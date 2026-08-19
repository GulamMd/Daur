import { hash, verify } from "@node-rs/argon2";

// OWASP Password Storage Cheat Sheet, argon2id baseline: m=19 MiB, t=2, p=1.
const OPTIONS = {
  // Algorithm.Argon2id. Written as a literal because @node-rs/argon2 exports it
  // as a `declare const enum`, which isolatedModules forbids referencing.
  algorithm: 2,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  return verify(hashed, plain, OPTIONS);
}

/**
 * Keeps login timing flat when an email does not exist. Without this, "no such
 * user" returns measurably faster than "wrong password", which leaks which
 * emails are registered.
 *
 * The decoy is hashed once at first use rather than hardcoded, so it is
 * guaranteed to be a parseable hash that costs a real verify to check.
 */
let decoy: Promise<string> | null = null;

export async function burnTimingBudget(plain: string): Promise<void> {
  decoy ??= hashPassword("daur-timing-decoy-not-a-real-password");
  try {
    await verify(await decoy, plain, OPTIONS);
  } catch {
    // Expected to fail. The elapsed time is the point, not the result.
  }
}
