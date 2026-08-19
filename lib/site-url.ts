/**
 * The canonical origin for absolute URLs — Open Graph images, the sitemap, and
 * password-reset links.
 *
 * On Vercel, NEXT_PUBLIC_SITE_URL should be set to the real domain. VERCEL_URL
 * is the per-deployment hostname, which is right for previews but wrong for
 * production (it changes on every deploy and is not the domain people share).
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  return "http://localhost:3000";
}
