# Broey.net — Discovery analytics, phase 1

Review date: November 14, 2026 (America/New_York). Baseline: `reports/personalization-discovery-architecture-audit.md`; starting source revision `a4a1e7cc1e2513fa27d379d0adf3d5450216f3ff`.

**Local implementation only. No commit, push, deployment, public legal-policy change, crawler change, dependency installation, or analytics-provider configuration change.** Existing unrelated working files were preserved. No personal browser/profile/session, desktop automation, keyboard/mouse simulation, or foreground application control was used.

## A. Executive summary

Added factual recommendation attribution around the existing three-card Keep listening section. Visible suggestions, release opens, intentional card playback actions, and the existing audio events now share source/destination/slot metadata. A short-lived in-memory handoff also attributes playback started or resumed after normal same-tab recommendation navigation. Automatic advancement and manual queue transport clear recommendation provenance and identify their own triggers.

The recommendation engine, owner overrides, daily rotation, release eligibility, editorial focus, queue construction, DSP links, public metadata, and layout remain unchanged. The implementation neither reads analytics to select music nor builds visitor preferences. `releaseAudioQueueForContext` remains the active queue constructor, and the root `AudioPlayerProvider` remains the only global player. No metadata was written onto reusable queue tracks, preventing later traversal back to a track from reviving its former recommendation origin.

The production build, lint, typecheck, unit tests, recommendation regression validator, and isolated local browser tests pass. Local event capture verifies calls and properties; **production Umami receipt and property reports are unverified**.

## B. Files changed

| File | Purpose |
| --- | --- |
| `app/music/[slug]/page.tsx` | Pass the existing recommendation object's slot and override status, source release, destination, and one-based displayed position into each card. |
| `components/ui/ReleaseCard.tsx` | Forward optional context to existing links/buttons; add an invisible observer marker inside the existing article. |
| `components/analytics/RecommendationImpression.tsx` | Client-only visibility attachment and per-mounted-card/context deduplication. |
| `components/analytics/TrackedLinks.tsx` | Extend historical `release_open`; remember context only for uncancelled Next Link same-tab SPA navigation. |
| `components/audio/ReleasePlayButton.tsx` | Record recommendation play/pause/resume/replay intent; pass origin to player commands. |
| `components/audio/useAudioPlayer.ts` | Optional typed playback context and navigation-handoff interface. |
| `components/audio/AudioPlayerProvider.tsx` | Bind attribution to active playback, propagate it to existing audio events, clear it on queue advancement, and consume navigation context. |
| `components/audio/GlobalAudioPlayer.tsx` | Wrap click callback so a React mouse event is never mistaken for optional recommendation context. |
| `lib/recommendation-analytics.ts` | Shared schemas, transient attribution state, and visibility observer helper; no recommendation selection. |
| `lib/analytics.ts` | Additive event types and handling for optional tracker promise rejection. Existing sanitization and campaign behavior remain. |
| `lib/audio-analytics.ts` | Explicit reset for a changed playback-origin segment on the same audio source. |
| `tests/recommendation-analytics.test.mjs` | Fifteen focused event, attribution, failure-tolerance, and visibility tests. |
| `scripts/validate-discovery-analytics.cjs` | Repeatable headless local integration scenarios; uses an already installed Playwright module. |
| `reports/discovery-analytics-phase-1-implementation.md` | This implementation review and unpublished policy proposals. |
| `reports/discovery-analytics-phase-1-browser.json` | Captured synthetic local events, isolation settings, and browser assertions. |
| `reports/discovery-analytics-phase-1-desktop.png` | Local 1440px browser capture of recommendation cards/player. |
| `reports/discovery-analytics-phase-1-mobile.png` | Local 390px browser capture of recommendation card/player. |

Relevant installed Next 16.3 guides were read before implementation: Server and Client Components, Link, and usePathname. The custom-server guide was also checked while assessing separate local validation startup. The managed AGENTS block was retained and its generator inspected. No Next configuration or dependency manifest was edited.

## C. Analytics event contract

### Shared fields

`RecommendationContext` contains only authored/public catalog facts:

| Property | Type / meaning |
| --- | --- |
| `source_release_slug` | Public release slug whose Keep listening section generated the suggestion. |
| `recommended_release_slug` | Public suggested destination slug. |
| `recommendation_slot` | `closest`, `bridge`, or `discovery`, directly from the engine. |
| `recommendation_position` | Integer `1`, `2`, or `3`, in rendered order. |
| `curated_override` | Boolean from the engine's `manualOverride`; false is retained in telemetry. |
| `source_surface` | `recommendations` for attributed recommendation events/audio. |

No score breakdown, rotation seed, audio URL, generated identifier, timestamp, email, or profile is included in these new properties. Slugs are selected by the application, not taken from query strings or free text. Internal track keys contain queue/source information for matching only and are not transmitted.

### Exact event names and payloads

| Event | Payload | Trigger / deduplication |
| --- | --- | --- |
| `recommendation_impression` (new) | Shared context + `source_surface: "recommendations"` + `interaction_type: "impression"`. | At least 50% of the article's area intersects the viewport for one continuous second while `document.visibilityState === "visible"`. Once per mounted card/context. |
| `release_open` (existing) | Existing `release_slug` and `source_surface`, plus shared context and `interaction_type: "open"` for recommendation links only. | Existing link click semantics retained. Counts activation intent, including modified clicks; not proof the destination loaded. No second click event is introduced. |
| `recommendation_interaction` (new) | Shared context + `source_surface: "recommendations"` + `interaction_type` equal to `play`, `pause`, `resume`, or `replay`. | One event per recommendation-card button activation. Describes intent; a blocked play attempt can still produce this event. |
| `audio_play` (existing) | Existing optional `release_slug`, `track_slug`, `track_title`, `project_slug`, `genre`; new `playback_trigger`; recommendation context and `source_surface` only when applicable. | Existing `playing` handler, or successful `play()` resolution while the audio remains active. The latter covers same-source origin changes where no new `playing` event occurs. Deduplicated by the existing audio session. |
| `audio_25_percent`, `audio_50_percent`, `audio_75_percent` (existing) | Same audio payload as `audio_play`. | Existing position-based milestones, each once per active measurement segment. A seek can cross all three. |
| `audio_complete` (existing) | Same audio payload as `audio_play`. | Existing `ended` handler, once per started segment, emitted before advancing the queue. Seeking near the end can cause this event. |

`playback_trigger` is `recommendation` for a matching explicit recommendation selection or consumed navigation handoff; `direct` for other queue/track starts; `automatic` for an `ended` transition; and `queue_selection` for global next/previous transport. The latter two carry **no** recommendation context or recommendation surface. Ordinary resumes preserve the origin of the active track.

Example of an attributed audio event (optional track metadata depends on the release):

```json
{
  "release_slug": "fragments",
  "track_title": "Like That",
  "source_release_slug": "free",
  "recommended_release_slug": "fragments",
  "recommendation_slot": "bridge",
  "recommendation_position": 2,
  "curated_override": true,
  "source_surface": "recommendations",
  "playback_trigger": "recommendation"
}
```

This is a schema example, not a claim about the current FREE override set. The browser JSON contains actual synthetic local selections. The historical OnlyU campaign enrichment remains conditional on existing `release_slug === onlyUCampaign.slug`: it may add `page_path`, `campaign`, and existing stored UTM fields just as before. The new impression and card-intent events do not add a separate campaign-storage path. No legacy event name or factual payload field was removed.

### Visibility and attribution boundaries

- Server rendering and hydration alone are not impressions. Three small observers run only for the three recommendation cards, with one timer per qualifying card; there is no polling. Dropping below 50%, hiding the document, or unmounting cancels an incomplete interval. Repeated intersection callbacks and routine React rerenders do not restart a continuing qualifying interval or recount a fired impression. Strict Mode effect cleanup preserves the component ref's counted contexts.
- This uses viewport geometry, not occlusion detection or proof of attention. A fixed overlay can cover an intersecting card. Browsers without IntersectionObserver produce no impression fallback. A fresh page visit/remount may count a new exposure. Timers may be delayed by browser scheduling.
- Next Link `onNavigate` stages one context only after uncancelled normal same-tab SPA navigation. The next matching release playback start/resume can consume it within five minutes. Leaving the destination, an unrelated selection, queue advancement, expiration, refresh, a new tab, or provider remount prevents reuse. Modified/new-tab clicks still record the historical open intent, but receive no navigation-to-play handoff.
- Explicit card playback context wins over a pending navigation. The actual track's existing `release_slug` must match the recommended destination. A recommendation to a project attributes its selected first track; following project/collection tracks are not attributed to that click. Origin survives ordinary pause/resume and route changes while the same track continues playing.
- Switching origin on the same source begins a fresh audio measurement segment without seeking, rebuilding queues, or changing sound. Normal resume under the same origin does not duplicate play/milestone events. Each started segment is bounded to one play, three position milestones, and one ended event. A user can deliberately create more segments through new selections/replays.
- Missing/blocked/throwing/rejected Umami is best effort and nonblocking. There is no retry queue or persistent telemetry backlog. A failed impression delivery is still locally deduplicated; late tracker loading can undercount exposures. New fields support aggregate attribution across events; they do not create a visitor-level join key or prove an individual causal funnel.

Position milestones are **not verified listening duration**; `audio_complete` means media ended, not that the entire recording was heard. Streaming clicks remain outbound intent, not confirmed external streams or playlist additions. Historical reporting needs to account for newly visible origins and explicitly changed same-source segments. Umami supports custom event properties and aggregate property breakdowns in its [event-data documentation](https://docs.umami.is/docs/event-data); this does not establish live provider receipt.

## D. Validation results

| Check | Result |
| --- | --- |
| `npm test` | 73 tests pass, including 15 new focused tests. Existing Node type-stripping/module-type and mock-timer experimental warnings remain informational. |
| `npm run lint` | Pass, no errors or warnings in the final run. |
| `npm run typecheck` | Pass. |
| `npm run build` with process-only `SITE_VISIBILITY=public` | Pass; production compilation, TypeScript, and all 56 static-page generation steps succeed. No environment file changed. |
| `node scripts/validate-release-recommendations.cjs` | Pass for 41 source pages / 19 eligible candidates over three dates. Exactly three, unique/self/parent checks, deterministic Closest/Bridge, rotating Discovery, owner override validation, and hidden/draft boundaries pass. Maximum exposure 13/41; no repeated complete sets. Existing `after-you` unmapped-genre diagnostic remains; no catalog edits made. |
| Headless browser integration | Pass at 1440×1000 and 390×844; eight grouped scenarios, no uncaught page errors. Captured events are synthetic local events. |
| Diff/storage review | No new dependency, cookie, localStorage/sessionStorage key, identify call, visitor identifier, behavioral history, crawler edit, or public-policy edit. Existing volume, campaign attribution, and playlist-prompt suppression storage remain. |

Browser evidence covers offscreen suppression; three foreground impressions with correct slots/positions; direct card play/pause/resume; deduplication during player updates; attributed seek-based milestones; preserved playback through same-tab navigation; destination main-player attribution; actual media completion followed by automatic advance; manual next transport; unrelated catalog playback without stale origin; and mobile interaction with absent/rejecting Umami.

The first unit run had a test-fixture teardown failure: its global mock document was restored before observer cleanup. Cleanup ordering was corrected in the test; application behavior was not altered to make it pass. A later source review corrected attribution for tracks without analytics metadata and added coverage. No final test failure remains.

Isolation: Playwright Core 1.61.0 and Chromium were already cached. Every run used `chromium.launch({ headless: true })`, a fresh temporary profile and new contexts, no CDP connection, and no persistent context. All external browser requests were blocked, and desktop events were intercepted by a local `window.umami.track` spy. Initial checks used the existing localhost development server without stopping it. Final checks used the built production application on a dedicated loopback server on port 3217, launched hidden and stopped afterward. No personal browser or credentials were accessed. Attempts to start a second development server were refused by Next's project lock; that server was left untouched.

To repeat browser checks, start a local server, then set `DISCOVERY_TEST_ORIGIN` to its loopback origin and `DISCOVERY_PLAYWRIGHT_MODULE` to an existing Playwright module directory before running `node scripts/validate-discovery-analytics.cjs`. The script refuses a non-loopback target and installs nothing. Defaults are `http://127.0.0.1:3000` and a resolvable `playwright` module.

Unverified: live Umami ingestion, dashboard property availability/filtering, provider retention/aggregation behavior, all-browser timing differences, and real visitors' blocking rates. No aggregate reporting connector or process-environment reporting credential was available. Environment-file secrets and individual visitor records were not inspected. Browser spies and historical reports are not production provider verification. No off-site listening was measured.

## E. Privacy assessment

New information **is** transmitted when these events are delivered: suggestion exposure, source/destination/slot/position/override facts, card action, and playback trigger. The destination provider stores these as event metadata under its existing service behavior. This is more precise engagement measurement, not a claim that data collection is unchanged.

No personal fields, new persistent identifiers, profiles, cookies, or cross-session history are introduced. A single navigation context and active playback origin live only in the mounted provider's memory. The five-minute expiration timestamp is local bookkeeping and is not sent. Existing campaign metadata/storage is unchanged. HTTP services still handle ordinary network request information; this source review does not establish what the provider internally derives or retains.

Reviewed `content/privacy.ts` and `app/privacy/page.tsx`: the August 6, 2026 notice already describes Umami aggregate engagement, music playback, release/genre activity, existing campaigns, blocking tolerance, and the absence of application persistent listener identity. Assessment: the new nonidentifying release/interaction metadata fits those categories; no new collection category, processor, or persistent profiling feature was identified that requires a disclosure rewrite for this incremental scope. This is a technical assessment, not a jurisdiction-wide compliance determination.

Optional clarification for owner approval only, to place in the analytics paragraph if desired:

> We may measure which release suggestions were visible and whether they led to release opens or on-site playback, using release and interaction details rather than stored listener profiles.

The published privacy content, effective date, and route were not edited.

## F. Artist rights policy proposal — unpublished

No separate verbatim Artist Rights draft was present in the supplied conversation/attachment. The wording below follows the supplied required positions and the site's direct, restrained voice. It avoids inventing ownership: `content/releases.ts` includes collaborators and a third-party phonographic copyright credit, so a blanket assertion of sole ownership would be unsupported.

### Proposed Artist Rights & AI Usage wording

> Broey welcomes ordinary search engine indexing, AI-assisted factual discovery of the artist and releases, references to publicly available release metadata, and links to authorized listening destinations. Listening through the website and authorized streaming services is welcome, subject to the terms that apply to those services.
>
> Copyright and related rights in the music, sound recordings, compositions, artwork, and other protected material remain with their respective rights holders, which may include Broey, collaborators, labels, publishers, and others.
>
> This website does not grant permission to use protected music or sound recordings for AI training, to fine-tune generative audio models, to collect recordings into machine-learning datasets, or to reproduce or extract protected recordings for model development without authorization from the applicable rights holders.
>
> Public availability, including access through this website or a streaming platform, does not by itself constitute a license for those uses. Any permission must come from the rights holders authorized to grant it.
>
> Broey and other applicable rights holders reserve their rights and their ability to pursue remedies available under applicable law. This statement does not override applicable copyright exceptions or limitations, existing licenses, or terms governing material on external platforms.
>
> For rights and licensing inquiries, contact broey@broey.net. An inquiry does not itself grant permission.

The reservation is qualified by applicable law and licenses; it does not claim that every AI use is necessarily unlawful or that a notice alone determines infringement. The distinction between exclusive rights and statutory limits is reflected in [17 U.S.C. §§106–107, U.S. Copyright Office](https://www.copyright.gov/title17/92chap1.html#106). Owner approval is required before publication.

### Placement recommendation

| Option | Assessment |
| --- | --- |
| Dedicated Artist Rights & AI Usage page/section | Clear, but a narrowly named new top-level page leaves future ordinary licensing information without a natural home. |
| **Rights & Licensing page with an Artist Rights & AI Usage section** | Recommended: one concise page and one footer link adjacent to Privacy. Discoverable, distinct from visitor privacy, and suitable for future authorized licensing details. Proposed path `/rights`, subject to approval. |
| Existing privacy/legal-information page | The only current public legal notice is `/privacy`. Adding artist permissions there would mix purposes or require broader renaming and metadata edits. |

No public route, footer link, sitemap entry, canonical, or legal rendering component was added. Approve the wording and placement together before a later implementation.

## G. AI crawler and indexing assessment — no configuration changes

### Current source behavior

`app/robots.ts` delegates to `lib/crawl-indexing.ts`: public sites allow `User-agent: *` at `/` and advertise the sitemap; private sites disallow all. There are no bot-specific training groups. `app/sitemap.ts` returns no private sitemap, otherwise uses publication-eligible releases and static pages. `content/seo.ts` and `lib/site-origin.ts` produce canonical URLs; private pages get noindex/nofollow, and intentionally nonindexable utility/project-track pages retain their own rules. Structured data and release eligibility were not changed. This is source behavior, not a fresh live robots/CDN configuration verification.

### Keep the controls distinct

Search indexing finds public pages for a search index. AI search/retrieval fetches or cites facts in response to questions. Training changes model parameters. Crawl rules govern cooperating agents' access; they neither secure audio files nor establish a copyright license. [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html#section-1) explicitly distinguishes robots rules from access authorization. A copyright reservation expresses rights-holder intent subject to law and licenses; it is not universal technical enforcement or retroactive deletion from datasets.

### Supported options, checked November 14, 2026

| Control | Scope and discovery consequence |
| --- | --- |
| `GPTBot` vs `OAI-SearchBot` | OpenAI documents independent controls: GPTBot concerns possible foundation-model training, OAI-SearchBot concerns ChatGPT search visibility. Targeting GPTBot while retaining OAI-SearchBot access separates those uses. User-triggered `ChatGPT-User` fetches are different; robots rules may not apply. [Official crawler documentation](https://developers.openai.com/api/docs/bots). |
| `ClaudeBot` vs `Claude-SearchBot` / `Claude-User` | Anthropic distinguishes training collection, search indexing, and user-directed retrieval. Restrict ClaudeBot while retaining the latter two for discovery. This applies to cooperating future collection, not proof of removing past material. [Official bot documentation](https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler). |
| `Google-Extended` | Product-control token, not a distinct HTTP crawler. It governs specified Gemini training **and grounding**; Google says it does not control Google Search inclusion/ranking. A broad restriction could reduce Gemini factual retrieval, so it is not a training-only switch. [Official crawler reference](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers#google-extended). |
| Googlebot and search snippet/noindex controls | Google Search's AI features use Search controls. Blocking Googlebot or adding broad noindex/nosnippet restrictions would compromise the requested public discovery. Do not use them for this proposal. [Official AI Search guidance](https://developers.google.com/search/docs/appearance/ai-features#control-content). |
| Shared `__usage_ai-training` preference | An October 30, 2026 individual Internet-Draft defines a cross-provider usage preference, separate from crawl traffic restrictions. It is not an adopted universal standard. Google announces support planned for 2027 and says fallback interpretation can be equivalent to disallowing Google-Extended, introducing the same grounding tradeoff. Evaluate provider support and precedence again before proposing adoption. [IETF draft/status](https://datatracker.ietf.org/doc/draft-kelley-aipref-training-preference-signal/), [Google announcement](https://developers.google.com/search/blog/2026/10/ai-training-control). |

### Narrow recommendation for later approval

Retain current public wildcard allow, sitemap, Googlebot access, public release indexing, and canonical metadata. Subject to approval, add only training-specific GPTBot and ClaudeBot groups with `Disallow: /`, while keeping search/retrieval bots allowed by the existing public policy. These controls would also exclude text/artwork from those training crawls; they do not obstruct their separately documented search bots. If the owner wants only recordings restricted, evaluate path-specific `/audio/` and `/api/release-audio/` groups instead, including every separately hosted media origin. Off-site DSP copies are governed elsewhere.

Defer broad Google-Extended and shared-token restrictions until the owner explicitly chooses the Gemini grounding tradeoff and current provider support is rechecked. Do not assume a `noai` meta tag, `llms.txt`, robots group, or the proposed legal notice provides universal training protection. Nothing in this phase edits robots, headers, sitemap, public metadata, CDN settings, or provider configuration.

## H. Deployment readiness and approvals

The local analytics change is reviewable and passes the checks above. Existing event names and fields remain compatible; new dimensions and same-source origin segments require care when comparing historical audio totals. No database migration, dependency installation, account setup, or provider-setting change is required by this implementation.

Remaining actions/decisions:

1. Review and explicitly authorize any commit, push, or deployment; none was performed.
2. After an authorized deployment, verify aggregate Umami event receipt and property breakdowns for the new names and existing audio/release events. Use aggregate Events/Properties views only, include a known timestamp range and applicable domain filters, confirm booleans/positions, and do not retrieve individual visitor/session histories. A separate authorized private preview can supply this evidence before wider release if available.
3. Approve or revise Artist Rights & AI Usage wording and the proposed Rights & Licensing placement. Publication remains separate work.
4. Decide whether to adopt the optional privacy clarification. No public privacy text changed.
5. Separately approve any crawler groups and their full-site/media-only scope. Google grounding and evolving shared-token behavior require an explicit decision before such controls.

No current local test failure blocks owner review. Production provider receipt and production environment behavior remain unverified; successful local production-mode testing does not establish deployed behavior.

## I. Future personalization readiness

The same typed release/slot/surface facts and explicit-play distinction could inform a later opt-in, same-browser preference feature, for example by using intentional selections rather than auto-queue transitions as a weak interest signal. Position milestones alone should not be treated as time heard. Aggregate analytics can first show whether discovery cards are visible and useful.

That feature would need its own consent choice, bounded local preference schema, retention/reset controls, treatment of collaborations/genres, and disclosure review. Do not reconstruct individual behavior from Umami or add server-side profiles. No preferences are derived, persisted, or consumed by this phase, and no recommendation selection depends on telemetry.
