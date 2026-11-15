# Isolated discovery browser QA

Use an already-running, authorized loopback server serving the current checkout.
The scripts do not start/stop servers or install dependencies or browsers.
They never attach to an existing browser, use a personal profile, send OS input,
or require foreground interaction. Chromium launches with `headless: true` and
each scenario uses a disposable context with service workers disabled and
off-origin requests blocked. Only created contexts/browser processes are closed.

```powershell
$env:DISCOVERY_TEST_ORIGIN = 'http://127.0.0.1:3000'
node scripts/validate-personalized-discovery-browser.cjs
```

The default expected canonical origin is `https://broey.net`. If an existing
development server is explicitly configured with a different origin, set
`DISCOVERY_EXPECTED_SITE_ORIGIN` to that observed development origin. This only
sets the validator's expectation; it does not reconfigure the server. In this
session port 3000 emitted `https://broey.com`, so QA used that expectation.
The separate production build/artifact gate must still assert `https://broey.net`.

`scripts/discovery-browser.cjs` first honors `DISCOVERY_PLAYWRIGHT_MODULE`, then
tries installed `playwright`, then existing Windows npm-cache `playwright-core`
modules whose matching Chromium executable exists. It prefers the newest
matching installed version and never runs npm/npx or downloads anything.
An explicitly configured module fails visibly if unavailable. On other systems,
set `DISCOVERY_PLAYWRIGHT_MODULE` to an existing module directory as needed.

The Phase 3 command prints each pass/failure and writes `browser.json` plus two
screenshots to a fresh OS temporary directory, printed at completion. Set
`DISCOVERY_BROWSER_OUTPUT` to select an evidence directory. Do not stage the
temporary evidence or profiles. The suite covers desktop/mobile native audio,
storage/consent/recovery, actual catalog-derived near-ties, analytics request
capture, keyboard/focus/status, and 1440/768/390/320px page geometry.
Its synthetic `window.umami` transport is fulfilled locally, so these events
never reach production analytics. This validates application payloads, not Umami
provider receipt. Audio is real native playback except explicitly labeled
rejection/unavailable-media cases. End-of-track seeking tests queue callbacks;
it is not proof of elapsed listening.

Run existing analytics regression coverage with the same module resolver:

```powershell
$env:DISCOVERY_REPORT_PREFIX = Join-Path $env:TEMP 'broey-phase3-analytics'
node scripts/validate-discovery-analytics.cjs
$env:PHASE2_TEST_ORIGIN = $env:DISCOVERY_TEST_ORIGIN
$env:PHASE2_REPORT_DIR = Join-Path $env:TEMP 'broey-phase3-phase2-regression'
node scripts/validate-phase2-readiness.cjs
```

The Phase 2 script retains its existing report/screenshot destinations by default;
set `PHASE2_REPORT_DIR` as above to preserve historical artifacts.
`PHASE3_BUILD_DIR` remains the separate compiled-artifact gate:

```powershell
$env:PHASE3_BUILD_DIR = 'C:\path\to\isolated-build\.next'
node scripts/validate-personalized-discovery.cjs
```

Browser acceptance and compiled-artifact validation are both required for release.
A compiled-artifact pass alone never counts as browser acceptance.

## Phase 3.1 UX coverage

The same browser command also tests the delayed homepage welcome popup, browser-local
30-day dismissal, shared affirmative consent, expiration, keyboard focus,
uninterrupted playback, one eligible artwork-based returning-listener tile,
featured-family exclusion, and compact native preferences disclosure. New UX
scenarios run at 1440/768/390/320px; the complete Phase 3 playback/recommendation
regressions still run at 1440/390px. Evidence includes `welcome-*.png`,
`welcome-context-*.png`, `music-tile-*.png`, `music-returning-*.png`, and
`music-manage-*.png`. These use synthetic profiles and the unchanged real catalog.

Set `PHASE3_VALIDATION_OUTPUT` to a temporary JSON file when running the compiled
validator for later phases, to preserve the original Phase 3 evidence. The
normal production `npm run build` works in this checkout with public visibility
and the production canonical origin supplied to that process; do not change
environment files for QA. A dedicated loopback development server was authorized
and successfully launched for the November 14 Phase 3.1 task. The historical
server rejection below describes a prior session; any new rejection still must
be respected.

The Phase 3.1 `next start --hostname 127.0.0.1 --port 3249` production-server
launch was separately rejected by automatic approval review with only
`blocked by policy`. It was not retried. Runtime QA used the already-running
authorized development server on port 3248; successful production compilation
and compiled SEO/privacy/sitemap checks are separate evidence, not a claim of
production-server browser testing.

The owner confirmed the baseline's existing public-but-unreleased suggestions
must remain unchanged. Personalization may add only eligible released choices;
the browser suite checks its Closest additions and exact Bridge/Discovery parity.

## Server permission failure

On November 14, 2026 the shell tool rejected a dedicated loopback `next start`
on port 3247 with `blocked by policy`. No alternate launch was attempted. The
existing development server on `127.0.0.1:3000` served the current Phase 3 checkout
and was reused read-only; it was neither started nor stopped by QA. Session
instructions declared unrestricted execution, while persisted Codex configuration
showed workspace-write/on-request and automatic review. This discrepancy and the
opaque rejection do not establish a Chromium, Next.js, or extension defect.

The exposed Playwright MCP was also configured with `headless: false`; its blank
automation tab was closed without application navigation. This workflow instead
uses the already installed matching headless Chromium. No Codex approval setting,
extension, browser profile or application configuration was changed. A rejected
server launch must not be retried with wrappers or alternate executables. If no
authorized existing server is available, record a blocked release and stop.

Official permission guidance: https://learn.chatgpt.com/docs/permissions
Installed Next.js guidance: `node_modules/next/dist/docs/01-app/02-guides/testing/playwright.md`
and `01-app/03-api-reference/06-cli/next.md`.

## Welcome popup refinement

Home invitation is now a six-second nonmodal popup with 30-day localStorage
suppression. The same Phase 3 browser command tests delay, route eligibility,
all dismissals, restored-context restart persistence and real OnlyU listening
priority/handoff, retaining the Music and recommendation regressions. Evidence
includes welcome-*.png and welcome-context-*.png at four widths.

An already-visible welcome now persists across SPA navigation through a root-layout
mount. Initial appearance remains homepage-only; unanswered activation is memory-only
and does not survive a fresh load. The suite checks direct Music entry and
Home ? Music ? Privacy ? Rights ? Home continuity at all four widths.
