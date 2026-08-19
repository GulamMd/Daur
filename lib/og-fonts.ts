import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Assets for `next/og` (satori) image rendering.
 *
 * Fonts are read with `fs` rather than `fetch(new URL(..., import.meta.url))` —
 * the documented pattern — because Node's fetch does not support `file://`
 * URLs and throws a bare "fetch failed".
 *
 * Because these paths are built at runtime, Next's output file tracing cannot
 * see them. `outputFileTracingIncludes` in next.config.ts pulls both the fonts
 * and tokens.css into the bundle; without those entries this works locally and
 * 500s on Vercel.
 */
const ROOT = process.cwd();
const FONT_DIR = join(ROOT, "assets", "fonts");
const TOKENS = join(ROOT, "app", "styles", "tokens.css");

let fontCache: Promise<{ archivo: Buffer; mono: Buffer }> | null = null;

export function loadOgFonts() {
  fontCache ??= (async () => {
    const [archivo, mono] = await Promise.all([
      readFile(join(FONT_DIR, "Archivo-ExtraBold.ttf")),
      readFile(join(FONT_DIR, "IBMPlexMono-Regular.ttf")),
    ]);
    return { archivo, mono };
  })();
  return fontCache;
}

export type OgColors = { asphalt: string; bib: string; chalk: string; sodium: string };

/**
 * Satori cannot resolve CSS custom properties, so the OG renderer needs literal
 * colours. Rather than copying them — which would let the preview card drift
 * away from the site the first time the palette is touched — they are parsed
 * out of tokens.css, which stays the single source of truth.
 *
 * A parse failure throws instead of falling back to hardcoded values: an
 * obviously broken image is better than one that is quietly the wrong brand.
 */
let colorCache: Promise<OgColors> | null = null;

export function loadOgColors(): Promise<OgColors> {
  colorCache ??= (async () => {
    const css = await readFile(TOKENS, "utf8");

    const read = (token: string): string => {
      const match = css.match(new RegExp(`--daur-${token}\\s*:\\s*(#[0-9a-fA-F]{3,8})`));
      if (!match) {
        throw new Error(
          `OG renderer could not find --daur-${token} in app/styles/tokens.css. ` +
            `If the token was renamed, update lib/og-fonts.ts to match.`,
        );
      }
      return match[1]!;
    };

    return {
      asphalt: read("asphalt"),
      bib: read("bib"),
      chalk: read("chalk"),
      sodium: read("sodium"),
    };
  })();
  return colorCache;
}

/** Sodium as an rgba() string, for the streetlight gradient satori renders. */
export function sodiumGlow(sodium: string, alpha: number): string {
  const hex = sodium.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export const OG_SIZE = { width: 1200, height: 630 };
