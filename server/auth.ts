import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/server/db";
import { authConfig } from "@/server/auth.config";
import { loginSchema } from "@/lib/schemas/auth.schema";
import { burnTimingBudget, verifyPassword } from "@/lib/password";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  // JWT rather than database sessions: the Credentials provider cannot write
  // adapter sessions, so mixing Credentials with a DB adapter requires this.
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });

        // Google-only accounts have no passwordHash. Both that case and an
        // unknown email must cost the same as a real verify, or the response
        // time reveals which emails are registered.
        if (!user?.passwordHash) {
          await burnTimingBudget(password);
          return null;
        }

        if (!(await verifyPassword(user.passwordHash, password))) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
