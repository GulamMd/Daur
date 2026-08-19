import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

/**
 * The whole funnel arrives from Google and Instagram, so event pages must be
 * crawlable. Everything behind a login, every API route, and the checkout
 * itself are not — a crawler following a register link would only ever hit a
 * redirect, and indexing an account page is never useful.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account/", "/api/", "/design", "/events/*/register"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
