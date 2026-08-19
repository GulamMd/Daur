import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Registrations" };

// Placeholder. Phase 7 builds the real Upcoming/Past list; it exists now
// because login redirects here.
export default function RegistrationsPage() {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
        Your registrations
      </h1>
      {/* An empty screen is an invitation to act, not a dead end. */}
      <p className="text-text-muted text-sm">No registrations yet.</p>
      <Link href="/events" className="text-text inline-block text-sm underline underline-offset-4">
        Browse events
      </Link>
    </div>
  );
}
