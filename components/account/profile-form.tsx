"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, type ProfileInput } from "@/lib/schemas/auth.schema";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";

export function ProfileForm({ defaults }: { defaults: ProfileInput }) {
  const router = useRouter();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults });

  async function onSubmit(values: ProfileInput) {
    setMessage(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      error?: string;
    } | null;

    if (!response.ok) {
      setMessage({ tone: "error", text: body?.error ?? "Could not save your profile." });
      return;
    }
    setMessage({ tone: "success", text: body?.message ?? "Profile saved." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {message && <FormMessage tone={message.tone}>{message.text}</FormMessage>}
      <Field
        label="Full name"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
      <Field
        label="Mobile number"
        inputMode="numeric"
        autoComplete="tel"
        hint="Used by the organiser on race day."
        error={errors.phone?.message}
        {...register("phone")}
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
