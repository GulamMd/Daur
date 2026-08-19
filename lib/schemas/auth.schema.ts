import { z } from "zod";

/**
 * Shared by client forms (react-hook-form), route handlers, and the Credentials
 * provider. One definition, so the browser and the server cannot disagree.
 */

// Stored lowercase so the @unique index on User.email is genuinely case-safe
// without needing the citext extension.
export const emailSchema = z
  .email({ message: "Enter a valid email address." })
  .trim()
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, { message: "Use at least 8 characters." })
  .max(200, { message: "That is longer than 200 characters." });

// Indian mobile numbers: 10 digits starting 6-9. Optional at signup; the
// organizer needs it on race day, collected per-participant in Phase 5.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, { message: "Enter a 10-digit mobile number." });

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Enter your name." })
    .max(80, { message: "That is longer than 80 characters." }),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { message: "Enter your password." }),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Enter your name." })
    .max(80, { message: "That is longer than 80 characters." }),
  phone: phoneSchema.optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Enter your current password." }),
  newPassword: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
