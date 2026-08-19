import type { MetadataRoute } from "next";
import { listEvents } from "@/server/services/event.service";
import { siteUrl } from "@/lib/site-url";

export const revalidate = 3600;

/**
 * Built from the database rather than hardcoded, so publishing an event makes
 * it discoverable without a code change. Draft events are excluded because
 * listEvents already filters them out — the same guard the public pages use.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const [upcoming, past] = await Promise.all([listEvents("upcoming"), listEvents("past")]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/events`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const eventRoutes: MetadataRoute.Sitemap = [...upcoming, ...past].map((event) => ({
    url: `${base}/events/${event.slug}`,
    lastModified: event.startAt,
    // An upcoming race changes as slots fill; a finished one does not.
    changeFrequency: upcoming.some((e) => e.slug === event.slug) ? "daily" : "yearly",
    priority: upcoming.some((e) => e.slug === event.slug) ? 0.8 : 0.4,
  }));

  return [...staticRoutes, ...eventRoutes];
}
