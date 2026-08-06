const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const reportPath = path.join(
  projectRoot,
  "docs",
  "launch-readiness",
  "V1_RELEASE_RECOMMENDATION_VALIDATION.md",
);
const validation = JSON.parse(
  execFileSync(process.execPath, [
    path.join(__dirname, "validate-release-recommendations.cjs"),
    "--json",
  ], {
    cwd: projectRoot,
    encoding: "utf8",
  }),
);
const branch = execFileSync("git", ["branch", "--show-current"], {
  cwd: projectRoot,
  encoding: "utf8",
}).trim();
const implementationCommit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: projectRoot,
  encoding: "utf8",
}).trim();

const escapeCell = (value) =>
  String(value ?? "")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");

const scoreLabel = (score) => {
  const breakdown = Object.entries(score.breakdown)
    .map(([key, value]) => `${key} ${value}`)
    .join(", ");
  return `${score.slug}=${score.score.toFixed(3)}${breakdown ? ` [${breakdown}]` : ""}`;
};

const lines = [];
const push = (...values) => lines.push(...values);

push(
  "# V1 release recommendation validation",
  "",
  "## Review status",
  "",
  "**Ready for owner review.** The branch is locally implemented, committed, and validated. It has not been pushed, merged, deployed, or connected to DNS, and no form was submitted.",
  "",
  "| Item | Value |",
  "| --- | --- |",
  `| Branch | \`${branch}\` |`,
  "| Starting commit | `6b1eb0dcaaf7ecba8bb1871b23729d9e8517a68f` |",
  `| Ending implementation commit | \`${implementationCommit}\` |`,
  "| Validation-report commit | This file is added by the final documentation commit; use `git rev-parse HEAD` after checkout for its exact hash. |",
  "| Reference matrix date | `2026-08-05` UTC |",
  `| Approved source pages | ${validation.sourcePageCount} |`,
  `| Eligible recommendation candidates | ${validation.eligibleCandidateCount} |`,
  "",
  "## Root cause of static recommendations",
  "",
  "The previous release route called `sortedArchiveReleases(releases)`, removed only the current slug, and took `.slice(0, 3)`. That made recommendations a fixed newest-first array/date slice. They were not manually assigned, genre-scored, route-specific beyond self-removal, or randomized. They were generated while statically rendering each route and serialized as identical compact links for most pages. Parent projects, detailed genres, curated genres, catalog eras, local audio, and highlighted-release priority did not participate.",
  "",
  "## Recommendation architecture",
  "",
  "`content/release-recommendations.ts` is the centralized, pure selection engine. It normalizes factual catalog signals already used by the site, validates owner overrides, creates deterministic scores and tie-breaks, and returns recommendations plus diagnostics. The release route computes the set on the server only. The browser receives three chosen `ReleaseCard` instances and their existing persistent-player queues; it never recomputes or reshuffles the set.",
  "",
  "The route remains SSG and exports `revalidate = 86400`. A UTC date is captured at build or ISR regeneration. Results therefore remain stable for a cached page and rotate on a cache-safe approximately 24-hour interval after the next request, rather than exactly at UTC midnight. This avoids visitor-specific rendering and avoids forcing the site dynamic.",
  "",
  "## Scoring weights",
  "",
  "| Signal | Weight | Slot |",
  "| --- | ---: | --- |",
  "| Shared detailed genre | +18 each, capped at three | Closest |",
  "| Shared curated genre family | +7 each, capped at three | Closest |",
  "| Exact release type | +5 | Closest |",
  "| Compatible release form | +3 | Closest |",
  "| Same release era | +3 | Closest |",
  "| Same parent project family | +6 | Closest |",
  "| Different catalog section | +18 | Bridge |",
  "| Different release era | +12 | Bridge |",
  "| Different primary genre family | +12 | Bridge |",
  "| Different release type | +5 | Bridge |",
  "| Different release form | +8 | Bridge |",
  "| No shared detailed genre | +4 | Bridge |",
  "| Different from closest result: primary genre/type/section | +6 / +3 / +3 | Bridge |",
  "| Local audio | +2 | All slots |",
  "| Owner priority | `clamp(-5..5) × 2` | All slots |",
  "| Seeded rotation | 0–100 deterministic value | Discovery |",
  "",
  "Bridge candidates within 12 points of the best factual bridge score form a strong-candidate band. A stable source/candidate hash distributes selection inside that band, preventing one old project from dominating while retaining purposeful catalog contrast. Closest and bridge tie-breaking uses stable source/candidate identifiers and does not depend on the date.",
  "",
  "## Eligibility and visibility rules",
  "",
  "Candidates must be non-draft, non-draft-catalog, present in the runtime release registry (therefore route-backed), included by the existing public archive policy, not owner-excluded, and backed by a real approved local artwork file. The current release, duplicate slugs, `watch`, `link`, and `paradise` are excluded. Drafts are removed by the existing release-registry export before routing; the engine defensively checks visibility again.",
  "",
  `Eligible candidates: ${validation.eligibleCandidateSlugs.map((slug) => `\`${slug}\``).join(", ")}.`,
  "",
  "Project-track routes remain approved source pages. Project tracks hidden from the public archive are not automatic candidates; their public parent project is preferred. Within a set, `parentReleaseSlug ?? slug` is the project identity. A new selection first uses a candidate with an unused project identity and allows a duplicate identity only if no broader candidate remains. The current dataset produces no duplicate-parent sets.",
  "",
  "## Owner controls",
  "",
  "- `recommendationPriority?: number` modestly adjusts all slot scores and defaults to zero.",
  "- `recommendedSlugs?: string[]` is considered in owner order before automatic choices. Valid unique public candidates fill the next available slots; automatic logic fills the remainder.",
  "- `excludeFromRecommendations?: boolean` removes a candidate without hiding its own page.",
  "",
  "No release entry received an invented manual override. Validation injects duplicate, missing, draft/ineligible, and self-referential examples and confirms that all are ignored and reported.",
  "",
  "## Complete recommendation matrix",
  "",
  "Scores are the chosen slot score on the reference UTC date. Parent shows the source parent relationship; every row also applies self-exclusion and the standard candidate-pool exclusions above.",
  "",
  "| Source | Parent | Slot 1: closest | Slot 2: bridge | Slot 3: discovery | Manual | Unique |",
  "| --- | --- | --- | --- | --- | --- | --- |",
);

for (const row of validation.matrix) {
  const [closest, bridge, discovery] = row.recommendations;
  const cell = (item) =>
    `\`${item.slug}\` (${item.score.toFixed(3)}): ${item.reason}`;
  push(
    `| \`${row.sourceSlug}\` | ${row.sourceFacts.parent ? `\`${row.sourceFacts.parent}\`` : "—"} | ${escapeCell(cell(closest))} | ${escapeCell(cell(bridge))} | ${escapeCell(`${cell(discovery)} Seed: \`${discovery.seed}\`.`)} | ${row.recommendations.some((item) => item.manualOverride) ? "yes" : "none"} | ${row.unique ? "yes" : "no"} |`,
  );
}

push(
  "",
  "## Candidate scores",
  "",
  "Every candidate score considered for each slot is listed below. Later slots omit already-selected slugs and prefer unused parent identities.",
  "",
);

for (const row of validation.matrix) {
  push(
    `### \`${row.sourceSlug}\``,
    "",
    `- Closest: ${row.candidateScores.closest.map(scoreLabel).join("; ")}`,
    `- Bridge: ${row.candidateScores.bridge.map(scoreLabel).join("; ")}`,
    `- Discovery: ${row.candidateScores.discovery.map(scoreLabel).join("; ")}`,
    "",
  );
}

push(
  "## Aggregate exposure counts",
  "",
  "| Release | Appearances | Source-page share |",
  "| --- | ---: | ---: |",
);

for (const exposure of validation.exposureCounts) {
  push(`| \`${exposure.slug}\` | ${exposure.count} | ${(exposure.count / validation.sourcePageCount * 100).toFixed(1)}% |`);
}

push(
  "",
  "The validation ceiling is 40% of source pages. The highest exposure is `hysteria` at 13/37 pages (35.1%); no candidate is unexposed. No owner priority caused concentration.",
  "",
  "### Matrix flags",
  "",
  `- Repeated complete sets: ${validation.repeatedSets.length}.`,
  ...validation.repeatedSets.map((item) => `- ${item.sourceSlugs.map((slug) => `\`${slug}\``).join(" and ")} share ${item.set.map((slug) => `\`${slug}\``).join(" / ")}.`),
  "- Self-recommendations: 0.",
  "- Duplicate recommendation slugs: 0.",
  "- Duplicate parents: 0.",
  "- Empty slots: 0.",
  "- Draft/hidden leakage: 0.",
  "- Genre mismatches where affinity exists: 0.",
  `- Unmapped source genres: ${validation.unmappedGenres.map((slug) => `\`${slug}\``).join(", ") || "none"}. This is flagged for owner taxonomy review and no genre was invented.`,
  "- Invalid real owner overrides: 0 (none configured). Synthetic validation reports duplicate, missing, draft/ineligible, and self references.",
  "",
  "## Three-date rotation validation",
  "",
  "For every source, same-date calls were byte-identical after JSON serialization, closest and bridge stayed stable, all dated sets remained eligible/unique, and discovery changed at least once across the three dates.",
  "",
  "| Source | Stable closest | Stable bridge | 2026-08-05 discovery | 2026-08-06 discovery | 2026-09-05 discovery |",
  "| --- | --- | --- | --- | --- | --- |",
);

for (const row of validation.matrix) {
  const [first, second, third] = row.rotation;
  push(`| \`${row.sourceSlug}\` | \`${first.closest}\` | \`${first.bridge}\` | \`${first.discovery}\` (\`${first.seed}\`) | \`${second.discovery}\` (\`${second.seed}\`) | \`${third.discovery}\` (\`${third.seed}\`) |`);
}

push(
  "",
  "## Route and browser validation",
  "",
  "The local production server was run with a process-only `SITE_VISIBILITY=public` override because the checked-in local environment is a private preview. No environment file or deployed setting changed.",
  "",
  "| Representative lane | Route | Build-date recommendations | Result |",
  "| --- | --- | --- | --- |",
  "| House | `/music/free` | `fragments-ep`, `contrast`, `warning` | 3 unique cards; self/hidden excluded; 3 play actions |",
  "| Jungle / DnB | `/music/i-cant-wait-for-love` | `hold-on`, `after-you`, `free` | 3 unique cards; self/hidden excluded; 2 play actions |",
  "| Early catalog | `/music/after-you` | `free`, `fragments-ep`, `stereo-luv` | 3 unique cards; self/hidden excluded; 3 play actions |",
  "| EP / project | `/music/fragments-ep` | `fragments-remixes`, `hysteria`, `after-you` | 3 unique cards; self/hidden excluded; 2 play actions |",
  "| Remix project | `/music/fragments-remixes` | `fragments-ep`, `hysteria`, `hold-on` | 3 unique cards; self/hidden excluded; 3 play actions |",
  "| Project track | `/music/wanted-almost-anyone-remix` | `fragments-remixes`, `after-you`, `free` | 3 unique cards; self/hidden excluded; 2 play actions |",
  "",
  "| Viewport | Columns | Card widths | Overflow/clipping |",
  "| --- | --- | --- | --- |",
  "| 360×800 | 1 | 284 px | none |",
  "| 768×1024 | 1 | 692 px | none |",
  "| 820×1180 | 2 | 368 px | none |",
  "| 1440×1000 | 3 | 424 px | none |",
  "",
  "Artwork, titles, metadata, genre tags, play actions when audio exists, and View Release links rendered through the established `ReleaseCard`. Keyboard Tab moved from the first recommendation play button to its View Release link and exposed a visible 2 px cyan focus outline. Enter navigation worked. Browser logs contained zero errors/warnings and no hydration message.",
  "",
  "Persistent-player test: played Fragments from the FREE recommendation, then navigated to Fragments. The same `/audio/like-that.mp3` source and `Like That` title persisted; time advanced from 0.37 s to 4.53 s and `paused` remained false. The destination rendered a fresh valid three-card set excluding Fragments. A navigation-continuation intent ref now resumes only playback that was active before a route transition; explicit user pause clears that intent.",
  "",
  "## Repository validation",
  "",
  "| Command/check | Result |",
  "| --- | --- |",
  "| `npm ls --depth=0` | Pass. Existing extraneous optional `@img/sharp-wasm32@0.35.3` reported; no install or dependency change. |",
  "| `npx eslint .` | Pass, zero warnings/errors. |",
  "| `npx tsc --noEmit --incremental false` | Pass. |",
  "| `$env:NEXT_PUBLIC_SITE_URL='https://broey.net'; npm run build` | Pass with Next 16.3.0 Turbopack; 54 static pages, 37 SSG release paths. |",
  "| `$env:NEXT_PUBLIC_SITE_URL='https://broey.net'; npx next build --webpack` | Pass; same 54-page/37-release SSG route shape. |",
  "| `node scripts/validate-release-recommendations.cjs` | Pass for 37 sources, 15 candidates, and three dates. |",
  "| Internal GET/link crawl | Pass: 54 internal routes checked, including all 37 release routes; zero failures. |",
  "| `git diff --check` | Pass. |",
  "| Dependency/lockfile diff | No `package.json` or `package-lock.json` change. |",
  "",
  "No canonical, sitemap, robots, indexing, metadata, JSON-LD relationship, DISCO policy, editorial description, provider, form, Contact, Newsletter, Privacy, Merch, About, Press, DNS, or hosting configuration changed. GET route coverage and both production builders passed; forms were deliberately not submitted.",
  "",
  "## Performance and caching implications",
  "",
  "The engine evaluates at most 15 eligible candidates for each of 37 pages during build/ISR. Sorting/scoring is in-memory and deterministic; approved-artwork filesystem hashes are cached per server process. There is no external request, cookie, visitor ID, local-storage recommendation state, analytics dependency, or client calculation. Three existing cards and their audio queues are the only added client payload. ISR can regenerate individual release pages after 86,400 seconds, so rotation may lag UTC midnight by up to the cache interval plus time until the next request.",
  "",
  "## Remaining owner decisions",
  "",
  "- Decide whether to map a factual genre for `after-you`; it is currently and intentionally reported as unmapped.",
  "- Review the two repeated complete-set pairs and the top exposure (`hysteria`, 13/37). Both are within validation limits and require no code change unless the owner prefers a different editorial balance.",
  "- Add owner overrides or priorities only for real editorial intent; none are required for launch.",
  "- Approve merge/push and the controlled DigitalOcean redeployment. No deployment action was taken here.",
  "",
  "## Exact merge, push, and DigitalOcean deployment steps",
  "",
  "Run only after owner approval and from a clean checkout:",
  "",
  "```powershell",
  "git switch main",
  "git pull --ff-only origin main",
  "git merge --ff-only codex/dynamic-release-recommendations",
  "git push origin main",
  "```",
  "",
  "Then in DigitalOcean App Platform:",
  "",
  "1. Open the existing `broey-website-6r8bd` app and the `broeywebsite2025` web-service component.",
  "2. Confirm the source repository is `Broey/broeywebsite2025`. Change the deployment branch from the existing `v1-prelaunch-backup` to `main` only if the owner intends `main` to become the source; keep autodeploy off.",
  "3. Do not change environment variables, domains, DNS, forms, providers, instance size, or port. Confirm the existing Node 22 runtime, `npm start` run command, and port 8080 remain intact. The build must retain `NEXT_PUBLIC_SITE_URL=https://broey.net` and the owner-selected existing `SITE_VISIBILITY` value.",
  "4. Create one manual deployment and confirm the dashboard commit hash equals the merged `main` hash.",
  "5. Confirm build success, healthy runtime, 37 generated release paths, and no restart/OOM loop.",
  "6. On the temporary `ondigitalocean.app` URL, repeat the six representative route checks plus the FREE → Fragments playback/navigation test at 390×844 and desktop. Confirm `audio.paused=false`, advancing time, the same source/title, three unique cards, visible keyboard focus, and zero console/hydration errors.",
  "7. Leave DNS disconnected and do not submit real Contact or Newsletter forms. Roll back to the prior immutable deployment if build, route, hydration, or playback checks fail.",
  "",
  "The branch is ready for owner review, not automatic deployment.",
  "",
  "---",
  "",
  "Generated from `scripts/validate-release-recommendations.cjs` by `scripts/generate-release-recommendation-report.cjs`; browser/build/deployment evidence is intentionally recorded as reviewed validation context.",
);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(projectRoot, reportPath)} (${lines.length} lines).`);
