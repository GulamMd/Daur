# Fonts for OG image rendering

These TTFs are used only by `next/og` (satori) to render Open Graph images on
the server. The site itself loads its fonts through `next/font` — these files
are not served to browsers.

They are vendored rather than fetched at render time so that generating a
preview card never depends on a network call to Google.

- **Archivo** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/Archivo
- **IBM Plex Mono** — SIL Open Font License 1.1 — https://fonts.google.com/specimen/IBM+Plex+Mono

Both are OFL, which permits redistribution.
