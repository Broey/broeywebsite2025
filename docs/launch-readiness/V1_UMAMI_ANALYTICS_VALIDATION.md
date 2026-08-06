# V1 Umami analytics validation

## Review status

**Ready for owner review.** The work is isolated in a clean sibling worktree and has not been pushed, merged, deployed, or connected to any external service. No real Contact, Newsletter, Shopify, or Umami Cloud write was made during validation.

| Item | Value |
| --- | --- |
| Branch | `codex/add-umami-analytics` |
| Worktree | `C:\Users\phill\Desktop\Scripts\Broey-Website-Umami` |
| Starting commit | `1b409316cd872234569b16150f91807dabf07064` |
| Ending commit | The documentation commit containing this report; use `git rev-parse HEAD` after checkout for the exact hash. |
| Approved script URL | `https://cloud.umami.is/script.js` |
| Approved website ID | `a48e8dfd-e4d8-42db-a2fe-970ae6cf373e` |

## Script-loading architecture

The root `app/layout.tsx` owns the only `next/script` declaration. It uses `strategy="afterInteractive"`, the two public environment values, and `data-domains="broey.net"`. Umami auto-tracking remains enabled, so the app does not manually send ordinary pageviews and cannot duplicate them through a second pageview implementation.

The script renders only when all of the following are true:

- `NODE_ENV` is `production`;
- `SITE_VISIBILITY` resolves to `public`;
- both `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` are non-empty.

Development, private previews, and production builds missing either Umami value render no tracker. The website ID and script URL are intentionally browser-visible public configuration, not encrypted secrets. `data-domains` also prevents the supplied tracker from running on localhost or a preview hostname.

Umami documents automatic pageview/event collection, SPA navigation support, and the `data-domains` hostname restriction in its [tracker configuration](https://docs.umami.is/docs/tracker-configuration) and [FAQ](https://docs.umami.is/docs/faq).

## Environment variables

```text
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=a48e8dfd-e4d8-42db-a2fe-970ae6cf373e
```

Both must be configured as build-time public-production variables in DigitalOcean. Do not configure a private preview with `SITE_VISIBILITY=public` merely to test analytics.

## Files changed

```text
.env.local.example
README.md
app/api/contact/route.ts
app/api/newsletter/route.ts
app/layout.tsx
app/merch/page.tsx
app/music/[slug]/page.tsx
app/music/page.tsx
components/analytics/TrackedLinks.tsx
components/audio/AudioPlayerProvider.tsx
components/audio/ReleaseTracklist.tsx
components/audio/releaseAudioQueue.ts
components/audio/useAudioPlayer.ts
components/music/MusicCatalogFilter.tsx
components/sections/ContactForm.tsx
components/sections/EmailSignup.tsx
components/sections/FeaturedRelease.tsx
components/sections/HomepageMerchSection.tsx
components/sections/MerchMobileBrowser.tsx
components/sections/MerchPreview.tsx
components/sections/MusicArchivePreview.tsx
components/sections/PressMentionsSection.tsx
components/ui/ExternalServiceButton.tsx
components/ui/MerchCard.tsx
components/ui/PlatformLinkList.tsx
components/ui/ReleaseCard.tsx
components/ui/ReleaseCarouselTile.tsx
content/privacy.ts
docs/launch-readiness/V1_PRODUCTION_HOSTING_REQUIREMENTS.md
docs/launch-readiness/V1_UMAMI_ANALYTICS_VALIDATION.md
lib/analytics.ts
lib/audio-analytics.ts
```

## Central event model

`lib/analytics.ts` is the single event dictionary and browser helper. It checks `window.umami?.track`, removes empty optional values, catches tracker errors, and returns without affecting the visitor when Umami is absent or blocked. It exposes no arbitrary event-name call sites, visitor identity, `umami.identify`, cookie, fingerprint, or analytics local-storage behavior.

`lib/audio-analytics.ts` owns the pure playback-session state machine. Playback starts only from the authoritative audio element's `playing` event. Pause/resume does not start another session; backward seeking cannot repeat a fired milestone; a new track resets the milestones; completion fires once; replay after completion starts a new session. The existing global player remains mounted at the root and its navigation/persistence behavior is unchanged.

The Contact and Newsletter APIs add `analyticsEligible: true` only to real provider-confirmed success responses. Friendly honeypot `200` responses intentionally omit it. Clients require HTTP success, `ok: true`, and `analyticsEligible: true` before emitting a conversion.

## Event dictionary

| Event | Exact permitted properties | Trigger |
| --- | --- | --- |
| `audio_play` | `release_slug`, `track_slug`, `track_title`, `project_slug`, `genre` | Authoritative audio element begins a new playback session |
| `audio_25_percent` | same audio properties | First crossing of 25% in the session |
| `audio_50_percent` | same audio properties | First crossing of 50% in the session |
| `audio_75_percent` | same audio properties | First crossing of 75% in the session |
| `audio_complete` | same audio properties | Authoritative audio element completes once |
| `streaming_click` | `release_slug`, `track_slug`, `platform`, `destination_type`, `source_surface` | Public release-platform handoff |
| `genre_filter` | `genre`, `result_count` | A different catalog genre filter is selected |
| `release_open` | `release_slug`, `source_surface` | One internal release-opening interaction |
| `newsletter_signup` | `source_surface`, `page_path` | MailerLite-confirmed success only |
| `contact_submit` | `source_surface`, `page_path` | Resend-confirmed success only |
| `merch_click` | `product_title`, `category`, `source_surface` | Outbound Shopify/product handoff only |
| `press_click` | `publication`, `source_surface` | Outbound press handoff |

Approved source surfaces are factual constants such as `home`, `music_catalog`, `release_page`, `recommendations`, `project_tracklist`, `merch`, `press`, `about`, `contact_page`, and `footer`.

Explicitly prohibited analytics data includes names, email addresses, Contact subjects, message text, newsletter form contents, subscriber IDs, provider responses, IP addresses, Turnstile tokens, API tokens, passcodes, persistent visitor IDs, hashed email addresses, full press URLs, and any other personal or secret data.

## Privacy and cookie-consent conclusion

The Privacy Notice now describes aggregate pages, referrals, campaign parameters, device/browser categories, approximate region, and anonymous engagement/conversion events. It explicitly says that names, email addresses, form contents, Contact messages, and provider identifiers are not sent to Umami and that the implementation has no advertising or behavioral-tracking cookies.

No cookie-consent banner was added for this exact implementation. Umami's current [documentation](https://docs.umami.is/docs) and [FAQ](https://docs.umami.is/docs/faq) state that its tracking code uses no cookies, cross-site tracking, fingerprinting, or personal-data collection, and this code adds no persistent analytics identifier. The notice remains appropriate transparency. Reassess consent and disclosure before any later cookie, advertising pixel, session replay, heatmap, identity, or behavioral-profile work; jurisdiction-specific legal advice is outside this technical conclusion.

## Pageviews, UTM parameters, and campaigns

The public build rendered one root `next/script` declaration with the approved website ID and `data-domains="broey.net"`; Next.js also emitted its normal preload hint for that same resource. There is no page-level script and no manual pageview call. The production build without Umami values contained no approved website-ID match. The private build rendered no analytics script.

The safe URL probe returned `200`, made zero redirects, and preserved the complete query string:

```text
https://broey.net/music/free?utm_source=instagram&utm_medium=social&utm_campaign=website_launch&utm_content=test_video
```

Umami automatically extracts all five standard fields: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term`, as documented in its [UTM guide](https://docs.umami.is/docs/utm). Use lowercase snake-case values, keep campaign names consistent across channels, and never place personal data in a UTM.

| Placement | Recommended convention |
| --- | --- |
| Instagram bio | `utm_source=instagram&utm_medium=social&utm_campaign=<campaign>&utm_content=bio` |
| Instagram Stories | `utm_source=instagram&utm_medium=social&utm_campaign=<campaign>&utm_content=story_<creative>` |
| TikTok | `utm_source=tiktok&utm_medium=social&utm_campaign=<campaign>&utm_content=<bio_or_video>` |
| Discord | `utm_source=discord&utm_medium=community&utm_campaign=<campaign>&utm_content=<channel_or_announcement>` |
| Newsletter | `utm_source=newsletter&utm_medium=email&utm_campaign=<send_or_release>&utm_content=<link_position>` |
| Meta paid social | `utm_source=meta&utm_medium=paid_social&utm_campaign=<campaign>&utm_content=<creative>&utm_term=<audience>` |
| QR codes | `utm_source=qr&utm_medium=offline&utm_campaign=<campaign>&utm_content=<placement>` |
| Press placements | `utm_source=<publication>&utm_medium=referral&utm_campaign=<campaign>&utm_content=<article_or_profile>` |

## Validation evidence

| Command/check | Result |
| --- | --- |
| `npm ls --depth=0` | Pass; existing extraneous optional `@img/sharp-wasm32@0.35.3` reported. |
| `npx eslint .` | Pass, zero warnings/errors after final implementation. |
| `npx tsc --noEmit --incremental false` | Pass. |
| Public production build with approved site, visibility, script URL, and website ID | Pass with Next.js 16.3.0; 54 pages generated. |
| Public production build with both Umami variables absent | Pass; approved website ID absent from build output. |
| Private production build with approved Umami values and disposable passcode | Pass; tracker not rendered and private site policy retained. |
| Local development probe | Tracker URL and approved website ID absent. |
| Safe compiled event harness | Pass: all 12 exact names, allowed sample properties, no prohibited fields, absent/throwing tracker no-op, conversion eligibility matrix, and audio session behavior. |
| Audio state-machine cases | Pass: play once, 25/50/75 once, backward seek no duplicate, complete once, replay reset, track-switch reset, stale-track progress ignored. |
| Representative route checks | Pass: `/`, `/music`, `/music/free`, `/about`, `/contact`, `/merch`, `/press`, `/privacy`, `/robots.txt`, and `/sitemap.xml` returned `200`. |
| Safe UTM probe | Pass: `200`, zero redirects, entire query string preserved. |
| `git diff --check` | Pass before documentation commit. |
| Dependency and lockfile diff | No `package.json` or `package-lock.json` change. |

Chrome blocked all local URLs with a client-side policy, so DOM clicking/network-panel browser automation could not be completed. The fallback safe harness and direct local HTTP probes were used and no real analytics endpoint or provider was contacted. Actual Umami Cloud receipt, live automatic SPA pageviews, and deployed-browser custom-event delivery remain post-deployment owner checks. Real successful Contact and Newsletter conversions were deliberately not submitted; Shopify handoffs and external press/streaming destinations were not opened, and no order was created.

## Dashboard verification after deployment

1. In the existing DigitalOcean web-service component, add production build-time values:
   - `NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js`
   - `NEXT_PUBLIC_UMAMI_WEBSITE_ID=a48e8dfd-e4d8-42db-a2fe-970ae6cf373e`
2. Confirm `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public` for the intended public production environment. Keep private previews private and without analytics values by default.
3. Deploy the owner-approved commit manually.
4. Open `https://broey.net` in a private window with extensions disabled if necessary.
5. Visit several pages, including one client-side navigation.
6. Play one track through at least one milestone, select one genre filter, and open one release.
7. Open the Umami dashboard and confirm the current visit, distinct pageviews, and the matching custom events and factual properties.
8. Confirm there is one tracker request, no duplicate pageview for a single navigation, no browser error, no form contents in event data, and UTM reporting for a tagged visit.

## Owner-controlled merge, push, and deployment

Do not use the dirty original worktree for these commands until its merch work has been safely handled by the owner. After approval, from the analytics worktree:

```powershell
git status --short
git push -u origin codex/add-umami-analytics
```

Open a pull request into `main`, review the three commits and checks, and merge only after approval. If using a local fast-forward instead, first make the original worktree clean without discarding its merch work, then run:

```powershell
git switch main
git pull --ff-only origin main
git merge --ff-only codex/add-umami-analytics
git push origin main
```

In DigitalOcean, add the two public Umami variables to the production web-service component, save them as build-time variables, keep autodeploy off unless the owner separately changes that policy, and manually deploy the merged `main` commit. Confirm the displayed commit hash, successful Node 22 / Next.js build, healthy runtime, route smoke, analytics dashboard steps above, and rollback target. Do not change DNS, Cloudflare, Resend, MailerLite, Shopify, or Turnstile for this analytics release.

Advertising pixels, paid-social conversion APIs, session replay, heatmaps, and behavioral identity are explicitly outside V1 and require a separate privacy, consent, security, and implementation phase.
