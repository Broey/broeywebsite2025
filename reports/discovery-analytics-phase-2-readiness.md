# Broey.net — Discovery analytics phase 2 readiness

Review date: November 14, 2026 (America/New_York). Starting and ending HEAD: `a4a1e7cc1e2513fa27d379d0adf3d5450216f3ff`.

## 1. Executive summary

Implemented `/rights`, its adjacent-to-Privacy footer link, canonical/social metadata, and sitemap registration. Added one analytics-disclosure paragraph to Privacy and revised its effective date. Public robots now restricts only GPTBot and ClaudeBot while retaining ordinary search/retrieval access and the sitemap declaration. Private-preview policy remains restrictive.

The existing Phase 1 analytics application code is unchanged. Its event contract, transient attribution, playback, queues, recommendations, release catalog, and streaming destinations remain intact. Expanded integration checks found no concrete analytics runtime defect requiring correction.

Final results: **76 unit tests pass; lint, typecheck, the public production build, recommendation validator, discovery integration validator, public SEO/browser checks, and private build/artifact checks pass.** Private-mode runtime browser checks were not completed because automatic approval review blocked launching that test server. Noninteractive checks cover private built metadata/robots/sitemap and actual proxy behavior instead.

**Ready for owner review and a separately authorized public deployment, with the verification limitations in section 9.** No commit, push, deployment, analytics-record access, provider configuration change, dependency installation, or environment-file edit occurred.

## 2. Baseline and exact file changes

Authoritative baselines reviewed:

- `reports/personalization-discovery-architecture-audit.md`
- `reports/discovery-analytics-phase-1-implementation.md`, including its event contract and section F wording.

Before implementation, all 73 baseline unit tests passed, including playback/attribution regressions. The recommendation validator passed for 41 source pages and 19 eligible candidates. The active privacy route, footer, static metadata registry, canonical helper, robots/sitemap helpers, root metadata, and preview proxy were inspected. Installed Next 16.3 page, metadata, robots, sitemap, distDir, and custom-server documentation was consulted. The managed AGENTS block remains intact.

### Phase 2 additions

| File | Purpose |
| --- | --- |
| `app/rights/page.tsx` | Server-rendered Rights & Licensing page using PageIntro and existing policy-page classes; public contact from `siteConfig.contact.email`. |
| `content/rights.ts` | Approved, qualified Artist Rights & AI Usage text. |
| `scripts/validate-phase2-readiness.cjs` | Loopback-only public/private browser and SEO checks; separate noninteractive private-build artifact mode. |
| `reports/discovery-analytics-phase-2-readiness.md` | This report. |
| `reports/discovery-analytics-phase-2-browser.json` | Synthetic desktop, history-navigation, and mobile analytics evidence. |
| `reports/discovery-analytics-phase-2-desktop.png` | Desktop recommendation/player capture. |
| `reports/discovery-analytics-phase-2-mobile.png` | Mobile recommendation/player capture. |
| `reports/discovery-analytics-phase-2-public-readiness.json` | Public HTTP, crawler, sitemap, metadata, responsive, and footer assertions. |
| `reports/discovery-analytics-phase-2-private-artifacts.json` | Private compiled HTML/robots and bundled sitemap-handler assertions. |
| `reports/discovery-analytics-phase-2-rights-public-1440.png` | Full desktop rights-page capture, visually reviewed. |
| `reports/discovery-analytics-phase-2-rights-public-390.png` | Full mobile rights-page capture, visually reviewed. |

### Phase 2 modifications

| File | Exact scope |
| --- | --- |
| `components/site/Footer.tsx` | Add Rights & Licensing immediately after Privacy in Site navigation. |
| `content/page-metadata.ts` | Add rights title, description, path, and verified modification date; add Privacy's verified modification date. Shared registry automatically supplies the sitemap. |
| `content/privacy.ts` | Add one recommendation-measurement paragraph; change effective date to November 14, 2026. |
| `lib/crawl-indexing.ts` | Add public GPTBot and ClaudeBot disallow groups; preserve private branch and public wildcard/sitemap behavior. |
| `tests/crawl-indexing.test.mjs` | Update exact public policy expectation; add selective-agent, rights metadata/date/visibility, and real proxy gate regressions. |
| `tests/metadata.test.mjs` | Add `/rights` to the expected static route inventory. |
| `scripts/validate-discovery-analytics.cjs` | Optional output prefix to preserve Phase 1 evidence; add keyboard/history and mobile attribution/queue/overflow scenarios and separate event capture. This file was already untracked Phase 1 work. |

No changes were needed to `app/robots.ts`, `app/sitemap.ts`, `app/privacy/page.tsx`, `content/seo.ts`, visibility helpers, proxy, CSS, dependencies, or release content.

### Complete pre-existing Phase 1 set

The nine tracked Phase 1 modifications present on arrival were `app/music/[slug]/page.tsx`, `components/analytics/TrackedLinks.tsx`, `components/audio/AudioPlayerProvider.tsx`, `components/audio/GlobalAudioPlayer.tsx`, `components/audio/ReleasePlayButton.tsx`, `components/audio/useAudioPlayer.ts`, `components/ui/ReleaseCard.tsx`, `lib/analytics.ts`, and `lib/audio-analytics.ts`.

Its eight pre-existing untracked additions were `components/analytics/RecommendationImpression.tsx`, `lib/recommendation-analytics.ts`, `tests/recommendation-analytics.test.mjs`, `scripts/validate-discovery-analytics.cjs`, `reports/discovery-analytics-phase-1-implementation.md`, `reports/discovery-analytics-phase-1-browser.json`, `reports/discovery-analytics-phase-1-desktop.png`, and `reports/discovery-analytics-phase-1-mobile.png`.

A SHA-256 preservation snapshot covered all 114 pre-existing modified/untracked files. Only the intentionally extended discovery validator changed among them; the other 113, including original Phase 1 application code/evidence and unrelated files, retained identical bytes. Newly modified tracked Phase 2 files are listed separately above. No broad staging or cleanup was performed.

## 3. Rights & Licensing content

Page title: **Rights & Licensing**. Section: **Artist Rights & AI Usage**.

> Broey welcomes ordinary search engine indexing, AI-assisted factual discovery of the artist and releases, references to publicly available release metadata, and links to authorized listening destinations. Listening through the website and authorized streaming services is welcome, subject to the terms that apply to those services.
>
> Copyright and related rights in the music, sound recordings, compositions, artwork, and other protected material remain with their respective rights holders, which may include Broey, collaborators, labels, publishers, and others.
>
> This website does not grant permission to use protected music, compositions, or sound recordings for AI training, to fine-tune generative audio models, to collect recordings into machine-learning datasets, or to reproduce or extract protected recordings for model development without authorization from the applicable rights holders.
>
> Public availability, including access through this website or a streaming platform, does not by itself constitute a license for those uses. Any permission must come from the rights holders authorized to grant it.
>
> Broey and other applicable rights holders reserve their rights and their ability to pursue remedies available under applicable law. This statement does not override applicable copyright exceptions or limitations, existing licenses, or terms governing material on external platforms.
>
> For rights and licensing inquiries, contact broey@broey.net. An inquiry does not itself grant permission.

This retains section F's wording and all qualifications, with “compositions” made explicit in its AI-training sentence to match the Phase 2 request. Contact is an accessible mailto link to the existing public address. No exclusive-ownership assertion, invented licensing terms, or blanket claim of illegality was added.

## 4. Privacy changes

The only added paragraph, under Privacy-focused analytics, is:

> We may measure whether music recommendations were visible, whether visitors opened suggested releases, and whether recommendations led to on-site playback, using basic release and interaction metadata. This functionality does not currently create stored listener-interest profiles or cross-session behavioral histories.

Effective date changed from August 6, 2026 to **November 14, 2026**, retaining the established authored human-readable date convention. The corresponding metadata `lastModified` is `2026-11-14`, reflecting this actual substantive update. Existing Umami Cloud, collection exclusions, blocking tolerance, contact, newsletter, hosting, and retention paragraphs are unchanged. The application adds no new cookie, persistent storage, identifier, account, preference profile, or listening history.

## 5. Crawler directives and official verification

Official documentation was checked before changing crawler rules on November 14, 2026. OpenAI identifies GPTBot with possible model training and documents independent OAI-SearchBot search controls. [OpenAI crawler documentation](https://developers.openai.com/api/docs/bots).

Anthropic identifies ClaudeBot with training collection and distinguishes Claude-SearchBot and Claude-User. Its documentation supports a named ClaudeBot `Disallow: /` rule. No contradiction with the authorized changes was found. [Anthropic crawler documentation](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler).

Actual public response:

```text
User-Agent: *
Allow: /

User-Agent: GPTBot
Disallow: /

User-Agent: ClaudeBot
Disallow: /

Sitemap: https://broey.net/sitemap.xml
```

Googlebot, Bingbot, OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, and ordinary crawlers retain the public wildcard allowance. There is no Google-Extended rule, shared training-preference directive, `llms.txt`, or `noai` metadata. The named restrictions cover the whole site for those two training crawlers, including text and artwork; external streaming services are unaffected.

Private build output remains:

```text
User-Agent: *
Disallow: /
```

Private mode has no advertised sitemap. These are crawler preferences for cooperating agents, not a media access-control system or proof of removal from previously collected datasets.

## 6. SEO and sitemap results

| Assertion | Result |
| --- | --- |
| Public `/rights` response | HTTP 200, validated against the built local application. |
| Canonical | `https://broey.net/rights`. |
| Browser title | `Rights & Licensing \| Broey.` |
| Description | “Read Broey’s artist rights and AI usage policy, including permissions for factual discovery and contact details for rights and licensing inquiries.” |
| Indexability | Public rights page has no noindex/nofollow restriction; private compiled page has robots and Googlebot noindex/nofollow. |
| Sitemap inventory | 27 unique URLs; all 26 baseline URLs retained, plus `/rights` exactly once. |
| Release URLs and dates | All existing release URLs and lastmod values unchanged. |
| Page modification dates | Only Privacy acquired its actual update date; new Rights uses its creation date. Both are `2026-11-14`; existing unrelated dates were preserved. |
| Footer | Rights follows Privacy in global Site navigation; both routes and browser back/forward work at all tested widths. |
| Private sitemap | Actual bundled private sitemap GET returns HTTP 200 and zero URL entries. |
| Preview gate | Actual proxy unit regression redirects absent/invalid authorization to `/gate?next=%2Frights`, accepts valid synthetic preview authorization, and permits ordinary public requests. |

The shared source-backed `lastModified` convention is retained. No build/request timestamp was substituted for content-maintenance evidence. No indexing submission or production URL check was performed.

## 7. Analytics review and regression results

Retained event names: `release_open`, `audio_play`, `audio_25_percent`, `audio_50_percent`, and `audio_75_percent`, `audio_complete`, plus Phase 1's `recommendation_impression` and `recommendation_interaction`. Shared source/destination/slot/position/override fields and playback triggers are unchanged.

Review and tests verify:

- Visibility requires at least 50% of the card for one continuous foreground second; initial offscreen rendering does not count. Per-mounted-context deduplication survives player rerenders, and incomplete intervals are canceled. Three card observers/timers use no polling.
- Card play/pause/resume intent is distinct from successful playback. Existing play/milestone/completion events remain bounded per measurement segment. A changed origin on the same source intentionally creates a new segment; ordinary resumes under the same origin do not duplicate play events.
- Normal same-tab navigation carries one expiring in-memory attribution handoff. Destination playback consumes it. Unrelated selection, departure, expiration, refresh/provider reset, or queue transitions prevent stale reuse. Back/forward after leaving a destination does not revive an unused handoff.
- Explicit direct recommendation playback is attributed. Automatic queue advancement uses `automatic`; manual transport uses `queue_selection`; neither inherits recommendation fields. Recommendation metadata is not attached to reusable queue tracks.
- Missing, throwing, rejected, or blocked analytics remains nonblocking, without retry queues or persistent telemetry. Keyboard link/button interaction and navigation preserve behavior.

Final integration evidence contains 19 main desktop events, 2 history-scenario events, and 10 mobile events, all synthetic and local. Ten grouped scenarios pass with no uncaught page errors. No unexpected duplicate event was observed in the tested paths. Volume in actual traffic remains unmeasured.

Position milestones and seeking-based completion are not verified listening duration. Opens and DSP clicks remain intent signals, not proof of off-site streams or playlist additions. Local spies prove emitted calls/properties, not production Umami ingestion.

## 8. Validation and isolated browser results

| Check | Final result |
| --- | --- |
| `npm test` | **76 passed, 0 failed**; baseline was 73. Includes 15 existing recommendation analytics tests and 3 new crawler/rights/gate regressions. |
| `npm run lint` | Pass, no errors or warnings. |
| `npm run typecheck` | Pass. |
| `npm run build` with process-only public visibility | Pass, Next 16.3 Turbopack, 57 static generation steps. |
| Separate private production build | Pass, Next 16.3 webpack, 57 static generation steps; copied source/config, existing dependency junction, synthetic passcode, no copied environment file. |
| `node scripts/validate-release-recommendations.cjs` | Pass: 41 source pages / 19 eligible candidates, three date keys, maximum exposure 13/41, no repeated complete sets. Existing `after-you` unmapped-genre diagnostic remains. |
| Discovery integration validator | Pass, 10 grouped desktop/history/mobile scenarios. |
| Public readiness validator | Pass, 7 grouped HTTP/SEO/crawler/responsive/navigation checks. |
| Private artifact validator | Pass, 5 grouped compiled-output/handler checks. |
| Preservation and whitespace | Pre-existing files preserved as described above; `git diff --check` passes. |

Browser isolation: already installed Playwright Core 1.61.0 and Chromium; `chromium.launch({ headless: true })`, automatically isolated temporary profile, fresh nonpersistent contexts, loopback origin `http://127.0.0.1:3227`, and external browser requests aborted. No CDP attachment, personal profile, desktop automation, OS-level input, foreground-window switch, or personal browser access occurred. The dedicated test server was started hidden and stopped after testing; existing servers were left alone.

Rights was tested at **1440×1000, 768×844, 390×844, and 320×844**. Content width matched each viewport, with no horizontal overflow; policy paragraphs computed to 15.2px. Desktop/mobile screenshots were visually inspected for wrapping, readable copy, spacing, contact link, and footer layout. Heading structure and keyboard activation were checked; this is not a full accessibility certification.

Desktop discovery checks cover impressions, direct play/pause/resume, rerender deduplication, seek milestones, uninterrupted playback through navigation, destination attribution, real media completion/automatic clearing, manual queue clearing, unrelated catalog play, and keyboard/history clearing. Mobile checks cover playback with missing/rejected Umami, impressions, keyboard direct play/open, destination attribution, automatic clearing, and player overflow.

### Failures encountered and their disposition

1. First post-change unit run: two failures. The existing static route inventory lacked `/rights`; the new canonical test incorrectly expected a production origin in a suite explicitly configured for development. Added the new route to the inventory and corrected that fixture expectation. Production canonical remains separately asserted against the built public page. No assertion was removed or weakened.
2. First public readiness run: the test selected both footer Privacy links (newsletter notice and Site navigation). Scoped the test to the named Footer navigation landmark. The existing UI was unchanged.
3. Temporary private Turbopack build: rejected a dependency junction pointing outside the temporary project root. A first npm-wrapper attempt to select webpack dropped the flag and repeated that isolation-fixture failure. The direct installed Next CLI with `build --webpack` passed. The actual repository's public Turbopack build passed independently; no dependency or application fix was made for this temporary-fixture issue.
4. Private runtime browser validation: automatic approval review rejected both the hidden server launch and a direct noninteractive loopback launch with **“blocked by policy”** and no more specific rationale. No desktop/browser substitution or further launch attempt was made. The requested noninteractive fallback verified compiled private metadata/robots, invoked the actual bundled sitemap GET, and tested the actual proxy with synthetic requests. Private runtime/browser checks remain unperformed.
5. Temporary-workspace cleanup: automatic approval review rejected removal of the isolated private build with **“blocked by policy”** and no more specific rationale. No deletion occurred. The retained folder is `C:\Users\phill\AppData\Local\Temp\broey-phase2-private-1bffdb2bcdf94fe9aed4f6cf7e3b9cb3`; it contains copied project source/build output and junctions to existing dependencies/public assets. No private test server is running. The owned public server on port 3227 was successfully stopped.

### Repeatable commands

Use an already installed Playwright module; do not install one implicitly. With the public built server running on loopback, set `DISCOVERY_PLAYWRIGHT_MODULE` to that module's existing directory and run:

```powershell
$env:DISCOVERY_TEST_ORIGIN = 'http://127.0.0.1:3227'
$env:DISCOVERY_REPORT_PREFIX = 'reports/discovery-analytics-phase-2'
node scripts/validate-discovery-analytics.cjs
$env:PHASE2_TEST_ORIGIN = 'http://127.0.0.1:3227'
node scripts/validate-phase2-readiness.cjs
```

Optional `PHASE2_BASELINE_SITEMAP` points to the saved pre-change sitemap JSON and enables exact baseline-inventory/date comparison; that comparison was enabled for this run. In an existing separately built private test workspace, use the noninteractive fallback with process-only private visibility, its synthetic test passcode, the canonical site origin, and `PHASE2_PRIVATE_BUILD_DIR` pointing to that build's `.next` directory, then run the same readiness script. This mode does not require Playwright or start a server. The script also supports `PHASE2_TEST_MODE=private` and a synthetic `PHASE2_TEST_PASSCODE` for future separately permitted loopback browser testing.

## 9. Remaining risks and limitations

- Live Umami receipt, aggregate event-property reporting, and actual blocking/traffic rates remain unverified. Production analytics records and provider settings were not accessed.
- Private runtime/browser checks were blocked as documented. Passing private build/artifact/proxy checks do not establish a complete served-browser preview flow.
- Browser coverage uses Chromium viewport emulation, not physical iOS/Android devices or every browser. Playback checks sample the active release/recommendation flows, not every recording in the catalog.
- Robots preferences depend on crawler cooperation and do not alter third-party streaming-platform terms or establish universal technical AI-training protection.
- Existing informational Node type-stripping/module-type/mock-timer warnings and the unmapped `after-you` genre diagnostic remain; no unrelated configuration or catalog change was made to hide them.

## 10. Production deployment readiness

The local public implementation has no outstanding failing code check and is ready for a separately authorized deployment, subject to the explicit verification limits above. The private fallback meets the requested noninteractive alternative but leaves runtime browser verification outstanding. The repository's resulting production build remains public; the separate private build did not replace it. No data migration, dependency installation, new account/storage system, or provider configuration change is required.

After a separately authorized deployment, verify public rights/privacy/footer responses, robots and sitemap at the deployed origin, and aggregate-only Umami receipt/property breakdowns for synthetic known actions. Those external checks and any publication remain outside this run.

## 11. Exact changes awaiting owner authorization

Commit/push/deployment authorization is still required for the combined Phase 1 analytics change set identified in section 2 and the Phase 2 files listed there. The resulting public publication would include:

1. Phase 1 recommendation impressions, interaction/navigation attribution, and playback-origin instrumentation with historical event compatibility.
2. `/rights`, its qualified Artist Rights & AI Usage wording and public licensing contact, metadata/sitemap entry, and global footer link.
3. The single Privacy clarification, revised effective date, and source-backed sitemap modification date.
4. Only the GPTBot and ClaudeBot public training-crawler groups.
5. The associated tests, validation scripts, and readiness evidence, as selected for version control during that separately authorized step.

No approval has been inferred to stage unrelated pre-existing files. All changes remain local and undeployed.
