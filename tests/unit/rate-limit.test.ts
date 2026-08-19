import { describe, expect, it, vi, afterEach } from "vitest";
import { rateLimit, clientKey } from "@/lib/rate-limit";

/** Unique per test so the module-level bucket map cannot leak between them. */
let n = 0;
const key = () => `test-${Date.now()}-${n++}`;

afterEach(() => vi.useRealTimers());

describe("rateLimit", () => {
  it("allows exactly `limit` requests then blocks", () => {
    const k = key();
    for (let i = 1; i <= 5; i++) {
      expect(rateLimit(k, 5, 60_000).ok, `request ${i}`).toBe(true);
    }
    expect(rateLimit(k, 5, 60_000).ok).toBe(false);
  });

  it("reports a retry-after once blocked", () => {
    const k = key();
    for (let i = 0; i < 3; i++) rateLimit(k, 3, 60_000);
    const blocked = rateLimit(k, 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("keeps separate buckets per key", () => {
    const a = key();
    const b = key();
    for (let i = 0; i < 3; i++) rateLimit(a, 3, 60_000);
    expect(rateLimit(a, 3, 60_000).ok).toBe(false);
    expect(rateLimit(b, 3, 60_000).ok).toBe(true);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    const k = key();
    for (let i = 0; i < 3; i++) rateLimit(k, 3, 1000);
    expect(rateLimit(k, 3, 1000).ok).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(k, 3, 1000).ok).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the leftmost x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178" });
    expect(clientKey(headers, "signup")).toBe("signup:203.0.113.9");
  });

  it("trims whitespace", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "  203.0.113.9 " }), "x")).toBe(
      "x:203.0.113.9",
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.4" }), "login")).toBe(
      "login:198.51.100.4",
    );
  });

  it("degrades to a shared bucket rather than no limit at all", () => {
    expect(clientKey(new Headers(), "login")).toBe("login:unknown");
  });

  it("scopes buckets so one endpoint cannot exhaust another", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9" });
    expect(clientKey(headers, "signup")).not.toBe(clientKey(headers, "register"));
  });
});
