import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { sendPasswordResetEmail } from "@/lib/mailer";
import type {
  SignupInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/lib/schemas/auth.schema";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

export class EmailTakenError extends Error {
  constructor() {
    super("An account with this email already exists.");
    this.name = "EmailTakenError";
  }
}

export class InvalidResetTokenError extends Error {
  constructor() {
    super("That reset link is invalid or has expired.");
    this.name = "InvalidResetTokenError";
  }
}

export class WrongPasswordError extends Error {
  constructor() {
    super("That password is incorrect.");
    this.name = "WrongPasswordError";
  }
}

/**
 * Signup does reveal whether an email is registered — it has to, since the
 * account cannot be created twice and the person needs to be told to log in
 * instead. Password reset deliberately does NOT reveal it (see below); that is
 * where enumeration actually matters, because it is unauthenticated and
 * scriptable against a list.
 */
export async function signupUser(input: SignupInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: { id: true, email: true, name: true },
    });
  } catch (error) {
    // P2002 = unique constraint violation. Let the database decide, rather than
    // a findUnique-then-create race that can still collide under concurrency.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new EmailTakenError();
    }
    throw error;
  }
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Always resolves the same way regardless of whether the email exists. The
 * caller returns one uniform response so the endpoint cannot be used to test
 * which emails have accounts.
 */
export async function requestPasswordReset(
  input: ForgotPasswordInput,
  siteUrl: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true },
  });

  if (!user) return;

  const raw = randomBytes(32).toString("base64url");

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  await sendPasswordResetEmail(user.email, `${siteUrl}/reset-password/${raw}`);
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(input.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new InvalidResetTokenError();
  }

  const passwordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    // Invalidate every other outstanding token for this user, so an older
    // unused link cannot be replayed after a successful reset.
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
  ]);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, currentPassword))) {
    throw new WrongPasswordError();
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}

export async function updateProfile(
  userId: string,
  data: { name: string; phone?: string },
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { name: data.name, phone: data.phone || null },
  });
}
