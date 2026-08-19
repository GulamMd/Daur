"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { InlineParticipantForm } from "@/components/registration/inline-participant-form";

type FlowEvent = {
  slug: string;
  name: string;
  dateLabel: string;
  venue: string;
  /** ISO instant + zone, so a newly added person can be labelled with their race-day age. */
  startAtIso: string;
  timeZone: string;
};
type FlowCategory = {
  id: string;
  name: string;
  minAge: number | null;
  startLabel: string;
  slotsLeft: number;
  description: string | null;
};
export type FlowParticipant = {
  id: string;
  fullName: string;
  isSelf: boolean;
  ageAtEvent: number;
  registeredIn: string | null;
};

type Step = "category" | "people" | "review";
const STEPS: { key: Step; label: string }[] = [
  { key: "category", label: "Distance" },
  { key: "people", label: "Who's running" },
  { key: "review", label: "Confirm" },
];

export function RegisterFlow({
  event,
  categories,
  participants: initialParticipants,
  preselectedCategoryId,
}: {
  event: FlowEvent;
  categories: FlowCategory[];
  participants: FlowParticipant[];
  preselectedCategoryId: string | null;
}) {
  const router = useRouter();

  const [step, setStep] = useState<Step>(preselectedCategoryId ? "people" : "category");
  const [categoryId, setCategoryId] = useState<string | null>(preselectedCategoryId);
  const [participants, setParticipants] = useState(initialParticipants);
  const [selected, setSelected] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Stable for the life of this checkout, so a double-tap replays rather than
  // registering twice.
  const idempotencyKey = useRef(crypto.randomUUID());

  const category = categories.find((c) => c.id === categoryId) ?? null;

  const eligibility = useMemo(() => {
    const map = new Map<string, { ok: boolean; reason: string | null }>();
    for (const person of participants) {
      if (person.registeredIn) {
        map.set(person.id, {
          ok: false,
          reason: `Already registered for this race in the ${person.registeredIn}`,
        });
      } else if (category?.minAge != null && person.ageAtEvent < category.minAge) {
        map.set(person.id, {
          ok: false,
          reason: `${person.fullName.split(" ")[0]} is ${person.ageAtEvent}. The ${category.name} needs a minimum age of ${category.minAge}.`,
        });
      } else {
        map.set(person.id, { ok: true, reason: null });
      }
    }
    return map;
  }, [participants, category]);

  const chosen = selected.filter((id) => eligibility.get(id)?.ok);
  const overCapacity = category ? chosen.length > category.slotsLeft : false;

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  async function confirm() {
    if (!category) return;
    setSubmitting(true);
    setError(null);

    const response = await fetch(`/api/events/${event.slug}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: category.id,
        participantIds: chosen,
        newParticipants: [],
        acceptedTerms: accepted,
        idempotencyKey: idempotencyKey.current,
      }),
    });

    const body = (await response.json().catch(() => null)) as {
      groupId?: string;
      error?: string;
    } | null;

    if (!response.ok || !body?.groupId) {
      setError(body?.error ?? "Could not complete the registration.");
      setSubmitting(false);
      return;
    }

    router.push(`/events/${event.slug}/register/success?group=${body.groupId}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <header className="mb-8">
        <p className="eyebrow text-text-muted">{event.name}</p>
        <p className="tnum text-text-muted mt-1 font-mono text-xs">
          {event.dateLabel} · {event.venue}
        </p>
        <ol className="mt-5 flex gap-2" aria-label="Progress">
          {STEPS.map((s, index) => {
            const active = s.key === step;
            const done = STEPS.findIndex((x) => x.key === step) > index;
            return (
              <li key={s.key} className="flex-1">
                <span
                  aria-current={active ? "step" : undefined}
                  className={`block h-1 rounded-full ${
                    active || done ? "bg-sodium" : "bg-[color:var(--daur-chalk)]"
                  }`}
                />
                <span className={`eyebrow mt-2 block ${active ? "text-text" : "text-text-muted"}`}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </header>

      {error && (
        <div className="mb-5">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      )}

      {step === "category" && (
        <section aria-labelledby="pick-distance">
          <h1
            id="pick-distance"
            className="font-display text-text text-xl font-extrabold tracking-tight"
          >
            Pick your distance
          </h1>
          <ul className="mt-4 space-y-3">
            {categories.map((c) => {
              const soldOut = c.slotsLeft === 0;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    disabled={soldOut}
                    onClick={() => {
                      setCategoryId(c.id);
                      setSelected([]);
                      setStep("people");
                    }}
                    className={`rounded-token w-full border p-4 text-left transition-colors ${
                      soldOut
                        ? "border-border cursor-not-allowed opacity-55"
                        : "border-border hover:border-[color:var(--daur-sodium)]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-display text-text text-2xl font-extrabold tracking-tight">
                        {c.name}
                      </span>
                      <span className="tnum font-mono text-xs">
                        {soldOut ? (
                          <span className="text-text-muted">Sold out</span>
                        ) : (
                          <span className="text-signal-ink">{c.slotsLeft} left</span>
                        )}
                      </span>
                    </div>
                    <p className="tnum text-text-muted mt-1 font-mono text-xs">
                      Flag-off {c.startLabel}
                      {c.minAge != null && ` · ${c.minAge}+`}
                    </p>
                    {c.description && (
                      <p className="text-text-muted mt-2 text-sm">{c.description}</p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === "people" && category && (
        <section aria-labelledby="pick-people">
          <h1
            id="pick-people"
            className="font-display text-text text-xl font-extrabold tracking-tight"
          >
            Who&rsquo;s running the {category.name}?
          </h1>
          <p className="text-text-muted mt-1 text-sm">
            {category.slotsLeft} slot{category.slotsLeft === 1 ? "" : "s"} left. Pick everyone you
            are entering.
          </p>

          <ul className="mt-4 space-y-2">
            {participants.map((person) => {
              const status = eligibility.get(person.id)!;
              const checked = selected.includes(person.id);
              return (
                <li key={person.id}>
                  <label
                    className={`rounded-token flex cursor-pointer items-start gap-3 border p-3 ${
                      status.ok
                        ? checked
                          ? "border-[color:var(--daur-sodium)]"
                          : "border-border"
                        : "border-border cursor-not-allowed opacity-60"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 size-4 accent-[color:var(--daur-sodium)]"
                      checked={checked}
                      disabled={!status.ok}
                      onChange={() => toggle(person.id)}
                    />
                    <span className="min-w-0">
                      <span className="text-text block font-medium">
                        {person.fullName}
                        {person.isSelf && <span className="eyebrow text-text-muted ml-2">You</span>}
                      </span>
                      <span className="tnum text-text-muted block font-mono text-xs">
                        {person.ageAtEvent} on race day
                      </span>
                      {status.reason && (
                        <span className="text-sodium-ink mt-1 block text-xs">{status.reason}</span>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          {adding ? (
            <div className="border-border rounded-token mt-3 border p-4">
              <InlineParticipantForm
                eventStartAt={event.startAtIso}
                timeZone={event.timeZone}
                onCancel={() => setAdding(false)}
                onCreated={(person) => {
                  setParticipants((current) => [...current, person]);
                  setSelected((current) => [...current, person.id]);
                  setAdding(false);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="border-border text-text rounded-token mt-3 w-full border border-dashed p-3 text-sm hover:border-[color:var(--daur-sodium)]"
            >
              + Add someone
            </button>
          )}

          {overCapacity && (
            <p className="text-sodium-ink mt-4 text-sm" role="alert">
              Only {category.slotsLeft} slot{category.slotsLeft === 1 ? "" : "s"} left, and you have
              chosen {chosen.length}.
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <Button variant="secondary" onClick={() => setStep("category")} type="button">
              Back
            </Button>
            <Button
              type="button"
              disabled={chosen.length === 0 || overCapacity}
              onClick={() => setStep("review")}
            >
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === "review" && category && (
        <section aria-labelledby="review">
          <h1 id="review" className="font-display text-text text-xl font-extrabold tracking-tight">
            Check and confirm
          </h1>

          <dl className="border-border rounded-token mt-4 border p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-muted">Race</dt>
              <dd className="text-text text-right">{event.name}</dd>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <dt className="text-text-muted">Distance</dt>
              <dd className="text-text tnum text-right font-mono">
                {category.name} · {category.startLabel}
              </dd>
            </div>
            <div className="mt-2 flex justify-between gap-4">
              <dt className="text-text-muted">Date</dt>
              <dd className="text-text tnum text-right font-mono">{event.dateLabel}</dd>
            </div>
          </dl>

          <ul className="mt-4 space-y-2">
            {chosen.map((id) => {
              const person = participants.find((p) => p.id === id)!;
              return (
                <li
                  key={id}
                  className="border-border rounded-token flex justify-between border p-3 text-sm"
                >
                  <span className="text-text">{person.fullName}</span>
                  <span className="tnum text-text-muted font-mono text-xs">
                    {person.ageAtEvent} on race day
                  </span>
                </li>
              );
            })}
          </ul>

          <label className="mt-5 flex items-start gap-3">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 accent-[color:var(--daur-sodium)]"
            />
            <span className="text-text-muted text-sm">
              I accept the{" "}
              <Link href="/terms" className="text-text underline underline-offset-4">
                terms and the runner&rsquo;s waiver
              </Link>{" "}
              for everyone listed above.
            </span>
          </label>

          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setStep("people")}
              disabled={submitting}
            >
              Back
            </Button>
            <Button type="button" disabled={!accepted || submitting} onClick={confirm}>
              {submitting
                ? "Registering…"
                : `Register ${chosen.length} ${chosen.length === 1 ? "person" : "people"}`}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
