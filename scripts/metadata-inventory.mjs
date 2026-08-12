const canonicalOrigin = "https://broey.net";
const args = process.argv.slice(2);

function argumentValue(name, fallback) {
  const exactIndex = args.indexOf(name);
  const inline = args.find((argument) => argument.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  return exactIndex >= 0 ? args[exactIndex + 1] : fallback;
}

const positionalArgs = args.filter((argument) => !argument.startsWith("--"));
const baseUrl = new URL(
  argumentValue(
    "--base",
    positionalArgs.find((argument) => /^https?:\/\//.test(argument)) ?? "http://127.0.0.1:3000",
  ),
);
const noindexRoute = argumentValue(
  "--noindex-route",
  positionalArgs.find((argument) => argument.startsWith("/")) ?? "/music/4u-vip",
);
const format = argumentValue("--format", "markdown");

function decodeHtml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([:\w-]+)=(['"])(.*?)\2/g)].map((match) => [
      match[1],
      decodeHtml(match[3]),
    ]),
  );
}

function stripHtml(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function inspectHtml(path, status, html) {
  const metaTags = [...html.matchAll(/<meta\s[^>]*>/g)].map((match) => attributes(match[0]));
  const linkTags = [...html.matchAll(/<link\s[^>]*>/g)].map((match) => attributes(match[0]));
  const titleValues = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((match) =>
    decodeHtml(match[1]),
  );
  const named = (name) => metaTags.filter((tag) => tag.name === name);
  const property = (name) => metaTags.filter((tag) => tag.property === name);
  const canonicals = linkTags.filter((tag) => tag.rel === "canonical");
  const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((match) =>
    stripHtml(match[1]),
  );
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((match) =>
    stripHtml(match[1]),
  );
  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => stripHtml(match[1]))
    .filter((value) => value.length >= 40);
  const internalLinks = [...html.matchAll(/<a\s[^>]*>[\s\S]*?<\/a>/g)]
    .map((match) => ({ ...attributes(match[0]), text: stripHtml(match[0]) }))
    .filter(({ href, text }) => href?.startsWith("/") && text)
    .filter((link, index, list) =>
      list.findIndex((candidate) => candidate.href === link.href && candidate.text === link.text) === index,
    );
  const images = [...html.matchAll(/<img\s[^>]*>/g)]
    .map((match) => attributes(match[0]))
    .map(({ src, alt, class: className = "", "aria-hidden": ariaHidden }) => ({
      src,
      altPresent: alt !== undefined,
      alt: alt ?? null,
      ariaHidden: ariaHidden === "true",
      className,
    }))
    .filter(({ src }) => src);

  return {
    path,
    status,
    counts: {
      title: titleValues.length,
      description: named("description").length,
      canonical: canonicals.length,
      ogTitle: property("og:title").length,
      ogDescription: property("og:description").length,
      ogUrl: property("og:url").length,
      ogImage: property("og:image").length,
      ogImageAlt: property("og:image:alt").length,
      twitterTitle: named("twitter:title").length,
      twitterDescription: named("twitter:description").length,
      twitterImage: named("twitter:image").length,
      twitterImageAlt: named("twitter:image:alt").length,
      h1: h1.length,
    },
    title: titleValues[0] ?? "",
    description: named("description")[0]?.content ?? "",
    canonical: canonicals[0]?.href ?? "",
    ogTitle: property("og:title")[0]?.content ?? "",
    ogDescription: property("og:description")[0]?.content ?? "",
    ogUrl: property("og:url")[0]?.content ?? "",
    ogImage: property("og:image")[0]?.content ?? "",
    ogImageAlt: property("og:image:alt")[0]?.content ?? "",
    twitterTitle: named("twitter:title")[0]?.content ?? "",
    twitterDescription: named("twitter:description")[0]?.content ?? "",
    twitterImage: named("twitter:image")[0]?.content ?? "",
    twitterImageAlt: named("twitter:image:alt")[0]?.content ?? "",
    robots: named("robots")[0]?.content ?? "",
    h1,
    h2,
    intro: paragraphs[0] ?? "",
    internalLinks,
    images,
  };
}

async function fetchRoute(path) {
  const response = await fetch(new URL(path, baseUrl));
  return inspectHtml(path, response.status, await response.text());
}

function expectedCanonical(path) {
  return path === "/" ? canonicalOrigin : new URL(path, canonicalOrigin).toString();
}

function localAssetUrl(assetUrl) {
  const parsed = new URL(assetUrl);
  return new URL(`${parsed.pathname}${parsed.search}`, baseUrl);
}

const sitemapResponse = await fetch(new URL("/sitemap.xml", baseUrl));
const sitemapXml = await sitemapResponse.text();
const routes = [...sitemapXml.matchAll(/<loc>https:\/\/broey\.net([^<]*)<\/loc>/g)].map(
  (match) => match[1] || "/",
);
const pages = [];

for (const route of routes) {
  pages.push(await fetchRoute(route));
}

const noindexPage = noindexRoute ? await fetchRoute(noindexRoute) : undefined;
const robotsResponse = await fetch(new URL("/robots.txt", baseUrl));
const robotsText = await robotsResponse.text();
const manifestResponse = await fetch(new URL("/manifest.webmanifest", baseUrl));
const manifest = await manifestResponse.json();
const failures = [];
const requiredCounts = [
  "title",
  "description",
  "canonical",
  "ogTitle",
  "ogDescription",
  "ogUrl",
  "ogImage",
  "ogImageAlt",
  "twitterTitle",
  "twitterDescription",
  "twitterImage",
  "twitterImageAlt",
  "h1",
];

for (const page of pages) {
  if (page.status !== 200) failures.push(`${page.path}: HTTP ${page.status}`);

  for (const key of requiredCounts) {
    if (page.counts[key] !== 1) failures.push(`${page.path}: expected one ${key}, found ${page.counts[key]}`);
  }

  const canonical = expectedCanonical(page.path);
  if (page.canonical !== canonical) failures.push(`${page.path}: canonical mismatch`);
  if (page.ogUrl !== canonical) failures.push(`${page.path}: Open Graph URL mismatch`);
  if (page.ogTitle !== page.title) failures.push(`${page.path}: Open Graph title mismatch`);
  if (page.twitterTitle !== page.title) failures.push(`${page.path}: Twitter title mismatch`);
  if (page.ogDescription !== page.description) failures.push(`${page.path}: Open Graph description mismatch`);
  if (page.twitterDescription !== page.description) failures.push(`${page.path}: Twitter description mismatch`);
  if (page.twitterImageAlt !== page.ogImageAlt) failures.push(`${page.path}: social image alt mismatch`);
  if (/noindex/i.test(page.robots)) failures.push(`${page.path}: sitemap route is noindex`);

  for (const [index, image] of page.images.entries()) {
    if (!image.altPresent) failures.push(`${page.path}: image ${index + 1} is missing an alt attribute`);
    if (image.alt === "" && !image.ariaHidden) {
      failures.push(`${page.path}: image ${index + 1} has empty alt without aria-hidden`);
    }
  }

  for (const [label, imageUrl] of [["Open Graph", page.ogImage], ["Twitter", page.twitterImage]]) {
    try {
      const parsed = new URL(imageUrl);
      if (parsed.origin !== canonicalOrigin) failures.push(`${page.path}: ${label} image is not an application URL`);
      const imageResponse = await fetch(localAssetUrl(imageUrl));
      if (!imageResponse.ok || !imageResponse.headers.get("content-type")?.startsWith("image/")) {
        failures.push(`${page.path}: ${label} image did not resolve as an image`);
      }
    } catch {
      failures.push(`${page.path}: ${label} image URL is invalid`);
    }
  }
}

if (sitemapResponse.status !== 200) failures.push(`sitemap: HTTP ${sitemapResponse.status}`);
if (routes.length !== 22) failures.push(`sitemap: expected 22 routes, found ${routes.length}`);
if (pages.filter(({ path }) => path.startsWith("/music/")).length !== 15) {
  failures.push("sitemap: expected 15 indexable release routes");
}
if (robotsResponse.status !== 200) failures.push(`robots: HTTP ${robotsResponse.status}`);
if (!/^User-Agent: \*\s+Allow: \/\s+Sitemap: https:\/\/broey\.net\/sitemap\.xml\s*$/i.test(robotsText)) {
  failures.push("robots: public policy changed");
}
if (manifestResponse.status !== 200) failures.push(`manifest: HTTP ${manifestResponse.status}`);
if (manifest.name !== "Broey." || manifest.short_name !== "Broey.") {
  failures.push("manifest: site identity mismatch");
}

for (const iconPath of [
  "/favicon.ico",
  "/favicon-16x16.png",
  "/favicon-32x32.png",
  "/apple-icon.png",
  "/icon.png",
  "/icon-192.png",
  "/icon-512.png",
]) {
  const response = await fetch(new URL(iconPath, baseUrl));
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    failures.push(`${iconPath}: favicon/site icon did not resolve as an image`);
  }
}

for (const field of ["title", "description"]) {
  const groups = Object.groupBy(pages, (page) => page[field]);
  for (const [value, matches] of Object.entries(groups)) {
    if (value && matches.length > 1) {
      failures.push(`duplicate ${field}: ${matches.map((page) => page.path).join(", ")}`);
    }
  }
}

if (noindexPage) {
  if (routes.includes(noindexPage.path)) failures.push(`${noindexPage.path}: noindex route appeared in sitemap`);
  if (!/noindex/i.test(noindexPage.robots)) failures.push(`${noindexPage.path}: expected noindex metadata`);

  for (const [index, image] of noindexPage.images.entries()) {
    if (!image.altPresent) failures.push(`${noindexPage.path}: image ${index + 1} is missing an alt attribute`);
    if (image.alt === "" && !image.ariaHidden) {
      failures.push(`${noindexPage.path}: image ${index + 1} has empty alt without aria-hidden`);
    }
  }
}

const inventory = {
  generatedAt: new Date().toISOString(),
  baseUrl: baseUrl.toString(),
  sitemapStatus: sitemapResponse.status,
  routeCount: pages.length,
  releaseCount: pages.filter(({ path }) => path.startsWith("/music/")).length,
  pages,
  noindexPage,
  sitePresentation: {
    robotsStatus: robotsResponse.status,
    robotsText,
    manifestStatus: manifestResponse.status,
    manifestName: manifest.name,
    manifestShortName: manifest.short_name,
  },
  failures,
  passed: failures.length === 0,
};

if (format === "json") {
  console.log(JSON.stringify(inventory, null, 2));
} else {
  console.log("# Rendered metadata inventory\n");
  console.log(`- Base URL: ${baseUrl}`);
  console.log(`- Sitemap routes: ${inventory.routeCount}`);
  console.log(`- Indexable release routes: ${inventory.releaseCount}`);
  console.log(`- Result: ${inventory.passed ? "PASS" : "FAIL"}\n`);
  console.log("| Route | Title | Description | H1 | Social image |");
  console.log("| --- | --- | --- | --- | --- |");
  for (const page of pages) {
    const cells = [page.path, page.title, page.description, page.h1.join("; "), page.ogImage]
      .map((value) => String(value).replaceAll("|", "\\|"));
    console.log(`| ${cells.join(" | ")} |`);
  }

  if (noindexPage) {
    console.log(`\nNoindex check: ${noindexPage.path} — ${noindexPage.robots || "missing robots metadata"}`);
  }

  if (failures.length) {
    console.log("\n## Failures\n");
    for (const failure of failures) console.log(`- ${failure}`);
  }
}

if (failures.length) {
  process.exitCode = 1;
}
