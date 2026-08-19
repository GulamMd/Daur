"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GENDER_LABELS } from "@/lib/schemas/participant.schema";

export type ParticipantRowData = {
  id: string;
  fullName: string;
  gender: keyof typeof GENDER_LABELS;
  phone: string;
  email: string | null;
  isSelf: boolean;
  /** Precomputed on the server — deriving "now" in the browser risks a hydration mismatch. */
  age: number;
  confirmedRegistrations: number;
};

export function ParticipantRow({ participant }: { participant: ParticipantRowData }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);

    const response = await fetch(`/api/participants/${participant.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(body?.error ?? "Could not remove that person.");
      setBusy(false);
      setConfirming(false);
      return;
    }

    router.refresh();
  }

  return (
    <li className="border-border rounded-token border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-text font-medium">
            {participant.fullName}
            {participant.isSelf && (
              <span className="eyebrow text-sodium-ink rounded-token ml-2 border border-[color:var(--daur-sodium)] px-1.5 py-0.5 align-middle">
                You
              </span>
            )}
          </p>
          <p className="tnum text-text-muted mt-1 font-mono text-xs">
            {participant.age} · {GENDER_LABELS[participant.gender]} · {participant.phone}
          </p>
          {participant.confirmedRegistrations > 0 && (
            <p className="text-text-muted mt-1 text-xs">
              {participant.confirmedRegistrations} race
              {participant.confirmedRegistrations === 1 ? "" : "s"} registered
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-4 text-sm">
          <Link
            href={`/account/participants/${participant.id}/edit`}
            className="text-text-muted hover:text-text underline underline-offset-4"
          >
            Edit
          </Link>
          {/* Two-step inline confirmation rather than a blocking window.confirm. */}
          {confirming ? (
            <>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="text-sodium-ink font-medium underline underline-offset-4 disabled:opacity-55"
              >
                {busy ? "Removing…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="text-text-muted hover:text-text underline underline-offset-4"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-text-muted hover:text-sodium-ink underline underline-offset-4"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {confirming && !error && (
        <p className="text-text-muted mt-3 text-sm">
          Remove {participant.fullName} from your account?
          {participant.confirmedRegistrations > 0 &&
            " Past race entries stay on your registration history."}
        </p>
      )}

      {error && (
        <p role="alert" className="text-sodium-ink mt-3 text-sm">
          {error}
        </p>
      )}
    </li>
  );
}
