/**
 * Eleventy configuration for Dr. Junaid Fateh's website.
 *
 * Content lives in /src:
 *   src/_data/*.yml        site settings, locations, reviews, general videos, FAQs
 *   src/procedures/*.md    one file per procedure
 *   src/categories/*.md    one file per procedure category
 *   src/blog/*.md          blog articles
 *
 * See CONTENT-GUIDE.md for how to add or change content.
 */
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import yaml from "js-yaml";
import markdownIt from "markdown-it";

import { videoEmbed, videoPlatform } from "./lib/video-embed.js";
import { buildSchema } from "./lib/schema.js";

const site = yaml.load(fs.readFileSync("./src/_data/site.yml", "utf8"));
const pathPrefix = site.pathPrefix || "/";

const md = markdownIt({ html: true, linkify: true, typographer: false }); // typographer off: it would turn "--" into dashes

/** Build an absolute URL (for canonical links, Open Graph and structured data). */
function absoluteUrl(path = "/") {
  if (/^https?:\/\//.test(path)) return path;
  const base = String(site.url).replace(/\/+$/, "");
  const prefix = pathPrefix.replace(/\/+$/, "");
  const clean = ("/" + String(path)).replace(/\/{2,}/g, "/");
  return base + prefix + clean;
}

/** Date a file was last changed: last git commit if available, otherwise the file's modified time. */
const gitDateCache = new Map();
function lastModified(inputPath) {
  if (!inputPath) return new Date();
  if (gitDateCache.has(inputPath)) return gitDateCache.get(inputPath);
  let date = null;
  try {
    const out = execFileSync("git", ["log", "-1", "--format=%cI", "--", inputPath], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (out) date = new Date(out);
  } catch (e) { /* not a git checkout */ }
  if (!date) {
    try { date = fs.statSync(inputPath).mtime; } catch (e) { date = new Date(); }
  }
  gitDateCache.set(inputPath, date);
  return date;
}

export default function (eleventyConfig) {
  // YAML data files (they allow comments, which makes editing easier)
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yaml.load(contents));

  // Rewrites root-relative links when the site is served from a sub-folder (GitHub Pages)
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  eleventyConfig.setLibrary("md", md);

  // Static files
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addWatchTarget("./src/assets/");

  // Anything with `draft: true` in its front matter is not published
  eleventyConfig.addPreprocessor("drafts", "md,njk", (data) => {
    if (data.draft) return false;
  });

  /* ── Collections ─────────────────────────────────────────────── */
  const categoryOrder = (api) => {
    const map = {};
    for (const c of api.getFilteredByGlob("src/categories/*.md")) map[c.fileSlug] = c.data.order ?? 99;
    return map;
  };

  eleventyConfig.addCollection("categories", (api) =>
    api.getFilteredByGlob("src/categories/*.md").sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );

  eleventyConfig.addCollection("procedures", (api) => {
    const order = categoryOrder(api);
    return api.getFilteredByGlob("src/procedures/*.md").sort(
      (a, b) =>
        (order[a.data.category] ?? 99) - (order[b.data.category] ?? 99) ||
        (a.data.order ?? 99) - (b.data.order ?? 99) ||
        a.data.title.localeCompare(b.data.title)
    );
  });

  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date)
  );

  /* ── Filters ─────────────────────────────────────────────────── */
  eleventyConfig.addFilter("abs", absoluteUrl);
  eleventyConfig.addFilter("json", (value) => JSON.stringify(value ?? null));
  eleventyConfig.addFilter("md", (value) => (value ? md.render(String(value)) : ""));
  eleventyConfig.addFilter("mdInline", (value) => (value ? md.renderInline(String(value)) : ""));
  eleventyConfig.addFilter("stripHtml", (value) => String(value ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());

  eleventyConfig.addFilter("byCategory", (items, slug) => (items || []).filter((p) => p.data.category === slug));
  eleventyConfig.addFilter("specialties", (items) => (items || []).filter((p) => p.data.specialty));
  eleventyConfig.addFilter("findBySlug", (items, slug) => (items || []).find((p) => p.fileSlug === slug));
  eleventyConfig.addFilter("bySlugs", (items, slugs) =>
    (slugs || []).map((s) => (items || []).find((p) => p.fileSlug === s)).filter(Boolean)
  );
  eleventyConfig.addFilter("exceptUrl", (items, url) => (items || []).filter((p) => p.url !== url));
  eleventyConfig.addFilter("where", (items, key, value) => (items || []).filter((i) => i && i[key] === value));
  eleventyConfig.addFilter("withoutKey", (items, key) => (items || []).filter((i) => i && !i[key]));
  eleventyConfig.addFilter("limit", (items, n) => (items || []).slice(0, n));
  eleventyConfig.addFilter("filled", (items, key = "value") => (items || []).filter((i) => i && i[key] !== "" && i[key] != null));
  eleventyConfig.addFilter("reviewsFor", (reviews, slug) => (reviews || []).filter((r) => r.procedure_slug === slug));

  /** Related procedures: explicit `related` slugs first, then others from the same category. */
  eleventyConfig.addFilter("relatedTo", (items, page, n = 3) => {
    const all = items || [];
    const picked = (page.related || []).map((s) => all.find((p) => p.fileSlug === s)).filter(Boolean);
    for (const p of all) {
      if (picked.length >= n) break;
      if (p.data.category === page.category && p.url !== page.page.url && !picked.includes(p)) picked.push(p);
    }
    return picked.slice(0, n);
  });

  /** Every video across all procedures, plus the general list in _data/videos.yml */
  eleventyConfig.addFilter("allVideos", (procedures, general = []) => {
    const out = [];
    for (const v of general || []) if (v && v.url) out.push({ ...v, procedure: v.procedure || "" });
    for (const p of procedures || []) {
      for (const v of p.data.videos || []) {
        if (v && v.url) out.push({ ...v, procedure: p.data.short_title, procedureUrl: p.url, category: p.data.category });
      }
    }
    return out;
  });

  /** Every before/after pair across all procedures (for the gallery). */
  eleventyConfig.addFilter("allResults", (procedures) => {
    const out = [];
    for (const p of procedures || []) {
      for (const pair of p.data.before_after || []) {
        if (pair && pair.before && pair.after) {
          out.push({ ...pair, procedure: p.data.short_title, url: p.url, category: p.data.category });
        }
      }
    }
    return out;
  });

  eleventyConfig.addFilter("initials", (name) =>
    String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("")
  );

  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })
  );
  eleventyConfig.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  eleventyConfig.addFilter("isoDateTime", (d) => new Date(d).toISOString());
  eleventyConfig.addFilter("lastModified", (inputPath) => lastModified(inputPath));
  eleventyConfig.addFilter("postsFor", (posts, slug) => (posts || []).filter((p) => (p.data.related_procedures || []).includes(slug)));
  eleventyConfig.addFilter("reviewsFromCity", (reviews, city) => (reviews || []).filter((r) => r.city === city));
  eleventyConfig.addFilter("mdText", (value) =>
    String(value ?? "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
  );
  /** Raw markdown body of a page (for llms-full.txt) */
  eleventyConfig.addFilter("rawBody", (item) => String(item?.rawInput ?? "").trim());

  eleventyConfig.addFilter("readingTime", (content) => {
    const words = String(content || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 220));
  });

  eleventyConfig.addFilter("platform", videoPlatform);
  eleventyConfig.addFilter("youtubeId", (url) => {
    const m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  });
  eleventyConfig.addFilter("waLink", (text = "") => `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`);

  // Plain-text outputs (llms.txt, robots.txt) should not contain HTML entities
  eleventyConfig.addTransform("plain-text", function (content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".txt")) {
      return content
        .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\n{3,}/g, "\n\n");
    }
    return content;
  });

  /* ── Shortcodes ──────────────────────────────────────────────── */
  eleventyConfig.addShortcode("videoEmbed", (video, fallbackTitle) => videoEmbed(video, fallbackTitle));
  eleventyConfig.addShortcode("year", () => String(new Date().getFullYear()));
  // Structured data for the current page (reads the page's own data)
  eleventyConfig.addShortcode("schema", function () {
    return buildSchema(this.ctx, absoluteUrl, lastModified);
  });

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    pathPrefix,
    templateFormats: ["njk", "md", "html", "11ty.js"],
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk",
  };
}
