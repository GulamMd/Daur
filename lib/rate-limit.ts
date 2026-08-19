type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter held in process memory.
 *
 * Deliberately in-memory for the MVP, per Stage 3 of the plan. Two limits are
 * worth knowing before relying on it:
 *   1. State is per-instance. On Vercel each serverless instance keeps its own
 *      counters, so the effective limit is (limit x instances).
 *   2. State is lost on cold start.
 *
 * That is acceptable for slowing down credential stuffing on a low-traffic
 * site, and not acceptable as a security boundary. Swap for Upstash Redis when
 * the domain and real traffic land.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) sweep(now);
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/**
 * Best-effort client identity. Vercel sets x-forwarded-for; the leftmost entry
 * is the client. Falls back to a constant so a missing header degrades to a
 * shared bucket rather than to no limit at all.
 */
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}
