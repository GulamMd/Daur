import type { ReactNode } from "react";
import type { EventDetail } from "@/server/services/event.service";
import {
  AboutSection,
  CategoriesSection,
  FactsSection,
  FaqsSection,
  GallerySection,
  HeroSection,
  InclusionsSection,
  OrganizerSection,
  RouteSection,
  RulesSection,
  ScheduleSection,
  VenueSection,
} from "@/components/event/sections";

/**
 * Section order is data, not code. The event document carries a `sections`
 * array and this renders exactly that, in that order — so re-ordering an event
 * page is a JSON edit and a re-seed, never a deploy.
 */
const REGISTRY: Record<string, (props: { event: EventDetail }) => ReactNode> = {
  hero: HeroSection,
  facts: FactsSection,
  categories: CategoriesSection,
  about: AboutSection,
  route: RouteSection,
  schedule: ScheduleSection,
  inclusions: InclusionsSection,
  gallery: GallerySection,
  venue: VenueSection,
  faqs: FaqsSection,
  rules: RulesSection,
  organizer: OrganizerSection,
};

// Hero and facts span the viewport; everything else lives in the reading column.
const FULL_BLEED = new Set(["hero", "facts"]);

export function EventSections({ event }: { event: EventDetail }) {
  const keys = parseSections(event.sections);

  // Group consecutive sections of the same kind so a run of contained sections
  // shares one column wrapper, without hardcoding where the boundary falls.
  const runs: { bleed: boolean; keys: string[] }[] = [];
  for (const key of keys) {
    if (!(key in REGISTRY)) continue;
    const bleed = FULL_BLEED.has(key);
    const current = runs.at(-1);
    if (current && current.bleed === bleed) current.keys.push(key);
    else runs.push({ bleed, keys: [key] });
  }

  return (
    <>
      {runs.map((run, index) =>
        run.bleed ? (
          run.keys.map((key) => <Render key={key} sectionKey={key} event={event} />)
        ) : (
          <div key={`run-${index}`} className="mx-auto max-w-5xl space-y-14 px-4 py-12">
            {run.keys.map((key) => (
              <Render key={key} sectionKey={key} event={event} />
            ))}
          </div>
        ),
      )}
    </>
  );
}

function Render({ sectionKey, event }: { sectionKey: string; event: EventDetail }) {
  const Component = REGISTRY[sectionKey];
  return Component ? <Component event={event} /> : null;
}

/**
 * `sections` is a Json column, so it is `unknown` at the type level however
 * carefully the Zod schema guards writes. Falling back to a sensible default
 * beats rendering a blank page if a row is ever written by hand.
 */
function parseSections(value: unknown): string[] {
  if (Array.isArray(value) && value.every((entry) => typeof entry === "string")) {
    return value as string[];
  }
  return [
    "hero",
    "facts",
    "categories",
    "about",
    "route",
    "schedule",
    "inclusions",
    "venue",
    "faqs",
    "rules",
    "organizer",
  ];
}
