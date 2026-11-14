// Requires an existing installed Playwright module and built loopback servers; installs nothing.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const origin = process.env.PHASE2_TEST_ORIGIN || "http://127.0.0.1:3227";
const privateBuildDir = process.env.PHASE2_PRIVATE_BUILD_DIR;
const isPrivate = Boolean(privateBuildDir) || process.env.PHASE2_TEST_MODE === "private";
const mode = isPrivate ? "private" : "public";
const target = new URL(origin);
assert.ok(target.protocol === "http:" && ["localhost", "127.0.0.1"].includes(target.hostname), "Only loopback HTTP servers are permitted");
assert.equal(target.origin, origin, "Specify an origin without a path or credentials");
const report = { passed: false, mode, origin, headless: !privateBuildDir, temporaryProfile: !privateBuildDir, externalRequestsBlocked: true, checks: [], errors: [], layouts: [] };

function robotsGroups(text) {
  return text.trim().split(/\r?\n\s*\r?\n/).map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.split(/:\s*/));
    return {
      agents: lines.filter(([key]) => key.toLowerCase() === "user-agent").map(([, value]) => value.toLowerCase()),
      allow: lines.filter(([key]) => key.toLowerCase() === "allow").map(([, value]) => value),
      disallow: lines.filter(([key]) => key.toLowerCase() === "disallow").map(([, value]) => value),
    };
  });
}

async function main() {
  if (privateBuildDir) {
    // Noninteractive fallback: inspect real private build output and invoke its sitemap handler.
    assert.equal(process.env.SITE_VISIBILITY, "private");
    const root = path.resolve(privateBuildDir, "server/app");
    const html = await fs.readFile(path.join(root, "rights.html"), "utf8");
    const meta = (name) => html.match(new RegExp(`<meta name="${name}" content="([^"]+)"`))?.[1];
    assert.match(meta("robots"), /noindex.*nofollow/);
    assert.match(meta("googlebot"), /noindex.*nofollow/);
    assert.match(html, /<link rel="canonical" href="https:\/\/broey.net\/rights"/);
    assert.equal(html.includes('id="umami-analytics"'), false);
    report.robots = await fs.readFile(path.join(root, "robots.txt.body"), "utf8");
    assert.equal(report.robots.trim(), "User-Agent: *\nDisallow: /");
    const bundled = require(path.join(root, "sitemap.xml/route.js"));
    const response = await bundled.routeModule.userland.GET();
    assert.equal(response.status, 200);
    report.sitemap = await response.text();
    assert.equal(report.sitemap.includes("<loc>"), false);
    report.browserValidation = "Not run in artifact mode; private server launch blocked by automatic approval review in this readiness run";
    report.checks.push(
      "Private prerendered rights robots and Googlebot metadata: noindex, nofollow",
      "Private canonical remains https://broey.net/rights",
      "Private prerendered HTML contains no Umami analytics script",
      "Private robots disallows all agents and advertises no sitemap",
      "Actual bundled private sitemap GET returns 200 with zero URL entries",
    );
    report.passed = true;
    return;
  }
  const robotsResponse = await fetch(`${origin}/robots.txt`);
  assert.equal(robotsResponse.status, 200);
  report.robots = await robotsResponse.text();
  const groups = robotsGroups(report.robots);
  const wildcard = groups.find((group) => group.agents.includes("*"));
  if (isPrivate) {
    assert.deepEqual(wildcard.disallow, ["/"]);
    assert.equal(/sitemap:/i.test(report.robots), false);
    assert.equal(groups.filter((group) => group.agents.length).length, 1);
  } else {
    assert.deepEqual(wildcard.allow, ["/"]);
    assert.deepEqual(wildcard.disallow, []);
    for (const agent of ["GPTBot", "ClaudeBot"]) {
      assert.deepEqual(groups.find((group) => group.agents.includes(agent.toLowerCase())).disallow, ["/"]);
    }
    for (const agent of ["Googlebot", "bingbot", "OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "Claude-User", "Google-Extended"]) {
      const effective = groups.find((group) => group.agents.includes(agent.toLowerCase())) || wildcard;
      assert.deepEqual(effective.allow, ["/"], agent);
      assert.deepEqual(effective.disallow, [], agent);
    }
    assert.equal(groups.filter((group) => group.agents.length).length, 3);
    assert.match(report.robots, /Sitemap: https:\/\/broey\.net\/sitemap\.xml/);
  }
  report.checks.push(`${mode} robots output and effective crawler groups`);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  assert.equal(sitemapResponse.status, 200);
  const sitemap = await sitemapResponse.text();
  const entries = [...sitemap.matchAll(/<url>\s*<loc>(.*?)<\/loc>([\s\S]*?)<\/url>/g)].map((match) => ({
    url: match[1], lastModified: match[2].match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));
  report.sitemapEntries = entries;
  if (isPrivate) {
    assert.equal(entries.length, 0);
  } else {
    assert.equal(new Set(entries.map(({ url }) => url)).size, entries.length);
    assert.equal(entries.filter(({ url }) => url === "https://broey.net/rights").length, 1);
    for (const path of ["/rights", "/privacy"]) {
      assert.equal(entries.find(({ url }) => url === `https://broey.net${path}`).lastModified, "2026-11-14T00:00:00.000Z");
    }
    if (process.env.PHASE2_BASELINE_SITEMAP) {
      const baseline = JSON.parse(await fs.readFile(process.env.PHASE2_BASELINE_SITEMAP, "utf8"));
      for (const entry of baseline) {
        const current = entries.find(({ url }) => url === entry.url);
        assert.ok(current, `Existing URL retained: ${entry.url}`);
        if (entry.url !== "https://broey.net/privacy") assert.equal(current.lastModified, entry.lastModified, entry.url);
      }
      assert.equal(entries.length, baseline.length + 1);
      report.checks.push(`All ${baseline.length} baseline sitemap URLs retained; only privacy date changed`);
    }
  }
  report.checks.push(`${mode} sitemap eligibility, uniqueness, and source-backed dates`);

  const { chromium } = require(process.env.DISCOVERY_PLAYWRIGHT_MODULE || "playwright");
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of isPrivate ? [1440, 390] : [1440, 768, 390, 320]) {
      const context = await browser.newContext({ viewport: { width, height: width > 768 ? 1000 : 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
      await context.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
      const page = await context.newPage();
      page.on("pageerror", (error) => report.errors.push(error.message));
      if (isPrivate) {
        const response = await page.goto(`${origin}/rights`);
        assert.equal(response.status(), 200);
        assert.match(page.url(), /\/gate\?next=%2Frights$/);
        assert.match(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex.*nofollow/);
        assert.equal(await page.getByRole("heading", { name: "Artist Rights & AI Usage", exact: true }).count(), 0);
        report.checks.push(`${width}px unauthenticated rights request stays behind preview gate with noindex/nofollow`);
        // Synthetic preview authorization, confined to this fresh loopback context.
        const { createHash } = require("node:crypto");
        assert.ok(process.env.PHASE2_TEST_PASSCODE, "Use a synthetic passcode matching the private test build");
        await context.addCookies([{ name: "broey_private_preview", value: createHash("sha256").update(`broey-preview-gate:${process.env.PHASE2_TEST_PASSCODE}`).digest("hex"), url: origin }]);
      }
      const response = await page.goto(`${origin}/rights`);
      assert.equal(response.status(), 200);
      assert.equal(await page.title(), "Rights & Licensing | Broey.");
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute("href"), "https://broey.net/rights");
      assert.match(await page.locator('meta[name="description"]').getAttribute("content"), /rights.*AI usage/i);
      await page.getByRole("heading", { name: "Rights & Licensing", exact: true }).waitFor();
      assert.equal(await page.getByRole("heading", { name: "Artist Rights & AI Usage", exact: true }).count(), 1);
      const robotsTag = page.locator('meta[name="robots"]');
      const robotsMetadata = await robotsTag.count() ? await robotsTag.getAttribute("content") : "";
      if (isPrivate) {
        assert.match(robotsMetadata, /noindex.*nofollow/);
        assert.match(await page.locator('meta[name="googlebot"]').getAttribute("content"), /noindex.*nofollow/);
        assert.equal(await page.locator("#umami-analytics").count(), 0);
      } else {
        assert.doesNotMatch(robotsMetadata || "", /noindex|nofollow/);
      }
      const article = page.locator("main article");
      assert.equal(await article.locator('a[href="mailto:broey@broey.net"]').count(), 1);
      const policyText = await article.innerText();
      for (const qualification of ["collaborators, labels, publishers, and others", "copyright exceptions or limitations", "existing licenses", "external platforms", "does not by itself constitute a license", "An inquiry does not itself grant permission"]) assert.ok(policyText.includes(qualification), qualification);
      const layout = await page.evaluate(() => ({ viewport: innerWidth, contentWidth: document.documentElement.scrollWidth, horizontalOverflow: document.documentElement.scrollWidth > innerWidth, paragraphFont: getComputedStyle(document.querySelector(".release-detail-copy p")).fontSize }));
      assert.equal(layout.horizontalOverflow, false, `${width}px overflow`);
      report.layouts.push({ width, ...layout });
      if (width === 1440 || width === 390) await page.screenshot({ path: `reports/discovery-analytics-phase-2-rights-${mode}-${width}.png`, fullPage: true });
      await page.locator('nav[aria-label="Footer navigation"] a[href="/privacy"]').click();
      await page.waitForURL(`${origin}/privacy`);
      assert.match(await page.locator("main").innerText(), /cross-session behavioral histories/);
      const links = page.locator('nav[aria-label="Footer navigation"] a');
      const hrefs = await links.evaluateAll((elements) => elements.map((element) => element.getAttribute("href")));
      assert.equal(hrefs[hrefs.indexOf("/privacy") + 1], "/rights");
      await page.locator('nav[aria-label="Footer navigation"] a[href="/rights"]').click();
      await page.waitForURL(`${origin}/rights`);
      await page.goBack();
      await page.waitForURL(`${origin}/privacy`);
      await page.goForward();
      await page.waitForURL(`${origin}/rights`);
      report.checks.push(`${width}px rights rendering, canonical, policy, footer links, and back/forward navigation`);
      await context.close();
    }
    assert.deepEqual(report.errors, []);
    report.passed = true;
  } finally {
    await browser.close();
  }
}

main().catch((error) => { report.failure = error.stack; process.exitCode = 1; }).finally(async () => {
  const reportPath = privateBuildDir ? "reports/discovery-analytics-phase-2-private-artifacts.json" : `reports/discovery-analytics-phase-2-${mode}-readiness.json`;
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ passed: report.passed, mode, checks: report.checks, errors: report.errors, failure: report.failure }, null, 2));
});
