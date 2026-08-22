import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe half of the Auth.js config.
 *
 * Middleware runs on the edge runtime, which cannot load the Prisma client or
 * the argon2 native binding. Everything that touches the database lives in
 * server/auth.ts instead; this file holds only what middleware needs.
 */
export const authConfig = {
  providers: [Google],
  // Auth.js only trusts the incoming Host header automatically when it detects
  // Vercel or a dev server, and rejects every /api/auth/* request otherwise.
  // The site header now reads the session over HTTP rather than in-process, so
  // an untrusted host takes out the header on any production build not running
  // on Vercel — `next start` locally, or a self-hosted box. Stating it here
  // changes nothing in production, where VERCEL=1 already enabled it.
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;
