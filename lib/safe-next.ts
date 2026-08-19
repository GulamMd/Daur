const DEFAULT_DESTINATION = "/account/registrations";

/**
 * The `next` parameter comes from the URL, so it is attacker-controllable.
 * Without this, `/login?next=https://evil.example` would turn the login page
 * into an open redirect that phishers can hang off a legitimate domain.
 *
 * Only same-origin absolute paths are allowed through. Note the `//` check:
 * `//evil.example` is protocol-relative and would otherwise pass a naive
 * "starts with /" test.
 */
export function safeNext(value: unknown, fallback = DEFAULT_DESTINATION): string {
  if (typeof value !== "string" || value.length === 0) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.startsWith("/\\")) return fallback;
  return value;
}
