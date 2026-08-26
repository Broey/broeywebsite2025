import assert from "node:assert/strict";
import test from "node:test";

const { AudioAnalyticsSession } = await import("../lib/audio-analytics.ts");

test("audio analytics emits one play event and each progress milestone once per track", () => {
  const session = new AudioAnalyticsSession();

  assert.deepEqual(session.start("release-a:track-a"), ["audio_play"]);
  assert.deepEqual(session.start("release-a:track-a"), []);
  assert.deepEqual(session.progress("release-a:track-a", 24, 100), []);
  assert.deepEqual(session.progress("release-a:track-a", 26, 100), ["audio_25_percent"]);
  assert.deepEqual(session.progress("release-a:track-a", 80, 100), [
    "audio_50_percent",
    "audio_75_percent",
  ]);
  assert.deepEqual(session.progress("release-a:track-a", 90, 100), []);
  assert.deepEqual(session.complete("release-a:track-a"), ["audio_complete"]);
  assert.deepEqual(session.complete("release-a:track-a"), []);
});

test("audio analytics resets cleanly when playback switches releases", () => {
  const session = new AudioAnalyticsSession();

  assert.deepEqual(session.start("release-a:track-a"), ["audio_play"]);
  assert.deepEqual(session.progress("release-a:track-a", 30, 100), ["audio_25_percent"]);
  assert.deepEqual(session.start("release-b:track-b"), ["audio_play"]);
  assert.deepEqual(session.progress("release-b:track-b", 30, 100), ["audio_25_percent"]);
  assert.deepEqual(session.progress("release-a:track-a", 80, 100), []);
});
