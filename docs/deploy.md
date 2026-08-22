# Deploying Daur

Vercel (app) + Neon (Postgres) + Cloudinary (images). Everything below assumes
the free tiers described in Stage 4 of the plan.

---

## 1. Environment variables

Set these in **Vercel → Settings → Environment Variables**. Everything except
`NEXT_PUBLIC_SITE_URL` should be identical across Production and Preview unless
you deliberately want a separate preview database.

| Variable                | Where it comes from                     | Notes                                                                                                                                  |
| ----------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | Neon → Connection Details → **Pooled**  | Host contains `-pooler`. Used by the app at runtime.                                                                                   |
| `DIRECT_URL`            | Neon → Connection Details → **Direct**  | Host has **no** `-pooler`. Used by migrations, which cannot run through a pooler.                                                      |
| `AUTH_SECRET`           | `npx auth secret`                       | Generate a fresh one for production; do not reuse the local value.                                                                     |
| `AUTH_GOOGLE_ID`        | Google Cloud Console                    | See §2.                                                                                                                                |
| `AUTH_GOOGLE_SECRET`    | Google Cloud Console                    | See §2.                                                                                                                                |
| `NEXT_PUBLIC_SITE_URL`  | **optional** — only for a custom domain | Leave unset on `*.vercel.app`; the code uses Vercel's stable production domain. Set it (no trailing slash) when a real domain arrives. |
| `ORGANIZER_ADMIN_EMAIL` | optional                                | Promotes that account to `ORGANIZER_ADMIN` on the next seed run.                                                                       |

### About the site URL

This drives absolute `og:image` URLs, canonical tags and the sitemap, so it has
to be the address people actually share.

You do **not** need to set anything to deploy on a free `*.vercel.app` domain.
`lib/site-url.ts` resolves it in this order:

1. `NEXT_PUBLIC_SITE_URL` — an explicit override, for a custom domain
2. `VERCEL_PROJECT_PRODUCTION_URL` on production — e.g. `daur.vercel.app`, the
   project's **stable** domain
3. `VERCEL_URL` on previews — the per-deployment hostname, so a preview links
   to itself
4. `http://localhost:3000`

The distinction in 2 vs 3 matters. `VERCEL_URL` is deployment-specific
(`daur-k3n8x2-gulam.vercel.app`) and changes every time you ship — using it in
production would mean every previously shared link points at a dead host.

---

## 2. Google OAuth

Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID
(type: Web application).

**Authorised redirect URIs** — every origin that will serve a login needs its
own entry, and they must match exactly:

```
http://localhost:3000/api/auth/callback/google
https://<project>.vercel.app/api/auth/callback/google
```

A `*.vercel.app` address is perfectly acceptable to Google — no custom domain
is required. Use the stable project domain, not a deployment-specific one.

Preview deployments get a new hostname each time, so Google logins will fail on
previews unless you add a stable preview domain and register that too. Email and
password sign-in works on previews regardless.

---

## 3. Vercel project

- **Framework preset:** Next.js (auto-detected)
- **Build command:** leave as default — `package.json` already runs
  `prisma migrate deploy && next build`
- **Install command:** default. `postinstall` runs `prisma generate`, which
  matters because Vercel restores a cached `node_modules` and the generated
  client is gitignored.
- **Node version:** 22 or 24. `.nvmrc` pins 22.

### What the build does

```
npm install           → postinstall → prisma generate
prisma generate       → again, unconditionally (see below)
prisma migrate deploy → applies pending migrations over DIRECT_URL
next build            → compiles
```

`prisma generate` runs in the build script as well as in `postinstall`. It is
not redundant: `/generated` is gitignored, and when the platform restores a
cached `node_modules` npm can skip `postinstall` entirely, leaving no client for
`next build` to compile against. Generating in the build makes that failure
mode impossible rather than intermittent.

`migrate deploy` only applies migrations that already exist in
`prisma/migrations/`; it never authors new ones. That is what makes it safe in a
build step.

**A failed migration fails the deploy.** That is intended — a half-migrated
database serving traffic is worse. But it does mean a bad migration blocks
shipping until it is fixed.

---

## 4. First deploy

1. Push `master`.
2. Import the repo in Vercel, set the variables from §1, deploy.
3. Watch the build log for `migrations found` / `applying migration`.
4. Seed the organizer and the event **against the production database**:
   ```
   DATABASE_URL=<prod pooled> DIRECT_URL=<prod direct> npm run seed:events
   ```
   Skip this if production points at the same Neon database used in
   development, which already has both.
5. Smoke test:
   ```
   npm run smoke -- https://<your-domain>
   ```

The smoke test is read-only — it never signs up or registers — so it is safe
against production.

---

## 5. Going live checklist

- [ ] Google redirect URI registered for `https://<project>.vercel.app`
- [ ] `NEXT_PUBLIC_SITE_URL` set **only if** you have a custom domain
- [ ] `npm run smoke -- https://<domain>` passes, especially the `og:image`
      checks — paste an event URL into WhatsApp and confirm the card renders
- [ ] **Real terms and waiver text is in `app/(public)/terms/page.tsx`** — it
      currently carries a visible placeholder saying the liability wording has
      not been supplied. The site records `termsVersion` against every entry,
      so this must be real before accepting entries.
- [ ] Event status flipped with `npm run event:status -- --slug=… --status=REGISTRATION_OPEN`
- [ ] `npm run check:db` passes against production (the two hand-written SQL
      constraints exist — nothing regenerates them if migrations are ever reset)

---

## 6. Known constraints

**Neon free tier scales to zero.** Measured on this project: a cold
`SELECT 1` takes ~2,300ms against ~250ms warm, so the wake-up costs roughly two
seconds. It no longer lands on a visitor — every public page is prerendered (see
below) and served from cache while any regeneration happens in the background.
It is still paid on the registration path and on `/api/health/db`.

**Public pages are prerendered, and stale for up to 60 seconds.** `/`, `/events`
and `/events/[slug]` carry `revalidate = 60`, so a status flip or a slot count
can lag by up to a minute. Writes through `/api/organizer/*` call
`revalidatePublicEvent()` (`server/revalidate.ts`) and take effect immediately;
`npm run event:status` goes through the service directly, cannot revalidate, and
therefore does show that minute of staleness. Neither risks overselling — the
conditional `UPDATE` in `registration.service.ts` is the authority, not the page.

**The header reads the session in the browser, not on the server.** A root
layout that touches cookies makes every route in the app dynamic, which is what
previously put a Neon query on every page view. `components/layout/site-header.tsx`
is synchronous and `HeaderAuthNav` calls `/api/auth/session` on the client. This
is why `authConfig` sets `trustHost: true`: Auth.js otherwise rejects
`/api/auth/*` on any host it does not recognise, which breaks the header on
`next start` and on self-hosted deployments (Vercel sets `VERCEL=1` and would
have masked it).

**Rate limiting is per-instance.** `lib/rate-limit.ts` holds counters in process
memory, so the effective limit is (limit × running instances) and resets on cold
start. Fine for slowing credential stuffing on a low-traffic site; not a
security boundary. Swap for Upstash Redis when traffic justifies it.

**Password reset cannot deliver.** The token flow is complete and correct, but
no email provider is wired. In production `lib/mailer.ts` logs a warning and
deliberately does **not** log the token. Wiring Resend there is the only change
needed.

**Error reporting is a console log.** `lib/report-error.ts` is the single seam;
swapping its body for `Sentry.captureException` is the whole integration.

**Do not add a `loading.tsx` above any route that calls `notFound()`.** It
creates a Suspense boundary, the response starts streaming with a 200 already
committed, and `notFound()` can no longer set the status — producing soft-404s
that Google will index. Five routes call `notFound()`; the smoke test guards
against this regression.

---

## 7. Production deploy: open issue

The first deploy did not come up, and no error text was recorded at the time.
There is nothing here to diagnose from, so start by reproducing it rather than
guessing.

**Reproduce with the real credentials.** This runs the same chain Vercel runs:

```
DATABASE_URL=<prod pooled> DIRECT_URL=<prod direct> npm run build
```

If that succeeds locally, the difference is environment, not code.

**Then read the Vercel build log and let it pick from these.** In rough order of
likelihood:

1. `DIRECT_URL` missing, or set to the pooled string. `prisma migrate deploy`
   cannot run through a pooler, and a failed migration fails the deploy by
   design (§3).
2. Variables set for Production but not Preview, or the reverse.
3. `prisma generate` skipped because npm restored a cached `node_modules`.
   Addressed — the build script now runs it explicitly (§3).
4. Node outside the `engines` range in `package.json` (`>=22 <23 || >=24`).
5. The OG image route's file tracing (`next.config.ts` `outputFileTracingIncludes`).
   `npm run smoke` already guards this: it fetches the PNG and checks the IHDR
   bytes are 1200×630.

**Record the answer here** — the failing step and its fix — so the next
iteration starts from evidence instead of from this paragraph.
