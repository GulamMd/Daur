/**
 * Post-deploy smoke test. Read-only — it never signs up, registers, or writes
 * anything, so it is safe to run against production.
 *
 *   npm run smoke -- https://daur.run
 *
 * Defaults to localhost:3000 when no URL is given.
 */
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let pass = 0;
let fail = 0;
function check(label: string, ok: boolean, detail = "") {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
  ok ? pass++ : fail++;
}

const get = (path: string, init?: RequestInit) =>
  fetch(BASE + path, { redirect: "manual", ...init });

async function main() {
  console.log(`Smoke testing ${BASE}\n`);

  console.log("=== public pages render ===");
  for (const path of ["/", "/events", "/terms", "/privacy", "/login", "/signup"]) {
    const res = await get(path);
    check(`GET ${path}`, res.status === 200, `${res.status}`);
  }

  console.log("\n=== an event page is reachable and complete ===");
  const listing = await (await get("/events")).text();
  const slug = listing.match(/\/events\/([a-z0-9-]+)"/)?.[1];
  check("an event is listed", Boolean(slug), slug ?? "none found");

  if (slug) {
    const res = await get(`/events/${slug}`);
    const html = await res.text();
    check(`GET /events/${slug}`, res.status === 200, `${res.status}`);
    check("renders category bibs", html.includes("bib-numeral"));
    check("has a canonical url", html.includes('rel="canonical"'));
    check("declares og:image", html.includes('property="og:image"'));

    // The single most likely production-only failure: the OG renderer reads
    // font files and tokens.css off disk, which only works if output file
    // tracing bundled them.
    const ogUrl = html.match(/property="og:image" content="([^"]+)"/)?.[1];
    check("og:image url is absolute", Boolean(ogUrl?.startsWith("http")), ogUrl ?? "missing");
    // Only meaningful against a deployed host: a localhost og:image on a real
    // domain means NEXT_PUBLIC_SITE_URL was never set, and every shared link
    // would render a broken preview.
    if (!BASE.includes("localhost")) {
      check(
        "og:image points at this host, not localhost",
        Boolean(ogUrl?.startsWith(BASE)),
        ogUrl?.includes("localhost") ? "NEXT_PUBLIC_SITE_URL is not set" : (ogUrl ?? ""),
      );
    }

    if (ogUrl) {
      const img = await fetch(ogUrl);
      const buf = Buffer.from(await img.arrayBuffer());
      check("og:image responds 200", img.status === 200, `${img.status}`);
      check(
        "og:image is a real PNG",
        buf.subarray(1, 4).toString() === "PNG",
        `${buf.length} bytes`,
      );
      if (buf.subarray(1, 4).toString() === "PNG") {
        const w = buf.readUInt32BE(16);
        const h = buf.readUInt32BE(20);
        check("og:image is 1200x630", w === 1200 && h === 630, `${w}x${h}`);
      }
    }
  }

  console.log("\n=== protected routes stay protected ===");
  for (const path of ["/account/registrations", "/account/participants", "/account/profile"]) {
    const res = await get(path);
    const location = res.headers.get("location") ?? "";
    check(
      `${path} redirects to login`,
      (res.status === 302 || res.status === 307) && location.includes("/login"),
      `${res.status} ${location}`,
    );
  }

  console.log("\n=== crawlability ===");
  const robots = await get("/robots.txt");
  const robotsBody = await robots.text();
  check("robots.txt served", robots.status === 200);
  check("account pages disallowed", robotsBody.includes("/account/"));
  check("sitemap advertised", robotsBody.includes("/sitemap.xml"));
  check(
    "sitemap url matches this host",
    robotsBody.includes(BASE),
    robotsBody.match(/Sitemap: (\S+)/)?.[1] ?? "",
  );

  const sitemap = await get("/sitemap.xml");
  const sitemapBody = await sitemap.text();
  const locs = [...sitemapBody.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  check("sitemap.xml served", sitemap.status === 200);
  check(
    "sitemap lists the event",
    locs.some((l) => l.includes("/events/")),
    `${locs.length} urls`,
  );

  console.log("\n=== security headers ===");
  const headers = (await get("/")).headers;
  const expected: [string, string][] = [
    ["x-frame-options", "DENY"],
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
  ];
  for (const [key, value] of expected) {
    check(`${key}: ${value}`, headers.get(key) === value, headers.get(key) ?? "missing");
  }
  if (BASE.startsWith("https://")) {
    check(
      "HSTS present",
      Boolean(headers.get("strict-transport-security")),
      headers.get("strict-transport-security") ?? "missing",
    );
  }

  console.log("\n=== error handling ===");
  const missing = await get("/no-such-page-here");
  check("unknown path returns 404", missing.status === 404, `${missing.status}`);
  // A 200 here is a soft-404: the not-found UI renders but search engines
  // index it as a real page. Adding a loading.tsx above these routes causes
  // exactly that, because streaming commits the 200 before notFound() runs.
  const missingEvent = await get("/events/no-such-event");
  check(
    "unknown event returns 404, not a soft-404",
    missingEvent.status === 404,
    `${missingEvent.status}`,
  );

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Smoke test could not run:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
