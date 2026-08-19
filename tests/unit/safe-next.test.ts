import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/safe-next";

const DEFAULT = "/account/registrations";

describe("safeNext", () => {
  it("allows same-origin absolute paths", () => {
    expect(safeNext("/account/profile")).toBe("/account/profile");
    expect(safeNext("/events/daur-bengaluru-edition-04/register")).toBe(
      "/events/daur-bengaluru-edition-04/register",
    );
    expect(safeNext("/events?show=past")).toBe("/events?show=past");
  });

  it("blocks absolute URLs to another origin", () => {
    expect(safeNext("https://evil.example")).toBe(DEFAULT);
    expect(safeNext("http://evil.example/path")).toBe(DEFAULT);
  });

  it("blocks protocol-relative URLs", () => {
    // The case a naive "starts with /" check waves straight through.
    expect(safeNext("//evil.example")).toBe(DEFAULT);
    expect(safeNext("//evil.example/login")).toBe(DEFAULT);
  });

  it("blocks backslash tricks some parsers normalise to //", () => {
    expect(safeNext("/\\evil.example")).toBe(DEFAULT);
  });

  it("blocks non-http schemes", () => {
    expect(safeNext("javascript:alert(1)")).toBe(DEFAULT);
    expect(safeNext("data:text/html,<script>")).toBe(DEFAULT);
  });

  it("falls back for anything that is not a usable string", () => {
    expect(safeNext(undefined)).toBe(DEFAULT);
    expect(safeNext(null)).toBe(DEFAULT);
    expect(safeNext("")).toBe(DEFAULT);
    expect(safeNext(42)).toBe(DEFAULT);
    expect(safeNext(["/a", "/b"])).toBe(DEFAULT);
  });

  it("honours a custom fallback", () => {
    expect(safeNext("https://evil.example", "/events")).toBe("/events");
  });
});
