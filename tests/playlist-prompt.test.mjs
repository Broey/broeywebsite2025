import assert from "node:assert/strict";
import test from "node:test";
const { PlaylistPromptSession } = await import("../lib/playlist-prompt.ts");

test("playlist reminder appears once after one minute of actual listening", () => {
  const session = new PlaylistPromptSession();
  const shown = [];
  for (let time = 0; time < 199; time++) {
    if (session.progress("only-u", time, 199, true)) shown.push(time);
  }
  assert.deepEqual(shown, [60]);
  session.interrupt();
  for (let time = 0; time < 199; time++) assert.equal(session.progress("only-u", time, 199, true), false);
});

test("seeking forward and time spent paused do not shortcut the one-minute reminder", () => {
  const session = new PlaylistPromptSession();
  for (let time = 0; time <= 30; time++) assert.equal(session.progress("only-u", time, 199, true), false);
  session.interrupt();
  assert.equal(session.progress("only-u", 90, 199, false), false);
  assert.equal(session.progress("only-u", 100, 199, true), false);
  for (let time = 101; time < 130; time++) assert.equal(session.progress("only-u", time, 199, true), false);
  assert.equal(session.progress("only-u", 130, 199, true), true);
});

test("seeking to the outro, pausing, and switching tracks do not count as sustained listening", () => {
  const session = new PlaylistPromptSession();
  session.progress("only-u", 0, 199, true);
  assert.equal(session.progress("only-u", 154, 199, true), false);
  assert.equal(session.progress("only-u", 155, 199, false), false);
  assert.equal(session.progress("other", 154, 199, true), false);
  assert.equal(session.progress("only-u", 156, 199, true), false);
  assert.equal(session.progress("only-u", 157, NaN, true), false);
});
