import assert from "node:assert/strict";
import test from "node:test";
import { MusicInvitationStore, MUSIC_INVITATION_KEY, INVITATION_DISMISSAL_MS, welcomeEligible, WELCOME_DELAY_MS } from "../lib/music-invitation.ts";
import { emptyPreferences, lastPlayedRelease } from "../lib/music-preferences.ts";

function invitation() {
  const values = new Map();
  let now = 1000000000;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const make = () => new MusicInvitationStore(() => storage, () => now);
  return { values, make, advance: ms => { now += ms; } };
}

test("invitation dismissal stores only a bounded expiry and survives normal tab navigation", () => {
  const { make, values, advance } = invitation();
  const store = make();
  assert.equal(store.getSnapshot(), true); // SSR/hydration starts hidden.
  store.refresh();
  assert.equal(store.getSnapshot(), false);
  store.dismiss();
  assert.equal(store.getSnapshot(), true);
  assert.deepEqual([...values.keys()], [MUSIC_INVITATION_KEY]);
  assert.equal(Number(values.get(MUSIC_INVITATION_KEY)), 1000000000 + INVITATION_DISMISSAL_MS);
  const nextPage = make(); nextPage.refresh();
  assert.equal(nextPage.getSnapshot(), true);
  advance(INVITATION_DISMISSAL_MS); nextPage.refresh();
  assert.equal(nextPage.getSnapshot(), false);
  assert.equal(values.size, 0);
});

test("invalid and unbounded dismissals are removed and enabling can clear the dismissal", () => {
  const { make, values } = invitation();
  for (const raw of ["broken", "0", "-1", "Infinity", String(1000000000 + INVITATION_DISMISSAL_MS + 1)]) {
    values.set(MUSIC_INVITATION_KEY, raw);
    const store = make(); store.refresh();
    assert.equal(store.getSnapshot(), false);
    assert.equal(values.size, 0);
  }
  const store = make(); store.dismiss(); store.clear();
  assert.equal(store.getSnapshot(), false);
  assert.equal(values.size, 0);
});

test("an externally expired or deleted dismissal replaces the previous in-memory expiry", () => {
  const { make, values } = invitation();
  const store = make(); store.dismiss();
  values.set(MUSIC_INVITATION_KEY, "1"); store.refresh();
  assert.equal(store.getSnapshot(), false);
  assert.equal(values.size, 0);
  store.dismiss(); values.delete(MUSIC_INVITATION_KEY); store.refresh();
  assert.equal(store.getSnapshot(), false);
});

test("denied session storage keeps a bounded in-memory dismissal without throwing", () => {
  let now = 1000000000;
  const store = new MusicInvitationStore(() => { throw new Error("Denied"); }, () => now);
  store.refresh(); assert.equal(store.getSnapshot(), false);
  store.dismiss(); store.refresh(); assert.equal(store.getSnapshot(), true);
  now += INVITATION_DISMISSAL_MS; store.refresh(); assert.equal(store.getSnapshot(), false);
  store.clear();
});

const day = 20771;
const catalog = [
  { slug: "focus", family: "focus", genres: [] },
  { slug: "focus-child", family: "focus", genres: [] },
  { slug: "older", family: "older", genres: [] },
  { slug: "oldest", family: "oldest", genres: [] },
];
const profile = slugs => ({ ...emptyPreferences(day, true), recent: slugs.map(slug => ({ slug, day })) });

test("returning tile selects the newest eligible family distinct from the focus", () => {
  assert.equal(lastPlayedRelease(profile(["missing", "focus", "focus-child", "older", "oldest"]), catalog, "focus", day)?.slug, "older");
  assert.equal(lastPlayedRelease(profile(["oldest", "older"]), catalog, "focus", day)?.slug, "oldest");
  // Search the whole permitted history rather than only the old six-link display window.
  const many = Array.from({ length: 10 }, (_, i) => ({ slug: `track-${i}`, family: "focus", genres: [] }));
  assert.equal(lastPlayedRelease(profile([...many.map(r => r.slug), "older"]), [...catalog, ...many], "focus", day)?.slug, "older");
});

test("returning tile omits absent, disabled, expired, ineligible and focus-only history", () => {
  for (const p of [emptyPreferences(day), emptyPreferences(day, true), profile(["missing"]), profile(["focus", "focus-child"]),
    { ...profile(["older"]), enabled: false }, { ...profile(["older"]), updatedDay: day - 90 },
    { ...profile(["older"]), recent: [{ slug: "older", day: day - 90 }] }]) {
    assert.equal(lastPlayedRelease(p, catalog, "focus", day), undefined);
  }
});

test("welcome delay and homepage/campaign/consent priority remain independent of playback", () => {
  assert.equal(WELCOME_DELAY_MS, 6000);
  assert.equal(INVITATION_DISMISSAL_MS, 30 * 86400000);
  assert.equal(welcomeEligible("/", true, false, false, false), true);
  for (const args of [["/music",true,false,false,false], ["/",false,false,false,false], ["/",true,true,false,false], ["/",true,false,true,false], ["/",true,false,false,true]]) assert.equal(welcomeEligible(...args), false);
});
