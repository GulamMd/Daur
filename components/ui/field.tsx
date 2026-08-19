"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { useId } from "react";

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>;

/**
 * Label + input + error, wired together with matching ids so screen readers
 * announce the error with the field rather than as loose text.
 */
export function Field({ label, error, hint, className = "", ...props }: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={`border-border bg-surface text-text rounded-token h-11 w-full border px-3 text-sm outline-none placeholder:text-[color:var(--daur-text-muted)] ${
          error ? "border-[color:var(--daur-sodium-ink)]" : ""
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="text-text-muted text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sodium-ink text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level message. Errors state what happened; they do not apologise. */
export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success";
  children: ReactNode;
}) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-token border px-3 py-2 text-sm ${
        tone === "error"
          ? "text-sodium-ink border-[color:var(--daur-sodium-ink)]"
          : "text-signal-ink border-[color:var(--daur-signal-ink)]"
      }`}
    >
      {children}
    </p>
  );
}
