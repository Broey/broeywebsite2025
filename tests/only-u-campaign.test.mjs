import assert from "node:assert/strict";
import test from "node:test";

const { campaignUrl, isOnlyUReleased, onlyUCampaign, onlyUCountdown } = await import("../content/only-u-campaign.ts");
const { isPublishedRelease, showReleaseInSitemap } = await import("../content/release-filters.ts");
const { scheduledAudioResponse } = await import("../lib/scheduled-release-audio.ts");
const { rememberCampaignAttribution, trackEvent } = await import("../lib/analytics.ts");

test("Only U switches at midnight Eastern, with no early release-page indexing", () => {
  const boundary = Date.parse("2026-10-15T04:00:00Z");
  assert.equal(Date.parse(onlyUCampaign.releaseAt), boundary);
  assert.equal(isOnlyUReleased(boundary - 1), false);
  assert.equal(isOnlyUReleased(boundary), true);
  assert.equal(onlyUCountdown(boundary - 1000), "0d 00h 00m 01s");
  assert.equal(onlyUCountdown(boundary + 1000), "0d 00h 00m 00s");
  const originalNow = Date.now;
  try {
    const release = { slug: "only-u", availableAt: onlyUCampaign.releaseAt };
    Date.now = () => boundary - 1;
    assert.equal(isPublishedRelease(release), false);
    assert.equal(showReleaseInSitemap(release), false);
    Date.now = () => boundary;
    assert.equal(isPublishedRelease(release), true);
    assert.equal(showReleaseInSitemap(release), true);
    assert.equal(isPublishedRelease({ ...release, visibility: "draft" }), false);
  } finally { Date.now = originalNow; }
});

test("outbound attribution distinguishes placements and preserves store parameters", () => {
  const banner = new URL(campaignUrl(onlyUCampaign.presaveUrl, "release_banner"));
  const tile = new URL(campaignUrl(onlyUCampaign.presaveUrl, "home_tile"));
  assert.equal(banner.pathname, "/onlyustores");
  assert.equal(banner.searchParams.get("utm_source"), "broey.net");
  assert.equal(banner.searchParams.get("utm_campaign"), onlyUCampaign.campaign);
  assert.notEqual(banner.searchParams.get("utm_content"), tile.searchParams.get("utm_content"));
  const itunes = new URL(campaignUrl(onlyUCampaign.stores[2].url, "release_page_itunes"));
  assert.equal(itunes.searchParams.get("app"), "itunes");
  assert.equal(itunes.searchParams.get("at"), "1l3v9Tx");
});

test("scheduled audio supports seeking, suffix ranges, HEAD, and invalid-range responses", async () => {
  const audio = new Uint8Array([10, 20, 30, 40]);
  const response = scheduledAudioResponse(audio, "bytes=1-2");
  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 1-2/4");
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [20, 30]);
  assert.equal(scheduledAudioResponse(audio, "bytes=8-").status, 416);
  assert.equal(scheduledAudioResponse(audio, "bytes=-0").status, 416);
  assert.equal(scheduledAudioResponse(audio, "bytes=0-1,2-3").status, 416);
  assert.deepEqual([...new Uint8Array(await scheduledAudioResponse(audio, "bytes=-2").arrayBuffer())], [30, 40]);
  const head = scheduledAudioResponse(audio, null, true);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), "4");
  assert.equal(await head.text(), "");
  assert.equal(head.headers.get("cache-control"), "private, no-store");
});

test("Only U click and playback events retain inbound UTMs after navigation", () => {
  const previousWindow = globalThis.window;
  const saved = new Map();
  const events = [];
  globalThis.window = {
    location: { pathname: "/", search: "?utm_source=instagram&utm_medium=social&utm_campaign=only_u_launch" },
    sessionStorage: { setItem: (key, value) => saved.set(key, value), getItem: key => saved.get(key) },
    umami: { track: (name, properties) => events.push({ name, properties }) },
  };
  try {
    rememberCampaignAttribution();
    window.location = { pathname: "/music/only-u", search: "" };
    trackEvent("streaming_click", { release_slug: "only-u", platform: "Spotify", destination_type: "streaming", source_surface: "release_page" });
    trackEvent("audio_play", { release_slug: "only-u" });
    for (const event of events) {
      assert.equal(event.properties.utm_source, "instagram");
      assert.equal(event.properties.utm_campaign, "only_u_launch");
      assert.equal(event.properties.page_path, "/music/only-u");
      assert.equal(event.properties.campaign, onlyUCampaign.campaign);
    }
  } finally { globalThis.window = previousWindow; }
});
