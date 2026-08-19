"use client";

import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { useId } from "react";

type Option = { value: string; label: string };

type SelectProps = {
  label: string;
  options: readonly Option[];
  error?: string;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ label, options, error, className = "", ...props }: SelectProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-text block text-sm font-medium">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`border-border bg-surface text-text rounded-token h-11 w-full border px-3 text-sm outline-none ${
          error ? "border-[color:var(--daur-sodium-ink)]" : ""
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-sodium-ink text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

type CheckboxProps = {
  label: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function CheckboxField({ label, hint, className = "", ...props }: CheckboxProps) {
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        aria-describedby={hint ? hintId : undefined}
        className={`border-border mt-0.5 size-4 shrink-0 rounded border accent-[color:var(--daur-sodium)] ${className}`}
        {...props}
      />
      <div>
        <label htmlFor={id} className="text-text block text-sm font-medium">
          {label}
        </label>
        {hint && (
          <p id={hintId} className="text-text-muted mt-0.5 text-xs">
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
