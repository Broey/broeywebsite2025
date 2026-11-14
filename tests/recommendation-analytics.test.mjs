import assert from "node:assert/strict";
import test from "node:test";
import { AudioAnalyticsSession } from "../lib/audio-analytics.ts";
import { trackEvent } from "../lib/analytics.ts";
import {
  RecommendationPlaybackAttribution,
  observeRecommendationImpression,
  recommendationProperties,
} from "../lib/recommendation-analytics.ts";

const context = {
  source_release_slug: "free",
  recommended_release_slug: "fragments",
  recommendation_slot: "bridge",
  recommendation_position: 2,
  curated_override: true,
};
const key = "archive:/audio/like-that.mp3";
const expected = { ...context, source_surface: "recommendations", playback_trigger: "recommendation" };

function globalValue(t, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  t.after(() => previous ? Object.defineProperty(globalThis, name, previous) : delete globalThis[name]);
}

test("recommendation events retain typed factual context and historical release_open fields", (t) => {
  const events = [];
  globalValue(t, "window", { umami: { track: (name, properties) => { events.push({ name, properties }); } } });
  trackEvent("recommendation_impression", recommendationProperties(context, "impression"));
  trackEvent("release_open", { release_slug: "fragments", ...recommendationProperties(context, "open") });
  for (const action of ["play", "pause", "resume", "replay"]) {
    trackEvent("recommendation_interaction", recommendationProperties(context, action));
  }
  assert.equal(events.length, 6);
  assert.deepEqual(events[0], { name: "recommendation_impression", properties: { ...context, source_surface: "recommendations", interaction_type: "impression" } });
  assert.equal(events[1].name, "release_open");
  assert.equal(events[1].properties.release_slug, "fragments");
  assert.deepEqual(events.slice(2).map((event) => event.properties.interaction_type), ["play", "pause", "resume", "replay"]);
});

test("direct recommendation playback attributes existing play, milestones, completion and replay", () => {
  const attribution = new RecommendationPlaybackAttribution();
  const audio = new AudioAnalyticsSession();
  assert.equal(attribution.select(key, "fragments", "/music/free", context), true);
  const events = [
    ...audio.start(key), ...audio.progress(key, 80, 100), ...audio.complete(key),
  ].map((name) => ({ name, ...attribution.properties(key) }));
  assert.deepEqual(events.map((event) => event.name), ["audio_play", "audio_25_percent", "audio_50_percent", "audio_75_percent", "audio_complete"]);
  for (const { name, ...properties } of events) {
    assert.ok(name.startsWith("audio_"));
    assert.deepEqual(properties, expected);
  }
  assert.equal(attribution.select(key, "fragments", "/music/free", context), false);
  assert.deepEqual(audio.start(key), ["audio_play"]);
});

test("pause/resume and route changes preserve only the active track origin", () => {
  const attribution = new RecommendationPlaybackAttribution();
  const audio = new AudioAnalyticsSession();
  attribution.select(key, "fragments", "/music/free", context);
  audio.start(key);
  attribution.visit("/about");
  assert.deepEqual(audio.start(key), []);
  assert.deepEqual(attribution.properties(key), expected);
  assert.deepEqual(attribution.properties("other:track"), {});
});

test("unrelated and same-track direct selections clear recommendation origin", () => {
  const attribution = new RecommendationPlaybackAttribution();
  attribution.select(key, "fragments", "/music/free", context);
  assert.equal(attribution.select(key, "fragments", "/music", undefined), true);
  assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" });
  attribution.select(key, "fragments", "/music/free", context);
  attribution.select("other:track", "other", "/music/other");
  assert.deepEqual(attribution.properties("other:track"), { playback_trigger: "direct" });
  assert.deepEqual(attribution.properties(key), {});
  assert.deepEqual(new RecommendationPlaybackAttribution().properties(key), {});
});

test("automatic and manual queue advancement clear origin, including return to the original track", () => {
  const attribution = new RecommendationPlaybackAttribution();
  attribution.select(key, "fragments", "/music/free", context);
  attribution.advance("archive:next", "automatic");
  assert.deepEqual(attribution.properties("archive:next"), { playback_trigger: "automatic" });
  attribution.advance(key, "queue_selection");
  assert.deepEqual(attribution.properties(key), { playback_trigger: "queue_selection" });
});

test("mismatched destination metadata never receives recommendation attribution", () => {
  const attribution = new RecommendationPlaybackAttribution();
  attribution.select(key, "other", "/music/free", context);
  assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" });
  attribution.select(key, undefined, "/music/free");
  assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" });
});

test("SPA navigation is consumed once at the matching release within five minutes", () => {
  const attribution = new RecommendationPlaybackAttribution();
  attribution.rememberNavigation(context, 1000);
  attribution.visit("/music/fragments");
  attribution.select(key, "fragments", "/music/fragments", undefined, 300999);
  assert.deepEqual(attribution.properties(key), expected);
  attribution.select(key, "fragments", "/music/fragments", undefined, 301000);
  assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" });
});

test("destination-page resume can consume navigation without resetting ordinary resumes", () => {
  const attribution = new RecommendationPlaybackAttribution();
  attribution.select(key, "fragments", "/music/fragments");
  attribution.rememberNavigation(context, 1000);
  assert.equal(attribution.resume(key, "fragments", "/music/fragments", undefined, 2000), true);
  assert.deepEqual(attribution.properties(key), expected);
  assert.equal(attribution.resume(key, "fragments", "/music/fragments"), false);
  assert.deepEqual(attribution.properties(key), expected);
});

test("expired, departed, and interrupted navigations cannot leak origin", () => {
  for (const scenario of ["expired", "departed", "interrupted", "wrong-track", "wrong-path"]) {
    const attribution = new RecommendationPlaybackAttribution();
    attribution.rememberNavigation(context, 1000);
    if (scenario === "departed") attribution.visit("/about");
    if (scenario === "interrupted") attribution.advance("next", "automatic");
    attribution.select(key, scenario === "wrong-track" ? "other" : "fragments",
      scenario === "wrong-path" ? "/music" : "/music/fragments", undefined,
      scenario === "expired" ? 301000 : 2000);
    assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" }, scenario);
  }
});

test("changing origin on the same audio source starts a fresh bounded milestone segment", () => {
  const attribution = new RecommendationPlaybackAttribution();
  const audio = new AudioAnalyticsSession();
  attribution.select(key, "fragments", "/music/free", context);
  audio.start(key);
  audio.progress(key, 80, 100);
  if (attribution.select(key, "fragments", "/music")) audio.reset();
  assert.deepEqual(audio.progress(key, 81, 100), []);
  assert.deepEqual(audio.start(key), ["audio_play"]);
  assert.deepEqual(audio.progress(key, 81, 100), ["audio_25_percent", "audio_50_percent", "audio_75_percent"]);
  assert.deepEqual(audio.progress(key, 90, 100), []);
  assert.deepEqual(attribution.properties(key), { playback_trigger: "direct" });
});

test("missing, throwing, rejected, and blocked Umami never interrupt callers", async (t) => {
  assert.doesNotThrow(() => trackEvent("recommendation_interaction", recommendationProperties(context, "play")));
  globalValue(t, "window", {});
  assert.doesNotThrow(() => trackEvent("recommendation_interaction", recommendationProperties(context, "play")));
  for (const track of [undefined, () => { throw new Error("blocked"); }, () => Promise.reject(new Error("offline"))]) {
    window.umami = { track };
    assert.doesNotThrow(() => trackEvent("recommendation_interaction", recommendationProperties(context, "play")));
  }
  await new Promise((resolve) => setImmediate(resolve));
});

function visibilityFixture(t) {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const doc = new EventTarget();
  doc.visibilityState = "visible";
  globalValue(t, "document", doc);
  const element = {};
  let callback;
  let disconnected = 0;
  globalValue(t, "IntersectionObserver", class {
    constructor(cb, options) { callback = cb; assert.deepEqual(options.threshold, [0, 0.5]); }
    observe(target) { assert.equal(target, element); }
    disconnect() { disconnected++; }
  });
  const emitBatch = (ratios) => callback(ratios.map((ratio) => ({ target: element, isIntersecting: ratio > 0, intersectionRatio: ratio })));
  return { doc, element, emit: (ratio) => emitBatch([ratio]), emitBatch, disconnected: () => disconnected };
}

test("impression requires continuous 50% foreground visibility and fires once despite repeated updates", (t) => {
  const f = visibilityFixture(t);
  let count = 0;
  const cleanup = observeRecommendationImpression(f.element, () => count++);
  f.emit(0.49); t.mock.timers.tick(2000); assert.equal(count, 0);
  f.emit(0.5); t.mock.timers.tick(999); assert.equal(count, 0);
  f.emit(0.8); t.mock.timers.tick(1); assert.equal(count, 1);
  f.emit(0); f.emit(1); t.mock.timers.tick(3000); assert.equal(count, 1);
  assert.equal(f.disconnected(), 1);
  cleanup();
});

test("leaving viewport, hiding tab, and effect cleanup cancel incomplete impressions", (t) => {
  const f = visibilityFixture(t);
  let count = 0;
  const cleanup = observeRecommendationImpression(f.element, () => count++);
  f.emit(1); t.mock.timers.tick(700); f.emit(0); t.mock.timers.tick(1000);
  f.emit(1); t.mock.timers.tick(700);
  f.doc.visibilityState = "hidden"; f.doc.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(2000); assert.equal(count, 0);
  f.doc.visibilityState = "visible"; f.doc.dispatchEvent(new Event("visibilitychange"));
  t.mock.timers.tick(999); assert.equal(count, 0);
  cleanup(); t.mock.timers.tick(2000); assert.equal(count, 0);
});

test("unsupported observers do not fabricate impressions", (t) => {
  globalValue(t, "IntersectionObserver", undefined);
  let count = 0;
  observeRecommendationImpression({}, () => count++)();
  assert.equal(count, 0);
});

test("batched intersection transitions cannot leave a stale visible impression timer", (t) => {
  const f = visibilityFixture(t);
  let count = 0;
  const cleanup = observeRecommendationImpression(f.element, () => count++);
  f.emitBatch([1, 0]); t.mock.timers.tick(2000); assert.equal(count, 0);
  f.emit(1); t.mock.timers.tick(800);
  f.emitBatch([0, 1]); t.mock.timers.tick(999); assert.equal(count, 0);
  t.mock.timers.tick(1); assert.equal(count, 1);
  cleanup();
});
