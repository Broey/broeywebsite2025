import assert from "node:assert/strict";
import test from "node:test";
const { releases } = await import("../content/releases.ts");
const { currentFocusRelease } = await import("../content/release-focus.ts");

test("scheduled releases replace the old focus and future drafts cannot take over", () => {
  const originalNow = Date.now;
  const launch = Date.parse("2026-10-15T03:26:52Z");
  try {
    Date.now = () => launch - 1;
    assert.equal(currentFocusRelease(releases).slug, "free");
    Date.now = () => launch;
    assert.equal(currentFocusRelease(releases).slug, "only-u");
    const future = { ...releases.find(r => r.slug === "only-u"), slug: "future-release", releaseDate: "2026-10-26", availableAt: "2026-10-26T04:00:00Z", featured: false };
    assert.equal(currentFocusRelease([...releases, future]).slug, "only-u");
    Date.now = () => Date.parse(future.availableAt);
    assert.equal(currentFocusRelease([...releases, future]).slug, "future-release");
    assert.equal(currentFocusRelease([...releases, { ...future, visibility: "draft", featured: true }]).slug, "only-u");
    assert.equal(currentFocusRelease([...releases, { ...future, carouselEnabled: false }]).slug, "only-u");
  } finally { Date.now = originalNow; }
});
