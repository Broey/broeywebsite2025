import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import {
  MUSIC_PREFERENCES_KEY, MAX_INTEREST, MAX_RECENT, MusicPreferenceStore,
  emptyPreferences, parsePreferences, decayedInterest, preferredClosest, recentReleases,
} from "../lib/music-preferences.ts";
import { AudioAnalyticsSession } from "../lib/audio-analytics.ts";
import { RecommendationPlaybackAttribution } from "../lib/recommendation-analytics.ts";
import { trackEvent } from "../lib/analytics.ts";

const day = 20771;
const catalog = [
  { slug: "one", family: "project", genres: ["house"] },
  { slug: "child", family: "project", genres: ["house"] },
  { slug: "two", family: "two", genres: ["jungle", "drum-and-bass"] },
];
function fixture(customCatalog = catalog) {
  const values = new Map([["broey-audio-volume", "0.4"]]);
  const writes = [];
  let now = day * 86400000;
  const storage = { getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); writes.push(key); },
    removeItem: (key) => { values.delete(key); writes.push(key); } };
  const make = () => new MusicPreferenceStore(() => storage, customCatalog, () => now);
  const store = make();
  store.refresh();
  return { store, values, writes, make, advance: (days) => { now += days * 86400000; } };
}
test("consent defaults disabled; passive reads and preconsent interactions write nothing", () => {
  const { store, values, writes } = fixture();
  store.selectGenre("House"); store.played("one", "direct");
  assert.equal(store.getSnapshot().enabled, false);
  assert.equal(values.has(MUSIC_PREFERENCES_KEY), false);
  assert.deepEqual(writes, []);
});
test("explicit enablement persists consent alone; disable removes profile and stops collection", () => {
  const { store, values } = fixture();
  assert.equal(store.enable(), true);
  assert.deepEqual(store.getSnapshot(), emptyPreferences(day, true));
  store.played("one", "direct"); store.disable();
  store.played("two", "direct"); store.selectGenre("Jungle");
  assert.equal(values.has(MUSIC_PREFERENCES_KEY), false);
  assert.deepEqual(store.getSnapshot(), emptyPreferences(day));
  assert.equal(values.get("broey-audio-volume"), "0.4");
});
test("clear keeps consent and unrelated volume but removes interests and recent releases", () => {
  const { store, values } = fixture();
  store.enable(); store.played("one", "direct"); store.clear();
  assert.deepEqual(store.getSnapshot(), emptyPreferences(day, true));
  assert.equal(values.get("broey-audio-volume"), "0.4");
  store.played("two", "direct");
  assert.deepEqual(store.getSnapshot().recent, [{ slug: "two", day }]);
});
test("corruption, unknown schema, oversized data and invalid consent reset closed", () => {
  for (const raw of ["{", "null", "[]", "x".repeat(8193),
    JSON.stringify({ ...emptyPreferences(day, true), version: 0 }),
    JSON.stringify({ ...emptyPreferences(day, true), enabled: "true" }),
    JSON.stringify({ ...emptyPreferences(day, true), updatedDay: day + 1 })]) {
    assert.equal(parsePreferences(raw, day).enabled, false);
    const { store, values } = fixture();
    values.set(MUSIC_PREFERENCES_KEY, raw); store.refresh();
    assert.equal(values.has(MUSIC_PREFERENCES_KEY), false);
  }
});
test("90-day expiry prunes entries, then resets inactive consent", () => {
  const { store, values, advance } = fixture();
  store.enable(); store.played("one", "direct"); advance(89);
  store.selectGenre("Jungle"); advance(1); store.refresh();
  assert.equal(store.getSnapshot().interests.house, undefined);
  assert.deepEqual(store.getSnapshot().recent, []);
  assert.ok(store.getSnapshot().interests.jungle);
  advance(90); store.refresh();
  assert.equal(store.getSnapshot().enabled, false);
  assert.equal(values.has(MUSIC_PREFERENCES_KEY), false);
});
test("weights are conservative, split multi-genre evidence, bounded and decay by half in 30 days", () => {
  const { store, advance } = fixture();
  store.enable(); store.played("two", "direct");
  assert.equal(store.getSnapshot().interests.jungle.score, 1);
  store.selectGenre("House"); store.selectGenre("House");
  assert.equal(store.getSnapshot().interests.house.score, 3);
  for (let index = 0; index < 30; index++) { advance(1); store.selectGenre("House"); }
  const interest = store.getSnapshot().interests.house;
  assert.equal(interest.score, MAX_INTEREST);
  assert.equal(decayedInterest(interest, interest.day + 30), 6);
  assert.equal(decayedInterest(interest, interest.day + 90), 0);
});
test("intentional successful play supports direct, recommendation and manual queue selection only", () => {
  for (const trigger of ["direct", "recommendation", "queue_selection"]) {
    const { store } = fixture(); store.enable(); store.played("one", trigger);
    assert.equal(store.getSnapshot().interests.house.score, 2);
  }
  for (const trigger of [undefined, "automatic", "autoplay", "impression", "audio_75_percent", "streaming_click"]) {
    const { store } = fixture(); store.enable(); store.played("one", trigger);
    assert.deepEqual(store.getSnapshot().recent, []);
    assert.deepEqual(store.getSnapshot().interests, {});
  }
});
test("same-family repeated plays and refreshes do not inflate scores; later visits can contribute", () => {
  const { store, make, advance } = fixture(); store.enable();
  store.played("one", "direct"); store.played("child", "recommendation");
  const returning = make(); returning.refresh(); returning.played("one", "direct");
  assert.equal(returning.getSnapshot().interests.house.score, 2);
  assert.equal(returning.getSnapshot().recent.length, 1);
  advance(1); returning.played("one", "direct");
  assert.ok(returning.getSnapshot().interests.house.score > 2);
});
test("seeking milestones, completion and automatic continuation do not create preference evidence", () => {
  const { store } = fixture(); store.enable();
  const attribution = new RecommendationPlaybackAttribution(); const audio = new AudioAnalyticsSession();
  attribution.advance("queue:src", "automatic"); audio.start("queue:src");
  assert.deepEqual(audio.progress("queue:src", 99, 100), ["audio_25_percent", "audio_50_percent", "audio_75_percent"]);
  audio.complete("queue:src"); store.played("one", attribution.properties("queue:src").playback_trigger);
  assert.deepEqual(store.getSnapshot(), emptyPreferences(day, true));
});
test("history is bounded, coarse, family-deduplicated and excludes noncatalog slugs", () => {
  const many = Array.from({ length: 30 }, (_, index) => ({ slug: `release-${index}`, family: `release-${index}`, genres: [] }));
  const { store, values } = fixture(many); store.enable();
  for (const item of many) store.played(item.slug, "direct");
  store.played("hidden", "direct");
  assert.equal(store.getSnapshot().recent.length, MAX_RECENT);
  assert.equal(recentReleases(store.getSnapshot(), many, day).length, 6);
  const raw = values.get(MUSIC_PREFERENCES_KEY);
  assert.ok(raw.length < 8192);
  assert.deepEqual(Object.keys(store.getSnapshot()).sort(), ["enabled", "interests", "recent", "updatedDay", "version"]);
  assert.equal(raw.includes("src"), false);
});
test("same-browser return, cross-tab disable and physical pruning preserve opt-in semantics", () => {
  const { store, make, values } = fixture(); store.enable(); store.played("one", "direct");
  const returning = make(); returning.refresh();
  assert.deepEqual(returning.getSnapshot(), store.getSnapshot());
  values.delete(MUSIC_PREFERENCES_KEY); returning.selectGenre("House");
  assert.equal(returning.getSnapshot().enabled, false);
  const profile = { ...emptyPreferences(day, true), recent: [{ slug: "hidden", day }, { slug: "one", day }, { slug: "child", day }] };
  values.set(MUSIC_PREFERENCES_KEY, JSON.stringify(profile)); returning.refresh();
  assert.deepEqual(returning.getSnapshot().recent, [{ slug: "one", day }]);
});
test("denied access, reads, quota writes and removal fail safely", () => {
  for (const operation of ["access", "getItem", "setItem", "removeItem"]) {
    const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    if (operation !== "access") storage[operation] = () => { throw new Error("blocked"); };
    const store = new MusicPreferenceStore(() => { if (operation === "access") throw new Error("blocked"); return storage; }, catalog);
    assert.doesNotThrow(() => { store.refresh(); store.enable(); store.played("one", "direct"); store.clear(); store.disable(); });
    assert.equal(store.getSnapshot().enabled, false);
  }
});
test("a blocked disable never revives retained consent when storage becomes available again", () => {
  const values = new Map(); let blocked = false;
  const storage = { getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => { if (blocked) throw new Error("blocked"); values.delete(key); } };
  const store = new MusicPreferenceStore(() => storage, catalog, () => day * 86400000);
  store.enable(); store.played("one", "direct"); blocked = true;
  assert.equal(store.disable(), false);
  store.refresh(); assert.equal(store.getSnapshot().enabled, false);
  blocked = false; store.refresh(); store.played("one", "direct");
  assert.equal(store.getSnapshot().enabled, false);
  assert.equal(values.has(MUSIC_PREFERENCES_KEY), false);
});
test("disabled, empty, expired and indistinguishable preferences preserve exact baseline", () => {
  const choices = [{ ...catalog[0], score: 30 }, { ...catalog[2], score: 30 }];
  for (const profile of [emptyPreferences(day), emptyPreferences(day, true),
    { ...emptyPreferences(day - 90, true), interests: { jungle: { score: 12, day: day - 90 } } },
    { ...emptyPreferences(day, true), interests: { jungle: { score: 1, day } } }]) {
    assert.equal(preferredClosest(choices, profile, day), "one");
  }
});
test("meaningfully different near-tie interests adjust deterministically with a bounded bonus", () => {
  const choices = [{ ...catalog[0], score: 30 }, { ...catalog[2], score: 29 }];
  const profile = { ...emptyPreferences(day, true), interests: { jungle: { score: 12, day } } };
  for (let i = 0; i < 10; i++) assert.equal(preferredClosest(choices, profile, day), "two");
  assert.equal(preferredClosest([choices[0], { ...choices[1], score: 26 }], profile, day), "one");
});

// Use the same installed TypeScript/alias loader as the recommendation validator.
const require = createRequire(import.meta.url);
const Module = require("module"); const ts = require("typescript");
const originalResolve = Module._resolveFilename;
const originalTs = require.extensions[".ts"];
Module._resolveFilename = function(request, parent, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.resolve(request.slice(2)) : request, parent, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: filename,
}).outputText, filename);
const { releases } = require("../content/releases.ts");
const { recommendReleases, personalizedClosestChoices, recommendationParentKey } = require("../content/release-recommendations.ts");
const { preferenceCatalog } = require("../content/music-personalization.ts");
const { curatedGenreFiltersForRelease } = require("../content/genres.ts");
Module._resolveFilename = originalResolve;
require.extensions[".ts"] = originalTs;

test("actual catalog eligibility excludes hidden, draft, noindex, unreleased, future and unapproved artwork", () => {
  const base = releases.find((release) => preferenceCatalog([release]).length);
  const variants = [{ indexing: "internal" }, { indexing: "noindex" }, { visibility: "draft" },
    { catalogStatus: "draft" }, { status: "unreleased" }, { availableAt: "2099-01-01" },
    { releaseDate: "2099-01-01" }, { coverImage: "/missing.png" }];
  for (const variant of variants) assert.deepEqual(preferenceCatalog([{ ...base, ...variant }]), []);
});
test("actual recommendation plans retain overrides, families, factual closest relevance and three purposes", () => {
  let alternatives = 0;
  for (const date of ["2026-11-14", "2026-11-15", "2026-12-01"]) for (const source of releases) {
    const baseline = recommendReleases(source, releases, { date });
    const before = JSON.stringify(baseline);
    const choices = personalizedClosestChoices(baseline, releases);
    const closest = baseline.recommendations[0];
    if (!closest) continue;
    if (closest.manualOverride) assert.deepEqual(choices.map((item) => item.slug), [closest.release.slug]);
    const fixed = baseline.recommendations.slice(1).map((item) => item.release);
    const primary = (release) => curatedGenreFiltersForRelease(release)[0] ?? "Unmapped";
    const variety = (release) => new Set([release, ...fixed].map(primary)).size;
    for (const choice of choices.slice(1)) {
      alternatives++;
      const release = releases.find((item) => item.slug === choice.slug);
      assert.ok(choice.score >= closest.score - 3);
      assert.ok(!fixed.some((item) => recommendationParentKey(item) === choice.family));
      assert.ok(variety(release) >= variety(closest.release));
    }
    assert.equal(preferredClosest(choices, emptyPreferences(day), day), closest.release.slug);
    assert.equal(JSON.stringify(baseline), before);
    assert.deepEqual(baseline.recommendations.map((item) => item.slot), ["closest", "bridge", "discovery"]);
  }
  assert.ok(alternatives > 0, "real catalog offers purposeful near-ties");
});
test("actual catalog has meaningful personalized changes while fixed slots stay untouched", () => {
  const changes = [];
  const date = "2026-11-14"; const rankingDay = Math.floor(Date.parse(date) / 86400000);
  for (const source of releases) {
    const set = recommendReleases(source, releases, { date });
    const choices = personalizedClosestChoices(set, releases);
    for (const candidate of choices.slice(1)) for (const genre of candidate.genres) {
      const profile = { ...emptyPreferences(rankingDay, true), interests: { [genre]: { score: 12, day: rankingDay } } };
      const slug = preferredClosest(choices, profile, rankingDay);
      if (slug !== choices[0].slug) changes.push({ source: source.slug, from: choices[0].slug, to: slug });
    }
  }
  assert.ok(changes.length, "personalization can improve at least one actual catalog near-tie");
});

test("personalized alternatives exclude draft, hidden, unreleased, scheduled and unapproved near-ties", () => {
  const set = releases.map((source) => recommendReleases(source, releases, { date: "2026-11-14" }))
    .find((set) => personalizedClosestChoices(set, releases).length > 1);
  const alternative = personalizedClosestChoices(set, releases)[1].slug;
  for (const variant of [{ visibility: "draft" }, { catalogStatus: "draft" }, { indexing: "internal" },
    { indexing: "noindex" }, { status: "unreleased" }, { availableAt: "2099-01-01" },
    { releaseDate: "2099-01-01" }, { coverImage: "/missing.png" }]) {
    const modified = releases.map((release) => release.slug === alternative ? { ...release, ...variant } : release);
    assert.equal(personalizedClosestChoices(set, modified).some((choice) => choice.slug === alternative), false,
      JSON.stringify(variant));
    assert.equal(personalizedClosestChoices(set, modified)[0].slug, set.recommendations[0].release.slug);
  }
});
test("personalized recommendation context flows through existing navigation and successful playback analytics", (t) => {
  const original = globalThis.window; const events = [];
  globalThis.window = { umami: { track: (name, properties) => events.push({ name, properties }) } };
  t.after(() => { globalThis.window = original; });
  const context = { source_release_slug: "free", recommended_release_slug: "two", recommendation_slot: "closest",
    recommendation_position: 1, curated_override: false, personalized: true };
  const attribution = new RecommendationPlaybackAttribution();
  attribution.rememberNavigation(context); attribution.visit("/music/two");
  attribution.select("key", "two", "/music/two");
  trackEvent("audio_play", { release_slug: "two", ...attribution.properties("key") });
  assert.equal(events[0].properties.personalized, true);
  assert.equal(events[0].properties.playback_trigger, "recommendation");
  assert.equal("interests" in events[0].properties, false);
  attribution.advance("next", "automatic");
  assert.deepEqual(attribution.properties("next"), { playback_trigger: "automatic" });
});
