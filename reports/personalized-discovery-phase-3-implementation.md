# Broey.net — Lightweight personalized discovery, Phase 3

> Follow-up November 14, 2026: fresh isolated browser acceptance now passes all
> 29 groups, and the standard Turbopack build plus 100 unit tests pass. The browser
> run found and fixed focus loss during a Closest-card change using stable
> source/slot keys. See the readiness addendum, browser evidence JSON, browser QA
> guide and production deployment report. The original results below are historical.

Review date: November 14, 2026 (America/New_York). Baseline HEAD: `242e814504c253e01f40645a4f961cdb0ae004cc`.

## 1. Executive summary

Implemented optional, same-browser music interests and Recently Played. Personalization is disabled until an affirmative Music-page action. Explicit genre selections and successful intentional local playback can update a small localStorage profile. An intentionally narrow adjustment can select a different, nearly equal Closest recommendation; Bridge, daily Discovery, owner overrides, and promotional focus retain their existing behavior.

**Verified locally:** 99 tests pass (76 existing, 23 new); lint and typecheck pass; a separate webpack production build completes all 57 generation steps; the existing recommendation validator passes; actual server-rendered Music/release component tests and compiled Privacy/robots/sitemap checks pass. A current catalog example changes BLU's Closest recommendation from `stereo-luv` to `dancing-dumpster-fire` with strong Garage interest. The fixed recommendation slots remain untouched.

**Not verified:** fresh browser interactions, mobile/desktop layout, hydration in a real browser, actual playback callbacks, and production Umami receipt. Automatic approval review rejected the dedicated localhost server launch with `blocked by policy`; testing stopped along that path. No alternate launch, browser attachment, desktop control, or OS input was attempted. See sections 12 and 16.

Local implementation only. No commit, push, deployment, dependency/browser installation, analytics integration, provider-setting change, environment-file edit, or individual visitor-record access occurred.

## 2. Architecture and data flow

Reviewed the architecture audit, Phase 1 implementation, Phase 2 readiness, and Phase 2 production deployment reports. Confirmed active interfaces in the requested recommendation, catalog, genre, player, card, analytics, and route files. Consulted installed Next 16.3 Server and Client Components and distDir guides. Existing discovery is server-selected, with client playback/filter islands; artwork validation depends on Node filesystem/crypto and stays on the server.

Flow:

1. The root server layout derives a narrow preference catalog from published, indexable, already available releases with approved artwork. It excludes explicitly unreleased entries and future release dates, even when a public catalog page is otherwise playable.
2. A separate `MusicPreferencesProvider` owns a testable local store and exposes a stable store reference. The player uses that reference, without subscribing its timeupdate state to preference ranking.
3. The store loads only after mount. `useSyncExternalStore` supplies a constant disabled server snapshot; server rendering and initial hydration use the original recommendation cards.
4. The existing Music genre handler submits a conservative signal. The global player marks explicit queue/transport/resume choices in memory and consumes the marker only after `playing` or successful `play()` resolution while active. One marker is consumed once, avoiding duplicate native-event/promise updates.
5. The release route calls the unchanged `recommendReleases` algorithm, then derives a small set of permitted Closest alternatives from its existing candidate scores. Server-rendered cards are passed as slots; the client selects one with the small pure preference selector. The full engine, artwork checks, and release registry are not imported into the client.
6. Music renders up to six recent, eligible release links using the existing tracked-link/compact CTA pattern. No playlist or separate playback engine is introduced.

No API route receives a profile. No profile data enters a URL, cookie, account, database, server synchronization path, or analytics payload.

## 3. Exact files changed

Existing files modified:

| File | Change |
| --- | --- |
| `app/layout.tsx` | Mount separate preference provider around the existing player, supplying narrow public catalog metadata. |
| `app/music/page.tsx` | Add optional controls and compact Recently Played navigation below the unchanged focus feature. |
| `app/music/[slug]/page.tsx` | Keep original server recommendation set; render server-prepared Closest alternatives through a small client selector. |
| `components/music/MusicCatalogFilter.tsx` | Submit only changed, explicit genre filter choices to the local store. |
| `components/audio/AudioPlayerProvider.tsx` | Mark/consume intentional playback; exclude automatic advance; tolerate blocked volume reads/writes. Volume key/default/clamping behavior remain the same. |
| `components/analytics/RecommendationImpression.tsx` | Preserve an optional factual `personalized` boolean in impression context; no preference signal from impressions. |
| `content/release-recommendations.ts` | Add a server-side near-tie plan helper around existing scores. Existing recommendation algorithm and weights remain unchanged. |
| `content/privacy.ts` | Replace the obsolete no-profile statement and disclose opt-in local music preferences, retention, and controls. |
| `content/page-metadata.ts` | Include optional browser-local music preferences in Privacy's description. |
| `lib/analytics.ts` | Type one aggregate preference-toggle event. |
| `lib/recommendation-analytics.ts` | Add optional `personalized` context field, inherited by existing attribution helpers. |

New files:

| File | Purpose |
| --- | --- |
| `lib/music-preferences.ts` | Versioned model, validation, bounded storage, decay, signal updates, recent filtering, pure preference selector. |
| `content/music-personalization.ts` | Server-side public eligibility/genre/family projection. |
| `components/music/MusicPreferencesProvider.tsx` | Store lifecycle, subscriptions and stable SSR snapshot. |
| `components/music/MusicPersonalization.tsx` | Modest controls, recent navigation, memoized recommendation selection. |
| `tests/music-preferences.test.mjs` | Nineteen model, storage, eligibility, recommendation and analytics tests. |
| `tests/music-personalization-ssr.test.mjs` | Four actual component/route server-rendering tests. |
| `scripts/validate-personalized-discovery.cjs` | Noninteractive catalog and compiled-output verification; launches nothing. |
| `reports/personalized-discovery-phase-3-validation.json` | Synthetic catalog examples and passing compiled artifact checks. |
| `reports/personalized-discovery-phase-3-implementation.md` | This report. |

Existing release data, genres, focus resolver, carousel, published dates/credits/artwork/DSP links, Rights policy, crawler policy, dependency manifests, Next configuration, and AGENTS instructions were not edited. Existing untracked reports/assets were left in place; historical browser evidence was not overwritten. No files were staged.

## 4. Preference model and storage schema

Only key: `broey-music-preferences`. Schema version: `1`.

Illustrative shape (days are integer UTC days since the Unix epoch):

```json
{
  "version": 1,
  "enabled": true,
  "updatedDay": 20771,
  "interests": {
    "house": { "score": 3, "day": 20771 }
  },
  "recent": [ { "slug": "free", "day": 20771 } ]
}
```

Seven normalized IDs map to the existing broad taxonomy: `house`, `drum-and-bass`, `jungle`, `dubstep`, `garage`, `breakbeat`, `electronic`. Each score is capped at 12. Recent history stores at most 12 release slugs, ordered in an array, with day precision for expiration. Dates do not contain playback positions or precise listening times. The parser accepts at most 8,192 characters and whitelists fields; actual writes are much smaller and contain only normalized IDs and approved slugs.

No email, IP, identity, fingerprint, full event history, device/visitor identifier, playback URL, Umami record, or cross-device key is stored. Project family keys are supplied by catalog metadata; they are not fabricated relationships.

## 5. Consent and retention

- No key or interest/history write on passive initialization or interactions before enablement. The normal pre-existing audio-volume/campaign behavior is separate.
- Enable explicitly writes an empty consented profile. No pre-consent activity is replayed or backfilled.
- Disable removes this key, resets local state, clears cooldown memory and stops collection. Each signal refreshes consent before acting; storage events refresh other open tabs in normal operation.
- Clear resets scores/history while preserving enabled status. Neither operation touches volume, cookies, provider analytics, or unrelated storage.
- Inactivity expires the entire profile, including consent, after 90 days; the next use requires opt-in again. Each genre/recent entry also expires at 90 days since its own update. Passive visits do not renew retention.
- Pruning happens on initialization, qualifying interactions, focus, visibility changes, storage notifications, and an hourly maintenance check. Expired data is removed when the site can next read/write storage; a closed browser cannot run pruning code.
- Corrupted, oversized, unsupported-version, invalid-consent, and future-dated profiles reset closed. There is deliberately no inferred consent migration from an older schema.
- Unavailable/denied/quota-limited storage falls back to normal discovery without throwing. If disable/clear cannot delete a previously saved key, collection stops in memory, the UI explains browser-level deletion, and the current store retries removal before any later read can revive the stale profile. A completely new page load while deletion remains impossible cannot guarantee physical erasure; this is disclosed rather than hidden.

The existing `broey-audio-volume` key, 0.7 default, clamping and saved value are preserved. Three try/catch guards were necessary because a browser denying all localStorage would otherwise throw in the pre-existing player volume code. Volume still works in memory when storage is denied.

## 6. Preference scoring rules

| Interaction | Weight and treatment |
| --- | --- |
| Explicit changed broad genre filter | +3 to that broad genre; ignore All/unknown values; at most one increment per genre per 30 minutes in the current store. |
| Successful intentional on-site play | +2 total, divided across the release's existing broad genres. Direct choices, recommendations and manual queue transport qualify. |
| Same-family repeated play | No additional genre score during the same UTC day while that family remains in bounded recent history, including reload/return visits. Move the chosen release to the front of history. Later days can contribute again. |
| Automatic queue continuation, autoplay | No interest or recent-history update. A subsequent explicit manual resume becomes a queue-selection action. |
| Seeking, position milestones, ended/completion | No preference update. Reaching a media position is not evidence of elapsed listening. |
| Impressions, route rendering, page/recommendation navigation, DSP clicks | No preference update. Existing analytics remain independent. |

Scores decay continuously by coarse day, with a 30-day half-life, are bounded to 0–12, and expire at 90 days without corresponding activity. Genre updates materialize the decayed value before adding new evidence. No sustained-listening bonus was added: the stronger existing accumulator is campaign-specific, and a new general listening-time subsystem is unnecessary here. Repeated plays across visits contribute conservatively without storing visit IDs or timelines.

Deduplication intentionally uses the bounded recent window and in-memory choice/cooldown markers, not an unbounded historical event log. Evicting a family from the 12-entry window removes its same-day duplicate guard; score caps still apply.

## 7. Recommendation integration

The original Closest, Bridge and Discovery scoring/selection function is unchanged. The optional helper uses its existing output:

1. Keep the original Closest as the first, stable fallback.
2. If Closest is an owner override, offer no alternative. Existing curated Bridge/Discovery slots also remain exact.
3. Otherwise consider only existing eligible candidates within three factual points of the original Closest. Recheck artwork/public eligibility, exclude explicitly unreleased/future-dated alternatives, and exclude families occupied by either fixed slot.
4. Require at least as many distinct primary genre labels across the three cards as the baseline set. Personalization cannot introduce a genre collapse or a new project-family duplicate.
5. Use at most +3 preference points, proportional to the strongest matching broad genre score. Apply a modest 0.5 recent-repeat penalty to Closest choices only. The existing daily Discovery rotation continues unchanged.
6. If affinity differs by less than two interest points, retain the baseline. A replacement must improve the adjusted score by more than 0.5; ties retain stable server order.

Ranking uses the server recommendation date converted to an integer UTC day. Given the same eligible server plan, recommendation date and profile, selection is deterministic. Disabled, missing, expired, blocked-storage, weak or indistinguishable preferences preserve the exact baseline. Availability/publication remains evaluated by the existing engine at request time; historical date keys do not reconstruct historical publication eligibility.

The client memo depends on plan/profile/date, not audio timeupdate, playback progress, analytics receipt or random values. Closest remains a factual near-match; fixed Bridge still provides contrast/adjacency and fixed Discovery still rotates. Personalized behavior can deliberately be absent on many pages, especially fully curated pages; this preserves editorial precedence rather than forcing a visible change.

Synthetic current-catalog examples are recorded in the validation JSON. Those examples demonstrate selection behavior, not listener satisfaction or measured recommendation quality.

## 8. Recently Played

Stored order reflects intentional successful playback choices. Display up to six compact release links, only when nonempty and consented. Filter through the current eligible public catalog and collapse parent/child families using the real `parentReleaseSlug` relationship. Never substitute invented track/project relationships. An explicitly unreleased, draft, hidden/internal, nonindexable, future-dated, missing, or unapproved-artwork release cannot enter this preference catalog or recent display.

The list does not represent all automatic queue playback. It is not a playlist, an off-site listening history, or proof a track was fully heard. No exact timestamp is shown or persisted. Disable removes the section; clear removes history immediately. Catalog eligibility refreshes with server-provided page data; a full reload obtains a new root store/catalog after a publication change.

## 9. Visitor-facing controls

Below the unchanged Music focus feature: “Personalize music discovery,” the requested explanatory sentence, same-browser/90-day explanation and Privacy link. The initial button is “Enable personalization,” with `aria-pressed=false`. Enabled visitors see “Disable personalization” and “Clear music preferences.” A polite status region confirms the resulting local action or explains unavailable storage. Status is tied to the current profile snapshot, preventing stale success text after another tab changes the profile.

Native buttons provide keyboard activation; the consent button references its explanation with `aria-describedby`. No prechecked consent, blocking modal, account step, new design system or DSP preference was added. Recently Played uses existing compact link styling and existing release-open attribution.

## 10. Privacy disclosure

Removed the now-inaccurate statement that the site does not create stored listener-interest profiles/cross-session histories. Added a distinct optional personalization section covering interaction categories, localStorage fields, 90-day expiry, coarse dates, limits, disable/clear controls, storage failure/deletion limits, absence of server-side accounts/synchronization, and separation from Umami. Qualified the pre-existing general retention paragraph so its indefinite-provider-retention language does not contradict the local 90-day policy.

Authored effective date and Privacy metadata `lastModified` remain **November 14, 2026 / `2026-11-14`**, which already matched this day's prior Phase 2 change. They were deliberately retained as the correct same-day modification date, rather than advanced to an invented date. Privacy's metadata description now includes the feature. Compiled HTML verifies the new disclosure/date/canonical and removal of the obsolete sentence.

This is an implementation/disclosure consistency review, not a jurisdiction-wide legal or vendor privacy certification. Rights & Licensing and AI crawler restrictions were not changed. The disclosure must ship with the feature, not independently.

## 11. Analytics changes and readiness

Added one bounded event: `personalization_change`, containing only `{ enabled: boolean, source_surface: "music_catalog" }`, emitted after a successful explicit enable/disable action. No separate clear, per-score, per-progress or history telemetry is introduced. It describes a confirmed application/storage change, not listening.

Existing recommendation events and attributed audio/release events can carry `personalized: true` only when the rendered Closest differs from the baseline. Shared attribution already forwards it through a matching destination navigation and playback; no new playback event name is needed. Baseline/curated cards retain their historical payload shape. Impression visibility/deduplication remains unchanged and never builds preferences.

Intent/engagement distinctions remain: `release_open` and `recommendation_interaction` are activation intent; impressions are geometry-based visibility proxies; position/completion events are media-position proxies; `audio_play` describes a successful application playback start, not complete listening. No inference of external streams or playlist additions is made. A manual resume of an automatically continued track now correctly changes its trigger to `queue_selection`, with no stale recommendation origin.

**Production aggregate receipt/property reports remain unverified.** Tool discovery exposed no Umami aggregate reporting connector, and no Umami/reporting credential name was present in the checked process environment. Environment-file credential values and personal-browser sessions were not inspected. No individual visitor/session records or new integration were accessed. Unit spies verify outgoing context and failure tolerance; they do not establish production ingestion. This remains an outstanding deployment-readiness item.

## 12. Test results and isolation

| Check | Result / scope |
| --- | --- |
| `npm test` | **99 passed, 0 failed, 0 skipped**, including all 76 existing regressions and 23 new tests. Existing Node type-stripping/module-type/mock-timer informational warnings remain. |
| `npm run lint` | Pass, no errors or warnings after removing an unused test import. |
| `npm run typecheck` | Pass. |
| Standard `npm run build` in isolated copy | Turbopack refused a dependency junction outside its root. Toolchain/workspace limitation, not an application compile error. |
| `node node_modules/next/dist/bin/next build --webpack` in isolated copy | **Pass**, TypeScript and all 57 generation steps. No dependency/config/environment-file changes. An npm forwarding attempt did not pass the webpack flag through, so the successful command invoked the installed Next CLI directly. |
| `node scripts/validate-release-recommendations.cjs` | Pass: 41 source pages, 19 eligible candidates, three date keys, maximum exposure 13/41, zero repeated complete sets. Existing `after-you` genre diagnostic remains. |
| `PHASE3_BUILD_DIR=… node scripts/validate-personalized-discovery.cjs` | Pass: actual catalog fallback/determinism/meaningful adjustments; compiled Privacy/rights/robots; actual compiled sitemap GET with 27 unique expected URLs. Synthetic results saved separately. |
| `git diff --check` | Pass; Git's existing LF/CRLF conversion notices are informational. |
| Source/build parity | SHA-256 comparison of all 132 files in `app`, `components`, `content`, `lib`, `data`: zero differences between final source and built isolated copy. |
| Desktop/mobile headless browser tests | **Not run.** Dedicated loopback server launch rejected by automatic approval review: `blocked by policy`, no further rationale. No retries/substitutions after rejection. |

Focused coverage of the requested cases:

| Requested behavior | Evidence |
| --- | --- |
| 1–5: disabled default, no pre-opt-in persistence, explicit enable, disable deletion, clear reset | Store tests plus actual SSR control markup; unrelated volume preservation asserted. Browser clicks remain untested. |
| 6–9: expiry, corruption, schema behavior, bounded scores | Parser/store tests, physical key/entry pruning and deterministic decay assertions. |
| 10–12: intentional play, auto queue, seek milestones | Store and existing attribution/audio-session tests; native/promise hook wiring inspected. Actual browser media callbacks untested. |
| 13: eligible recent history | Real eligibility projection tests plus stale/family/unknown-history filtering. |
| 14–16: exact fallback, overrides, three purposes | Full actual source catalog across three date keys, family/genre/factual-score assertions, meaningful actual changes, unchanged engine validator. |
| 17: server content and SEO | Four actual component/route render tests; no localStorage access during SSR; baseline-only cards; structured data retained; compiled metadata/robots/sitemap. Real hydration untested. |
| 18: analytics | All prior attribution/observer/failure tests plus personalized navigation-to-play context; no profile/history payload. Production receipt unverified. |
| 19: same-browser return | New store instances over the same synthetic storage preserve preferences; reload dedup and cross-tab removal behavior asserted. Real browser return visits untested. |
| 20: unavailable/blocked storage | Storage getter/read/write/quota/removal failures tested; failed disable cannot revive stale consent in that store; player volume guards inspected. Real blocked-storage browser execution untested. |

Build workspace retained at `C:\Users\phill\AppData\Local\Temp\broey-phase3-86ffe70beec148e38f007a935587e397`. It contains copied source and junctions to existing dependencies/public/assets; no environment file was copied. Public visibility and canonical origin were supplied only to the process. An existing localhost development server was observed and was not used, stopped, attached to, or reconfigured by this task. No dedicated test server successfully started and no new browser was launched. Historical Phase 1/2 browser screenshots/results are not claimed as Phase 3 verification.

## 13. Performance and SEO assessment

Verified structural limits: seven score entries, 12 stored recent releases, six displayed links, bounded input parse, small near-tie plans (73 choices total across 41 source pages in the current validation), and memoized client ranking separate from playback state. No extra network/service dependency or progress telemetry. Pruning uses lifecycle events and one hourly timer, not audio ticks. Alternative server-rendered card slots add bounded RSC payload; the engine and generated registry remain server-only. Bundle/latency/Core Web Vitals deltas were not benchmarked.

Actual SSR tests retain Music focus/catalog, release structured data, ordinary canonical release links and all baseline suggestions. Initial snapshots never depend on browser storage. No canonical, route, sitemap eligibility, structured metadata implementation, homepage carousel or promotional focus logic changed. The compiled sitemap still has 27 unique URLs. Stable hydration is supported by the external-store server snapshot design and SSR tests; actual browser hydration is explicitly unverified.

## 14. Accessibility assessment

Verified markup/source: native buttons and links, descriptive labels, pressed consent state, connected explanation, status live region, section heading references, wrapping button row and existing responsive grids. Reused `music-filter-button` includes the existing `:focus-visible` outline. No modal/focus trap, autoplay addition or forced navigation.

Keyboard execution, screen-reader announcement quality, contrast measurements, touch targets, viewport overflow and focus continuity after recommendation changes were not exercised in a browser. They remain acceptance checks before production approval.

## 15. Remaining risks and unresolved questions

- Fresh isolated desktop/mobile runtime QA is outstanding because of the explicit execution rejection. Do not substitute a personal browser or bypass that restriction.
- Standard Turbopack build should be rechecked in an authorized isolated environment with a supported dependency layout. Webpack production compilation is verified; no bundler configuration was changed.
- Actual recommendation usefulness/exposure impact is unmeasured. The change is intentionally conservative; some visitors/pages see no adjustment, especially curated pages.
- A start indicates intentional successful playback, not duration listened. No sustained-listening or weak exploration score is inferred. Unreleased-but-playable existing catalog entries intentionally remain outside personalized history.
- Generic localStorage has no multi-tab transaction protocol: normal storage notifications and per-action consent reads are implemented, but simultaneous writes can use last-writer semantics. No cross-device/concurrent consistency service was introduced.
- The provider retains its initial root catalog until remount/reload; publication changes during a long-lived tab may require reload before a newly eligible release contributes to interests. Recent display is additionally filtered by the Music page's current server catalog. No hidden release is newly promoted by this feature.
- Browser settings can prevent physical deletion. Current-session disablement is maintained, retry is pending, and browser-level removal is explained; universal erasure cannot be guaranteed while browser storage operations are denied.
- Umami provider receipt, property reporting, vendor retention/recognition and real blocking rates remain unverified. No claim about individual listeners follows from the synthetic tests.

## 16. Deployment readiness and required approval

Ready for local code review with the explicit runtime/toolchain limitations above; not a claim of complete production certification. No commit, push or deploy is authorized by this phase, and none occurred. Working changes remain unstaged.

Before a production release:

1. Obtain explicit authorization for any commit/push/deployment. Include feature and revised Privacy disclosure together.
2. Complete dedicated headless temporary-profile desktop/mobile tests when permitted: affirmative keyboard opt-in, disabled/default visits, reload return visits, clear/disable/blocked storage, actual successful/failed playback, seeks and automatic/manual queue transitions, recommendation attribution/focus, layout and console/hydration checks. Use only a dedicated localhost server; no personal-browser/desktop control.
3. Confirm the normal production bundler build in a supported isolated checkout. Preserve existing public/private SEO and promotion regressions.
4. When authorized aggregate reporting becomes available, verify Phase 1 event receipt/properties and the small Phase 3 additions without opening visitor/session records. Record any continued lack of access as an outstanding readiness item rather than implying ingestion was verified.
5. After a separately authorized deployment, verify public Music/Privacy/release responses, sitemap/canonicals, promotion, playback and aggregate analytics against that deployed revision.

Automatic approval review's rejected action was `next start --hostname 127.0.0.1 --port 3247` in the dedicated copied build workspace. Its stated reason was only `blocked by policy`. No execution-policy bypass, alternative launch or permission change was attempted.
