import fs from "node:fs/promises";
import path from "node:path";
import { pressItemsForRelease } from "../content/press.ts";
import { releases } from "../content/releases.ts";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");
const outputPath = path.resolve(process.cwd(), "reports/phase-5-rendered-content-audit.json");
const approvedHomepageCopy = "Learn more about Broey and explore music and releases spanning house, UK garage, breakbeats, and more.";
const approvedMusicCopy = "Explore selected Broey releases with playback, credits, and platform links, organized across current and earlier catalog eras.";
const approvedEdmReviewerSummary = "EDM Reviewer highlighted Fragments’ vocal choices, deep-house elements, stylistic variety, and the saxophone on “Breathing Room.”";

const decodeHtml = (value = "") => value
  .replaceAll("&amp;", "&")
  .replaceAll("&quot;", '"')
  .replaceAll("&#x27;", "'")
  .replaceAll("&#39;", "'")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&nbsp;", " ")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

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
const releaseForRoute = (route) => releases.find((release) => `/music/${release.slug}` === route);
const hasLink = (page, href, text) => page.internalLinks.some(
  (link) => link.href === href && link.text === text,
);

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
  const release = releaseForRoute(route);
  const storedAboutParagraphs = release
    ? (Array.isArray(release.about) ? release.about : [release.about])
      .filter((paragraph) => paragraph?.trim())
    : [];
  const exposedStoredAboutParagraphs = storedAboutParagraphs.filter(
    (paragraph) => visibleText.includes(paragraph.trim()),
  );

  if (response.status !== 200) failures.push(`${route}: HTTP ${response.status}`);
  if (h1.length !== 1) failures.push(`${route}: expected one H1, found ${h1.length}`);
  if (release) {
    if (h2.some((heading) => heading.toLowerCase() === "about the release")) {
      failures.push(`${route}: rendered the rejected About the release section`);
    }
    if (exposedStoredAboutParagraphs.length) {
      failures.push(`${route}: automatically exposed stored about prose`);
    }
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
    hasAboutReleaseSection: h2.some((heading) => heading.toLowerCase() === "about the release"),
    exposedStoredAboutParagraphs,
  });
}

if (sitemapRoutes.length !== 22) failures.push(`sitemap: expected 22 routes, found ${sitemapRoutes.length}`);
if (sitemapRoutes.filter((route) => route.startsWith("/music/")).length !== 15) {
  failures.push("sitemap: expected 15 indexable release routes");
}
if (sitemapRoutes.includes("/music/4u-vip")) failures.push("sitemap: noindex route was included");

const pagesByRoute = new Map(pages.map((page) => [page.route, page]));
const homePage = pagesByRoute.get("/");
const musicPage = pagesByRoute.get("/music");
const aboutPage = pagesByRoute.get("/about");
const pressPage = pagesByRoute.get("/press");

if (!homePage?.paragraphs.includes(approvedHomepageCopy)) failures.push("/: approved homepage copy is not exact");
if (!hasLink(homePage, "/music", "Explore the music")) failures.push("/: missing primary Explore the music link");
if (!hasLink(homePage, "/about", "About Broey")) failures.push("/: missing secondary About Broey link");
if (musicPage?.h1[0] !== "Broey. Selects") failures.push("/music: branded H1 changed");
if (!musicPage?.paragraphs.includes(approvedMusicCopy)) failures.push("/music: approved introduction is not exact");

const aboutReleaseLinks = [
  ["/music/fragments-ep", "Fragments"],
  ["/music/4u", "4u"],
  ["/music/mean-something", "Mean Something"],
  ["/music/dancing-dumpster-fire", "dancing dumpster fire"],
  ["/music/stereo-luv", "STEREO LUV"],
  ["/music/blu", "blu."],
  ["/music/free", "FREE"],
];
for (const [href, text] of aboutReleaseLinks) {
  if (!hasLink(aboutPage, href, text)) failures.push(`/about: missing ${text} release link`);
}
if (!hasLink(aboutPage, "/music/dancing-dumpster-fire", "View dancing dumpster fire")) {
  failures.push("/about: missing featured press-card release link");
}

if (!pressPage?.paragraphs.includes(approvedEdmReviewerSummary)) {
  failures.push("/press: approved EDM Reviewer summary is not exact");
}
for (const [href, text] of [
  ["/music/dancing-dumpster-fire", "View dancing dumpster fire"],
  ["/music/fragments-ep", "View Fragments"],
]) {
  if (!hasLink(pressPage, href, text)) failures.push(`/press: missing ${text} release link`);
}

for (const [route, context, parentHref, parentText] of [
  ["/music/like-that", "Track 1 on Fragments", "/music/fragments-ep", "View Fragments"],
  ["/music/4u-vip", "Track 7 on dancing dumpster fire", "/music/dancing-dumpster-fire", "View dancing dumpster fire"],
]) {
  const page = pagesByRoute.get(route);
  if (!page?.paragraphs.includes(context)) failures.push(`${route}: missing verified track position`);
  if (!hasLink(page, parentHref, parentText)) failures.push(`${route}: missing parent-project link`);
}

for (const route of ["/music/dancing-dumpster-fire", "/music/fragments-ep"]) {
  const page = pagesByRoute.get(route);
  const release = releaseForRoute(route);
  if (!page?.h2.some((heading) => heading.toLowerCase() === "press coverage")) {
    failures.push(`${route}: missing release press section`);
  }
  if (!hasLink(page, "/press", "View all coverage")) failures.push(`${route}: missing press archive link`);
  for (const item of pressItemsForRelease(release.slug)) {
    if (!page?.outboundLinks.some((link) => link.href === item.href)) {
      failures.push(`${route}: missing original press source ${item.href}`);
    }
  }
}

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
  approvedCopy: {
    homepage: approvedHomepageCopy,
    music: approvedMusicCopy,
    edmReviewer: approvedEdmReviewerSummary,
  },
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
