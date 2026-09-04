import type { NextConfig } from "next";

/**
 * Applied to every response. Deliberately excludes a Content-Security-Policy:
 * a correct one for Next needs per-request nonces, and a wrong one breaks
 * hydration silently in production. That is a considered follow-up, not
 * something to bolt on at deploy time.
 */
const SECURITY_HEADERS = [
  // The site is never framed, so clickjacking is closed off outright.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site but never the path — an event URL is harmless,
  // but /account/registrations/<id> should not leak into another site's logs.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Nothing here needs any of these; denying them means a future dependency
  // cannot quietly start asking.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  // The OG image renderer reads TTFs and tokens.css with fs at a runtime-built
  // path, which tracing cannot detect. Without this the preview card renders
  // locally and 500s in production with the files missing from the bundle.
  outputFileTracingIncludes: {
    "/events/[slug]/opengraph-image": ["./assets/fonts/**", "./app/styles/tokens.css"],

    // Prisma's query engine is a ~20MB native binary that the client loads at
    // runtime through a computed path, so static tracing never sees it. The
    // generator writes it to a custom output dir (generated/prisma, see
    // prisma/schema.prisma), which puts it outside node_modules where Next
    // would otherwise find it. Without this every database call in production
    // dies with "Could not locate the Query Engine for runtime
    // rhel-openssl-3.0.x" — the deployment simply has no engine in it.
    //
    // "/*" is the documented global key: these globs are matched with
    // picomatch({ contains: true }), so it is not limited to one path segment
    // and does cover /api/auth/signup. Fully static routes get no trace file
    // and are skipped automatically, so this costs nothing on those.
    "/*": ["./generated/prisma/**"],
  },

  images: {
    // Event route maps and gallery photos come from Cloudinary per Stage 3 of
    // the plan. next/image refuses any host not listed here, which is the point
    // — an event document cannot make the site proxy arbitrary remote images.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
