// Requires an existing loopback server. No installation, server launch, or desktop control.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { installedPlaywright, loopbackOrigin } = require("./discovery-browser.cjs");
const origin = loopbackOrigin(process.env.DISCOVERY_TEST_ORIGIN || "http://127.0.0.1:3000");
const expectedSiteOrigin = new URL(process.env.DISCOVERY_EXPECTED_SITE_ORIGIN || "https://broey.net").origin;
const key = "broey-music-preferences";
const report = { passed: false, origin, expectedSiteOrigin, headless: true, temporaryContexts: true, externalRequestsBlocked: true, checks: [], errors: [], consoleErrors: [], layouts: [], analytics: [], requests: [] };
let output;
const day = Math.floor(Date.now() / 86400000);
const profile = (genre) => ({ version: 1, enabled: true, updatedDay: day, interests: genre ? { [genre]: { score: 12, day } } : {}, recent: [] });
const check = (text) => { report.checks.push(text); console.log(`PASS ${text}`); };
const readProfile = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);
const cards = (page) => page.locator(".release-detail-recommendation-grid article");
const links = (page) => cards(page).locator("a").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
const recent = (page) => page.locator('section[aria-labelledby="recently-played-title"]');
const audioPlaying = async (page) => {
  try { await page.waitForFunction(() => { const a = document.querySelector("[data-broey-global-audio]"); return a && !a.paused && a.currentTime > 0; }); }
  catch (error) {
    report.playbackFailure = await page.evaluate(() => { const a = document.querySelector("[data-broey-global-audio]"); return { src: a?.currentSrc, paused: a?.paused, time: a?.currentTime, ready: a?.readyState, error: a?.error?.message, player: document.querySelector(".global-audio-player")?.textContent }; });
    throw error;
  }
};
const tick = (page) => page.waitForTimeout(150);
async function navigateMusic(page) {
  const desktopLink = page.locator('header nav a[href="/music"]').first();
  if (await desktopLink.isVisible()) await desktopLink.click();
  else {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.locator('#mobile-menu a[href="/music"]').click();
  }
  await page.waitForURL(`${origin}/music`);
}

// Use the actual catalog engine to derive deterministic synthetic near-tie cases.
function catalogPlan() {
  const Module = require("node:module");
  const ts = require("typescript");
  const root = path.resolve(__dirname, "..");
  const resolve = Module._resolveFilename;
  Module._resolveFilename = function(request, parent, ...args) {
    return resolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...args);
  };
  require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(require("node:fs").readFileSync(filename, "utf8"), {
    fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
  const { releases } = require("../content/releases.ts");
  const { preferenceCatalog } = require("../content/music-personalization.ts");
  const { recommendReleases, personalizedClosestChoices, recommendationDateKey } = require("../content/release-recommendations.ts");
  const { preferredClosest, genreIds } = require("../lib/music-preferences.ts");
  const { currentFocusRelease } = require("../content/release-focus.ts");
  const date = recommendationDateKey();
  const eligible = preferenceCatalog(releases).map((r) => r.slug);
  const cases = [];
  for (const release of releases) {
    const set = recommendReleases(release, releases, { date });
    const choices = personalizedClosestChoices(set, releases);
    for (const genre of genreIds) {
      const selected = preferredClosest(choices, profile(genre), day);
      if (selected && selected !== choices[0]?.slug && eligible.includes(release.slug)) {
        cases.push({ source: release.slug, genre, selected, baseline: set.recommendations.map((r) => `/music/${r.release.slug}`) });
        break;
      }
    }
  }
  assert.ok(cases.length, "Real catalog must expose an eligible near-tie example");
  return { cases, eligible, focus: currentFocusRelease(releases)?.slug };
}

async function contextFor(browser, width, options = {}) {
  const context = await browser.newContext({ viewport: { width, height: width > 768 ? 1000 : 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname === "/__qa_analytics") {
      report.analytics.push(JSON.parse(req.postData()));
      return route.fulfill({ status: 204 });
    }
    if (url.origin !== origin) return route.abort();
    if (req.method() !== "GET") report.requests.push({ url: req.url(), method: req.method(), body: req.postData() });
    if (options.failedAudio && (/\/api\/release-audio\//.test(url.pathname) || /\.(mp3|wav|m4a)$/.test(url.pathname))) {
      return route.fulfill({ status: 404, body: "Synthetic unavailable media" });
    }
    return route.continue();
  });
  await context.addInitScript(({ key, raw, blockedStorage, blockedPlay }) => {
    window.__discoveryEvents = [];
    window.umami = { track: (name, properties) => {
      window.__discoveryEvents.push({ name, properties });
      return fetch("/__qa_analytics", { method: "POST", body: JSON.stringify({ name, properties }) });
    } };
    if (raw !== undefined && !sessionStorage.getItem("qa-seeded")) {
      localStorage.setItem(key, raw);
      sessionStorage.setItem("qa-seeded", "1");
    }
    if (blockedStorage) Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Synthetic storage denial", "SecurityError"); } });
    if (blockedPlay) HTMLMediaElement.prototype.play = function() { return Promise.reject(new DOMException("Synthetic playback denial", "NotAllowedError")); };
  }, { key, raw: options.raw, blockedStorage: options.blockedStorage, blockedPlay: options.blockedPlay });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(30000);
  page.on("pageerror", (error) => report.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !/net::ERR_FAILED|Failed to load resource/.test(message.text())) report.consoleErrors.push(message.text());
  });
  return { context, page };
}

async function consentPlayback(browser, width, plan) {
  const { context, page } = await contextFor(browser, width);
  try {
    await page.goto(`${origin}/music`);
    const enable = page.getByRole("button", { name: "Enable personalization", exact: true });
    await enable.waitFor();
    assert.equal(await enable.getAttribute("aria-pressed"), "false");
    await page.getByRole("button", { name: "House", exact: true }).click();
    assert.equal(await readProfile(page), null);
    await page.goto(`${origin}/music/free`);
    await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
    await audioPlaying(page);
    assert.equal(await readProfile(page), null);
    check(`${width}px: first visit disabled; genre and successful playback do not store preferences before opt-in`);
    await page.goto(`${origin}/music`);
    await enable.focus();
    await enable.press("Enter");
    await page.getByRole("button", { name: "Disable personalization", exact: true }).waitFor();
    assert.deepEqual(await readProfile(page), profile());
    assert.match(await page.getByRole("status").first().innerText(), /enabled/);
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "Disable personalization");
    await page.getByRole("button", { name: "House", exact: true }).press("Space");
    assert.equal((await readProfile(page)).interests.house.score, 3);
    await page.reload();
    await page.getByRole("button", { name: "Disable personalization", exact: true }).waitFor();
    assert.equal((await readProfile(page)).interests.house.score, 3);
    check(`${width}px: keyboard opt-in creates versioned profile; status and focus update; genre score and reload persist`);

    await page.getByRole("button", { name: "Clear music preferences", exact: true }).click();
    await page.goto(`${origin}/music/free`);
    await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().press("Enter");
    await audioPlaying(page);
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).recent.some((r) => r.slug === "free"), key);
    const played = await readProfile(page);
    assert.ok(Object.values(played.interests).some((i) => i.score > 0));
    const player = page.getByRole("complementary", { name: "Site audio player" });
    await player.getByRole("button", { name: /^pause /i }).press("Space");
    await player.locator(".global-audio-player__play").press("Enter");
    await audioPlaying(page);
    assert.deepEqual((await readProfile(page)).interests, played.interests);
    const seek = player.getByRole("slider", { name: /^Seek through / });
    await seek.focus();
    await seek.press("ArrowRight");
    await page.evaluate(() => { const a = document.querySelector("[data-broey-global-audio]"); a.currentTime = a.duration * 0.6; });
    await tick(page);
    assert.deepEqual((await readProfile(page)).interests, played.interests);
    const beforeNavigation = await page.evaluate(() => document.querySelector("[data-broey-global-audio]").currentTime);
    await navigateMusic(page);
    await audioPlaying(page);
    assert.ok(await page.evaluate((time) => document.querySelector("[data-broey-global-audio]").currentTime >= time, beforeNavigation));
    await recent(page).getByRole("link", { name: "FREE", exact: true }).waitFor();
    await page.reload();
    await recent(page).getByRole("link", { name: "FREE", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: path.join(output, `music-${width}.png`), fullPage: false });
    check(`${width}px: intentional native playback scores; pause/resume/seek do not duplicate; SPA navigation retains playback; Recently Played survives return and reload`);

    await page.goto(`${origin}/music/fragments-ep`);
    await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
    await audioPlaying(page);
    const beforeAuto = await readProfile(page);
    await page.evaluate(() => { const a = document.querySelector("[data-broey-global-audio]"); a.currentTime = a.duration - 0.15; });
    await page.waitForFunction(() => window.__discoveryEvents.some((e) => e.name === "audio_play" && e.properties.playback_trigger === "automatic"));
    assert.deepEqual(await readProfile(page), beforeAuto);
    // Remove the already-scored project family so manual selection can supply a new signal.
    await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile() });
    await player.getByRole("button", { name: "Play next track", exact: true }).click();
    await page.waitForFunction(() => window.__discoveryEvents.some((e) => e.name === "audio_play" && e.properties.playback_trigger === "queue_selection"));
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).recent.length > 0, key);
    assert.ok(Object.keys((await readProfile(page)).interests).length > 0);
    check(`${width}px: real native ended/queue advancement adds no preference evidence; manual next-track selection updates history`);

    await navigateMusic(page);
    await page.getByRole("button", { name: "Clear music preferences", exact: true }).click();
    assert.deepEqual(await readProfile(page), profile());
    assert.equal(await recent(page).count(), 0);
    assert.match(await page.getByRole("status").first().innerText(), /cleared/);
    await page.getByRole("button", { name: "Disable personalization", exact: true }).press("Enter");
    assert.equal(await readProfile(page), null);
    assert.match(await page.getByRole("status").first().innerText(), /disabled/);
    assert.deepEqual(await context.cookies(), []);
    check(`${width}px: clear removes interests/history and retains consent; disable deletes profile; no cookies created`);
    // The existing public focus is used, rather than assuming which release is current.
    await page.goto(`${origin}/music`);
    assert.ok(await page.locator(`main a[href="/music/${plan.focus}"]`).count());
  } finally { await context.close(); }
}

async function recovery(browser, width) {
  for (const [name, options] of [
    ["blocked localStorage", { blockedStorage: true }],
    ["corrupt profile", { raw: "{broken" }],
    ["expired profile", { raw: JSON.stringify({ ...profile("house"), updatedDay: day - 91 }) }],
    ["unknown profile version", { raw: JSON.stringify({ ...profile("house"), version: 2 }) }],
  ]) {
    const { context, page } = await contextFor(browser, width, options);
    try {
      await page.goto(`${origin}/music`);
      await page.getByRole("button", { name: "Enable personalization", exact: true }).waitFor();
      if (options.blockedStorage) {
        await page.getByRole("button", { name: "Enable personalization", exact: true }).press("Enter");
        assert.match(await page.getByRole("status").first().innerText(), /storage is unavailable/);
        await page.getByRole("button", { name: "House", exact: true }).click();
      } else {
        await page.waitForFunction((key) => localStorage.getItem(key) === null, key);
        assert.equal(await readProfile(page), null);
      }
      assert.equal(await recent(page).count(), 0);
      check(`${width}px: ${name} safely falls back to disabled discovery`);
    } finally { await context.close(); }
  }
  for (const options of [{ blockedPlay: true }, { failedAudio: true }]) {
    const { context, page } = await contextFor(browser, width, { ...options, raw: JSON.stringify(profile()) });
    try {
      await page.goto(`${origin}/music/free`);
      await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
      if (options.failedAudio) await page.getByText("Audio unavailable", { exact: true }).waitFor();
      else await tick(page);
      assert.deepEqual(await readProfile(page), profile());
      assert.equal(await page.evaluate(() => window.__discoveryEvents.some((e) => e.name === "audio_play")), false);
      check(`${width}px: ${options.blockedPlay ? "rejected play promise" : "unavailable media response"} creates no false preference or audio_play`);
    } finally { await context.close(); }
  }
}

async function recommendations(browser, width, plan) {
  const { context, page } = await contextFor(browser, width);
  try {
    for (const example of plan.cases) {
      await page.goto(`${origin}/music/${example.source}`);
      await cards(page).first().waitFor();
      assert.deepEqual(await links(page), example.baseline);
      const focused = cards(page).nth(1).locator("a");
      await focused.focus();
      await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile(example.genre) });
      await page.waitForFunction((slug) => document.querySelector(".release-detail-recommendation-grid article a")?.getAttribute("href") === `/music/${slug}`, example.selected);
      assert.deepEqual((await links(page)).slice(1), example.baseline.slice(1));
      assert.equal(await focused.evaluate((node) => node === document.activeElement), true);
      // A changed Closest card must retain the focused control as well.
      await cards(page).first().locator("a").focus();
      await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile() });
      await page.waitForFunction((href) => document.querySelector(".release-detail-recommendation-grid article a")?.getAttribute("href") === href, example.baseline[0]);
      assert.equal(await cards(page).first().locator("a").evaluate((node) => node === document.activeElement), true);
      await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile(example.genre) });
      await page.waitForFunction((slug) => document.querySelector(".release-detail-recommendation-grid article a")?.getAttribute("href") === `/music/${slug}`, example.selected);
      const slugs = (await links(page)).map((href) => href.split("/").at(-1));
      assert.ok(plan.eligible.includes(slugs[0]), JSON.stringify({ slugs, eligible: plan.eligible }));
      assert.deepEqual(slugs.slice(1), example.baseline.slice(1).map((href) => href.split("/").at(-1)));
      // Only the first visible card is required at narrow widths.
      await cards(page).first().scrollIntoViewIfNeeded();
      await page.waitForFunction((slug) => window.__discoveryEvents.some((e) => e.name === "recommendation_impression" && e.properties.recommended_release_slug === slug && e.properties.personalized === true), example.selected);
      const before = await page.evaluate(() => window.__discoveryEvents.filter((e) => e.name === "recommendation_impression"));
      await page.evaluate(() => scrollTo(0, 0));
      await cards(page).first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(850);
      const after = await page.evaluate(() => window.__discoveryEvents.filter((e) => e.name === "recommendation_impression"));
      const count = (events) => events.filter((e) => e.properties.recommended_release_slug === example.selected && e.properties.personalized).length;
      assert.equal(count(after), count(before));
      if (example === plan.cases[0]) {
        await cards(page).first().locator("a").press("Enter");
        await page.waitForURL(`${origin}/music/${example.selected}`);
        const opened = await page.evaluate(() => window.__discoveryEvents.find((e) => e.name === "release_open"));
        assert.equal(opened.properties.personalized, true);
        assert.equal(opened.properties.recommended_release_slug, example.selected);
        await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().press("Enter");
        await audioPlaying(page);
        const destinationPlay = await page.evaluate(() => window.__discoveryEvents.find((e) => e.name === "audio_play"));
        assert.equal(destinationPlay.properties.personalized, true);
        assert.equal(destinationPlay.properties.recommended_release_slug, example.selected);
        await page.goto(`${origin}/music/${example.source}`);
        await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile(example.genre) });
        await page.waitForFunction((slug) => document.querySelector(".release-detail-recommendation-grid article a")?.getAttribute("href") === `/music/${slug}`, example.selected);
        await cards(page).first().getByRole("button").press("Enter");
        await audioPlaying(page);
        const event = await page.evaluate(() => window.__discoveryEvents.find((e) => e.name === "audio_play"));
        assert.equal(event.properties.personalized, true);
        assert.equal(event.properties.recommended_release_slug, example.selected);
        assert.equal(event.properties.source_release_slug, example.source);
        assert.equal(event.properties.recommendation_slot, "closest");
        assert.equal(await cards(page).first().getByRole("button").evaluate((node) => node === document.activeElement), true);
      }
      await page.evaluate((key) => { localStorage.removeItem(key); window.dispatchEvent(new StorageEvent("storage", { key })); }, key);
    }
    await page.goto(`${origin}/music/vultures`);
    const curated = await links(page);
    await page.evaluate(({ key, profile }) => { localStorage.setItem(key, JSON.stringify(profile)); window.dispatchEvent(new StorageEvent("storage", { key })); }, { key, profile: profile("jungle") });
    await tick(page);
    assert.deepEqual(await links(page), curated);
    check(`${width}px: ${plan.cases.length} real near-ties change only eligible Closest; Bridge/Discovery and focused link persist; curated precedence, personalized play/open attribution and impression dedup pass`);
  } finally { await context.close(); }
}

async function layouts(browser, width) {
  const { context, page } = await contextFor(browser, width, { raw: JSON.stringify({ ...profile("house"), recent: [{ slug: "free", day }, { slug: "blu", day }] }) });
  try {
    for (const route of ["/music", "/music/free", "/privacy", "/rights", "/"]) {
      const response = await page.goto(`${origin}${route}`);
      assert.equal(response.status(), 200);
      await page.locator("main").waitFor();
      await tick(page);
      const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      assert.equal(layout.scrollWidth <= layout.width, true, `${route} at ${width}px overflow`);
      report.layouts.push({ route, ...layout });
      assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute("href")).href, new URL(route, expectedSiteOrigin).href);
      if (route === "/music") {
        await recent(page).getByRole("link", { name: "FREE", exact: true }).focus();
        assert.ok(await recent(page).getByRole("link").count() >= 2);
        assert.ok(await page.getByRole("button", { name: "Disable personalization", exact: true }).isVisible());
      }
      if (route === "/privacy") {
        const text = await page.locator("main").innerText();
        for (const term of ["localStorage", "90 days", "not sent to Umami", "Disable personalization"]) assert.ok(text.includes(term), term);
      }
    }
    check(`${width}px: Music/Recently Played, release, Privacy, Rights and home have no overflow; canonical and disclosure checks pass`);
  } finally { await context.close(); }
}

async function main() {
  output = process.env.DISCOVERY_BROWSER_OUTPUT || await fs.mkdtemp(path.join(os.tmpdir(), "broey-phase3-browser-"));
  await fs.mkdir(output, { recursive: true });
  report.output = output;
  const plan = catalogPlan();
  report.recommendationCases = plan.cases;
  report.currentFocus = plan.focus;
  const browser = await installedPlaywright().chromium.launch({ headless: true });
  report.browserVersion = browser.version();
  assert.equal(browser._options.headless, true);
  try {
    for (const width of [1440, 390]) {
      await consentPlayback(browser, width, plan);
      await recovery(browser, width);
      await recommendations(browser, width, plan);
    }
    for (const width of [1440, 768, 390, 320]) await layouts(browser, width);
    assert.deepEqual(report.errors, [], "Uncaught browser errors");
    assert.deepEqual(report.consoleErrors, [], "Unexpected console errors or hydration errors");
    const allowed = new Set(["enabled", "source_surface", "genre", "result_count", "source_release_slug", "recommended_release_slug", "recommendation_slot", "recommendation_position", "curated_override", "personalized", "interaction_type", "release_slug", "track_slug", "track_title", "project_slug", "playback_trigger", "campaign", "page_path"]);
    for (const event of report.analytics) {
      for (const field of Object.keys(event.properties)) assert.ok(allowed.has(field), `Unexpected analytics field: ${field}`);
      assert.doesNotMatch(JSON.stringify(event), /broey-music-preferences|updatedDay|interests|recent|score/);
    }
    for (const req of report.requests) assert.doesNotMatch(req.body || "", /broey-music-preferences|updatedDay|"interests"|"recent"|"score"/);
    for (const name of ["personalization_change", "recommendation_impression", "recommendation_interaction", "audio_play", "release_open"]) assert.ok(report.analytics.some((event) => event.name === name), name);
    check("Browser-captured synthetic analytics requests contain only aggregate allowlisted properties; no preference profile in application requests; no uncaught or hydration errors");
    report.passed = true;
  } finally { await browser.close(); }
}

main().catch((error) => { report.failure = error.stack; process.exitCode = 1; }).finally(async () => {
  if (output) await fs.writeFile(path.join(output, "browser.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, output, failure: report.failure, playbackFailure: report.playbackFailure, errors: report.errors, consoleErrors: report.consoleErrors }, null, 2));
});
