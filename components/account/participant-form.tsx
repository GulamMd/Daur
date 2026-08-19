"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  participantInputSchema,
  GENDER_LABELS,
  type ParticipantInput,
  type ParticipantFormInput,
} from "@/lib/schemas/participant.schema";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { SelectField, CheckboxField } from "@/components/ui/select";

const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as (keyof typeof GENDER_LABELS)[]).map(
  (value) => ({ value, label: GENDER_LABELS[value] }),
);

export function ParticipantForm({
  defaults,
  participantId,
  offerSelf,
}: {
  defaults: Partial<ParticipantFormInput>;
  participantId?: string;
  offerSelf: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const editing = Boolean(participantId);

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
      ...defaults,
    },
  });

  async function onSubmit(values: ParticipantInput) {
    setFormError(null);

    const response = await fetch(
      editing ? `/api/participants/${participantId}` : "/api/participants",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setFormError(body?.error ?? "Could not save.");
      return;
    }

    router.push("/account/participants");
    router.refresh();
  }

  // A birthday cannot be in the future; the picker should not offer one.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {formError && <FormMessage tone="error">{formError}</FormMessage>}

      <Field
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        {...register("fullName")}
      />

      <Field
        label="Date of birth"
        type="date"
        max={today}
        hint="Minimum ages are checked against race day, not today."
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
        autoComplete="tel"
        hint="The organiser uses this on race day."
        error={errors.phone?.message}
        {...register("phone")}
      />

      <Field
        label="Email (optional)"
        type="email"
        autoComplete="email"
        hint="Leave blank to use your account email."
        error={errors.email?.message}
        {...register("email")}
      />

      {offerSelf && (
        <CheckboxField
          label="This is me"
          hint="Marks this as your own entry so it is offered first when you register."
          {...register("isSelf")}
        />
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : editing ? "Save changes" : "Add person"}
        </Button>
        <Link
          href="/account/participants"
          className="text-text-muted hover:text-text shrink-0 text-sm underline underline-offset-4"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
