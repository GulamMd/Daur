import type { Metadata } from "next";

// Internal proof sheet from Phase 0.5, superseded by the real event page.
// Kept for reference but kept out of search results.
export const metadata: Metadata = { title: "Visual direction", robots: { index: false } };

// Temporary Phase 0.5 proof sheet. Delete once Phase 4 builds the real event
// page — this exists so the direction can be reviewed before components land.

const SWATCHES = [
  { name: "asphalt", note: "road surface · all body text", cls: "bg-asphalt" },
  { name: "bib", note: "bib card · page surface", cls: "bg-bib" },
  { name: "chalk", note: "lane markings · borders", cls: "bg-chalk" },
  { name: "sodium", note: "streetlight · CTA fill", cls: "bg-sodium" },
  { name: "signal", note: "traffic signal · status only", cls: "bg-signal" },
] as const;

const CATEGORIES = [
  { distance: "5K", start: "06:00", left: 214 },
  { distance: "10K", start: "05:30", left: 38 },
  { distance: "21K", start: "05:00", left: 0 },
] as const;

function Bib({ distance, start, left }: (typeof CATEGORIES)[number]) {
  const soldOut = left === 0;
  const scarce = left > 0 && left < 50;
  return (
    <article
      className={`border-border bg-surface rounded-bib relative overflow-hidden border ${
        soldOut ? "opacity-55" : ""
      }`}
    >
      <span aria-hidden="true" className="bg-sodium absolute inset-y-0 left-0 w-1.5" />
      <div className="py-5 pr-5 pl-7">
        <p className="eyebrow text-text-muted">Daur Bengaluru</p>
        <p className="bib-numeral text-text mt-2">{distance}</p>
        <dl className="mt-4 flex items-center justify-between font-mono text-xs">
          <div>
            <dt className="text-text-muted">Flag-off</dt>
            <dd className="tnum text-text mt-0.5">{start}</dd>
          </div>
          <div className="text-right">
            <dt className="text-text-muted">Slots</dt>
            <dd className="mt-0.5">
              {soldOut ? (
                <span className="text-text-muted">Sold out</span>
              ) : (
                <span
                  className={`tnum inline-flex items-center gap-1.5 ${
                    scarce ? "text-sodium-ink" : "text-signal-ink"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${scarce ? "bg-sodium" : "bg-signal"}`}
                  />
                  {left} left
                </span>
              )}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default function DesignPage() {
  return (
    <>
      {/* ---- the dark hero: the race starts before sunrise ---- */}
      <section className="on-asphalt sodium-glow relative">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:py-28">
          <p className="eyebrow rise text-chalk/70">Daur Bengaluru</p>
          <p className="eyebrow rise text-sodium mt-1" style={{ animationDelay: "90ms" }}>
            Edition 04
          </p>
          <h1
            className="font-display rise mt-6 text-5xl leading-[0.9] font-extrabold tracking-tight sm:text-7xl"
            style={{ animationDelay: "180ms" }}
          >
            The city,
            <br />
            closed.
          </h1>
          <p
            className="rise text-chalk/80 mt-6 max-w-md text-base"
            style={{ animationDelay: "260ms" }}
          >
            Three hours of empty road through the middle of Bengaluru. Flag-off at 5:00 AM, before
            the traffic wakes up.
          </p>
          <p
            className="eyebrow rise text-chalk/70 mt-8 font-mono"
            style={{ animationDelay: "340ms" }}
          >
            13 Sep 2026 · Cubbon Park · 5K / 10K / 21K
          </p>
        </div>
      </section>

      {/* ---- daylight ---- */}
      <div className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="eyebrow text-text-muted">Pick your distance</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Bib key={c.distance} {...c} />
          ))}
        </div>

        <hr className="lane-rule my-14" />

        <h2 className="eyebrow text-text-muted">Palette</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {SWATCHES.map((s) => (
            <li key={s.name} className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={`${s.cls} border-border size-12 shrink-0 rounded border`}
              />
              <span className="text-sm">
                <span className="text-text font-medium">{s.name}</span>{" "}
                <span className="text-text-muted block text-xs">{s.note}</span>
              </span>
            </li>
          ))}
        </ul>

        <hr className="lane-rule my-14" />

        <h2 className="eyebrow text-text-muted">Type</h2>
        <div className="mt-4 space-y-4">
          <p className="font-display text-4xl font-extrabold tracking-tight">
            Archivo — display, bib numerals
          </p>
          <p className="max-w-prose text-base">
            IBM Plex Sans carries the body copy. It was chosen because it has a real Devanagari
            companion, so the wordmark <span className="font-deva">दौड़</span> can be set in its own
            script rather than transliterated only.
          </p>
          <p className="tnum font-mono text-sm">IBM Plex Mono — 04:30 · 21.097 km · DMR26-0042</p>
        </div>

        <hr className="lane-rule my-14" />

        <h2 className="eyebrow text-text-muted">Copy</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-text-muted font-mono text-xs">age block</dt>
            <dd>Aisha is 14. The 10K needs a minimum age of 16.</dd>
          </div>
          <div>
            <dt className="text-text-muted font-mono text-xs">not yet open</dt>
            <dd>Registration opens 12 Sep</dd>
          </div>
          <div>
            <dt className="text-text-muted font-mono text-xs">empty history</dt>
            <dd>No registrations yet. Browse events</dd>
          </div>
        </dl>
      </div>

      {/* ---- sticky CTA: asphalt on sodium, never white on sodium ---- */}
      <div className="bg-accent sticky bottom-0 z-30">
        <div className="text-accent-text mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">5K / 10K / 21K</span>
          <span className="font-display text-sm font-extrabold tracking-wide uppercase">
            Register
          </span>
        </div>
      </div>
    </>
  );
}
