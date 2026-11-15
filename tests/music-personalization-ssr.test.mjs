import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

process.env.NODE_ENV = "development";
delete process.env.NEXT_PUBLIC_SITE_URL;
const require = createRequire(import.meta.url);
const Module = require("module"); const ts = require("typescript");
const resolve = Module._resolveFilename;
const extensions = { ts: require.extensions[".ts"], tsx: require.extensions[".tsx"] };
Module._resolveFilename = function(request, parent, ...args) {
  return resolve.call(this, request.startsWith("@/") ? path.resolve(request.slice(2)) : request, parent, ...args);
};
for (const extension of [".ts", ".tsx"]) require.extensions[extension] = (module, filename) => {
  module._compile(ts.transpileModule(readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
};
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { MusicPreferencesProvider } = require("../components/music/MusicPreferencesProvider.tsx");
const { AudioPlayerProvider } = require("../components/audio/AudioPlayerProvider.tsx");
const { MusicPersonalization, PersonalizedRecommendations } = require("../components/music/MusicPersonalization.tsx");
const { HomeMusicInvitation } = require("../components/music/HomeMusicInvitation.tsx");
const { HomepageMusicArchiveSection } = require("../components/sections/HomepageMusicArchiveSection.tsx");
const MusicPage = require("../app/music/page.tsx").default;
const ReleasePage = require("../app/music/[slug]/page.tsx").default;
const { releases } = require("../content/releases.ts");
const { preferenceCatalog } = require("../content/music-personalization.ts");
const { recommendReleases } = require("../content/release-recommendations.ts");
const { currentFocusRelease } = require("../content/release-focus.ts");
Module._resolveFilename = resolve;
require.extensions[".ts"] = extensions.ts;
if (extensions.tsx) require.extensions[".tsx"] = extensions.tsx;
else delete require.extensions[".tsx"];
const element = React.createElement;
const render = (child) => renderToStaticMarkup(element(MusicPreferencesProvider,
  { catalog: preferenceCatalog(releases) }, element(AudioPlayerProvider, null, child)));

test("server render never reads storage and always offers explicit disabled consent", (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    get localStorage() { throw new Error("Server accessed browser storage"); },
  } });
  t.after(() => descriptor ? Object.defineProperty(globalThis, "window", descriptor) : delete globalThis.window);
  const html = render(element(MusicPersonalization));
  assert.match(html, /role="switch"/);
  assert.doesNotMatch(html, /<details[^>]* open/);
  assert.match(html, /Personalize/);
  assert.match(html, /<summary>Manage preferences<\/summary>/);
  assert.match(html, /aria-label="Enable personalized music discovery"/);
  assert.match(html, /aria-checked="false"/);
  assert.match(html, /aria-describedby="music-personalization-description"/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /Recently played|Disable personalization|Clear music preferences/);
});

test("homepage invitation checks browser state only after hydration and retains the archive and signup", () => {
  assert.doesNotMatch(render(element(HomeMusicInvitation)), /Enable personalization|Not now/);
  const html = render(element(HomepageMusicArchiveSection));
  assert.match(html, /Explore the music/);
  assert.match(html, /Join the list/);
  assert.doesNotMatch(html, /role="dialog"/);
});
test("server recommendation render keeps the baseline and its fixed Bridge and Discovery cards", () => {
  const html = render(element(PersonalizedRecommendations, { day: 20771,
    choices: [{ slug: "baseline", family: "baseline", genres: ["house"], score: 30, card: element("article", null, "Baseline") },
      { slug: "alternative", family: "alternative", genres: ["jungle"], score: 30, card: element("article", null, "Alternative") }],
  }, element("article", null, "Bridge"), element("article", null, "Discovery")));
  assert.match(html, /Baseline/); assert.doesNotMatch(html, /Alternative/);
  assert.equal((html.match(/<article/g) ?? []).length, 3);
});
test("complete music page server-renders focus and catalog with optional disabled controls", () => {
  const html = render(element(MusicPage));
  assert.match(html, /Current focus/); assert.ok(html.includes(`/music/${currentFocusRelease(releases).slug}`));
  assert.match(html, /Filter by genre/); assert.match(html, /Selected Catalog/);
  assert.match(html, /aria-label="Enable personalized music discovery"/); assert.doesNotMatch(html, /Recently played/);
});
test("actual release route retains server-rendered content, structured data and baseline recommendations", async () => {
  const tree = await ReleasePage({ params: Promise.resolve({ slug: "free" }) });
  const html = render(tree);
  assert.match(html, /application\/ld\+json/); assert.match(html, /Keep listening/);
  assert.match(html, /https:\/\/broey.net\/music\/free/);
  const grid = html.split('class="release-detail-recommendation-grid"')[1];
  assert.ok(grid);
  for (const item of recommendReleases(releases.find((entry) => entry.slug === "free"), releases).recommendations) {
    assert.ok(grid.includes(`/music/${item.release.slug}`), item.release.slug);
  }
});
