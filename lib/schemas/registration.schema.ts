import { z } from "zod";
import { participantInputSchema } from "@/lib/schemas/participant.schema";

/**
 * The confirm payload for a checkout.
 *
 * One category, one or more participants — the multi-participant decision from
 * discovery. `newParticipants` lets a first-timer add themselves without
 * leaving the flow.
 */
export const registrationRequestSchema = z
  .object({
    categoryId: z.string().min(1, "Pick a distance."),
    participantIds: z.array(z.string().min(1)).default([]),
    newParticipants: z.array(participantInputSchema).default([]),
    acceptedTerms: z.boolean().refine((value) => value === true, "Accept the terms to continue."),
    // Client-generated, stable for the life of one checkout. A double-tap
    // replays the same key and gets the same registration back.
    idempotencyKey: z.uuid("Missing a valid idempotency key."),
  })
  .refine((value) => value.participantIds.length + value.newParticipants.length > 0, {
    path: ["participantIds"],
    message: "Choose at least one person.",
  });

export type RegistrationRequest = z.output<typeof registrationRequestSchema>;

export const cancelRegistrationSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});
