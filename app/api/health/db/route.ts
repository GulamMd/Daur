import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { listEvents } from "@/server/services/event.service";

/**
 * Latency instrumentation, not a liveness probe.
 *
 * Neon's free tier scales to zero, so a slow page can mean either "the compute
 * was asleep" or "the query is slow" — two problems with nothing in common.
 * Timing a trivial round-trip separately from a real query separates them:
 * `connectMs` is dominated by wake-up and connection setup, `queryMs` is the
 * actual work. Hit this once after several minutes idle and once immediately
 * after; the difference between the two `connectMs` readings is the cold start.
 *
 * Read-only and unauthenticated, but robots.txt disallows /api/ wholesale and
 * it exposes no data beyond how many events are public.
 */
export async function GET() {
  const started = performance.now();

  await prisma.$queryRaw`SELECT 1`;
  const connectMs = performance.now() - started;

  const beforeQuery = performance.now();
  const events = await listEvents("upcoming");
  const queryMs = performance.now() - beforeQuery;

  return NextResponse.json(
    {
      connectMs: Math.round(connectMs),
      queryMs: Math.round(queryMs),
      totalMs: Math.round(performance.now() - started),
      upcomingEvents: events.length,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
