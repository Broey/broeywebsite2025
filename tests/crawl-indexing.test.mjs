import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const {
  createPublicSitemap,
  createRobotsPolicy,
  reliableSitemapDate,
} = await import("../lib/crawl-indexing.ts");
const {
  isPublicIndexableRelease,
  isPublishedRelease,
  showReleaseInSitemap,
} = await import("../content/release-filters.ts");
const {
  canonicalPath,
  parseSiteOrigin,
  productionSiteOrigin,
} = await import("../lib/site-origin.ts");

test("robots policy allows public crawling and blocks private crawling", () => {
  assert.deepEqual(createRobotsPolicy(false, "https://broey.net/sitemap.xml"), {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
    ],
    sitemap: "https://broey.net/sitemap.xml",
  });
  assert.deepEqual(createRobotsPolicy(true, "https://broey.net/sitemap.xml"), {
    rules: { userAgent: "*", disallow: "/" },
  });
});

test("only verified training crawlers are restricted on the public site", () => {
  const policy = createRobotsPolicy(false, "https://broey.net/sitemap.xml");
  for (const agent of ["Googlebot", "bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "Google-Extended"]) {
    const applicable = policy.rules.find((rule) => rule.userAgent === agent)
      ?? policy.rules.find((rule) => rule.userAgent === "*");
    assert.equal(applicable.allow, "/", agent);
    assert.equal(applicable.disallow, undefined, agent);
  }
  assert.deepEqual(policy.rules.filter((rule) => rule.disallow).map((rule) => rule.userAgent), ["GPTBot", "ClaudeBot"]);
});

test("rights metadata follows public and private visibility and has one dated sitemap entry", async () => {
  const { staticPageMetadata, staticSitemapPages } = await import("../content/page-metadata.ts");
  const { createPageMetadata } = await import("../content/seo.ts");
  const visibility = process.env.SITE_VISIBILITY;
  const passcode = process.env.SITE_PASSCODE;
  try {
    process.env.SITE_VISIBILITY = "public";
    const publicMetadata = createPageMetadata(staticPageMetadata.rights);
    // This suite uses the development fallback origin; the built-site validator checks production.
    assert.equal(publicMetadata.alternates.canonical, "http://localhost:3000/rights");
    assert.equal(publicMetadata.title, "Rights & Licensing");
    assert.equal(publicMetadata.robots, undefined);
    const entries = createPublicSitemap(staticSitemapPages, [], (path) => `${productionSiteOrigin}${path}`);
    const rights = entries.filter((entry) => entry.url === "https://broey.net/rights");
    assert.equal(rights.length, 1);
    assert.equal(rights[0].lastModified.toISOString(), "2026-11-14T00:00:00.000Z");
    assert.equal(entries.find((entry) => entry.url === "https://broey.net/privacy").lastModified.toISOString(), "2026-11-14T00:00:00.000Z");
    process.env.SITE_VISIBILITY = "private";
    process.env.SITE_PASSCODE = "synthetic-test-only";
    assert.deepEqual(createPageMetadata(staticPageMetadata.rights).robots, {
      index: false, follow: false, googleBot: { index: false, follow: false },
    });
  } finally {
    if (visibility === undefined) delete process.env.SITE_VISIBILITY;
    else process.env.SITE_VISIBILITY = visibility;
    if (passcode === undefined) delete process.env.SITE_PASSCODE;
    else process.env.SITE_PASSCODE = passcode;
  }
});

test("private preview gates rights requests and accepts only valid preview authorization", async () => {
  const require = createRequire(import.meta.url);
  const ts = require("typescript");
  const { NextRequest } = require("next/server");
  const visibility = await import("../lib/site-visibility.ts");
  // Evaluate the actual proxy, resolving its application alias without a running server.
  const compiled = ts.transpileModule(readFileSync(new URL("../proxy.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((id) => id === "@/lib/site-visibility" ? visibility : require(id), exports);
  const previousVisibility = process.env.SITE_VISIBILITY;
  const previousPasscode = process.env.SITE_PASSCODE;
  try {
    process.env.SITE_VISIBILITY = "private";
    process.env.SITE_PASSCODE = "synthetic-test-only";
    for (const cookie of [undefined, "invalid"]) {
      const request = new NextRequest("http://localhost:3000/rights", cookie ? { headers: { cookie: `${visibility.gateCookieName}=${cookie}` } } : {});
      const response = await exports.proxy(request);
      assert.equal(response.status, 307);
      assert.equal(response.headers.get("location"), "http://localhost:3000/gate?next=%2Frights");
    }
    const cookie = await visibility.createGateCookieValue();
    const authorized = await exports.proxy(new NextRequest("http://localhost:3000/rights", {
      headers: { cookie: `${visibility.gateCookieName}=${cookie}` },
    }));
    assert.equal(authorized.headers.get("x-middleware-next"), "1");
    process.env.SITE_VISIBILITY = "public";
    assert.equal((await exports.proxy(new NextRequest("http://localhost:3000/rights"))).headers.get("x-middleware-next"), "1");
  } finally {
    if (previousVisibility === undefined) delete process.env.SITE_VISIBILITY;
    else process.env.SITE_VISIBILITY = previousVisibility;
    if (previousPasscode === undefined) delete process.env.SITE_PASSCODE;
    else process.env.SITE_PASSCODE = previousPasscode;
  }
});

test("public sitemap contains static and eligible release URLs once", () => {
  const sitemap = createPublicSitemap(
    [{ path: "/" }, { path: "/music", lastModified: "2026-11-12" }, { path: "/music" }],
    [
      { path: "/music/free", lastModified: "2026-11-13" },
      { path: "/music/free", lastModified: "2026-11-13" },
      { path: "/music/stereo-luv", lastModified: "2025-00-00" },
    ],
    (path) => `${productionSiteOrigin}${path}`,
  );

  assert.deepEqual(sitemap.map(({ url }) => url), [
    "https://broey.net/",
    "https://broey.net/music",
    "https://broey.net/music/free",
    "https://broey.net/music/stereo-luv",
  ]);
  assert.equal(sitemap[1].lastModified?.toISOString(), "2026-11-12T00:00:00.000Z");
  assert.equal(sitemap[2].lastModified?.toISOString(), "2026-11-13T00:00:00.000Z");
  assert.equal("lastModified" in sitemap[3], false);
});

test("only complete calendar dates become sitemap modification dates", () => {
  assert.equal(reliableSitemapDate("2024-00-00"), undefined);
  assert.equal(reliableSitemapDate("2023-02-31"), undefined);
  assert.equal(reliableSitemapDate("not-a-date"), undefined);
  assert.equal(reliableSitemapDate("2023-08-04")?.toISOString(), "2023-08-04T00:00:00.000Z");
});

test("release eligibility excludes drafts, internal entries, noindex entries, and invalid slugs", () => {
  const base = { slug: "free", type: "single", title: "FREE", description: "x", links: [] };
  assert.equal(isPublishedRelease(base), true);
  assert.equal(isPublishedRelease({ ...base, visibility: "draft" }), false);
  assert.equal(isPublishedRelease({ ...base, catalogStatus: "draft" }), false);
  assert.equal(isPublishedRelease({ ...base, indexing: "noindex" }), false);
  assert.equal(isPublishedRelease({ ...base, indexing: "internal" }), false);
  assert.equal(isPublishedRelease({ ...base, slug: " " }), false);
  assert.equal(isPublicIndexableRelease(base), true);
  assert.equal(
    isPublicIndexableRelease({ ...base, isProjectTrack: true, showInArchive: false }),
    false,
  );
  assert.equal(showReleaseInSitemap({ ...base, showInSitemap: false }), false);
  assert.equal(showReleaseInSitemap({ ...base, showInSitemap: true }), true);
  assert.equal(
    showReleaseInSitemap({ ...base, visibility: "draft", showInSitemap: true }),
    false,
  );
});

test("production origin and canonical paths are constrained", () => {
  assert.equal(parseSiteOrigin("https://broey.net/", "production"), productionSiteOrigin);
  assert.equal(
    parseSiteOrigin("https://example.vercel.app", "production"),
    productionSiteOrigin,
  );
  assert.throws(() => parseSiteOrigin(undefined, "production"), /explicit HTTPS origin/);
  assert.equal(canonicalPath("/music/free"), "/music/free");
  assert.throws(() => canonicalPath("/music/free?preview=1"), /query, or fragment/);
  assert.throws(() => canonicalPath("https://example.com/music/free"), /Invalid application path/);
});


test("sitemap dates track page updates independently of publication and request time", (t) => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-14T12:00:00Z") });
  const pages = [
    { path: "/music/old", releaseDate: "2020-01-01", lastModified: "2026-11-13" },
    { path: "/music/unknown", releaseDate: "2020-01-01" },
    { path: "/music/invalid", lastModified: "2026-02-30" },
  ];
  const build = () => createPublicSitemap([], pages, (path) => `${productionSiteOrigin}${path}`);
  const before = build();
  assert.equal(before[0].lastModified.toISOString(), "2026-11-13T00:00:00.000Z");
  assert.equal("lastModified" in before[1], false);
  assert.equal("lastModified" in before[2], false);
  t.mock.timers.tick(86400000);
  assert.deepEqual(build(), before);
  assert.equal(reliableSitemapDate("2024-02-29")?.toISOString(), "2024-02-29T00:00:00.000Z");
  for (const invalid of [undefined, "", "2026", "2026-11", "2026-13-01", "2026-11-14T00:00:00Z"]) {
    assert.equal(reliableSitemapDate(invalid), undefined);
  }
});

test("scheduled sitemap eligibility switches at launch and preserves exclusions", (t) => {
  const launch = Date.parse("2026-11-15T05:00:00Z");
  t.mock.timers.enable({ apis: ["Date"], now: launch - 1 });
  const scheduled = {
    slug: "scheduled", type: "single", title: "Scheduled", description: "x", links: [],
    visibility: "public", availableAt: new Date(launch).toISOString(), showInSitemap: true,
  };
  assert.equal(showReleaseInSitemap(scheduled), false);
  t.mock.timers.tick(1);
  assert.equal(showReleaseInSitemap(scheduled), true);
  for (const excluded of [
    { visibility: "draft" }, { catalogStatus: "draft" }, { indexing: "internal" },
    { indexing: "noindex" }, { showInSitemap: false }, { availableAt: "invalid" },
  ]) {
    assert.equal(showReleaseInSitemap({ ...scheduled, ...excluded }), false);
  }
});

test("catalog sitemap covers the shared core registry and every eligible release exactly once", async () => {
  const { staticPageMetadata, staticSitemapPages } = await import("../content/page-metadata.ts");
  const { releases } = await import("../content/releases.ts");
  const { releaseDetailHref } = await import("../content/release-actions.ts");
  const eligible = releases.filter(showReleaseInSitemap);
  const sitemap = createPublicSitemap(staticSitemapPages, eligible.map((release) => ({
    path: releaseDetailHref(release), lastModified: release.lastModified,
  })), (path) => `${productionSiteOrigin}${path}`);
  const expectedPaths = [
    ...Object.values(staticPageMetadata).filter((page) => page.indexable !== false).map((page) => page.path),
    ...eligible.map(releaseDetailHref),
  ];
  assert.equal(new Set(sitemap.map((entry) => entry.url)).size, expectedPaths.length);
  assert.deepEqual(sitemap.map((entry) => entry.url), expectedPaths.map((path) => `${productionSiteOrigin}${path}`));
  assert.equal(sitemap.some((entry) => /\/(join|gate|design-system|watch)$/.test(entry.url)), false);
  for (const path of ["/press", "/music/dancing-dumpster-fire"]) {
    assert.equal(sitemap.find((entry) => entry.url === `${productionSiteOrigin}${path}`)
      ?.lastModified?.toISOString(), "2026-11-14T00:00:00.000Z");
  }
});
