import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";

const { pressItems } = await import("../content/press.ts");
const { showReleaseInSitemap } = await import("../content/release-filters.ts");
const { releases } = await import("../content/releases.ts");
const {
  curatedGenreFilters,
  curatedGenreFiltersForRelease,
  normalizedGenres,
} = await import("../content/genres.ts");
const {
  NEUTRAL_PLAYER_ACCENT,
  isPlayerAccent,
  playerAccentStyle,
  resolvePlayerAccent,
  withPlayerAccentQuery,
} = await import("../lib/player-accent.ts");

const indexableReleases = releases.filter(showReleaseInSitemap);
const comparableTitle = (title) => title.toLowerCase().replace(/[.!]/g, "").trim();

test("all 17 indexable catalog entries retain the factual data needed by music-first pages", () => {
  assert.equal(indexableReleases.length, 17);

  for (const release of indexableReleases) {
    assert.ok(release.title.trim(), `${release.slug} needs a title`);
    assert.ok(release.type, `${release.slug} needs a release type`);
    assert.ok(release.releaseDate || release.year, `${release.slug} needs a date or year`);
    assert.ok(release.audio, `${release.slug} needs a player source`);
  }
});

test("authored about data remains stored when provided but the shared release template does not render it", async () => {
  for (const release of indexableReleases) {
    const paragraphs = (Array.isArray(release.about) ? release.about : [release.about])
      .filter((paragraph) => paragraph?.trim());

    if (release.about) {
      assert.ok(paragraphs.length, `${release.slug} should retain its stored about data`);
    }
  }

  const releaseTemplate = await fs.readFile(
    new URL("../app/music/[slug]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(releaseTemplate, /About the release/i);
  assert.doesNotMatch(releaseTemplate, /release\.about/);
  assert.doesNotMatch(releaseTemplate, /releaseAboutParagraphs/);
});

test("COUNTING is modeled as an unreleased playable 2023 catalog entry without invented release metadata", () => {
  const counting = releases.find((release) => release.slug === "counting");

  assert.ok(counting);
  assert.equal(counting.status, "unreleased");
  assert.equal(counting.year, 2023);
  assert.equal(counting.artistName, "Broey.");
  assert.equal(counting.releaseDate, undefined);
  assert.equal(counting.description, undefined);
  assert.equal(counting.links.length, 0);
  assert.equal(counting.playerAccent, "#4f9fa8");
  assert.deepEqual(normalizedGenres(counting), ["Dubstep", "Electronic"]);
  assert.deepEqual(curatedGenreFiltersForRelease(counting), ["Dubstep", "Electronic"]);
  assert.equal(counting.audio.tracks[0].artist, "Broey.");
  assert.equal(counting.audio.tracks[0].src, "/audio/counting.mp3");
});

test("Hold Me Back is modeled as an unreleased playable 2023 catalog entry without invented release metadata", () => {
  const holdMeBack = releases.find((release) => release.slug === "hold-me-back");

  assert.ok(holdMeBack);
  assert.equal(holdMeBack.status, "unreleased");
  assert.equal(holdMeBack.year, 2023);
  assert.equal(holdMeBack.artistName, "Broey.");
  assert.equal(holdMeBack.releaseDate, undefined);
  assert.equal(holdMeBack.description, undefined);
  assert.equal(holdMeBack.links.length, 0);
  assert.equal(holdMeBack.playerAccent, "#688B9D");
  assert.deepEqual(normalizedGenres(holdMeBack), ["Drum & Bass", "Electronic"]);
  assert.deepEqual(curatedGenreFiltersForRelease(holdMeBack), ["Drum & Bass", "Electronic"]);
  assert.equal(holdMeBack.audio.tracks[0].artist, "Broey.");
  assert.equal(holdMeBack.audio.tracks[0].src, "/audio/hold-me-back.mp3");
});

test("unreleased catalog cards preserve independent type, era, and status presentation", async () => {
  const releaseCard = await fs.readFile(
    new URL("../components/ui/ReleaseCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(releaseCard, /<p className="release-grid-card-meta">\{releaseMeta\}<\/p>/);
  assert.doesNotMatch(releaseCard, /!release\.status\s*\?/);
  assert.match(releaseCard, /<ReleaseStatusMeta[\s\S]*?showEra=\{false\}[\s\S]*?\/>/);
});

test("the curated genre filter bar remains unchanged", () => {
  assert.deepEqual(curatedGenreFilters, [
    "House",
    "Drum & Bass",
    "Jungle",
    "Dubstep",
    "Garage",
    "Breakbeat",
    "Electronic",
  ]);
});

test("every published release resolves to an intentional artwork accent", () => {
  for (const release of releases) {
    assert.ok(release.playerAccent, `${release.slug} needs a release-level player accent`);
    assert.ok(isPlayerAccent(release.playerAccent), `${release.slug} needs a six-digit hex player accent`);
  }

  assert.equal(resolvePlayerAccent(undefined), "#939da9");
  assert.equal(resolvePlayerAccent("#397B8A"), "#397b8a");
  assert.equal(resolvePlayerAccent("not-a-color", "#c66eae"), "#c66eae");
  assert.notEqual(resolvePlayerAccent(undefined), NEUTRAL_PLAYER_ACCENT);
  assert.equal(
    withPlayerAccentQuery("https://example.com/player?theme=dark", "#c66eae"),
    "https://example.com/player?theme=dark&color=%23c66eae",
  );

  for (const release of releases.filter((entry) => entry.embed?.provider === "disco")) {
    const playerSafeAccent = resolvePlayerAccent(release.playerAccent);

    assert.equal(release.embed.disco.controlColor, playerSafeAccent);
    assert.match(
      release.embed.src ?? release.embed.embedUrl,
      new RegExp(`color=%23${playerSafeAccent.slice(1)}`, "i"),
    );
  }
});

test("player-safe normalization strengthens pale accents without shifting defined midtones", () => {
  const sourceAccentBySlug = new Map(
    releases.map((release) => [release.slug, release.playerAccent]),
  );

  assert.equal(resolvePlayerAccent(sourceAccentBySlug.get("free")), "#397b8a");
  assert.equal(resolvePlayerAccent(sourceAccentBySlug.get("contrast")), "#c66eae");
  assert.equal(resolvePlayerAccent(sourceAccentBySlug.get("counting")), "#4f9fa8");
  assert.equal(resolvePlayerAccent(sourceAccentBySlug.get("hold-me-back")), "#688b9d");
  assert.equal(sourceAccentBySlug.get("4u"), "#a987c8");
  assert.equal(resolvePlayerAccent(sourceAccentBySlug.get("4u")), "#a07ac2");
  assert.equal(playerAccentStyle("#a987c8")["--player-accent"], "#a07ac2");
});

test("reviewed release accents stay aligned with their artwork families", () => {
  const accentBySlug = new Map(
    releases.map((release) => [release.slug, release.playerAccent]),
  );

  assert.equal(accentBySlug.get("free"), "#397b8a");
  assert.equal(accentBySlug.get("mean-something"), "#4f8068");
  assert.equal(
    accentBySlug.get("fragments-remixes"),
    accentBySlug.get("fragments-ep"),
  );
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
