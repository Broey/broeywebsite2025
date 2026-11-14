// Uses an existing local server and installed Playwright; installs nothing.
// Example: DISCOVERY_PLAYWRIGHT_MODULE=/path/to/playwright-core node scripts/validate-discovery-analytics.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.DISCOVERY_PLAYWRIGHT_MODULE || "playwright");
const origin = process.env.DISCOVERY_TEST_ORIGIN || "http://127.0.0.1:3000";
// Keep later readiness runs separate from the original Phase 1 evidence.
const reportPrefix = process.env.DISCOVERY_REPORT_PREFIX || "reports/discovery-analytics-phase-1";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Only a local test server is permitted");
const report = { passed: false, origin, headless: true, freshContexts: true, externalRequestsBlocked: true, checks: [], events: [], errors: [] };

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await context.addInitScript(() => {
      window.__discoveryEvents = [];
      window.umami = { track: (name, properties) => { window.__discoveryEvents.push({ name, properties }); } };
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => report.errors.push(error.message));
    await page.goto(`${origin}/music/free`);
    const cards = page.locator(".release-detail-recommendation-grid article");
    await cards.first().waitFor();
    assert.equal(await cards.count(), 3);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "recommendation_impression").length), 0);
    await cards.first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => window.__discoveryEvents.filter((event) => event.name === "recommendation_impression").length === 3);
    const impressions = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "recommendation_impression"));
    assert.deepEqual(impressions.map((event) => event.properties.recommendation_position).sort(), [1, 2, 3]);
    assert.deepEqual(impressions.map((event) => event.properties.recommendation_slot).sort(), ["bridge", "closest", "discovery"]);
    report.checks.push("Three visible-card impressions; none for initial offscreen rendering");

    const first = cards.first();
    const destinationPath = await first.locator("a").getAttribute("href");
    const destinationSlug = destinationPath.split("/").pop();
    await first.getByRole("button").click();
    await page.waitForFunction(() => { const audio = document.querySelector("[data-broey-global-audio]"); return !audio.paused && audio.currentTime > 0.1; });
    await page.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play" && event.properties.playback_trigger === "recommendation"));
    const play = await page.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play"));
    assert.equal(play.properties.source_release_slug, "free");
    assert.equal(play.properties.recommended_release_slug, destinationSlug);
    assert.equal(play.properties.release_slug, destinationSlug);
    assert.equal(play.properties.recommendation_position, 1);
    await first.getByRole("button").click();
    await page.waitForFunction(() => document.querySelector("[data-broey-global-audio]").paused);
    await first.getByRole("button").click();
    await page.waitForFunction(() => !document.querySelector("[data-broey-global-audio]").paused);
    await page.waitForTimeout(1200);
    assert.equal(await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").length), 1);
    assert.equal(await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "recommendation_impression").length), 3);
    const interactions = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "recommendation_interaction").map((event) => event.properties.interaction_type));
    assert.deepEqual(interactions, ["play", "pause", "resume"]);
    report.checks.push("Direct card play/pause/resume with attributed play and rerender deduplication");

    await page.evaluate(() => { const audio = document.querySelector("[data-broey-global-audio]"); audio.currentTime = audio.duration * 0.8; });
    await page.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_75_percent"));
    for (const event of await page.evaluate(() => window.__discoveryEvents.filter((event) => /audio_(25|50|75)_percent/.test(event.name)))) {
      assert.equal(event.properties.recommended_release_slug, destinationSlug);
      assert.equal(event.properties.source_release_slug, "free");
    }
    report.checks.push("Existing seek-based position milestones retain attribution (not elapsed listening)");
    await page.screenshot({ path: `${reportPrefix}-desktop.png`, fullPage: false });

    const beforeNavigation = await page.locator("[data-broey-global-audio]").getAttribute("src");
    await first.locator("a").click();
    await page.waitForURL(`${origin}${destinationPath}`);
    assert.equal(await page.locator("[data-broey-global-audio]").getAttribute("src"), beforeNavigation);
    await page.waitForFunction(() => !document.querySelector("[data-broey-global-audio]").paused);
    const open = await page.evaluate(() => window.__discoveryEvents.find((event) => event.name === "release_open"));
    assert.equal(open.properties.recommended_release_slug, destinationSlug);
    assert.equal(open.properties.release_slug, destinationSlug);
    report.checks.push("Same-tab recommendation navigation retains release_open fields and uninterrupted global playback");

    // Select the destination's main player; its queue can differ from the card's queue.
    await page.evaluate(() => document.querySelector("[data-broey-global-audio]").pause());
    const playCount = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").length);
    await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
    await page.waitForFunction((count) => window.__discoveryEvents.filter((event) => event.name === "audio_play").length > count, playCount);
    const destinationPlay = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").at(-1));
    assert.equal(destinationPlay.properties.recommended_release_slug, destinationSlug);
    assert.equal(destinationPlay.properties.source_release_slug, "free");
    report.checks.push("Destination-page play consumes pending recommendation navigation");

    await page.evaluate(() => { const audio = document.querySelector("[data-broey-global-audio]"); audio.currentTime = audio.duration - 0.15; });
    await page.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play" && event.properties.playback_trigger === "automatic"));
    const automatic = await page.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play" && event.properties.playback_trigger === "automatic"));
    assert.equal(automatic.properties.source_release_slug, undefined);
    assert.equal(automatic.properties.recommended_release_slug, undefined);
    const completion = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_complete").at(-1));
    assert.equal(completion.properties.recommended_release_slug, destinationSlug);
    report.checks.push("Actual ended event attributes completion then clears origin on automatic queue advance");
    await page.getByRole("button", { name: "Play next track", exact: true }).click();
    await page.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play" && event.properties.playback_trigger === "queue_selection"));
    const manual = await page.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play" && event.properties.playback_trigger === "queue_selection"));
    assert.equal(manual.properties.source_release_slug, undefined);
    assert.equal(manual.properties.recommended_release_slug, undefined);
    await page.locator(".site-header").getByRole("link", { name: /music/i }).first().click();
    await page.waitForURL(`${origin}/music`);
    const unrelatedCount = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").length);
    await page.getByRole("button", { name: /^play /i }).first().click();
    await page.waitForFunction((count) => window.__discoveryEvents.filter((event) => event.name === "audio_play").length > count, unrelatedCount);
    const unrelated = await page.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").at(-1));
    assert.equal(unrelated.properties.playback_trigger, "direct");
    assert.equal(unrelated.properties.source_release_slug, undefined);
    assert.equal(unrelated.properties.recommended_release_slug, undefined);
    report.checks.push("Manual queue selection and unrelated catalog play never inherit recommendation origin");
    report.events = await page.evaluate(() => window.__discoveryEvents);

    // A navigation with no playback must not be revived by a later history traversal.
    await page.goto(`${origin}/music/free`);
    const historyLink = page.locator(".release-detail-recommendation-grid article").first().locator("a");
    const historyDestination = await historyLink.getAttribute("href");
    await historyLink.press("Enter");
    await page.waitForURL(`${origin}${historyDestination}`);
    await page.goBack();
    await page.waitForURL(`${origin}/music/free`);
    await page.goForward();
    await page.waitForURL(`${origin}${historyDestination}`);
    await page.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
    await page.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play"));
    const historyPlay = await page.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play"));
    assert.equal(historyPlay.properties.playback_trigger, "direct");
    assert.equal(historyPlay.properties.recommended_release_slug, undefined);
    report.checks.push("Keyboard recommendation navigation and back/forward do not revive departed pending attribution");
    report.historyEvents = await page.evaluate(() => window.__discoveryEvents);
    await context.close();

    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await mobile.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const mobilePage = await mobile.newPage();
    mobilePage.on("pageerror", (error) => report.errors.push(error.message));
    await mobilePage.goto(`${origin}/music/free`);
    const mobileCard = mobilePage.locator(".release-detail-recommendation-grid article").first();
    await mobileCard.getByRole("button").click();
    await mobilePage.waitForFunction(() => !document.querySelector("[data-broey-global-audio]").paused);
    await mobilePage.screenshot({ path: `${reportPrefix}-mobile.png`, fullPage: false });
    await mobilePage.evaluate(() => { window.umami = { track: () => Promise.reject(new Error("simulated blocked delivery")) }; });
    const mobileDestination = await mobileCard.locator("a").getAttribute("href");
    await mobileCard.locator("a").click();
    await mobilePage.waitForURL(`${origin}${mobileDestination}`);
    await mobilePage.waitForTimeout(200);
    assert.equal(report.errors.length, 0);
    report.checks.push("390px fresh context: playback without Umami and navigation with rejected analytics delivery");

    await mobilePage.goto(`${origin}/music/free`);
    await mobilePage.evaluate(() => {
      window.__discoveryEvents = [];
      window.umami = { track: (name, properties) => { window.__discoveryEvents.push({ name, properties }); } };
    });
    const visibleMobileCard = mobilePage.locator(".release-detail-recommendation-grid article").first();
    await visibleMobileCard.scrollIntoViewIfNeeded();
    await mobilePage.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "recommendation_impression" && event.properties.recommendation_position === 1));
    const mobilePath = await visibleMobileCard.locator("a").getAttribute("href");
    const mobileSlug = mobilePath.split("/").pop();
    await visibleMobileCard.getByRole("button").press("Enter");
    await mobilePage.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play"));
    const mobilePlay = await mobilePage.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play"));
    assert.equal(mobilePlay.properties.playback_trigger, "recommendation");
    assert.equal(mobilePlay.properties.recommended_release_slug, mobileSlug);
    assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await visibleMobileCard.locator("a").press("Enter");
    await mobilePage.waitForURL(`${origin}${mobilePath}`);
    assert.equal((await mobilePage.evaluate(() => window.__discoveryEvents.find((event) => event.name === "release_open"))).properties.recommended_release_slug, mobileSlug);
    await mobilePage.evaluate(() => document.querySelector("[data-broey-global-audio]").pause());
    const mobilePlayCount = await mobilePage.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").length);
    await mobilePage.locator(".release-detail-hero").getByRole("button", { name: /^(play|replay)/i }).first().click();
    await mobilePage.waitForFunction((count) => window.__discoveryEvents.filter((event) => event.name === "audio_play").length > count, mobilePlayCount);
    const mobileDestinationPlay = await mobilePage.evaluate(() => window.__discoveryEvents.filter((event) => event.name === "audio_play").at(-1));
    assert.equal(mobileDestinationPlay.properties.recommended_release_slug, mobileSlug);
    await mobilePage.evaluate(() => { const audio = document.querySelector("[data-broey-global-audio]"); audio.currentTime = audio.duration - 0.15; });
    await mobilePage.waitForFunction(() => window.__discoveryEvents.some((event) => event.name === "audio_play" && event.properties.playback_trigger === "automatic"));
    const mobileAutomatic = await mobilePage.evaluate(() => window.__discoveryEvents.find((event) => event.name === "audio_play" && event.properties.playback_trigger === "automatic"));
    assert.equal(mobileAutomatic.properties.recommended_release_slug, undefined);
    assert.equal(mobileAutomatic.properties.source_release_slug, undefined);
    report.mobileEvents = await mobilePage.evaluate(() => window.__discoveryEvents);
    assert.equal(report.errors.length, 0);
    report.checks.push("390px visible impressions, keyboard direct play/open, destination attribution, automatic clearing, and no player overflow");
    await mobile.close();
    report.passed = true;
  } finally {
    await browser.close();
    await fs.writeFile(path.resolve(`${reportPrefix}-browser.json`), `${JSON.stringify(report, null, 2)}\n`);
  }
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks, errors: report.errors }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
