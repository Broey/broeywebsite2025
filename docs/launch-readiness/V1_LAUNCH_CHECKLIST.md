# Broey Website V1 Launch Checklist

Audit date: 2026-08-05  
Current recommendation: **NO-GO**  
Current score: **70/100**

Legend: `[x]` verified during the audit; `[ ]` still required. “Owner” means the item needs a decision, approval, account, or external-service access. “Codex” means it can be implemented in the repository once authorized.

## Must complete before launch

- [ ] **P0 / Owner:** Confirm ownership and intended canonical host for `broey.net`.
- [ ] **P0 / Owner:** Add the apex and `www` domain to the correct Vercel project and configure registrar DNS.
- [ ] **P0 / Owner:** Select the canonical host (`broey.net` or `www.broey.net`) and configure the other as a permanent redirect.
- [ ] **P0 / Codex + Owner:** Replace all `broey.com` fallbacks/examples/email copy with the approved origin and set `NEXT_PUBLIC_SITE_URL` in Vercel Production.
- [ ] **P0 / Owner:** Verify public DNS, TLS, redirect, home response, and domain ownership from outside the owner’s network.
- [ ] **P1 / Codex:** Remediate the two high production dependency advisories using a supported Next/PostCSS path.
- [ ] **P1 / Codex:** Rerun lint, strict type check, production build, route crawl, Lighthouse, and browser smoke tests after dependency changes.
- [ ] **P1 / Owner + Codex:** Choose and implement a public privacy disclosure; link it from footer and forms.
- [ ] **P1 / Owner + Codex:** Resolve the contact “email updates” checkbox by either creating a consented MailerLite subscription or removing the promise.
- [ ] **P1 / Owner + Codex:** Activate a complete form-abuse strategy: matched Turnstile keys/equivalent plus server/edge rate limiting.
- [ ] **P1 / Owner:** Approve the smallest content scope for Watch, LiNK, and Paradise.
- [ ] **P1 / Codex:** Hide/noindex unfinished Watch, LiNK, and Paradise content unless approved final content is supplied.
- [ ] **Required / Owner:** Complete controlled production contact, newsletter, and Shopify checkout smoke tests.
- [ ] **Required / Owner:** Give final content, legal/privacy, merch, streaming-link, and launch approval.

## Technical validation

- [x] Repository was clean and `main` matched `origin/main` before audit documents were created.
- [x] `npm ci --dry-run --ignore-scripts` completed successfully.
- [x] `npm ls --all` completed successfully.
- [x] `npm run lint` completed with no lint warnings/errors.
- [x] `npx tsc --noEmit --incremental false` completed successfully.
- [x] `npm run build` completed successfully and generated 56 pages.
- [x] All discovered page routes returned expected 200/307/404 responses locally.
- [x] All 63 unique local href/src targets completed without an HTTP error.
- [x] All 110 crawled external URLs reached a 2xx/3xx final response.
- [ ] Add an automated `test` script and focused test suite; `npm test` currently reports `Missing script: "test"`.
- [ ] Add lint/type/build/test CI for pull requests and the production branch.
- [ ] Add a formatter script/config or document the chosen formatting workflow.
- [ ] Install/configure a dead-code checker if desired; `npx --no-install knip` could not run because Knip is not installed.
- [ ] Remove the deprecated `experimental.outputFileTracingIgnores` key after confirming the existing excludes cover required routes.
- [ ] Pin a supported Node runtime in repository/Vercel configuration.
- [ ] Re-run `npm audit --omit=dev` and require no unaccepted high/critical production findings.
- [ ] Review the dev-only `xlsx` advisory and remove/replace/contain the dependency.

## Content approval

- [x] Home communicates music-first positioning and offers clear discovery/play paths.
- [x] Music archive and 39 generated release/track paths contain registry-backed content.
- [x] About and Press provide meaningful artist context and proof.
- [x] Merch loads six Shopify products with a local fallback.
- [ ] Approve every home carousel card and its release status.
- [ ] Supply verified public platform links and final copy for LiNK, or remove it from V1 highlight/index surfaces.
- [ ] Supply approved Paradise artwork/local content, or exclude/noindex it for V1.
- [ ] Finish the Watch archive, or make `/watch` unavailable/noindex for V1.
- [ ] Confirm whether “Crewbeck” is a typo; if so, correct Shopify source data and `content/merch.ts:71,76,78`.
- [ ] Owner spot-check every social, streaming, press, Discord, email, and merch destination for editorial/account accuracy.
- [ ] Confirm rights/licensing for every image, audio file, embed, press logo, font, and promotional asset.
- [ ] Confirm Services and Studio are intentionally deferred and remain absent from navigation/copy.

## Mobile and browser validation

- [x] Small mobile (390×844) visually checked on Home and `/music/free`.
- [x] Large mobile (430×932) visually checked on Contact.
- [x] Tablet (768×1024) visually checked on Merch.
- [x] Standard desktop (1440×900) visually checked on Home.
- [x] Wide desktop (1920×1080) visually checked on About.
- [x] No horizontal overflow or broken active images appeared in the checked views.
- [x] Mobile menu opens, exposes expanded state, follows links, and closes after navigation.
- [x] Home audio playback starts and persists across client-side navigation.
- [x] Merch category filtering updates visible items and its result summary.
- [ ] Make the mobile menu close on Escape and implement focus capture/return.
- [ ] Increase short touch targets, including the mobile-menu button and release “Open” links, toward 44×44 CSS px.
- [ ] Review the fixed global audio player over long mobile pages; provide adequate safe-area/scroll clearance or a minimize/close behavior.
- [ ] Smoke-test current iOS Safari on a real iPhone, including audio playback, menu, forms, safe areas, and embeds.
- [ ] Smoke-test current macOS Safari and Firefox desktop.
- [ ] Smoke-test one Android Chrome device, including audio, keyboard opening, forms, and Shopify handoff.
- [ ] Confirm disabled/loading/error states under slow network and provider failure.

## Accessibility

- [x] Representative Lighthouse accessibility audits scored 100.
- [x] Document language, headings, landmarks, image alt text, form labels, and named controls were present on representative pages.
- [x] Focus styling and carousel keyboard controls are implemented.
- [x] Carousel autoplay honors reduced-motion preference.
- [x] YouTube/Disco embeds have accessible titles; YouTube uses the privacy-enhanced host.
- [ ] Add a skip-to-main-content link.
- [ ] Fix mobile-menu Escape, focus containment/initial focus, and trigger focus return.
- [ ] Bring short interactive targets up to an appropriate touch size.
- [ ] Perform a full keyboard-only pass on the production candidate.
- [ ] Perform a short VoiceOver or NVDA pass on Home, Music, a release, Contact, and Merch.
- [ ] Verify focus and status announcements for real contact/newsletter success and provider errors.
- [ ] Recheck contrast and focus appearance against the final production assets in Safari and high-contrast/forced-colors mode.

## SEO and social sharing

- [x] Core and release pages generate unique titles and descriptions.
- [x] Canonicals, OG metadata, Twitter/X cards, robots, sitemap, favicons, manifest, and OG-image route exist.
- [x] Release pages generate music and breadcrumb structured data; About generates Person data.
- [x] `/design-system` is `noindex,nofollow`.
- [x] Unknown routes return 404 with `noindex`.
- [ ] Set the canonical production origin to the approved `broey.net` HTTPS host everywhere.
- [ ] Verify `robots.txt`, `sitemap.xml`, canonical, JSON-LD, OG image URLs, and share URLs from the public domain.
- [ ] Decide whether all 22 project-track routes should be indexed; align robots metadata, internal linking, and sitemap inclusion.
- [ ] Remove unfinished Watch/LiNK/Paradise pages from indexing until complete.
- [ ] Replace sitemap request-time `lastModified` values with real content dates.
- [ ] Optimize multi-megabyte release/social artwork while preserving quality.
- [ ] Use platform share debuggers or equivalent fetch tests for Home and representative release pages after DNS is live.
- [ ] Submit/inspect the sitemap in owner-controlled search tooling after launch.

## Forms and integrations

- [x] Contact required fields, email, name/subject/message limits, and 5,000-character maximum are validated server-side.
- [x] Contact user content is HTML-escaped and the sender display name is newline/quote sanitized.
- [x] Contact and newsletter include honeypot handling.
- [x] MailerLite configured group lookup returned HTTP 200 without creating a subscriber.
- [x] Resend domain lookup returned HTTP 200 and showed the configured sender domain as verified.
- [x] Shopify Storefront query returned HTTP 200 with six products and no GraphQL errors.
- [ ] Configure paired `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` for Production.
- [ ] Add and test server/edge rate limits for contact and newsletter endpoints.
- [ ] Decide and document abuse/quota behavior if Resend, MailerLite, or Turnstile is unavailable.
- [ ] Run a production contact submission; confirm delivery, From, Reply-To, formatting, spam placement, and Resend logs.
- [ ] Run a production newsletter submission; confirm intended group, consent state, duplicate behavior, confirmation flow, and unsubscribe.
- [ ] Correct/remove the contact updates opt-in before the production test.
- [ ] Pin Shopify to a currently supported Storefront API version and regression-test the product query.
- [ ] Open each product from production and complete cart-to-checkout smoke testing without an unintended purchase.
- [ ] Confirm fallback merch remains usable during simulated Shopify failure.
- [ ] Do not add Stripe/native payments to V1 unless the scope and security review are reopened.

## Vercel and DNS

- [x] Local production build succeeds with the existing App Router/serverless routes.
- [x] A `.vercel/project.json` link exists locally; IDs were not reproduced in the audit.
- [x] `.env*.local`, `.vercel`, `api_token.txt`, and logs are excluded from Git and Vercel uploads.
- [ ] Confirm the local Vercel link targets the intended production project/team.
- [ ] Confirm ownership/availability of `broey.net` before changing application metadata.
- [ ] Add apex and `www` to Vercel and configure registrar DNS exactly as Vercel specifies.
- [ ] Select and verify one canonical host plus permanent redirect from the alternate host.
- [ ] Confirm TLS certificate issuance and renewal.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the canonical host in Production.
- [ ] Restore env-aware `SITE_VISIBILITY`; set Production public and Preview private/noindex as intended.
- [ ] Verify all required provider variables in Vercel Production without copying secret values into tickets/docs.
- [ ] Confirm Preview and Development receive only the minimum scoped credentials.
- [ ] Confirm supported Node runtime, function region/timeouts, and build command.
- [ ] Add/verify CSP, HSTS, Referrer-Policy, Permissions-Policy, X-Content-Type-Options, and removal of `X-Powered-By` where appropriate.
- [ ] Verify immutable/CDN caching for versioned art/audio and working byte-range requests from the public domain.
- [ ] Confirm production deployment contains no `.env.local`, `api_token.txt`, debug outputs, or unnecessary private source artifacts.

## Analytics and monitoring

- [x] No analytics/tracking code was found, so there is no current analytics-cookie disclosure mismatch.
- [ ] Decide whether V1 needs privacy-preserving analytics; do not add it before privacy/cookie review.
- [ ] Add basic server/API error monitoring or alerting for contact, newsletter, and Shopify degradation.
- [ ] Define owner-accessible dashboards/alerts for Resend failures/quota, MailerLite failures, and Vercel function errors.
- [ ] Establish a simple availability check for the canonical home page, sitemap, contact API, and merch page.
- [ ] Establish Core Web Vitals/real-user monitoring after enough public traffic exists.
- [ ] Document who owns production incidents and how to disable a failing form/integration safely.

## Post-deployment smoke test

- [ ] From a clean network/device, load both apex and `www`; confirm one 200 and one permanent redirect.
- [ ] Confirm HTTPS, no mixed content, and correct canonical host on every sampled page.
- [ ] Verify Home, Music, one single, one EP/project, About, Press, Contact, and Merch.
- [ ] Verify unknown URL returns 404/noindex and utility/draft routes are restricted or noindex as decided.
- [ ] Verify `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, favicons, default OG image, and release OG metadata.
- [ ] Play audio, navigate to another route, pause/resume, seek, and test mobile safe-area behavior.
- [ ] Open a video/Disco embed and representative streaming/social/press destinations.
- [ ] Submit one approved contact message and one approved newsletter signup; verify provider records and UI states.
- [ ] Exercise Turnstile and rate limiting, including a rejected/expired challenge and a throttled request.
- [ ] Open Shopify products and reach checkout; do not place an unintended order.
- [ ] Test small/large mobile, tablet, standard/wide desktop, keyboard-only, Safari, Firefox, and Android Chrome samples.
- [ ] Check browser console, Vercel logs, Resend logs, MailerLite activity, and Shopify errors.
- [ ] Run a production Lighthouse sample and record it separately from local baseline numbers.
- [ ] Confirm no draft/placeholder words are visible or indexed.

## First-week post-launch monitoring

- [ ] Check uptime/TLS/DNS at least daily and after any DNS change.
- [ ] Review Vercel function/build logs for new errors, timeouts, and unexpected traffic.
- [ ] Review contact/newsletter success and failure counts without exposing message content or personal data.
- [ ] Review Resend/MailerLite quotas, reputation, bounces, spam complaints, duplicate subscribers, and abuse attempts.
- [ ] Review Shopify catalog availability, outbound product links, and checkout handoff.
- [ ] Inspect search-engine crawl/index coverage, sitemap ingestion, canonical selection, and structured-data errors.
- [ ] Review real-user Core Web Vitals and production asset transfer/caching behavior.
- [ ] Spot-check Home and one release share preview after caches refresh.
- [ ] Record user-reported accessibility/mobile/audio defects and prioritize regressions over new V1.1 features.
- [ ] Rotate/revoke any credential suspected of exposure; never paste secrets into issue trackers or audit documents.
- [ ] Schedule P2/P3 backlog triage after the public site is stable.
