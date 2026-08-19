import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { siteUrl } from "@/lib/site-url";

const KEYS = ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
});
afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("siteUrl", () => {
  it("falls back to localhost off-platform", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("uses the STABLE production domain on production, not the deployment url", () => {
    // The whole point: VERCEL_URL changes every deploy, so an OG image built
    // against it would 404 the next time anything ships.
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "daur.vercel.app";
    process.env.VERCEL_URL = "daur-k3n8x2-gulam.vercel.app";
    expect(siteUrl()).toBe("https://daur.vercel.app");
  });

  it("uses the deployment url on previews so a preview links to itself", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "daur.vercel.app";
    process.env.VERCEL_URL = "daur-k3n8x2-gulam.vercel.app";
    expect(siteUrl()).toBe("https://daur-k3n8x2-gulam.vercel.app");
  });

  it("lets an explicit setting win everywhere", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "daur.vercel.app";
    process.env.NEXT_PUBLIC_SITE_URL = "https://daur.run";
    expect(siteUrl()).toBe("https://daur.run");
  });

  it("tolerates a trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://daur.run/";
    expect(siteUrl()).toBe("https://daur.run");
  });

  it("adds https when the protocol is omitted", () => {
    // Vercel's own variables are bare hostnames, and it is an easy thing to
    // paste into NEXT_PUBLIC_SITE_URL too.
    process.env.NEXT_PUBLIC_SITE_URL = "daur.run";
    expect(siteUrl()).toBe("https://daur.run");
  });

  it("ignores an empty value rather than producing 'https://'", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "   ";
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  it("never returns a trailing slash, so path concatenation is safe", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "daur.vercel.app/";
    expect(siteUrl().endsWith("/")).toBe(false);
  });
});
