import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const {
  createPublicSitemap,
  createRobotsPolicy,
  reliableReleaseDate,
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
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://broey.net/sitemap.xml",
  });
  assert.deepEqual(createRobotsPolicy(true, "https://broey.net/sitemap.xml"), {
    rules: { userAgent: "*", disallow: "/" },
  });
});

test("public sitemap contains static and eligible release URLs once", () => {
  const sitemap = createPublicSitemap(
    ["/", "/music", "/music"],
    [
      { path: "/music/free", releaseDate: "2026-05-07" },
      { path: "/music/free", releaseDate: "2026-05-07" },
      { path: "/music/stereo-luv", releaseDate: "2025-00-00" },
    ],
    (path) => `${productionSiteOrigin}${path}`,
  );

  assert.deepEqual(sitemap.map(({ url }) => url), [
    "https://broey.net/",
    "https://broey.net/music",
    "https://broey.net/music/free",
    "https://broey.net/music/stereo-luv",
  ]);
  assert.equal(sitemap[2].lastModified?.toISOString(), "2026-05-07T00:00:00.000Z");
  assert.equal("lastModified" in sitemap[3], false);
});

test("only complete factual release dates become sitemap modification dates", () => {
  assert.equal(reliableReleaseDate("2024-00-00"), undefined);
  assert.equal(reliableReleaseDate("2023-02-31"), undefined);
  assert.equal(reliableReleaseDate("not-a-date"), undefined);
  assert.equal(reliableReleaseDate("2023-08-04")?.toISOString(), "2023-08-04T00:00:00.000Z");
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
