/**
 * Verifies the committed palette against WCAG 2.1 contrast minimums.
 * Values must stay in sync with app/styles/tokens.css.
 * Run: npm run check:contrast
 */
const hex = (h) => {
  h = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const L = (h) => {
  const [r, g, b] = hex(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = L(a) > L(b) ? [L(a), L(b)] : [L(b), L(a)];
  return (hi + 0.05) / (lo + 0.05);
};

const C = {
  asphalt: "#1A1D21",
  bib: "#FAFAF7",
  chalk: "#E4E4DE",
  sodium: "#FF8A1F",
  sodiumInk: "#9A4A05",
  signal: "#00933F",
  signalInk: "#076B36",
  muted: "#5A6068",
};

// [label, fg, bg, min, expectPass]
const CHECKS = [
  ["asphalt on bib", C.asphalt, C.bib, 4.5, true],
  ["muted on bib", C.muted, C.bib, 4.5, true],
  ["signal-ink on bib", C.signalInk, C.bib, 4.5, true],
  ["sodium-ink on bib", C.sodiumInk, C.bib, 4.5, true],
  ["signal dot on bib (UI)", C.signal, C.bib, 3.0, true],
  ["asphalt ON sodium (sticky CTA)", C.asphalt, C.sodium, 4.5, true],
  ["bib on asphalt (hero)", C.bib, C.asphalt, 4.5, true],
  ["sodium on asphalt (hero accent)", C.sodium, C.asphalt, 4.5, true],
  ["chalk on asphalt", C.chalk, C.asphalt, 4.5, true],
  // Negative control: this is WHY --daur-sodium-ink exists. If this ever
  // starts passing, the palette changed and the rule needs re-deriving.
  ["sodium as text on bib", C.sodium, C.bib, 4.5, false],
];

let failed = 0;
for (const [label, fg, bg, min, expectPass] of CHECKS) {
  const r = ratio(fg, bg);
  const passes = r >= min;
  const ok = passes === expectPass;
  if (!ok) failed++;
  const tag = ok ? "ok  " : "BAD ";
  const note = expectPass ? "" : "  (expected to fail — negative control)";
  console.log(`${tag} ${r.toFixed(2).padStart(6)}:1  min ${min}  ${label}${note}`);
}
if (failed) {
  console.error(`\n${failed} contrast check(s) did not match expectation.`);
  process.exit(1);
}
console.log("\nAll contrast expectations hold.");
