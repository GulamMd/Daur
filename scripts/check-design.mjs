/**
 * Verification step 12: tokens.css is the only place raw hex may live.
 * Run: npm run check:design
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const ROOTS = ["app", "components", "lib", "server"];
// tokens.css is the design system. google-mark.tsx is a third-party brand asset
// whose colours are mandated by Google and cannot be tokenised. Keep this list
// at exactly these two entries.
const ALLOWED = ["app/styles/tokens.css", "components/ui/google-mark.tsx"];
const HEX = /#[0-9a-fA-F]{3,8}\b/;

function toPosix(p) {
  return p.split(sep).join("/");
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry)) out.push(toPosix(full));
  }
  return out;
}

const offenders = [];
for (const root of ROOTS) {
  let files = [];
  try {
    files = walk(root);
  } catch {
    continue;
  }
  for (const file of files) {
    if (ALLOWED.includes(file)) continue;
    readFileSync(file, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (HEX.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
  }
}

if (offenders.length) {
  console.error("Raw hex found outside app/styles/tokens.css:\n");
  offenders.forEach((o) => console.error("  " + o));
  console.error(`\n${offenders.length} violation(s). Use a token instead.`);
  process.exit(1);
}
console.log("No raw hex outside app/styles/tokens.css.");
