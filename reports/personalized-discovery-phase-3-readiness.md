# Broey.net — Phase 3 final QA and release readiness

> November 14, 2026 follow-up: the historical browser gaps below are now resolved.
> The dedicated server launch still received an opaque execution-policy rejection;
> no alternate launch was attempted. Authorized reuse of the existing loopback
> development server plus installed Playwright 1.61/headless Chromium restored QA.
> All 29 Phase 3 browser acceptance groups pass, including native audio, consent,
> storage failures, focus, attribution, and 1440/768/390/320px layouts. All 100 unit
> tests, lint, typecheck, standard Turbopack build, recommendation/artifact validators,
> Phase 1 browser regressions and public Phase 2 browser/crawler checks pass.
> One observed focus-loss defect was corrected by keying recommendation cards by
> source and slot rather than selected release. The owner explicitly confirmed
> existing public-but-unreleased baseline suggestions remain unchanged; only new
> personalization alternatives must exclude unreleased entries.
>
> See `personalized-discovery-phase-3-browser.json`,
> `../docs/launch-readiness/DISCOVERY_BROWSER_QA.md`, and the post-push
> `personalized-discovery-phase-3-production-deployment.md` for current evidence.
> The existing server emits development canonicals on broey.com; browser validators
> explicitly use that observed origin. The fresh production build/artifact validator
> independently asserts broey.net. No server or hosting configuration was changed.
>
> The release scope is the original 21 files in section 7 plus six workflow/evidence
> files: `scripts/discovery-browser.cjs`,
> `scripts/validate-personalized-discovery-browser.cjs`,
> `scripts/validate-discovery-analytics.cjs`, `scripts/validate-phase2-readiness.cjs`,
> `docs/launch-readiness/DISCOVERY_BROWSER_QA.md`, and
> `reports/personalized-discovery-phase-3-browser.json` (27 files total).
> Commit/push authorization is now conditional on the completed gates under the
> current user request. DigitalOcean access and aggregate Umami access remain
> unavailable; neither deployment nor provider receipt is claimed by this update.

The remainder records the earlier readiness task and its historical limitations.

Review date: November 14, 2026 (America/New_York).
Baseline: `reports/personalized-discovery-phase-3-implementation.md` and the existing uncommitted Phase 3 working tree. HEAD remains `242e814504c253e01f40645a4f961cdb0ae004cc`.

**Assessment: conditional production deployment is reasonable after separate explicit authorization and acceptance of the outstanding browser/aggregate-reporting limitations.** All independently executable checks passed. Standard Turbopack production compilation is now freshly verified. No application defect was identified and no implementation correction was needed. This is not a complete browser or production certification, and this report does not authorize publication.

No commit, push, deployment, staging, dependency installation, browser installation, environment-file edit, desktop automation, personal-browser access, or analytics-record retrieval occurred.

## 1. Final test results

These results were obtained during this readiness task, rather than copied from the implementation report:

| Check | Fresh result and limits |
| --- | --- |
| `npm test` | **99 passed, 0 failed, 0 skipped.** Includes all existing Phase 1 attribution/observer/failure tests, Phase 2 rights/crawler/private-gate/SEO tests, preference tests, and four actual component/route SSR tests. |
| `npm run lint` | **Pass**, exit 0, no errors or warnings. |
| `npm run typecheck` | **Pass**, exit 0. |
| `node scripts/validate-release-recommendations.cjs` | **Pass**: 41 source pages, 19 eligible candidates, three date keys, maximum exposure 13/41, zero repeated complete sets. Existing `after-you` unmapped-genre diagnostic remains. |
| Standard `npm run build` | **Pass with Next 16.3.0 Turbopack**, TypeScript and all 57 generation steps completed. See section 4. |
| Existing `scripts/validate-personalized-discovery.cjs` against the fresh Turbopack build | **Pass**: original disabled fallback, deterministic meaningful near-tie adjustments, compiled Privacy disclosure/canonical/indexability, Rights canonical/statement, exact public robots policy, and actual compiled sitemap GET returning the expected 27 unique URLs. |
| Existing SEO and sitemap regressions | **Pass within the full unit suite and compiled-output validator**: canonical constraints, static/release metadata, structured data, hidden/draft/internal/noindex exclusions, unique sitemap entries, reliable modification dates and timed availability. Served HTTP/browser SEO audit scripts were not run. |
| Additional privacy/analytics helper check | **Pass** with synthetic storage and transport spies: no pre-consent key; genre/play interests after opt-in; clear retains consent; disable deletes profile; personalized context survives navigation-to-play attribution; event properties contain only the allowed aggregate fields. No direct request call, cookie write or URL change from the exercised helpers. Not a browser network capture. |
| Preservation / build parity | SHA-256 comparison: **all 526 pre-existing versioned/unignored files unchanged**; all 130 such files under `app`, `components`, `content`, `lib`, `data`, plus seven root configuration/manifest files, match the freshly built copy. |
| `git diff --check` | **Pass**. Existing LF/CRLF conversion notices are informational. |

The standard build used ordinary copied dependencies/assets rather than the previous unsupported junction arrangement. No assertions were weakened and no application/configuration changes were made to obtain passing results. Existing Node type-stripping, module-type and mock-timer informational warnings remain.

Fresh evidence is retained outside the repository at:

`C:\Users\phill\AppData\Local\Temp\broey-phase3-readiness-HNLt5b`

Relevant files there are `unit-tests.log`, `turbopack-build.log`, `privacy-analytics-check.json`, `baseline-hashes.json`, `preservation-parity.json`, and `build/reports/personalized-discovery-phase-3-validation.json`. The last file was generated by running the existing validator in the copied checkout, preserving the original repository's Phase 3 validation JSON byte-for-byte.

## 2. Real-browser scenarios completed

**None during this task. No browser was launched.**

Read-only inspection found an existing development listener at `127.0.0.1:3000`, process 6180. It is not an established dedicated Phase 3 QA environment and was not used, stopped, reconfigured, or attached to. No existing browser/profile inventory was accessed.

The preceding implementation task's dedicated `next start --hostname 127.0.0.1 --port 3247` launch was rejected by automatic approval review with only `blocked by policy`. The user's current instructions explicitly forbid repeated alternate launches or bypasses. This readiness task therefore made **no new server launch attempt**, used no alternate server wrapper, and did not replace Playwright with desktop/personal-browser automation.

The existing validator includes a fixed `browserValidation` description referring to that earlier rejection. Its fresh passing noninteractive output is not evidence that a new rejection or a new browser test occurred in this task.

Historical Phase 1/2 headless browser evidence supports earlier attribution/layout behavior only. It does not validate the new Phase 3 browser behavior.

## 3. Browser scenarios remaining unverified

Both desktop and mobile versions of every requested runtime scenario remain unverified:

| Scenario | Fresh noninteractive evidence available; remaining browser gap |
| --- | --- |
| First visit disabled; no preference writes before opt-in | Actual SSR shows the unpressed enable button and no history; store tests assert no writes. Actual mounted first-visit behavior was not exercised. |
| Enable creates the expected profile; genres influence interests | Store/schema tests and synthetic helper execution pass. Actual button/filter activation was not exercised. |
| Intentional playback contributes; automatic continuation does not | Store, attribution and audio-session regressions pass; native/promise callback wiring reviewed. Actual media playback, completion and automatic advance were not exercised. |
| Reload preserves consent; returning to Music shows Recently Played | Multiple store instances over the same synthetic storage and recent eligibility/family tests pass. Browser reload/navigation/history display was not exercised. |
| Clear removes interests/history and retains consent; disable removes the profile | Store assertions pass, including failure handling and unrelated volume preservation. Actual UI synchronization and storage events were not exercised. |
| Blocked localStorage does not crash the site | Getter/read/write/quota/removal failure tests pass; player volume guards inspected. A browser enforcing blocked storage was not exercised. |
| Recommendations stay within approved near-ties; overrides and Bridge/Discovery remain intact | Real catalog matrices, factual-score/family/variety assertions, SSR fallback and original validator pass. Hydrated card replacement and focus continuity were not exercised. |
| Personalized selection preserves analytics attribution | Actual attribution helpers and event spies preserve the factual personalized marker through navigation to playback. Browser emission and network delivery were not exercised. |
| No hydration/console errors, horizontal overflow or broken keyboard behavior | Native controls, labels, status region, existing focus styles and responsive classes inspected; SSR tests pass. Browser hydration, console capture, geometry, keyboard activation and screen-reader behavior were not exercised. |

These are explicit acceptance gaps, not simulated browser passes. A permitted future test must use headless Chromium, a fresh temporary profile/context, a dedicated localhost environment and no existing-session attachment. No dependency/browser installation is required or authorized by this report.

## 4. Standard production build verification

**The prior Turbopack limitation is resolved for this readiness assessment.**

Created a separate copied checkout at:

`C:\Users\phill\AppData\Local\Temp\broey-phase3-readiness-HNLt5b\build`

Copied current application/source/configuration and existing `node_modules`, `public`, and `assets` as real directories. The source dependency tree contained approximately 419 MiB / 22,241 files; public/assets approximately 380 MiB. No dependency resolution, package installation, downloads or external-root junctions were used. Inspection found no dependency reparse points in the copied tree. The original development `.next` directory was not built over or copied.

Consulted installed Next 16.3 Server and Client Components, Turbopack and Turbopack-root documentation. The existing `turbopack.root: __dirname` is valid for this physical copy. `next.config.js`, package manifests/lockfile and the other compared root configuration files match the original source. No setting was changed to accommodate the workspace.

Ran the unmodified standard build script:

```powershell
$env:NEXT_PUBLIC_SITE_URL = 'https://broey.net'
$env:SITE_VISIBILITY = 'public'
npm run build
```

Result: `Next.js 16.3.0 (Turbopack)`, successful compilation, successful TypeScript, all 57 generation steps, exit 0. Music/home/release routes remain request-rendered; Privacy/Rights/robots remain prerendered and sitemap remains dynamic. Public canonical/visibility values were process-only. No environment file or credential was copied into the build workspace.

The previous webpack success remains historical corroboration; a fresh webpack rerun was unnecessary after the standard bundler passed. A production hosting-provider build/environment was not inspected or deployed.

## 5. Concrete defects discovered and corrected

**No application regression was discovered. No implementation files were edited.**

Resolved a validation-environment limitation by physically copying existing dependencies/assets under the build root. This was not an application fix. Recommendation scores, near-tie limits, consent behavior, retention, editorial overrides, genre/music metadata, release focus/home priorities and Artist Rights remain unchanged from the Phase 3 baseline.

Known baseline limitations were not expanded into feature work: the root preference catalog can require reload after a publication change in a long-lived tab; localStorage has last-writer semantics for simultaneous tabs; denied deletion cannot guarantee physical erasure until storage becomes usable or the visitor removes it in browser settings. These are documented limitations, not newly observed browser defects.

## 6. Privacy and analytics validation

The intended Privacy notice accurately describes the inspected first-party implementation: explicit opt-in, same-browser localStorage, broad genre choices and successful intentional local playback, coarse dates, score decay, 90-day expiry, maximum 12 stored/six displayed recent releases, clear/disable controls, no account/synchronization, and separation from aggregate Umami analytics. It excludes impressions, seeking/position milestones, automatic continuation and DSP clicks from preference scoring. The obsolete no-interest-profile statement is removed. The authored effective/modification date remains the correct same-day November 14, 2026 / `2026-11-14`.

Rechecked active call sites and module imports:

- The stored profile is read/written only by `MusicPreferenceStore` through the injected browser localStorage interface. Score/history/profile consumers perform local selection/display, not server submission.
- The root server supplies public catalog metadata; it does not receive saved browser interests/history. Initial SSR uses a constant disabled snapshot.
- The only new toggle event is `personalization_change` with `enabled` and `source_surface`. Existing recommendation/open/audio events may carry the factual `personalized: true` marker and ordinary public release/slot metadata. No score vector, history list, coarse stored date, stable identifier or serialized profile is forwarded.
- No new profile-related fetch/XHR/beacon/socket, API endpoint, query parameter, cookie, account, database, server storage or synchronization path was found. Existing release navigation and media requests still occur; they do not carry the saved profile/history list.
- Actual helper execution with synthetic storage produced the expected four aggregate events: enable, recommendation interaction, attributed audio play, disable. The exercised preference helpers made zero direct request calls, cookie writes or URL changes. Payload fields were checked against an explicit allowlist. This is bounded helper/source evidence, not a real-browser egress capture or provider certification.

**Umami production event receipt remains unavailable and unverified.** Available tools exposed no aggregate Umami reporting connector, and no Umami/analytics reporting credential name was present in the checked process environment. Environment-file secrets, browser login sessions and individual visitor histories were not inspected. No new integration was introduced. Phase 1 event-contract/attribution tests freshly pass, but those tests and local spies do not establish Umami ingestion or dashboard property reporting.

Phase 2 Rights source, Rights route, crawler helper, robots route, sitemap route and footer were not changed. The compiled public robots policy still allows ordinary public crawling and restricts only GPTBot/ClaudeBot. The actual compiled sitemap handler returns exactly the source-defined 27 unique public URLs. Private-policy and real proxy gate regressions pass in the unit suite; a fresh private production build/runtime flow was not run. Existing private compiled/browser evidence remains historical.

## 7. Exact changed-file inventory

### This final-QA task

Only new repository file:

1. `reports/personalized-discovery-phase-3-readiness.md` — this report.

All 526 pre-existing versioned/unignored files were hashed before validation and compared afterward: no content changes or deletions. This includes the Phase 3 implementation/report/evidence and unrelated local files. The staging area remains empty; no commit was created. Build/test caches and the copied workspace/logs are outside that tracked/unignored source inventory; no source cleanup was performed.

### Complete proposed Phase 3 release scope already present locally

For a future explicitly authorized scoped release, the 20 pre-existing Phase 3 files plus this report are:

| Existing tracked file changed by the implementation | New Phase 3 file |
| --- | --- |
| `app/layout.tsx` | `components/music/MusicPersonalization.tsx` |
| `app/music/page.tsx` | `components/music/MusicPreferencesProvider.tsx` |
| `app/music/[slug]/page.tsx` | `content/music-personalization.ts` |
| `components/analytics/RecommendationImpression.tsx` | `lib/music-preferences.ts` |
| `components/audio/AudioPlayerProvider.tsx` | `tests/music-preferences.test.mjs` |
| `components/music/MusicCatalogFilter.tsx` | `tests/music-personalization-ssr.test.mjs` |
| `content/page-metadata.ts` | `scripts/validate-personalized-discovery.cjs` |
| `content/privacy.ts` | `reports/personalized-discovery-phase-3-implementation.md` |
| `content/release-recommendations.ts` | `reports/personalized-discovery-phase-3-validation.json` |
| `lib/analytics.ts` | `reports/personalized-discovery-phase-3-readiness.md` |
| `lib/recommendation-analytics.ts` | — |

This table is an explicit review inventory, not a staging instruction executed by this task. Existing unrelated `.codex`, `.playwright-mcp`, `CLAUDE.md`, release source JSON, older reports and image artifacts remain excluded from the suggested release scope.

## 8. Production readiness assessment

**Conditional release is technically reasonable; unconditional browser/production sign-off is not supported by the evidence.**

The application compiles with its standard production bundler; all available regressions pass; source and built-copy parity is verified; no defect required correction; revised disclosure matches the feature; and the remaining major verification limits are environmental/access-related. Optional personalization defaults off, normal discovery has an exact fallback, and promotion/editorial controls remain intact.

The release owner should explicitly accept that native browser playback/queue callbacks, hydration, actual return visits, responsive layout and keyboard behavior have not been freshly tested for Phase 3. Aggregate provider delivery is also unverified. Source-level confidence and historical Phase 1/2 browser evidence reduce uncertainty but do not eliminate those risks.

No claim is made that the working tree has been committed, uploaded, deployed, observed in production or approved by the owner.

## 9. Deployment blockers versus limitations

| Item | Classification / disposition |
| --- | --- |
| No authorization to commit/push/deploy | **Hard operational blocker.** No release action is allowed by the current request. |
| Application regression or failing available check | **None identified.** A newly observed failure would block release until investigated. |
| Standard Turbopack build | **Resolved:** freshly passes in a supported copied workspace without settings/dependency changes. |
| Isolated browser/server restriction | **Outstanding environmental acceptance gap.** Conditional release requires the owner's explicit acceptance of the listed runtime risks, or completion of the isolated scenarios when permitted. It was not waived silently. |
| Aggregate Umami reporting unavailable | **Outstanding access/readiness limitation.** Can be accepted for a conditional release; must not be represented as receipt verification. Check aggregate reporting when authorized access exists. |
| Private served-browser verification / production-provider environment | **Unverified in this task.** Fresh unit private-policy/gate tests pass; public compiled artifacts pass. No broader runtime/provider certification is implied. |
| Baseline localStorage concurrency/catalog-refresh/deletion limits | **Documented implementation tradeoffs.** No new regression discovered; normal discovery remains available. |

The environmental limits are acceptable only for a conditional release decision acknowledging them. They are not proof that the omitted scenarios pass.

## 10. Recommended scoped commit/deployment procedure

This is a recommendation for a later authorized task. None of these release actions was executed.

1. Obtain explicit authorization for the proposed source/report scope and any commit, push and production deployment. Record whether the owner accepts the browser/Umami limitations or requires those checks first.
2. If an authorized dedicated test environment becomes available, complete section 3 on desktop/mobile with headless temporary Chromium contexts. Stop after an execution rejection; use no personal browser or alternate launch bypass. Retain separate Phase 3 evidence and review any actual defect before changing implementation.
3. Confirm the working-tree inventory still matches this report. Stage only the 21 listed Phase 3 files using literal paths; review the complete staged diff and `git diff --cached --check`. Exclude unrelated untracked files, secrets, dependency/build directories, temporary evidence and older artifacts. Do not use broad staging.
4. Run the standard production build and the same regressions on the exact intended revision in the release environment. Include the feature and revised Privacy content in the same release. Any source changes after this validation require appropriate fresh checks.
5. After separately authorized commit/push, use the established manual hosting deployment workflow. Do not change release metadata, editorial priorities, DSP weighting, crawler rules, environment configuration or automatic-deployment settings as part of this scope.
6. Record the deployed revision/provider deployment result. Verify public Music/Privacy/release responses, server baseline and enabled/disabled states, canonicals/sitemap/robots, current promotion, media delivery and playback in an allowed isolated environment. Check Phase 1 events and Phase 3 marker/toggle receipt using aggregate-only Umami reporting when available. Retain any continued access gap explicitly.
7. If a material consent, privacy, playback or discovery regression is observed, pause wider validation and use the authorized deployment rollback procedure for the coupled feature/disclosure release. Do not deploy a disclosure claiming behavior that the deployed code does not implement.

The earlier automatic approval rejection applied to starting the dedicated localhost server and gave only `blocked by policy` as its reason. No server-launch retry, policy bypass, desktop control or personal-browser substitution occurred in this readiness task.
