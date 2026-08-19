import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The OG image renderer reads TTFs with fs at a runtime-built path, which
  // tracing cannot detect. Without this the preview card renders locally and
  // 500s in production with the fonts missing from the bundle.
  outputFileTracingIncludes: {
    "/events/[slug]/opengraph-image": ["./assets/fonts/**", "./app/styles/tokens.css"],
  },

  images: {
    // Event route maps and gallery photos come from Cloudinary per Stage 3 of
    // the plan. next/image refuses any host not listed here, which is the point
    // — an event document cannot make the site proxy arbitrary remote images.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
