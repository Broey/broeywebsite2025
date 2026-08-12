import assert from "node:assert/strict";
import test from "node:test";

const { pressItems } = await import("../content/press.ts");
const { releaseAboutParagraphs } = await import("../content/release-content.ts");
const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { releases } = await import("../content/releases.ts");

const indexableReleases = releases.filter(showReleaseInSitemap);
const comparableTitle = (title) => title.toLowerCase().replace(/[.!]/g, "").trim();

test("all 15 indexable releases expose meaningful visible release context", () => {
  assert.equal(indexableReleases.length, 15);

  for (const release of indexableReleases) {
    const paragraphs = releaseAboutParagraphs(release);
    const prose = paragraphs.join(" ").trim();

    assert.ok(release.description.trim(), `${release.slug} needs a description`);
    assert.ok(paragraphs.length >= 1, `${release.slug} needs visible release context`);
    assert.ok(
      prose.split(/\s+/).length >= 12,
      `${release.slug} visible release context is unexpectedly thin`,
    );
  }
});

test("release parent and project-track relationships resolve to published routes", () => {
  const publishedSlugs = new Set(
    releases
      .filter((release) => release.visibility !== "draft")
      .map((release) => release.slug),
  );

  for (const release of releases.filter((entry) => entry.visibility !== "draft")) {
    if (release.parentReleaseSlug) {
      assert.ok(
        publishedSlugs.has(release.parentReleaseSlug),
        `${release.slug} has an unpublished parent project`,
      );

      const parent = releases.find((entry) => entry.slug === release.parentReleaseSlug);
      const appearsInParentTracklist = (parent?.tracklist ?? []).some((track) => {
        const title = typeof track === "string" ? track : track.title;
        const slug = typeof track === "string" ? undefined : track.slug;
        const parentTitle = comparableTitle(title);
        const childTitle = comparableTitle(release.title);
        return slug === release.slug || parentTitle === childTitle || parentTitle.startsWith(`${childTitle} (`);
      });

      assert.ok(
        appearsInParentTracklist,
        `${release.slug} is missing from ${release.parentReleaseSlug}'s tracklist`,
      );
    }
  }
});

test("press-to-release relationships target indexable release pages", () => {
  const indexableSlugs = new Set(indexableReleases.map((release) => release.slug));

  for (const item of pressItems) {
    for (const releaseSlug of item.releaseSlugs ?? []) {
      assert.ok(
        indexableSlugs.has(releaseSlug),
        `${item.id} links to non-indexable release ${releaseSlug}`,
      );
    }
  }
});

test("no noindex project track enters the sitemap", () => {
  const accidentalProjectTracks = indexableReleases.filter(
    (release) => release.isProjectTrack,
  );

  assert.deepEqual(accidentalProjectTracks, []);
});
