#!/usr/bin/env node
/**
 * Content checker. Run with:  npm run check
 *
 * Validates every procedure, category and blog post:
 *  - front matter is valid YAML and has the required fields
 *  - SEO title/description lengths are sensible
 *  - no leftover wording from the old clinic website
 *  - image files referenced in before/after actually exist
 *
 * Optional: pass file paths to check only those files.
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "src");

const FORBIDDEN = [
  [/salma/i, "mentions Dr. Salma"],
  [/aestique/i, "mentions Aestique (only allowed in src/_data/locations.yml)"],
  [/\bour (expert )?surgeons\b/i, "plural 'our surgeons' (this is a single-surgeon site)"],
  [/\bboth surgeons\b|\bmale (and|&) female\b|\bfemale surgeon\b/i, "two-surgeon wording"],
  [/guarantee/i, "uses 'guarantee' (avoid promising results)"],
  [/\b(PKR|Rs\.?)\s?\d/i, "contains a price (use price_from instead)"],
  [/\u2014/, "contains an em dash (use a comma, colon or full stop instead)"],
];

const REQUIRED = {
  procedures: ["title", "short_title", "category", "summary", "seo", "stats", "benefits", "candidates", "recovery", "faqs"],
  categories: ["title", "nav_title", "order", "summary", "seo"],
  blog: ["title", "description", "date", "author"],
};

function split(file) {
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error("missing front matter (--- block)");
  return { data: yaml.load(m[1]) || {}, body: m[2], raw };
}

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map((f) => path.resolve(f))
  : ["procedures", "categories", "blog"].flatMap((d) => {
      const dir = path.join(SRC, d);
      return fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => path.join(dir, f)) : [];
    });

let errors = 0;
let warnings = 0;
const err = (f, msg) => { errors++; console.log(`  ✖ ${path.relative(ROOT, f)}: ${msg}`); };
const warn = (f, msg) => { warnings++; console.log(`  ⚠ ${path.relative(ROOT, f)}: ${msg}`); };

for (const f of files) {
  const kind = path.basename(path.dirname(f));
  let doc;
  try { doc = split(f); } catch (e) { err(f, `YAML error: ${e.message.split("\n")[0]}`); continue; }
  const { data, raw } = doc;
  for (const key of REQUIRED[kind] || []) if (data[key] === undefined || data[key] === null || data[key] === "") err(f, `missing "${key}"`);
  for (const [re, why] of FORBIDDEN) {
    const hit = raw.split("\n").find((l) => !l.trim().startsWith("#") && re.test(l));
    if (hit) err(f, `${why}: “${hit.trim().slice(0, 90)}”`);
  }
  const seo = data.seo || {};
  const title = seo.title || data.title || "";
  const desc = seo.description || data.description || "";
  if (title.length > 70) warn(f, `SEO title is ${title.length} chars (aim for ≤ 65)`);
  if (desc && (desc.length < 70 || desc.length > 165)) warn(f, `SEO description is ${desc.length} chars (aim for 120–160)`);
  if (kind === "procedures") {
    if ((data.faqs || []).length < 5) warn(f, `only ${(data.faqs || []).length} FAQs (aim for 6+)`);
    for (const pair of data.before_after || []) {
      for (const side of ["before", "after"]) {
        if (pair[side] && !fs.existsSync(path.join(SRC, pair[side]))) err(f, `image not found: ${pair[side]}`);
      }
    }
    for (const v of data.videos || []) if (!v || !v.url) err(f, "a video item is missing its url");
    for (const s of data.social_links || []) if (!s || !s.url) err(f, "a social link is missing its url");
  }
}

console.log(`\nChecked ${files.length} file(s): ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
