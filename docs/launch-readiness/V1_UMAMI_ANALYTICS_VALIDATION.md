# V1 Umami analytics validation

## Review status

**Ready for owner review and merge.** The analytics branch was rebased onto the finalized responsive-merch `main`, the integration was reconciled, and the full validation matrix passed. Nothing was pushed, merged, deployed, or written to Umami Cloud, Contact, Newsletter, or Shopify during this work.

| Item | Value |
| --- | --- |
| Branch | `codex/add-umami-analytics` |
| Worktree | `C:\Users\phill\Desktop\Scripts\Broey-Website-Umami` |
| Finalized `main` base | `46ee39dae565aecb0d17c1247deff8dd99884959` |
| Original analytics head | `6b59800a76178f987618e2dd054c3bbf5fd7e9bd` |
| Reconciled code head | `aeb62e958068635449d71ad72fb4a016f0098e80` |
| Final branch head | The documentation commit containing this report; use `git rev-parse HEAD` for its exact hash. |
| Approved script URL | `https://cloud.umami.is/script.js` |
| Approved website ID | `a48e8dfd-e4d8-42db-a2fe-970ae6cf373e` |

## Rebase and reconciliation

The original three analytics commits were rebased onto local `main`. The rebase stopped only for the expected responsive-merch overlap:

- `app/merch/page.tsx`: retained the finalized responsive `MerchBrowser` architecture and integrated analytics into it.
- `components/sections/MerchMobileBrowser.tsx`: retained its deletion because `main` replaced the legacy mobile-only browser with the shared responsive browser.

The rebased analytics commits are `d45ec8a`, `76528b9`, and `596e40f`. Follow-up commit `aeb62e9` reconciles the responsive merch click boundary and supplies the missing `music_catalog` source surface on the foundation release card.

The final merch behavior is one responsive component at every viewport. `MerchBrowser` delegates clicks only from actual outbound `a.merch-card-action[href][target="_blank"]` links. A genuine card handoff emits exactly one `merch_click` with `product_title`, `category`, and `source_surface: "merch_page"`. Filter changes, renders, and non-outbound card interactions do not emit it. The two hero handoffs are independently tracked once through `TrackedMerchLink`. `MerchCard` remains reusable without double tracking.

## Script-loading architecture

The root `app/layout.tsx` owns the only `next/script` declaration. It uses `strategy="afterInteractive"`, `data-domains="broey.net"`, and the two public environment values. It renders only when `NODE_ENV` is production, `SITE_VISIBILITY` is public, and both Umami values are non-empty. Development, private previews, and production builds missing either value render no tracker.

Umami automatic pageviews remain enabled; the app contains no manual pageview call. This avoids duplicate SPA pageviews, consistent with Umami's [SPA guidance](https://docs.umami.is/docs/guides/track-single-page-apps). The public configuration values are intentionally visible to browsers and are not secrets. The [tracker configuration](https://docs.umami.is/docs/tracker-configuration) documents the hostname restriction that keeps this configuration inactive on localhost and preview hosts.

```text
NEXT_PUBLIC_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=a48e8dfd-e4d8-42db-a2fe-970ae6cf373e
```

## Central event and privacy model

`lib/analytics.ts` is the typed event dictionary and browser helper. It checks for `window.umami?.track`, removes empty optional values, catches tracker errors, and leaves the visitor flow unaffected when tracking is unavailable or blocked. There is no arbitrary event-name call site, `umami.identify`, analytics cookie, fingerprint, or analytics storage implementation.

`lib/audio-analytics.ts` owns playback sessions. A session starts only from the authoritative audio element's `playing` event. Pause/resume does not add a play; backward seeking cannot repeat a milestone; a track change resets state; completion fires once; and replay after completion starts a fresh session. The root-mounted player and route-persistent playback behavior remain intact.

Contact and Newsletter APIs add `analyticsEligible: true` only after a provider-confirmed success. Honeypot `200` responses and all failures omit it. Clients require HTTP success, `ok: true`, and `analyticsEligible: true` before emitting a conversion. No form contents or provider identifiers enter analytics.

| Event | Exact permitted properties | Trigger |
| --- | --- | --- |
| `audio_play` | `release_slug`, `track_slug`, `track_title`, `project_slug`, `genre` | New authoritative playback session |
| `audio_25_percent` | same audio properties | First 25% crossing in the session |
| `audio_50_percent` | same audio properties | First 50% crossing in the session |
| `audio_75_percent` | same audio properties | First 75% crossing in the session |
| `audio_complete` | same audio properties | Authoritative completion, once |
| `streaming_click` | `release_slug`, `track_slug`, `platform`, `destination_type`, `source_surface` | Public platform handoff |
| `genre_filter` | `genre`, `result_count` | A different genre is selected |
| `release_open` | `release_slug`, `source_surface` | Internal release opening |
| `newsletter_signup` | `source_surface`, `page_path` | Provider-confirmed success only |
| `contact_submit` | `source_surface`, `page_path` | Provider-confirmed success only |
| `merch_click` | `product_title`, `category`, `source_surface` | Genuine outbound product handoff |
| `press_click` | `publication`, `source_surface` | Outbound press handoff |

Validated source surfaces include `home`, `music_catalog`, `release_page`, `recommendations`, `project_tracklist`, `merch_page`, `press`, `about`, `contact_page`, and `footer`. Public release pages retain only Spotify, Apple Music, YouTube, and TIDAL handoffs; the private DISCO policy is unchanged.

Names, email addresses, subjects, messages, form contents, subscriber/provider IDs, IP addresses, tokens, passcodes, persistent visitor IDs, hashed emails, full press URLs, and secrets are prohibited analytics data.

## Privacy and consent conclusion

The Privacy Notice describes the aggregate analytics in use and explicitly states that form PII is not sent to Umami. This repository does not enable identity, session replay, heatmaps, advertising pixels, cross-site tracking, fingerprinting, analytics cookies, or persistent analytics identifiers.

For this exact implementation, an analytics cookie banner is not technically indicated by Umami's documented [no-cookie tracker behavior](https://docs.umami.is/docs/faq). This is a technical conclusion, not jurisdiction-specific legal advice. Reassess disclosure and consent before adding identity, replay/heatmaps, advertising technology, cookies, or behavioral profiles.

## Files changed from finalized `main`

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
components/sections/MerchBrowser.tsx
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

`package.json` and `package-lock.json` are unchanged.

## Validation evidence

| Command or check | Result |
| --- | --- |
| `npm ci` | Pass; 403 packages audited. |
| `npm ls --all` | Exit 0; pre-existing extraneous optional `@img/sharp-wasm32@0.35.3` reported. |
| `npm audit --omit=dev --audit-level=high` | Pass; zero runtime vulnerabilities. |
| `npx eslint .` | Pass. |
| `npx tsc --noEmit --incremental false` | Pass after the reconciliation fix. |
| Public production build with approved Umami values | Pass; Next.js 16.3.0, 54 pages. Repeated after browser validation to leave the final public artifact. |
| Public production build without Umami values | Pass; approved URL and website ID absent from `.next`. |
| Private production build with approved values and disposable passcode | Pass; gate redirect and private robots/sitemap policy retained, tracker absent. |
| Typed event harness | Pass: all 12 exact names, property allowlists, absent/throwing tracker safety, conversion matrix, and audio state transitions. |
| Public HTTP route smoke | Pass: `/`, `/music`, `/music/free`, `/about`, `/contact`, `/merch`, `/press`, `/privacy`, `/robots.txt`, and `/sitemap.xml` returned `200`; intentionally hidden `/watch` returned `404`. |
| Sitemap and robots | Pass: merch included; design-system, gate, and watch excluded; public crawling policy correct. |
| Safe form probes | Honeypot successes and validation failures returned no `analyticsEligible`; no provider submission was made. |
| Safe UTM probe | `200`, zero redirects, full query including `utm_term` preserved. |
| Shopify fallback | Pass: missing-domain fallback rendered the manual six-item catalog and filters. |
| Shopify tokenless live read | Pass: configured store returned six products and valid outbound links; no write/order occurred. |

### Browser validation

The hydrated public build contained one tracker declaration with the approved ID, `data-domains="broey.net"`, and no manual pageview calls. Its runtime remained unavailable on localhost as intended by the hostname restriction. SPA navigation kept one script instance.

The responsive Merch browser passed at `360x800`, `430x932`, `768x1024`, `1440x900`, and `1920x1080`: two columns through tablet, four on desktop, zero page/filter overflow, correct `3` Hoodies, `2` Crewnecks, `1` Hat, and `6` All results. A Dad Hat click opened the exact Shopify destination. Filters did not add tracker elements.

Music filtering returned seven House releases. Audio playback continued across Music-to-Merch SPA navigation with the same source and one tracker. The free-release page exposed only the four approved services; its Spotify handoff opened the correct destination. Recommendation navigation, the external press handoff, and the rendered privacy disclosure also passed. Public and development browser consoles had no errors or warnings; development rendered no tracker.

The safe UTM used for the local probe was:

```text
https://broey.net/music/free?utm_source=instagram&utm_medium=social&utm_campaign=website_launch&utm_content=test_video&utm_term=test_audience
```

Actual Umami Cloud receipt and deployed-host automatic pageviews remain production owner checks because `data-domains="broey.net"` correctly blocks localhost delivery.

## Owner dashboard verification after deployment

1. Add the two approved Umami variables as production build-time values in the existing DigitalOcean web-service component.
2. Confirm `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public`. Keep private previews private and analytics-free by default.
3. Manually deploy the approved merged `main` commit and confirm DigitalOcean displays that exact hash.
4. In a private browser window, visit several pages and perform one client-side navigation.
5. Play a track through a milestone, change a genre, open a release, and use merch, streaming, and press handoffs. Optionally make controlled real Contact/Newsletter successes if provider writes are approved.
6. In Umami, confirm distinct pageviews and the expected custom events/properties, with no duplicate pageview for one navigation and no PII.
7. Visit a tagged URL and confirm all intended UTM fields. Check browser health, route smoke, and the rollback target.

## Owner-controlled push, merge, and deployment

The remote analytics branch did not exist after `git fetch --all --prune`, so the first push is a normal upstream push. No force push is required or recommended.

From the analytics worktree, after approval:

```powershell
git status --short
git push -u origin codex/add-umami-analytics
```

Open a pull request into `main` and merge after review. If the owner instead chooses the currently valid local fast-forward path, first fetch and confirm the main worktree is still clean, then run:

```powershell
git fetch origin
git status --short
git merge --ff-only codex/add-umami-analytics
git push origin main
```

If fetched `origin/main` has advanced, reconcile/review that change rather than forcing either branch. In DigitalOcean, keep autodeploy unchanged unless separately approved, add the two build-time values, manually deploy merged `main`, and verify the commit, Node 22 / Next.js build, routes, tracker, dashboard events, and rollback target. Do not change DNS, Cloudflare, Resend, MailerLite, Shopify, or Turnstile for this release.

Advertising pixels, paid-social conversion APIs, identity, replay, heatmaps, and behavioral profiles remain outside V1.
