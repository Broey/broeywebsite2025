import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const outputPath = path.resolve(process.cwd(), "reports/phase-5-rendered-content-audit.json");

const decodeHtml = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#x27;", "'")
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">");

const stripHtml = (value = "") => decodeHtml(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([:\w-]+)=(['"])(.*?)\2/g)].map((match) => [
    match[1],
    decodeHtml(match[3]),
  ]),
);

const unique = (values) => [...new Set(values)];
const elementText = (html, tag) => [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi"))]
  .map((match) => stripHtml(match[1]))
  .filter(Boolean);

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
const sitemapXml = await sitemapResponse.text();
const sitemapRoutes = [...sitemapXml.matchAll(/<loc>https:\/\/broey\.net([^<]*)<\/loc>/g)]
  .map((match) => match[1] || "/");
const auditRoutes = [...sitemapRoutes, "/music/4u-vip"];
const pages = [];
const failures = [];

for (const route of auditRoutes) {
  const response = await fetch(new URL(route, baseUrl));
  const html = await response.text();
  const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? html;
  const paragraphs = elementText(main, "p").filter((value) => value.length >= 20);
  const links = [...main.matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/gi)]
    .map((match) => ({ ...attributes(match[0]), text: stripHtml(match[0]) }))
    .filter(({ href, text }) => href && text);
  const internalLinks = links.filter(({ href }) => href.startsWith("/"));
  const outboundLinks = links.filter(({ href }) => /^https?:\/\//.test(href));
  const h1 = elementText(main, "h1");
  const h2 = elementText(main, "h2");
  const h3 = elementText(main, "h3");
  const visibleText = stripHtml(main);
  const visibleWordCount = visibleText.split(/\s+/).filter(Boolean).length;
  const duplicateParagraphs = unique(
    paragraphs.filter((paragraph, index) => paragraphs.indexOf(paragraph) !== index),
  );
  const duplicateSubstantiveBlocks = duplicateParagraphs.filter(
    (paragraph) => paragraph.length >= 120,
  );
  const robots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["']/i)?.[1]
    ?? "";

  if (response.status !== 200) failures.push(`${route}: HTTP ${response.status}`);
  if (h1.length !== 1) failures.push(`${route}: expected one H1, found ${h1.length}`);
  if (route.startsWith("/music/") && route !== "/music/4u-vip") {
    if (!h2.map((heading) => heading.toLowerCase()).includes("about the release")) {
      failures.push(`${route}: missing visible About the release section`);
    }
    if (visibleWordCount < 80) failures.push(`${route}: unexpectedly thin rendered body`);
  }
  if (route === "/music/4u-vip" && !/noindex/i.test(robots)) {
    failures.push(`${route}: expected noindex metadata`);
  }
  if (duplicateSubstantiveBlocks.length) {
    failures.push(`${route}: duplicate substantive paragraph block`);
  }

  pages.push({
    route,
    status: response.status,
    robots,
    h1,
    h2,
    h3,
    intro: paragraphs[0] ?? "",
    paragraphs,
    visibleWordCount,
    internalLinks: internalLinks.map(({ href, text }) => ({ href, text })),
    outboundLinks: outboundLinks.map(({ href, text }) => ({ href, text })),
    duplicateParagraphs,
    duplicateSubstantiveBlocks,
    hasReleaseContext: h2.map((heading) => heading.toLowerCase()).includes("about the release"),
  });
}

if (sitemapRoutes.length !== 22) failures.push(`sitemap: expected 22 routes, found ${sitemapRoutes.length}`);
if (sitemapRoutes.filter((route) => route.startsWith("/music/")).length !== 15) {
  failures.push("sitemap: expected 15 indexable release routes");
}
if (sitemapRoutes.includes("/music/4u-vip")) failures.push("sitemap: noindex route was included");

const internalPaths = unique(pages.flatMap((page) => page.internalLinks.map(({ href }) => href.split("#")[0])))
  .filter(Boolean);
for (const internalPath of internalPaths) {
  const response = await fetch(new URL(internalPath, baseUrl), { redirect: "manual" });
  if (response.status >= 400) failures.push(`${internalPath}: broken internal link (HTTP ${response.status})`);
}

const audit = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.toString(),
  sitemapRouteCount: sitemapRoutes.length,
  indexableReleaseCount: sitemapRoutes.filter((route) => route.startsWith("/music/")).length,
  auditedRouteCount: pages.length,
  pages,
  summary: {
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
  },
};

await fs.writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(JSON.stringify(audit.summary, null, 2));
console.log(`Wrote ${outputPath}`);

if (failures.length) process.exitCode = 1;
