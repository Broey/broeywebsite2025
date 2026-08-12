import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const { pressItems } = await import("../content/press.ts");
const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { releases } = await import("../content/releases.ts");

const indexableReleases = releases.filter(showReleaseInSitemap);
const comparableTitle = (title) => title.toLowerCase().replace(/[.!]/g, "").trim();

test("all 15 indexable releases retain the factual data needed by music-first pages", () => {
  assert.equal(indexableReleases.length, 15);

  for (const release of indexableReleases) {
    assert.ok(release.title.trim(), `${release.slug} needs a title`);
    assert.ok(release.type, `${release.slug} needs a release type`);
    assert.ok(release.releaseDate || release.year, `${release.slug} needs a date or year`);
    assert.ok(release.audio, `${release.slug} needs a player source`);
  }
});

test("authored about data remains stored but the shared release template does not render it", async () => {
  for (const release of indexableReleases) {
    const paragraphs = (Array.isArray(release.about) ? release.about : [release.about])
      .filter((paragraph) => paragraph?.trim());

    assert.ok(paragraphs.length, `${release.slug} should retain its stored about data`);
  }

  const releaseTemplate = await fs.readFile(
    new URL("../app/music/[slug]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(releaseTemplate, /About the release/i);
  assert.doesNotMatch(releaseTemplate, /release\.about/);
  assert.doesNotMatch(releaseTemplate, /releaseAboutParagraphs/);
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

test("verified EDM Reviewer coverage retains its approved source and literal summary", () => {
  const item = pressItems.find((entry) => entry.id === "edm-reviewer-fragments");

  assert.ok(item);
  assert.equal(
    item.href,
    "https://edmreviewer.com/2024/04/03/fragments-of-experimental-lofi-a-review-of-broey-s-ep-fragments/",
  );
  assert.equal(
    item.summary,
    "EDM Reviewer highlighted Fragments’ vocal choices, deep-house elements, stylistic variety, and the saxophone on “Breathing Room.”",
  );
  assert.notEqual(item.needsVerification, true);
});

test("no noindex project track enters the sitemap", () => {
  const accidentalProjectTracks = indexableReleases.filter(
    (release) => release.isProjectTrack,
  );

  assert.deepEqual(accidentalProjectTracks, []);
});
