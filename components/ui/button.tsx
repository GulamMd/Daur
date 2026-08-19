import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const BASE =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-token px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55";

// The sticky CTA rule from the design direction: asphalt ON sodium (7.17:1),
// never white on sodium.
const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-text hover:brightness-95",
  secondary: "border border-border bg-surface text-text hover:bg-surface-sunk",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return <button className={`${BASE} ${VARIANTS[variant]} ${className}`} {...props} />;
}
