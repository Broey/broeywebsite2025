// Compiled-artifact checks. Real browser acceptance is a separate mandatory gate.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const buildDir = process.env.PHASE3_BUILD_DIR;
assert.ok(buildDir, "PHASE3_BUILD_DIR must point to the isolated production .next directory");
const report = { passed: false, mode: "compiled-artifacts", checks: [], browserValidation: "Separate gate: node scripts/validate-personalized-discovery-browser.cjs" };
const root = path.resolve(__dirname, "..");
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  return originalResolve.call(this, request.startsWith("@/") ? path.join(root, request.slice(2)) : request, parent, ...args);
};
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  fileName: filename, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
}).outputText, filename);
async function main() {
  process.env.SITE_VISIBILITY = "public";
  process.env.NEXT_PUBLIC_SITE_URL = "https://broey.net";
  const { releases } = require("../content/releases.ts");
  const { recommendReleases, personalizedClosestChoices, recommendationDateKey } = require("../content/release-recommendations.ts");
  const { emptyPreferences, preferredClosest, genreIds } = require("../lib/music-preferences.ts");
  const sourceSitemap = require("../app/sitemap.ts").default;
  const dateKey = recommendationDateKey();
  const day = Math.floor(Date.parse(dateKey) / 86400000);
  report.recommendationDate = dateKey;
  const changes = [];
  let choicesCount = 0;
  for (const source of releases) {
    const set = recommendReleases(source, releases, { date: dateKey });
    const choices = personalizedClosestChoices(set, releases);
    choicesCount += choices.length;
    if (!choices.length) continue;
    assert.equal(preferredClosest(choices, emptyPreferences(day), day), set.recommendations[0].release.slug);
    for (const genre of genreIds) {
      const profile = { ...emptyPreferences(day, true), interests: { [genre]: { score: 12, day } } };
      const selected = preferredClosest(choices, profile, day);
      assert.equal(preferredClosest(choices, profile, day), selected);
      if (selected !== choices[0].slug) changes.push({ source: source.slug, genre, baseline: choices[0].slug, personalized: selected });
    }
  }
  assert.ok(changes.length, "actual catalog must permit a meaningful adjustment");
  report.personalizedExamples = changes.slice(0, 5);
  report.totalChoices = choicesCount;
  report.checks.push("All actual source releases retain disabled baseline; fixed-date preference plans are deterministic and can adjust real near-ties");
  const output = path.join(buildDir, "server/app");
  const privacy = fs.readFileSync(path.join(output, "privacy.html"), "utf8");
  assert.match(privacy, /<link rel="canonical" href="https:\/\/broey.net\/privacy"/);
  for (const text of ["Optional music personalization on this device", "localStorage", "90 days", "switching personalization Off", "Clear music preferences", "not sent to Umami", "November 14, 2026"]) assert.ok(privacy.includes(text), text);
  assert.equal(privacy.includes("does not currently create stored listener-interest profiles"), false);
  assert.doesNotMatch(privacy, /<meta name="robots" content="[^"]*noindex/);
  report.checks.push("Real compiled Privacy HTML has optional local storage disclosure, retention, controls, authored effective date, canonical and public indexability");
  const rights = fs.readFileSync(path.join(output, "rights.html"), "utf8");
  assert.match(rights, /<link rel="canonical" href="https:\/\/broey.net\/rights"/);
  assert.match(rights, /Artist Rights &amp; AI Usage/);
  const robots = fs.readFileSync(path.join(output, "robots.txt.body"), "utf8");
  assert.equal(robots.trim(), "User-Agent: *\nAllow: /\n\nUser-Agent: GPTBot\nDisallow: /\n\nUser-Agent: ClaudeBot\nDisallow: /\n\nSitemap: https://broey.net/sitemap.xml");
  const bundle = require(path.resolve(output, "sitemap.xml/route.js"));
  const response = await bundle.routeModule.userland.GET();
  assert.equal(response.status, 200);
  const xml = await response.text();
  const actualUrls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = sourceSitemap().map((entry) => entry.url);
  assert.deepEqual([...actualUrls].sort(), [...expectedUrls].sort());
  assert.equal(new Set(actualUrls).size, actualUrls.length);
  report.sitemapUrls = actualUrls.length;
  report.checks.push("Actual compiled sitemap handler retains public URL eligibility and unique canonicals; Rights and exact selective robots policy remain intact");
  report.passed = true;
}
main().catch((error) => { report.failure = error.stack; process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(process.env.PHASE3_VALIDATION_OUTPUT || path.join(root, "reports/personalized-discovery-phase-3-validation.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
});
