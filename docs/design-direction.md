# Daur — Visual Direction

Committed in Phase 0.5. Every colour and type value in Phases 3–6 derives from
`app/styles/tokens.css`. If a screen needs a value that isn't a token, the token file is wrong and
gets revised — components never invent one-off hex codes.

## The subject, pinned

**Daur Bengaluru — Edition 04.** A recurring, numbered city road race, flagged off at 5:00 AM on
closed roads, run by and for the city's running crews.

The city is the point. Bengaluru's roads are gridlocked eighteen hours a day; for three hours on a
Sunday morning they are silent and yours. That is what a club runner is actually buying, and it is
what the page has to sell.

_(The city is a placeholder that costs one search-and-replace. The direction below survives changing
it — what it depends on is "Indian city, closed roads, pre-dawn, club culture," not Bengaluru
specifically.)_

**The event page's single job:** get a runner from "a friend shared this" to "I'm registered, and so
are the two people I run with."

## Thesis

> **The city, closed.**

The hero opens in the dark, because the race does. The page then moves into daylight, because the
race does. That transition is the one atmospheric move, and it is literally true to the subject
rather than decorative.

## Palette

Derived from the material world of a pre-dawn Indian road race: asphalt, sodium-vapour streetlights,
lane markings, traffic signals, and the bib itself.

| Token            | Hex       | Origin                                       | Job                                           |
| ---------------- | --------- | -------------------------------------------- | --------------------------------------------- |
| `--daur-asphalt` | `#1A1D21` | Road surface. Blue-grey, not warm black      | All body text; the hero's ground              |
| `--daur-bib`     | `#FAFAF7` | Bib card stock. A paper white, **not** cream | Default page surface                          |
| `--daur-chalk`   | `#E4E4DE` | Lane markings, chalk start line              | Borders, muted surfaces, dividers             |
| `--daur-sodium`  | `#FF8A1F` | Sodium-vapour streetlight at 5 AM            | Brand accent; CTA fill; hero light source     |
| `--daur-signal`  | `#00933F` | Traffic signal green                         | **Status only** — go-states, never decoration |

Two derived inks exist because the saturated values fail as text on light:

| Token               | Hex       | Why it exists                                                             |
| ------------------- | --------- | ------------------------------------------------------------------------- |
| `--daur-sodium-ink` | `#9A4A05` | `sodium` as text on `bib` is **2.25:1**. Never use it. Use this.          |
| `--daur-signal-ink` | `#076B36` | `signal` reads as a dot at 3.83:1, but fails as text. Use this for words. |

**Measured contrast** (`node scripts/check-contrast.mjs`):

```
16.17:1  asphalt on bib              6.07:1  muted on bib
 7.17:1  asphalt ON sodium (CTA)     6.34:1  signal-ink on bib
16.17:1  bib on asphalt (hero)       5.98:1  sodium-ink on bib
 7.17:1  sodium on asphalt           3.83:1  signal dot on bib (UI, min 3:1)
```

Hard rules:

- The sticky CTA is **asphalt text on sodium**, never white on sodium.
- Sodium is a surface or a light source. It is never small text on a light background.
- Signal green is reserved for go-states — registration open, slots remaining, registration
  confirmed. Using it decoratively destroys its meaning.

**No automatic dark mode.** This design commits to one look and uses darkness deliberately — the
hero zone only — rather than surrendering it to `prefers-color-scheme`. A registration platform is
form-heavy and gets used outdoors in Indian daylight; a light UI is the right call, and maintaining
two palettes to express a narrative that is inherently about a single sunrise would weaken it.

## Type

| Role       | Face                                   | Why this one                                                                                                                                                                                     |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Display    | **Archivo** (variable `wght` + `wdth`) | Bibs are utilitarian, not decorative — the correct reference is a heavy grotesque. Personality comes from the extreme width/weight range (numerals at `wdth 125 / wght 800`), not a novelty face |
| Body       | **IBM Plex Sans**                      | Genuine character in its terminals, and it has a real Devanagari companion                                                                                                                       |
| Devanagari | **IBM Plex Sans Devanagari**           | _Daur_ is दौड़. The wordmark can be set properly in its own script instead of transliterated-only — this is the actual reason the Plex family was chosen                                         |
| Data       | **IBM Plex Mono**                      | Times (`04:30`), splits, slot counts, refs (`DMR26-0042`). Tabular figures matter                                                                                                                |

Scale is restrained everywhere except the bib numeral, which is the single outlier — one loud voice,
everything else quiet.

## Layout

Mobile-first. Dark hero, then daylight for everything below.

```
┌──────────────────────────────┐
│ ███  ASPHALT — pre-dawn      │   sodium glow pools behind
│                              │   the headline like a streetlight
│  DAUR BENGALURU              │   chalk, small caps
│  EDITION 04                  │   mono, sodium
│                              │
│  The city,                   │   Archivo 800 / wdth 125
│  closed.                     │
│                              │
│  13 SEP 2026 · 05:00 · 5–21K │   mono strip, chalk
└──────────────────────────────┘
        ↓ sunrise
┌──────────────────────────────┐
│ ░░  BIB WHITE                │
│  PICK YOUR DISTANCE          │
│  ┌────────┐ ┌────────┐       │
│  │ DAUR   │ │ DAUR   │       │   ← SIGNATURE
│  │   5K   │ │  10K   │       │   bib numeral, huge
│  │ 06:00  │ │ 05:00  │       │   mono
│  │ ▪214 left│ │ Sold out│    │   signal / muted
│  └────────┘ └────────┘       │
│  - - - - - - - - - - - - -   │   lane-marking divider
│  About / Route / Schedule…   │
└──────────────────────────────┘
┌──────────────────────────────┐
│ ▓ 5K–21K · Register          │   sticky, sodium + asphalt
└──────────────────────────────┘
```

## Signature: the bib

Race categories are rendered **as race bibs** — the distance set as an enormous Archivo numeral on
bib-white card, event name in small caps above, flag-off time and slots below in mono, with a sodium
tear-strip along the edge. The same bib object reappears on the confirmation screen carrying the
participant's name.

It earns the place because it is the artifact the entire product exists to produce, every runner
recognises it instantly, and it carries real data rather than ornament.

**Deliberately cut:** a road centre-line running down the page as a structural spine. It was a good
idea that competed with the bib for attention. Only a whisper survives — section dividers are dashed
rules in chalk, echoing lane markings at 1px.

## Sequence markers, used honestly

`EDITION 04` and the schedule timeline are numbered because they are genuinely sequences — a
recurring edition and a real running order. Decorative `01 / 02 / 03` markers appear nowhere else.

## Motion

One orchestrated moment, then restraint:

- **Page load:** the hero's identity strip staggers in over ~400ms, like a start-line countdown.
- **Bib cards:** 2px lift on hover, tear-strip appears.
- Nothing else. `prefers-reduced-motion: reduce` resolves everything to final state.

## Copy

Words are design material here, not decoration.

| Situation     | Write                                             | Not                      |
| ------------- | ------------------------------------------------- | ------------------------ |
| Slots         | `214 left`                                        | `Filling fast`           |
| Not yet open  | `Registration opens 12 Sep`                       | `Coming soon`            |
| Action        | `Register` → confirmation reads `Registered`      | `Submit` / `Sign up now` |
| Age block     | `Aisha is 14. The 10K needs a minimum age of 16.` | `Invalid participant`    |
| Empty history | `No registrations yet.` + `Browse events`         | `Nothing to see here`    |

Active voice, sentence case, specific over clever. An action keeps its name through the whole flow.

> **Plan amendment:** this replaces the `Filling fast` treatment in §1.4 of the build plan. The real
> number is more useful and more honest; scarcity is signalled by colouring the number sodium under
> 20%, not by changing the words.
