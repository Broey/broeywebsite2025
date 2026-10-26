import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;

const { releases } = await import("../content/releases.ts");
const { releasePlatformLinks } = await import("../content/release-actions.ts");
const { currentFocusRelease } = await import("../content/release-focus.ts");
const { isPublishedRelease } = await import("../content/release-filters.ts");
const { createReleaseStructuredData } = await import("../content/structured-data.ts");
const release = releases.find(release => release.slug === "vultures");
const source = JSON.parse(readFileSync(new URL("../data/source/vultures-release-2026-10-25.json", import.meta.url)));

test("Vultures exposes all artist-supplied direct destinations in the requested order", () => {
  const links = releasePlatformLinks(release);
  assert.deepEqual(links.slice(0, 5).map(link => link.platform), [
    "Spotify", "Apple Music", "SoundCloud", "TIDAL", "YouTube Music",
  ]);
  assert.equal(links.length, 11);
  assert.deepEqual(new Map(links.filter(link => link.kind !== "promo").map(link => [link.platform, link.url])),
    new Map(source.officialStreamingLinks.map(link => [link.platform, link.url])));
  assert.equal(links.at(-1).url, source.smartLink);
  assert.equal(links.find(link => link.platform === "YouTube").kind, "video");
  assert.ok(links.every(link => !link.primary && new URL(link.url).protocol === "https:"));
});

test("Vultures uses confirmed metadata and leads highlights while OnlyU remains published", () => {
  const originalNow = Date.now;
  try {
    Date.now = () => Date.parse("2026-10-26T12:00:00Z");
    assert.equal(currentFocusRelease(releases).slug, "vultures");
    const highlights = releases.filter(release => release.carouselEnabled && isPublishedRelease(release))
      .sort((a, b) => a.carouselPriority - b.carouselPriority);
    assert.deepEqual(highlights.slice(0, 2).map(release => release.slug), ["vultures", "only-u"]);
    assert.equal(release.releaseDate, source.releaseDate.value);
    assert.equal(release.coverImage, source.artwork.path.replace("public", ""));
    assert.equal(release.artistName, "Broey. & sunscrn");
    const schema = JSON.stringify(createReleaseStructuredData(release));
    for (const { url } of source.officialStreamingLinks) assert.ok(schema.includes(url));
    assert.ok(schema.includes("sunscrn"));
    assert.ok(schema.includes(source.releaseDate.value));
  } finally { Date.now = originalNow; }
});
