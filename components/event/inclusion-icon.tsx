import {
  Backpack,
  Bus,
  Camera,
  Clock,
  Coffee,
  Cross,
  Droplet,
  Gift,
  GlassWater,
  Map,
  Medal,
  Music,
  Shirt,
  ShowerHead,
  Timer,
  Utensils,
} from "lucide-react";

/**
 * The allowlist of icons an event document may reference.
 *
 * Kept in lockstep with `inclusionIconSchema` in lib/schemas/event.schema.ts so
 * that a typo in a seed file fails at authoring time rather than rendering an
 * empty box on the live page.
 */
export const INCLUSION_ICONS = {
  medal: Medal,
  shirt: Shirt,
  droplet: Droplet,
  water: GlassWater,
  cross: Cross,
  bag: Backpack,
  coffee: Coffee,
  food: Utensils,
  clock: Clock,
  timer: Timer,
  map: Map,
  music: Music,
  camera: Camera,
  bus: Bus,
  shower: ShowerHead,
  gift: Gift,
} as const;

export type InclusionIconName = keyof typeof INCLUSION_ICONS;

export function InclusionIcon({ name }: { name: string }) {
  const Icon = INCLUSION_ICONS[name as InclusionIconName] ?? Medal;
  return <Icon aria-hidden="true" className="text-sodium-ink size-5 shrink-0" strokeWidth={1.75} />;
}
