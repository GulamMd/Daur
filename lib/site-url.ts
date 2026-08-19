/**
 * The canonical origin for absolute URLs — Open Graph images, canonical tags,
 * the sitemap, and password-reset links.
 *
 * Vercel exposes two different hostnames and picking the wrong one is a quiet
 * disaster:
 *
 *   VERCEL_URL                     daur-k3n8x2-gulam.vercel.app
 *                                  Deployment-specific. Changes on EVERY
 *                                  deploy, so a shared link dies the next time
 *                                  you ship. Right for previews only.
 *
 *   VERCEL_PROJECT_PRODUCTION_URL  daur.vercel.app
 *                                  The project's stable production domain.
 *                                  This is what a shared link must point at.
 *
 * So: an explicit override wins, production uses the stable domain, previews
 * use their own hostname, and local development falls back to localhost. No
 * environment variable is required for a working `*.vercel.app` deploy — set
 * NEXT_PUBLIC_SITE_URL only when a custom domain arrives.
 */
function normalise(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return normalise(configured);

  const productionDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (process.env.VERCEL_ENV === "production" && productionDomain) {
    return normalise(productionDomain);
  }

  // Previews link to themselves, so a preview's OG card shows preview content
  // rather than silently advertising production.
  const deploymentUrl = process.env.VERCEL_URL?.trim();
  if (deploymentUrl) return normalise(deploymentUrl);

  return "http://localhost:3000";
}
