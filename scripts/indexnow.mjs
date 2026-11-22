#!/usr/bin/env node
/**
 * Tells Bing, Yandex and other IndexNow search engines that the site has changed,
 * so new and updated pages are crawled quickly. Bing's index also feeds ChatGPT search
 * and Microsoft Copilot.
 *
 * Runs automatically after each deploy (see .github/workflows/deploy.yml).
 * Manual use:  node scripts/indexnow.mjs
 */
import fs from "node:fs";
import yaml from "js-yaml";

const site = yaml.load(fs.readFileSync(new URL("../src/_data/site.yml", import.meta.url), "utf8"));
if (!site.indexNowKey) {
  console.log("indexNowKey is empty in site.yml, skipping IndexNow.");
  process.exit(0);
}
const prefix = (site.pathPrefix || "/").replace(/\/+$/, "");
const base = String(site.url).replace(/\/+$/, "") + prefix;
const host = new URL(site.url).host;

const sitemapUrl = `${base}/sitemap.xml`;
const res = await fetch(sitemapUrl);
if (!res.ok) {
  console.log(`Could not read ${sitemapUrl} (${res.status}); skipping.`);
  process.exit(0);
}
const xml = await res.text();
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);

const body = { host, key: site.indexNowKey, keyLocation: `${base}/${site.indexNowKey}.txt`, urlList };
const ping = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`IndexNow: submitted ${urlList.length} URLs, response ${ping.status}`);
