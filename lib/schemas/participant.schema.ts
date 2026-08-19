import { z } from "zod";
import { emailSchema, phoneSchema } from "@/lib/schemas/auth.schema";

/**
 * Core identity only, per the locked MVP decision. Emergency contact, t-shirt
 * size and medical info are deliberately deferred — adding them later is an
 * additive migration plus fields in one form component.
 */

export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER", "UNDISCLOSED"]);

export const GENDER_LABELS: Record<z.infer<typeof genderSchema>, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  UNDISCLOSED: "Prefer not to say",
};

// A date-only value. Kept as a string through the form (native <input
// type="date"> speaks YYYY-MM-DD) and only turned into a Date at the edge, so
// no timezone can shift a birthday by a day.
const MAX_AGE_YEARS = 120;

export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker.")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "That is not a real date.")
  .refine((value) => {
    // Guard against typos like 2206 instead of 1996 — a future birth date is
    // always wrong, and so is one implying an impossible age.
    const dob = new Date(`${value}T00:00:00Z`);
    const now = new Date();
    const oldest = new Date(
      Date.UTC(now.getUTCFullYear() - MAX_AGE_YEARS, now.getUTCMonth(), now.getUTCDate()),
    );
    return dob <= now && dob >= oldest;
  }, "Check the year — that date of birth is not possible.");

export const participantInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Enter their full name." })
    .max(80, { message: "That is longer than 80 characters." }),
  dateOfBirth: dateOfBirthSchema,
  gender: genderSchema,
  phone: phoneSchema,
  email: emailSchema.optional().or(z.literal("")),
  isSelf: z.boolean().default(false),
});

// Input and output differ because isSelf has a default: before parsing it may
// be absent, after parsing it is always a boolean. react-hook-form needs both.
export type ParticipantFormInput = z.input<typeof participantInputSchema>;
export type ParticipantInput = z.output<typeof participantInputSchema>;

/** Turns the form's date-only string into the UTC midnight a `date` column stores. */
export function toDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

/** And back, for populating the edit form. */
export function fromDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
