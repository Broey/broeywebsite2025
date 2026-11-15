# Phase 3.1: Personalized discovery welcome popup

Local owner-review refinement ? November 14, 2026.

## Executive summary and before/after

Replaced the inline archive-pane invitation with a delayed, nonmodal homepage welcome popup. Broey selects / Join the list is restored to its original markup. Featured Release, the artwork returning-listener tile, collapsed Music preferences, genre filters and editorial catalog order remain intact. The accepted cross-page persistence refinement is included. No commit, push, deployment, release-data, dependency, analytics-definition or environment-file change was made.

## Existing OnlyU architecture and reuse

OnlyUPlaylistPrompt is an aside mounted by AudioPlayerProvider when playlistPromptTrack matches the current track key. PlaylistPromptSession counts positive playback deltas of at most two seconds, excluding paused/seeking/interrupted time, and triggers after 60 seconds of actual listening. The provider retains its existing sessionStorage suppression, analytics, track-reset behavior and dismissal callback. The component retains Escape, close, service links and unchanged CSS.

The welcome popup reuses playlist-prompt, playlist-prompt-close and playlist-prompt-links styles, plus existing gold homepage CTA and secondary button styling. No shared presentation component was extracted: sharing the existing styles avoids coupling campaign content and independent consent behavior. Only two lines change the audio provider: import a boolean visibility context and publish the exact existing OnlyU visibility condition around children. No campaign trigger, link, event, player or listening accumulator changed.

## Trigger, consent and dismissal

The welcome component mounts once in the root layout inside the existing providers. First appearance requires six seconds on the homepage, with browser preference/dismissal state checked first. Leaving home before appearance cancels that timer. Once it has actually appeared, memory-only activation retains the invitation across ordinary SPA navigation until enabled or dismissed. Direct visits to other routes never trigger it, and an unanswered invitation is not restored on a fresh page load/browser session. Audio is neither required nor counted. Already-enabled visitors see no invitation; expired/disabled profiles may become eligible.

Enable calls the existing MusicPreferenceStore.enable(), initializing the unchanged empty version-1 profile without backfilling prior actions. Failure keeps consent off and displays a polite storage error. The Music page remains the manual enable/disable/clear alternative.

Not now, close and Escape share dismissal behavior. broey-discovery-invitation-dismissed now uses localStorage, containing only an expiration time, capped at 30 days without renewal on reads. This survives browser closure. Expired/invalid/far-future values are removed on the next check; successful welcome enable removes the key. Checks occur on mount, focus, storage events and once per minute while mounted. Browser settings can delete it. Storage denial falls back to bounded memory-only dismissal across ordinary SPA navigation; reload can show the popup again. The previous sessionStorage UI key is no longer consulted and expires with its old tab session; it contains no consent or music data.

No identifier, cookie, server record or dismissal analytics was introduced. The music preference schema, scoring, decay, 90-day retention and 12-entry history limit are unchanged. The local Privacy notice now describes localStorage and 30-day suppression instead of tab-local 24-hour suppression.

## Coordination, placement and accessibility

OnlyU takes priority via PlaylistPromptVisibility. The welcome returns null while OnlyU is visible; a scoped CSS rule also enforces priority during mounting. When OnlyU closes, welcome can appear if its own delay elapsed and it is still eligible. The timers and dismissal keys are entirely separate.

The popup sits in the bottom-right corner, above the fixed player when active. It reuses the responsive width and viewport-bounded scroll container. No backdrop, focus trap, automatic focus grab or animation is added; reduced-motion visitors receive the same static experience. Heading/description, named close button, native keyboard actions, Privacy link, polite content and error status are provided. Closing from within the popup restores the previously focused connected page element. Ordinary site navigation and playback remain available.

## Changed-file inventory (complete local Phase 3.1 change set)

- app/page.tsx ? restored to baseline; home-only mount removed.
- app/layout.tsx ? mount one persistent invitation inside the existing providers.
- app/globals.css ? returning tile/disclosure styles, shared focus/scroll clearance, scoped popup placement/priority.
- app/music/page.tsx ? previously completed returning tile placement, unchanged by this refinement.
- components/audio/AudioPlayerProvider.tsx ? publish existing OnlyU visibility condition only.
- components/audio/PlaylistPromptVisibility.tsx (new) ? boolean presentation context.
- components/music/HomeMusicInvitation.tsx (new) ? independent delayed welcome, consent/error, close/Escape/focus.
- components/music/MusicPersonalization.tsx - returning tile plus directly accessible On/Off pill and secondary Details & reset disclosure.
- components/sections/HomepageMusicArchiveSection.tsx ? inline invitation removed; restored to baseline.
- content/privacy.ts ? revised opt-in, history-display and dismissal disclosure.
- docs/launch-readiness/DISCOVERY_BROWSER_QA.md ? extended workflow and prior launch restriction record.
- lib/music-invitation.ts (new) ? 30-day dismissal, delay constant, pure route/priority predicate.
- lib/music-preferences.ts ? existing pure returning-tile selector; store/ranking unchanged.
- scripts/validate-personalized-discovery-browser.cjs ? popup scenarios plus retained Music/player/recommendation acceptance.
- scripts/validate-personalized-discovery.cjs ? optional evidence destination, preserving historical JSON.
- tests/music-discovery-ux.test.mjs (new) ? bounded dismissal, expiry, storage failures, selection and welcome eligibility/priority.
- tests/music-personalization-ssr.test.mjs ? SSR/hydration consent baseline and prior Music regressions.
- reports/personalized-discovery-phase-3-1-ux-review.md ? this report.

The restored archive component may have no final Git diff. Existing unrelated untracked files remain untouched. OnlyUPlaylistPrompt.tsx and lib/playlist-prompt.ts remain byte-for-byte unchanged.

## Validation and screenshots

- Full unit/SSR tests: 108 passed, none failed/skipped.
- Lint and typecheck: pass.
- Standard Turbopack build: pass, including 57 generation steps. Public visibility/canonical supplied to process only.
- Recommendation validator: pass, 41 sources / 19 candidates, three dates; existing after-you genre diagnostic remains.
- Personalized discovery compiled validator: pass, 73 choices, compiled Privacy/rights/robots, 27 unique sitemap URLs.
- Phase 1 analytics browser regression: pass, 10 groups.
- Phase 2 public SEO/Rights regression: pass, six groups at all four widths.
- Prior popup browser suite: PASS: 38 groups, including native OnlyU coordination and 20 route/viewport geometry checks; zero page errors or unexpected console/hydration errors. Screenshots visually reviewed at desktop/mobile sizes.
- Final git diff --check: PASS (existing LF/CRLF notices only).

Final screenshots/evidence: C:/Users/phill/AppData/Local/Temp/broey-welcome-final/. welcome-{1440,768,390,320}.png show popup detail; welcome-context-{width}.png show viewport placement; welcome-playing-390.png shows player clearance. music-tile-*, music-manage-* and music-returning-* retain Music-page visual evidence. browser.json contains checks, layouts, errors and event payloads. Other evidence is in %TEMP%/broey-welcome-build.log, broey-welcome-compiled.json, broey-welcome-analytics-browser.json and broey-welcome-seo/.

Browser cases cover no immediate prompt, six-second trigger without audio, homepage-only eligibility, explicit empty opt-in, all three dismissals, reload and restored-context restart persistence, expired dismissal, enabled suppression, denied storage, exact promotion order, real OnlyU sustained listening/priority/handoff, ongoing playback and player clearance. Existing Phase 3 native audio/queue, scores, recommendation focus/attribution, controls/filtering and four-width route geometry checks are retained. Restored disposable contexts model restart persistence; no personal browser is restarted or inspected.

## Limitations and owner review

QA uses the existing authorized http://127.0.0.1:3248 development server, installed headless Chromium and disposable contexts. Off-origin requests are blocked; synthetic analytics are fulfilled locally. No desktop or personal browser control is used. A prior production-server launch was rejected by automatic approval review with ?blocked by policy?; it was not retried. Compilation/artifact checks are separate from dev-server browser acceptance. Screenshots may include the Next dev indicator.

This does not certify screen-reader speech, all browsers/mobile operating systems, measured contrast, real-listener recommendation usefulness or provider ingestion. Existing catalog-refresh/last-writer/storage-denied physical-deletion limits remain. Owner review of popup placement/content and the matching Privacy clarification remains; any commit/push/deployment requires separate explicit authorization.

## Cross-page persistence follow-up

Owner accepted retaining an already-shown invitation during navigation. The initial six-second homepage trigger, OnlyU priority, consent, close/Escape and 30-day suppression remain unchanged. The active state exists only in React memory; no storage schema or key was added. Enabling/dismissing resolves that active invitation, including changes through Music preferences or another tab. Tests: 108 unit/SSR tests, lint and typecheck passed. Standard Turbopack build and compiled personalization/SEO validator passed. Final headless browser acceptance passed all 38 groups, including cross-page navigation at 1440/768/390/320px and native OnlyU priority/playback, with zero page or unexpected console/hydration errors. git diff --check passed. Evidence destination: %TEMP%/broey-welcome-navigation/.

## Direct On/Off control follow-up

Replaced the Music-page Manage row with Your personalized discovery preferences and an always-visible On/Off pill on the right. It is a native button with switch semantics and aria-checked, driven by the exact existing preference store. Off is the default, explicit On initializes empty consent, and Off deletes the profile. No consent schema, ranking, analytics definition, popup behavior or retention changes were made. The same switch element retains focus through state changes.

Details & reset remains secondary below the row, containing the same-device/90-day explanation, Privacy link, and Clear music preferences while On. Clear retains consent; Off removes it. A screen-reader description is available before enabling even with details closed. The Privacy notice now names the pill and Off action. UI remains usable when storage is denied, with visible failure feedback and state Off.

Focused disposable headless tests passed at 1440/768/390/320px with details closed: default Off, keyboard Space/Enter, immediate store/UI state, reload hydration, Off deletion, retained focus and no horizontal overflow. Off/on screenshots were visually reviewed and are in %TEMP%/broey-pill-controls/{off,on}-{width}.png; results.json records the four-width pass. Full unit/SSR suite: 108 passed. Lint, typecheck, normal Turbopack build and compiled personalization/privacy/SEO validator passed. Browser regression: 33 consent/playback/recommendation/popup groups passed with zero page or unexpected console/hydration errors; then the running harness stopped on its old Privacy phrase assertion (Disable personalization), already superseded by the new Off wording. Updated the checked phrase and reran the four-width layout/canonical/disclosure groups successfully (5 groups including error checks), using a temporary filtered copy of the same harness. Separately validated the full captured analytics allowlist and required event-name gate offline successfully. This is combined evidence, not a claim that the original single full invocation exited successfully. Focused pill tests also passed at all four widths. Final build and compiled validator passed. git diff --check passed. Corrected layout evidence: %TEMP%/broey-pill-final-layouts/. New browser evidence is in %TEMP%/broey-discovery-pill/.

## Switch motion and visual polish - November 15, 2026

Addressed the oversized/static pill and segmented appearance. The track is now 68 by 28px inside a 68 by 44px keyboard/touch target. A fixed-position 18px thumb travels 40px with a 240ms easing transition; On/Off labels crossfade in fixed positions instead of changing flex order. Track and thumb colors transition smoothly. Reduced-motion preference disables these transitions. No preference-store, consent, ranking, popup, release, or analytics behavior changed.

Removed the preferences section's top/bottom rules; it now flows between the existing recent-listening card and the single genre-toolbar divider. Routine success/off/clear status stays in the polite screen-reader region without adding visible height; storage errors remain visible. Details & reset, clear, Privacy and keyboard focus remain available. Changed for this polish: components/music/MusicPersonalization.tsx, app/globals.css and this report.

Validation: 108 unit/SSR tests passed; lint, typecheck, standard Turbopack build and git diff --check passed. Focused disposable headless Chromium QA passed at 1440/768/390/320px: observed intermediate thumb positions during transition, verified reduced-motion zero transition, stable section height after toggling, native keyboard/focus, consent deletion/re-enable, history removal and clear retaining consent, no page errors or horizontal overflow. Desktop/mobile screenshots with and without real eligible OnlyU history were visually reviewed. Evidence: %TEMP%/broey-pill-polish/results.json, off-{width}.png, on-{width}.png and with-history-{width}.png. Test runner: %TEMP%/broey-pill-polish.cjs. Full previous native audio/recommendation suite was not repeated for this presentation-only change. No commit, push, deployment or personal-browser/desktop control occurred.

## Intro placement preview - November 15, 2026

Moved the existing preferences control into the Music page intro. At desktop widths of 1100px and above it sits to the right of Broey. Selects; below that breakpoint it follows the description, before Featured Release. Existing shared PageIntro and all consent/player/ranking logic are unchanged. Featured Release remains the first music feature, followed by eligible recent listening and the catalog. Removed the old lower mount. Updated the browser suite's order assertion to reflect the accepted placement.

Changed for this follow-up: app/music/page.tsx, app/globals.css, scripts/validate-personalized-discovery-browser.cjs and this report. Validation: 108 unit/SSR tests, lint and typecheck passed; focused disposable headless checks at 1440/768/390/320px passed intro-before-feature geometry, no overflow, switch motion/reduced motion, state/clear/focus and real eligible history. Desktop/mobile intro screenshots visually reviewed. Screenshots: %TEMP%/broey-intro-placement/intro-{1440,768,390,320}.png; full-page context with history: with-history-{width}.png; results.json records all widths. Build result recorded in %TEMP%/broey-intro-build.log. Local preview remains http://127.0.0.1:3248/music. No commit, push or deployment.

## Release validation - November 15, 2026

The owner authorized committing the personalization changes and deploying them to broey.net. The Privacy notice now names the final Personalize switch and Manage preferences controls. Browser geometry acceptance now checks actual inline-link fragments: the narrow desktop column wraps Privacy notice onto two lines, and the center of its combined bounding box can fall in empty space despite both fragments being unobstructed. No application layout change was required for this test correction.

Fresh validation: 108 unit/SSR tests, lint, typecheck, standard public production build, compiled personalization/Privacy/Rights/robots/sitemap validation, and git diff --check passed. The compiled validator checked 69 choices and 27 unique sitemap URLs. Browser acceptance passed all 38 groups with zero uncaught or unexpected console/hydration errors, including native OnlyU priority, four-width invitation/recent-card controls, consent/storage failures, native playback/queues, recommendations and analytics payloads.

Browser evidence is combined across two invocations of the same source. The first completed 33 functional groups, then stopped because the historical development canonical expectation was broey.com while the running server correctly emitted broey.net. With only the test expectation corrected, the four-width layout/canonical/disclosure groups and final aggregate analytics/error gate passed using the already-captured functional evidence. This is not a claim that the original single invocation exited successfully. Functional screenshots and raw results: %TEMP%/broey-phase3-browser-1DhJM2/. Completed results: %TEMP%/broey-phase3-browser-vguWhF/browser.json. Compiled results: %TEMP%/broey-personalization-deploy-compiled.json. Unrelated historical screenshots, local agent/browser configuration and release-import artifacts are excluded from the release commit.
