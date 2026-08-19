import type { Metadata } from "next";

export const metadata: Metadata = { title: "Participants" };

// Placeholder. Phase 5 builds participant CRUD; this exists so the account
// nav does not lead to a 404.
export default function ParticipantsPage() {
  return (
    <div className="space-y-3">
      <h1 className="font-display text-text text-xl font-extrabold tracking-tight">
        People you register
      </h1>
      <p className="text-text-muted text-sm">
        Adding the people you register for &mdash; yourself, family, your crew &mdash; arrives in
        Phase 5.
      </p>
    </div>
  );
}
