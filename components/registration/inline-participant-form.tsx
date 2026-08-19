"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  participantInputSchema,
  GENDER_LABELS,
  toDateOnly,
  type ParticipantFormInput,
  type ParticipantInput,
} from "@/lib/schemas/participant.schema";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { SelectField } from "@/components/ui/select";
import { ageOnEventDate } from "@/lib/age";
import type { FlowParticipant } from "@/components/registration/register-flow";

const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as (keyof typeof GENDER_LABELS)[]).map(
  (value) => ({ value, label: GENDER_LABELS[value] }),
);

/**
 * Adding someone without leaving the flow. The person is saved immediately
 * rather than held until confirm, so abandoning the checkout still leaves them
 * on the account — a first-timer who bounces off a sold-out category does not
 * have to type their details again.
 */
export function InlineParticipantForm({
  eventStartAt,
  timeZone,
  onCreated,
  onCancel,
}: {
  eventStartAt: string;
  timeZone: string;
  onCreated: (participant: FlowParticipant) => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ParticipantFormInput, unknown, ParticipantInput>({
    resolver: zodResolver(participantInputSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      gender: "UNDISCLOSED",
      phone: "",
      email: "",
      isSelf: false,
    },
  });

  async function onSubmit(values: ParticipantInput) {
    setError(null);
    const response = await fetch("/api/participants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const body = (await response.json().catch(() => null)) as {
      participant?: { id: string; fullName: string; isSelf: boolean };
      error?: string;
    } | null;

    if (!response.ok || !body?.participant) {
      setError(body?.error ?? "Could not add that person.");
      return;
    }

    onCreated({
      id: body.participant.id,
      fullName: body.participant.fullName,
      isSelf: body.participant.isSelf,
      // Shown as a label only. The server recomputes age and enforces the
      // minimum at confirm time — this number is never the authority.
      ageAtEvent: ageOnEventDate(toDateOnly(values.dateOfBirth), new Date(eventStartAt), timeZone),
      registeredIn: null,
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <p className="eyebrow text-text-muted">Add someone</p>
      {error && <FormMessage tone="error">{error}</FormMessage>}

      <Field label="Full name" error={errors.fullName?.message} {...register("fullName")} />
      <Field
        label="Date of birth"
        type="date"
        max={today}
        error={errors.dateOfBirth?.message}
        {...register("dateOfBirth")}
      />
      <SelectField
        label="Gender"
        options={GENDER_OPTIONS}
        error={errors.gender?.message}
        {...register("gender")}
      />
      <Field
        label="Mobile number"
        inputMode="numeric"
        error={errors.phone?.message}
        {...register("phone")}
      />

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="button" disabled={isSubmitting} onClick={handleSubmit(onSubmit)}>
          {isSubmitting ? "Adding…" : "Add"}
        </Button>
      </div>
    </div>
  );
}
