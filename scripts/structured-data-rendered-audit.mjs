import fs from "node:fs/promises";
import path from "node:path";

process.env.NODE_ENV = "development";
process.env.NEXT_PUBLIC_SITE_URL ??= "https://broey.net";

const baseUrl = (process.argv[2] ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const outputPath = path.resolve(
  process.cwd(),
  "reports/phase-4-structured-data-rendered-audit.json",
);
const productionOrigin = "https://broey.net";

const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { releases } = await import("../content/releases.ts");

const indexableReleasePaths = releases
  .filter(showReleaseInSitemap)
  .map((release) => `/music/${release.slug}`);
const routes = [
  "/",
  "/about",
  "/music",
  ...indexableReleasePaths,
  "/music/4u-vip",
  "/press",
  "/contact",
  "/merch",
];

const decodeHtml = (value) =>
  value
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");

const jsonLdBlocks = (html) =>
  [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => decodeHtml(match[1].trim()));

const collectIds = (value, ids = []) => {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, ids);
  } else if (value && typeof value === "object") {
    if (typeof value["@id"] === "string") {
      ids.push({ id: value["@id"], type: value["@type"], name: value.name });
    }
    for (const item of Object.values(value)) collectIds(item, ids);
  }
  return ids;
};

const meaningfulValueIssues = (value, location = "$", issues = []) => {
  if (value === null) issues.push(`${location} is null`);
  if (typeof value === "string" && !value.trim()) issues.push(`${location} is empty`);
  if (Array.isArray(value)) {
    if (!value.length) issues.push(`${location} is an empty array`);
    value.forEach((item, index) => meaningfulValueIssues(item, `${location}[${index}]`, issues));
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      meaningfulValueIssues(item, `${location}.${key}`, issues);
    }
  }
  return issues;
};

const audit = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  productionOrigin,
  routeCount: routes.length,
  indexableReleaseCount: indexableReleasePaths.length,
  routes: [],
  summary: {},
};

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`);
  const html = await response.text();
  const rawBlocks = jsonLdBlocks(html);
  const schemas = [];
  const errors = [];

  rawBlocks.forEach((raw, index) => {
    if (raw.includes("undefined")) errors.push(`block ${index + 1} contains undefined`);
    try {
      const schema = JSON.parse(raw);
      schemas.push(schema);
      meaningfulValueIssues(schema).forEach((issue) =>
        errors.push(`block ${index + 1}: ${issue}`),
      );
      if (schema["@context"] !== "https://schema.org") {
        errors.push(`block ${index + 1} has an invalid @context`);
      }
      const serialized = JSON.stringify(schema);
      const urls = serialized.match(/https?:\\?\/\\?\/[^" ]+/g) ?? [];
      for (const url of urls.filter((candidate) => candidate.includes("broey.net"))) {
        if (!url.startsWith(productionOrigin)) {
          errors.push(`block ${index + 1} has noncanonical Broey URL: ${url}`);
        }
      }
    } catch (error) {
      errors.push(`block ${index + 1} does not parse: ${error.message}`);
    }
  });

  const ids = schemas.flatMap((schema) => collectIds(schema));
  const duplicateConflicts = ids.filter((entry, index) => {
    const earlier = ids.findIndex((candidate) => candidate.id === entry.id);
    if (earlier === index) return false;
    const first = ids[earlier];
    const conflictingType = first.type && entry.type && first.type !== entry.type;
    const conflictingName = first.name && entry.name && first.name !== entry.name;
    return Boolean(conflictingType || conflictingName);
  });
  duplicateConflicts.forEach((entry) =>
    errors.push(`conflicting duplicate @id: ${entry.id}`),
  );

  const robots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']robots["']/i)?.[1]
    ?? null;

  if (route === "/music/4u-vip" && robots !== "noindex, nofollow") {
    errors.push(`expected noindex, nofollow; received ${robots ?? "no robots meta"}`);
  }

  if (indexableReleasePaths.includes(route)) {
    const types = schemas.map((schema) => schema["@type"]);
    if (!types.includes("BreadcrumbList")) errors.push("missing BreadcrumbList");
    if (!types.some((type) => type === "MusicRecording" || type === "MusicAlbum")) {
      errors.push("missing release entity");
    }
  }

  audit.routes.push({
    route,
    status: response.status,
    robots,
    schemaCount: schemas.length,
    schemaTypes: schemas.map((schema) => schema["@type"]),
    entityIds: [...new Set(ids.map((entry) => entry.id))],
    errors,
  });
}

const allErrors = audit.routes.flatMap(({ route, errors }) =>
  errors.map((error) => `${route}: ${error}`),
);
audit.summary = {
  passed: allErrors.length === 0 && audit.routes.every(({ status }) => status === 200),
  errorCount: allErrors.length,
  errors: allErrors,
  httpStatusCounts: Object.fromEntries(
    [...new Set(audit.routes.map(({ status }) => status))].map((status) => [
      status,
      audit.routes.filter((route) => route.status === status).length,
    ]),
  ),
};

await fs.writeFile(outputPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
console.log(JSON.stringify(audit.summary, null, 2));
console.log(`Wrote ${outputPath}`);

if (!audit.summary.passed) process.exitCode = 1;
