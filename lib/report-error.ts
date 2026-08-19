/**
 * Single seam for error reporting.
 *
 * Everything that catches an unexpected error routes through here, so wiring a
 * monitoring service later is one change rather than a search across the
 * codebase.
 *
 * Sentry is NOT installed. It needs a DSN, and `@sentry/nextjs` wraps
 * next.config — both of which belong with the deploy rather than with a
 * dependency that would sit inert in the repo. To enable it:
 *
 *   1. npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
 *   2. replace the body of report() with Sentry.captureException(error, { extra: context })
 *
 * Never pass personal data in `context`. Ids are fine; names, emails and phone
 * numbers are not — a monitoring service is not a place to leak a start list.
 */
export function reportError(error: unknown, context?: Record<string, string | number>): void {
  const detail = context ? ` ${JSON.stringify(context)}` : "";
  console.error(`[daur] unhandled error${detail}`, error);
}
