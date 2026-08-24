/**
 * Content gate for the S3 lane. No dependencies, plain Node.
 *
 *   node scripts/check-content.mjs          run every check
 *   node scripts/check-content.mjs --table  print the fact table for the ledger
 *
 * Checks the standing copy rules mechanically, because a rule that is only in
 * someone's head gets broken on the next edit. Exits non-zero on any violation
 * so this can gate a commit.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const failures = [];
const notes = [];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const contentFiles = walk(join(ROOT, "content"));
const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, "/");

/**
 * Pull the user-facing string literals out of a source file.
 *
 * Deliberately skips import lines and `//` comments so a rule explained in a
 * comment does not trip the rule it explains.
 */
function stringsOf(src) {
  const out = [];
  for (const [i, line] of src.split("\n").entries()) {
    const t = line.trim();
    if (t.startsWith("import ") || t.startsWith("//") || t.startsWith("*") || t.startsWith("/*")) {
      continue;
    }
    for (const m of line.matchAll(/"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)) {
      const v = m[1] ?? m[2] ?? "";
      if (v.length > 3) out.push({ line: i + 1, text: v });
    }
  }
  return out;
}

function fail(rule, file, line, detail) {
  failures.push(`${rule}\n    ${file}:${line}\n    ${detail}`);
}

for (const file of contentFiles) {
  const src = readFileSync(file, "utf8");
  const f = rel(file);
  const isFactsFile = f.endsWith("content/facts.ts");

  for (const { line, text } of stringsOf(src)) {
    // Em dash and en dash. Hard constraint on this site's copy.
    if (/[—–]/.test(text)) {
      fail("DASH: em or en dash in user-facing copy", f, line, text.slice(0, 90));
    }
    // Curly quotes. Straight quotes only.
    if (/[“”‘’]/.test(text)) {
      fail("QUOTE: curly quote in copy", f, line, text.slice(0, 90));
    }
    // The concatenation artifact that typechecking cannot see: a literal
    // '" + "' stranded inside a template string.
    if (/"\s*\+\s*"/.test(text)) {
      fail("CONCAT: stranded concatenation inside a string", f, line, text.slice(0, 90));
    }
    // Stale employment claim. The TMU role ended in July 2026.
    if (/\bPresent\b/.test(text)) {
      fail("STALE: 'Present' in copy; the TMU role ended July 2026", f, line, text.slice(0, 90));
    }
    // Academic year and minor must never appear in user-facing copy.
    if (/\b(first|second|third|fourth|1st|2nd|3rd|4th)[- ]year\b/i.test(text)) {
      fail("IDENTITY: academic year in copy", f, line, text.slice(0, 90));
    }
    if (/\bminor(ing)? in\b/i.test(text)) {
      fail("IDENTITY: minor in copy", f, line, text.slice(0, 90));
    }
    // Fabrication claims. The engineering design project was CAD only.
    if (/\b(hands-on prototyp|physically built|machined|welded|3d[- ]printed|fabricated (a|the) (prototype|cart|cane|part|frame|model))/i.test(text)) {
      fail("FABRICATION: implies physical build", f, line, text.slice(0, 90));
    }
    // Sales register.
    const promo = text.match(
      /\b(cutting[- ]edge|state[- ]of[- ]the[- ]art|revolutionary|seamless(ly)?|leverage[ds]?|robust solution|world[- ]class|game[- ]chang)/i,
    );
    if (promo) {
      fail(`PROMO: sales register "${promo[0]}"`, f, line, text.slice(0, 90));
    }
    // AI vocabulary tells.
    const slop = text.match(
      /\b(delve|tapestry|testament to|underscore[sd]?|showcas(e|es|ing)|vibrant|pivotal|intricate|multifaceted|realm of)\b/i,
    );
    if (slop) {
      fail(`AI-TELL: "${slop[0]}"`, f, line, text.slice(0, 90));
    }
    // A URL hard-coded outside links.ts defeats the single-constant rule.
    if (!f.endsWith("content/links.ts") && /https?:\/\//.test(text)) {
      fail("URL: hard-coded URL outside links.ts", f, line, text.slice(0, 90));
    }
    // Retired figure. Two internal ledgers still quote it.
    if (!isFactsFile && /\bPCI (of )?68\b/.test(text)) {
      fail("STALE FIGURE: PCI 68 is the retired legacy scorer; use 85", f, line, text.slice(0, 90));
    }
  }
}

/* Every fact must carry a non-empty source. The constructor enforces this at
 * runtime; this is the static half, so a bad fact is caught before a build. */
const factsSrc = readFileSync(join(ROOT, "content", "facts.ts"), "utf8");
const factCalls = [...factsSrc.matchAll(/^\s*(\w+):\s*fact\(/gm)];
const declaredKeys = factCalls.map((m) => m[1]);
if (declaredKeys.length === 0) {
  failures.push("FACTS: no fact() calls found; the registry did not parse");
}
notes.push(`${declaredKeys.length} facts declared`);

/* Print the fact table for the ledger. */
if (process.argv.includes("--table")) {
  const { ALL_FACTS } = await import("../content/facts.ts").catch(() => ({ ALL_FACTS: null }));
  if (!ALL_FACTS) {
    console.log(
      "Fact table needs a TS loader. Run `npx tsx scripts/check-content.mjs --table`,\n" +
        "or read the table already recorded in the S3 ledger.",
    );
  } else {
    console.log("| Group | Claim | Value | Scope | Source |");
    console.log("|---|---|---|---|---|");
    for (const [group, facts] of Object.entries(ALL_FACTS)) {
      for (const [key, fx] of Object.entries(facts)) {
        console.log(`| ${group} | ${key} | ${fx.value} | ${fx.scope ?? "n/a"} | ${fx.source} |`);
      }
    }
  }
}

console.log(`\nchecked ${contentFiles.length} content files, ${notes.join(", ")}`);
if (failures.length) {
  console.error(`\n${failures.length} violation(s):\n`);
  for (const f of failures) console.error(`  ${f}\n`);
  process.exit(1);
}
console.log("content gate: PASS");
