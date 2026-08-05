# V1 DigitalOcean temporary deployment validation

## 1. Executive result

**Overall result: CONDITIONAL PASS.**

The temporary DigitalOcean App Platform deployment is healthy, serves the expected finalized commit, passes all route, metadata, public-content, asset-range, responsive-layout, form-safety, and Lighthouse smoke checks, and has adequate observed headroom on the 1 GB instance for this low-volume test.

One application behavior must be fixed before public launch: local audio plays, seeks, persists across navigation, and survives filtering, but the persistent player's React state remains `paused`/`Loading` while the underlying audio is playing. As a result, the control remains labeled **Play FREE** and cannot pause playback. The issue reproduced in two fresh real-browser sessions.

There are no blockers to continuing controlled hosting and domain preparation, but the website should not be declared publicly launch-ready until the player defect is fixed and the production configuration items in this report are completed.

Validation was read-only and low-volume. No source, repository history, deployment setting, environment variable, DNS record, provider account, Contact delivery, Newsletter subscriber, cart, or order was changed.

## 2. Temporary URL tested

- Temporary URL: `https://broey-website-6r8bd.ondigitalocean.app/`
- Test date: 2026-08-05
- DigitalOcean region shown by the dashboard: NYC1
- Canonical production origin intentionally embedded in the build: `https://broey.net`

The temporary-host/canonical-origin difference is expected before the production domain is connected and is not classified as a code defect.

## 3. Deployed branch and commit

DigitalOcean component settings and deployment/build evidence confirm:

| Item | Verified value |
| --- | --- |
| Repository | `Broey/broeywebsite2025` |
| Component | `broeywebsite2025` web service |
| Branch | `v1-prelaunch-backup` |
| Deployed commit | `2b887772ebe016af6ba0f0cf5af4b44223e23229` (dashboard displays `2b88777`) |
| Expected backup commit | `2b887772ebe016af6ba0f0cf5af4b44223e23229` |
| Current finalized local `main` | `2b887772ebe016af6ba0f0cf5af4b44223e23229` |
| Revision classification | The backup commit and finalized local `main` are identical; the deployment is current |
| Autodeploy | Off |

No revision mismatch was found.

## 4. Deployment and runtime health

| Evidence | Result |
| --- | --- |
| Deployment start | 2026-08-05 18:34:04 UTC |
| Build completion | 2026-08-05 18:37:11 UTC |
| Build duration | 3m 14s total; 1m 2s billable as displayed by DigitalOcean |
| Deployment result | Success; live deployment; dashboard status Healthy |
| Node runtime | `22.22.2` |
| npm runtime used by buildpack | `10.9.7` |
| Next.js | `16.3.0` with Turbopack build |
| Runtime command | `npm start`, invoking `next start` |
| Port | Bound correctly to port 8080 |
| Startup | Ready in 490 ms; `next.config.js` completed in 56 ms |
| Instances | One web-service instance |
| Initial overview sample | Approximately 4% CPU and 28% RAM |
| Post-smoke/Lighthouse sample | Approximately 3% CPU and 44% RAM |
| Restarts/OOM/fatal errors | None visible in Activity or the available runtime logs |

The available logs showed one normal runtime start, the expected Shopify fallback notice, and `TURNSTILE_CONFIGURATION_MISSING` entries corresponding to safe form probes. No unhandled exception, out-of-memory event, repeated start, or container restart was visible.

DigitalOcean settings showed no configured liveness check and no external log-forwarding destination. Those are production configuration gaps, not evidence of a current runtime failure.

**1 GB assessment:** adequate for this low-volume smoke and four sequential Lighthouse runs. RAM rose to about 44% without a restart or latency failure. This is not a load or capacity guarantee; sustained traffic and concurrency were intentionally not tested.

The build log also reported the already documented development-only high-severity `xlsx` audit condition. The production dependency audit was previously validated separately as clean; no dependency mutation was performed here.

## 5. Route results

Requests were sequential and low-volume. Every route finished on the requested temporary URL with no redirect unless noted separately. No GET route produced a 5xx response.

| Route | Expected | Status | Time | Content type | Cache evidence |
| --- | ---: | ---: | ---: | --- | --- |
| `/` | 200 | 200 | 120 ms | HTML | `s-maxage=31536000`; Cloudflare HIT; Next HIT |
| `/music` | 200 | 200 | 133 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/merch` | 200 | 200 | 234 ms | HTML | private/no-cache/no-store; Cloudflare BYPASS |
| `/about` | 200 | 200 | 48 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/contact` | 200 | 200 | 46 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/press` | 200 | 200 | 50 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/privacy` | 200 | 200 | 62 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/music/stereo-luv` | 200 | 200 | 49 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/music/fragments-remixes` | 200 | 200 | 52 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/music/run-for-cover` | 200 | 200 | 132 ms | HTML | `s-maxage=31536000`; Next HIT |
| `/watch` | 404 | 404 | 149 ms | HTML | cached static 404 |
| `/music/link` | 404 | 404 | 142 ms | HTML | cached 404 |
| `/music/paradise` | 404 | 404 | 156 ms | HTML | cached 404 |
| Random nonexistent route | 404 | 404 | 191 ms | HTML | private/no-cache/no-store |
| `/robots.txt` | 200 | 200 | 116 ms | `text/plain` | revalidated route output |
| `/sitemap.xml` | 200 | 200 | 142 ms | `application/xml` | revalidated route output |
| `/manifest.webmanifest` | 200 | 200 | 39 ms | Web App Manifest | revalidated route output |
| `/opengraph-image` | 200 | 200 | 257 ms | PNG | revalidated route output |

Representative release coverage included a single (`STEREO LUV`), an EP/project (`Fragments (Remixes)`), and a project track (`Run For Cover`).

## 6. Canonical and metadata results

Pass:

- Home canonical and `og:url` use `https://broey.net`.
- Music canonical and `og:url` use `https://broey.net/music`.
- Representative release and track canonical, Open Graph, Twitter/X image, and JSON-LD URLs use `https://broey.net`.
- `robots.txt` allows crawling and references `https://broey.net/sitemap.xml`.
- `sitemap.xml` contains 22 production URLs, all under `https://broey.net`; `/privacy` is included and Watch, LiNK, and Paradise are excluded.
- No active metadata or scanned HTML uses `broey.com`.
- The manifest and generated Open Graph image route return the correct content types.

The canonical URLs intentionally do not match the temporary DigitalOcean hostname. This is an expected pre-domain condition.

## 7. Public-content policy results

Pass:

- `/watch`, `/music/link`, and `/music/paradise` are unavailable with 404 responses.
- No `coming soon`, pending-artwork, pending-link, or public DISCO action was found in the inspected public output.
- Seventy-five unique editorial `description`/`mood` source strings were checked against representative deployed HTML; none appeared.
- Release cards use neutral release type, date, artist, and detailed genre metadata.
- The visible curated filters are exactly: All, House, Drum & Bass, Jungle, Dubstep, Garage, Breakbeat, Electronic.
- All shows 13 approved archive releases.
- Drum & Bass shows four releases: I Can't Wait For Love, Contrast, Hold On, and hysteria.
- Jungle shows four releases and includes Hold On.
- Dubstep shows two releases and includes Warning.
- FREE disappears when Drum & Bass is selected, while its active audio continues.
- Empty sections disappear after filtering; the Drum & Bass result retained only the two sections that had matches.
- No draft release appeared under any tested filter.

## 8. Browser interaction results

Real-browser checks covered a small mobile viewport (390x844), a tablet viewport (820x1180), and the browser's standard desktop viewport (2560x1271). No horizontal overflow was found.

### Navigation and accessibility

- Desktop and tablet primary navigation is visible and functional.
- The mobile Menu opens a labeled navigation list and a Close control; selecting Music performs an internal client-side transition.
- Header, footer, About, Press, Contact, and Privacy links resolve correctly.
- Footer and form Privacy links are present.
- About coverage contains clear, descriptive anchor labels and a complete timeline/coverage layout.
- Press exposes 12 standard anchor actions with non-empty understandable labels. As ordinary anchors, they are keyboard-focusable; no click-only pseudo-controls were found.
- No mixed-content resource or browser console warning/error was observed in the tested tabs.

### Music and persistent player

Pass:

- FREE local audio reached ready state 4 and playback time advanced.
- Keyboard seeking works: Home moved playback near zero and ArrowRight advanced it.
- Playback persisted with the same source and increasing time through an internal transition from Music to About and back.
- Changing filters did not stop, reset, or replace the active audio.
- Filtering FREE out of the visible cards did not stop playback.
- The global player remained mounted and visible across navigation.

Fail — **Must fix before public launch**:

- In two fresh sessions, the underlying `<audio>` element was actively playing while the persistent control remained `data-state="paused"`, labeled `Play FREE`, and announced `Loading` or `Ready` rather than Playing.
- Clicking that control did not pause; playback time continued advancing.
- This makes the required pause/resume interaction unavailable and gives assistive technology incorrect state.
- The smoke audio sessions were stopped by closing their test tabs; no complete large audio file was intentionally downloaded.

### Artwork, About, Press, and Merch

- Fragments (Remixes) artwork loaded as a square image in a square card and uses `object-position: 50% 100%`; its embedded bottom text remained visible in the visual check.
- FREE and STEREO LUV comparison cards remained square and centered without a framing regression.
- The release-detail artwork also rendered with the embedded bottom text visible.
- Merch returned 200 and rendered six curated/manual products. No category controls are currently present, so category-filter behavior was not applicable.
- One product handoff was opened only to the external Shopify product page. The destination loaded the expected hoodie product; no cart or checkout action occurred.

## 9. Form negative-path results

No real visitor identity, deliverable email address, Contact message, or Newsletter subscriber was used. Reserved `.invalid` addresses were used only where a valid-shaped request was needed to reach the fail-closed configuration path.

### Contact

- First name, last name, email, and message are all required.
- Empty submission stayed on `/contact` and native validation focused first name.
- The privacy disclosure and Privacy Notice link are present.
- No Newsletter opt-in checkbox exists.
- The honeypot remains present and excluded from normal tab order.
- An incomplete API request returned controlled JSON HTTP 400.
- Because production Turnstile keys are not configured, a valid-shaped reserved-domain request failed before provider delivery. The application origin returned 503, which DigitalOcean surfaced externally as a 504 HTML error with `x-do-orig-status: 503`.
- The browser client handled that non-JSON response without crashing and showed the safe provider-unavailable fallback.

### Newsletter

- The visitor input remains email-only; the other fields are hidden source/honeypot metadata.
- Empty submission focused the required email field.
- Privacy disclosure and Privacy Notice link are present.
- A malformed email API request returned controlled JSON HTTP 400.
- The missing Turnstile configuration failed before provider delivery. DigitalOcean again mapped the application 503 to external 504 HTML.
- The browser client remained stable and showed the safe mailing-list-unavailable fallback.

No tested response exposed an API key, secret, raw Turnstile token, stack trace, complete visitor IP address, or internal provider credential. Runtime logs recorded only the safe `TURNSTILE_CONFIGURATION_MISSING` identifier.

## 10. Audio and asset delivery results

Only HEAD and small partial-range reads were used for the large assets.

| Asset | HEAD | Length | MIME | Range result | Cache/CDN result |
| --- | --- | ---: | --- | --- | --- |
| `/audio/free.mp3` | 200 | 7,643,237 bytes | `audio/mpeg` | 206; exactly bytes 0-4095; correct `Content-Range`; `Accept-Ranges: bytes` | `public, max-age=0`; Cloudflare BYPASS |
| `/assets/cover-art/fragments-remixes.jpg` | 200 | 1,124,179 bytes | `image/jpeg` | 206; exactly bytes 0-4095; correct `Content-Range` | `public, max-age=0`; Cloudflare BYPASS |
| Representative `/_next/image` response | 200 | 1,406 bytes | `image/webp` | 206; complete small optimized object | four-hour max-age; Cloudflare HIT |

Audio byte-range support passes. The full audio file was not transferred by the explicit range test.

The zero-second cache lifetime and CDN bypass for large public audio and original artwork are too restrictive for final production efficiency. Final CDN/static caching should be configured and re-probed after the custom domain and production delivery path are in place.

## 11. Lighthouse results

Lighthouse 12.8.2 ran sequentially against the temporary deployment using standard mobile lab throttling. These are lab measurements, not field data.

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | TBT | CLS | Transfer size |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 98 | 100 | 96 | 100 | 0.94 s | 2.28 s | 44 ms | 0.039 | 323,815 B |
| `/music` | 100 | 100 | 100 | 100 | 0.93 s | 1.83 s | 29 ms | 0 | 546,569 B |
| `/music/stereo-luv` | 98 | 100 | 96 | 100 | 1.08 s | 2.36 s | 20 ms | 0 | 559,131 B |
| `/contact` | 99 | 100 | 100 | 100 | 1.08 s | 1.98 s | 50 ms | 0 | 221,696 B |

There is no material regression from the prior local migration measurements. Every Performance score is above 85, every Accessibility score is 100, metadata/SEO remains intact, blocking time is low, and no major layout shift appeared.

## 12. Errors and warnings

### Must fix before public launch

1. Persistent player state does not follow actual playback; pause/resume is broken and the accessible label is incorrect.

### Production configuration pending

1. Configure the matched production Turnstile key pair and verify Siteverify success, expired/invalid challenges, and provider-unavailable behavior.
2. Configure and authorize one real Contact delivery and one Newsletter subscription test; provider writes were intentionally not attempted.
3. Add distributed rate limiting for both form POST routes with HTTP 429 and `Retry-After`; rate limits were intentionally not triggered.
4. Attach DNS/TLS and configure the permanent canonical apex/`www` redirect.
5. Configure efficient production caching/CDN behavior for large audio and original artwork, then repeat range/cache probes.
6. Add production security headers as appropriate. The temporary response did not include HSTS, CSP, `X-Content-Type-Options`, `X-Frame-Options`, Referrer Policy, or Permissions Policy, and it exposed `X-Powered-By: Next.js`.
7. Complete production observability: liveness/health policy, log retention/forwarding, alerting, and a verified rollback point.

### Post-launch improvement

- Remove or suppress `X-Powered-By` if it is not needed after the broader production header policy is established.
- Capacity-test the selected production topology with an approved traffic model; this smoke test intentionally did not exercise concurrency.

### Additional private-preview warning

The safe open-redirect probes did not escape to the supplied external hostname. GET `/gate` redirected to `/`, and the POST path sanitized `//evil.example` to `/`. However, DigitalOcean generated the absolute POST redirect as `https://localhost:8080/`, exposing the internal host. Public mode does not use this gate, but private previews on DigitalOcean require forwarded-host/redirect correction before use.

## 13. Expected pre-domain limitations

- Temporary pages are served from an `ondigitalocean.app` hostname while canonical, Open Graph, Twitter/X, JSON-LD, robots, and sitemap values intentionally point to `https://broey.net`.
- `broey.net` and `www` were not connected or tested in this task.
- TLS validation passed for the DigitalOcean temporary hostname only.
- The manual Shopify merch fallback is active because no live Shopify store domain is configured. The fallback links work and are acceptable as current application behavior.
- DigitalOcean's edge converts an application-origin 503 into an external 504 HTML error. The form clients handle it safely, but final Turnstile/provider configuration should remove the normal missing-configuration path and the behavior should be rechecked.
- Final CDN behavior may differ after custom-domain and caching configuration.

## 14. Production blockers

### Blockers before connecting `broey.net`: 0

The deployment is current, healthy, canonical-ready, and suitable for continued controlled hosting/domain preparation.

### Must fix before public launch: 1

- Repair and revalidate persistent-player playing state and pause/resume behavior.

### Production configuration pending: 7

- Turnstile
- Contact/Newsletter provider configuration and authorized writes
- Distributed rate limiting
- DNS/TLS/canonical redirects
- Static/audio CDN caching
- Security headers
- Health checks, logs, alerting, and rollback

Do not treat the absence of a domain-connection blocker as authorization to launch publicly. The player defect and configuration work above remain launch gates.

## 15. Recommended next action

**Exact next action:** create an isolated local fix for the persistent audio player's `isPlaying`/loading event state so the visible control and accessible label switch to Pause while audio is actually playing, verify pause and resume in at least mobile and desktop browsers, and redeploy the corrected commit to the temporary DigitalOcean app for a targeted read-only retest.

After that targeted retest passes, configure the production Turnstile/provider/rate-limit/security/cache/observability requirements and run the owner-authorized pre-domain verification before connecting `broey.net`.
