# Broey Website V1 Launch Readiness Report

Audit date: 2026-08-05  
Repository: `Broey. Website`  
Branch/commit: `main` at `f82a620af2a1b5dcb74b7a7655ab495949f203ab`  
Audit mode: read-only product audit; only the requested audit documents were added

## 1. Executive summary

The Broey site is visually polished, builds cleanly, performs well, and already supports the core artist-site journeys: visitors can discover releases, play music, reach streaming/social destinations, browse merch, learn about Broey, view press coverage, and contact or join the newsletter. Representative Lighthouse runs scored 98–100 for performance and 100 for accessibility, best practices, and SEO. All generated page routes returned successful responses; 63 unique local targets and 110 unique external URLs completed without an HTTP error in the audit crawl.

It is not safe to launch today. The intended production domain, `broey.net`, did not resolve during the audit, while the application generates canonical, sitemap, robots, JSON-LD, and sharing URLs for `https://broey.com`. That domain resolves but redirects to an Atom domain-sale page. This is a P0 blocker because a deployment cannot become the official public site, and a launch using the present metadata would advertise the wrong origin.

Seven P1 issues also need resolution: high-severity production dependency advisories, incomplete form-abuse controls, no privacy notice, a contact-form updates opt-in that does not subscribe the visitor, and three public/indexable unfinished-content cases (`/watch`, LiNK, and Paradise). Actual email delivery, newsletter creation, checkout, Vercel environment settings, and DNS ownership were not mutated or end-to-end exercised and require owner-controlled production smoke tests.

**Overall readiness: 70/100 — Deployable only with accepted risk**  
**Launch recommendation: NO-GO**

The score reflects a strong application, but a high score cannot override the P0 production-domain blocker.

## 2. Overall readiness score

| Category | Score | Max | Confidence | Evidence and deductions |
| --- | ---: | ---: | --- | --- |
| Build and technical stability | 14 | 20 | High | `npm run build`, lint, TypeScript, lock validation, and dependency-tree validation passed. Deducted for two high production advisories, no automated test suite/CI, and deprecated Next config. |
| Core routes and content completeness | 11 | 15 | High | Core pages and all 39 release paths build and render. Deducted for the public Watch placeholder, pending LiNK messaging, Paradise placeholder artwork, and a merch typo. |
| Functional behavior and integrations | 10 | 15 | Medium | Navigation, mobile menu open/close-by-link, carousel, persistent audio, merch filtering, validation, redirects, embeds, and link health were exercised. Deducted for the broken updates opt-in promise and owner-controlled provider/checkout flows not being end-to-end submitted. |
| Responsive design and visual quality | 9 | 10 | High | Visually inspected at 390×844, 430×932, 768×1024, 1440×900, and 1920×1080 with no horizontal overflow or broken active images. Deducted for undersized targets and the fixed audio-player overlay on mobile. |
| Accessibility | 9 | 10 | Medium | Representative Lighthouse accessibility scores were 100; semantics, labels, focus styling, alt text, embeds, and reduced-motion carousel behavior are sound. Deducted for menu keyboard/focus behavior, no skip link, and small touch targets. |
| SEO and social sharing | 6 | 10 | High | Unique page metadata, canonical URLs, OG/Twitter metadata, structured data, robots, sitemap, icons, and manifest exist. The origin is wrong for the intended domain; draft/indexing policy is inconsistent. |
| Performance | 7 | 8 | High | Mobile performance 98–99; desktop 100; TBT and CLS were near zero. Deducted for a lazy-loaded home LCP image, very large source/social artwork, and unverified production caching. |
| Security and privacy | 3 | 7 | High | Secrets are ignored, input validation and HTML escaping are present, and no payment code exists locally. Deducted for high advisories, incomplete abuse controls, no privacy page, and absent repo-defined security headers. |
| Deployment and operational readiness | 1 | 5 | Medium | Production build succeeds and the repo is linked to Vercel. DNS/origin are not launchable, production environment values were not independently confirmed, and monitoring/runtime policy is under-specified. |
| **Total** | **70** | **100** | **High for repository state; medium for external production state** | **The P0 blocker forces NO-GO regardless of score.** |

## 3. Launch recommendation

**NO-GO until F-001 is closed and all P1 findings are resolved or deliberately removed from the V1 surface.**

A credible V1 does not require Services, Studio, Watch, every catalog track, analytics, or a native checkout. It does require the official domain, honest finished content, safe data collection, and a dependency posture the owner accepts.

## 4. Critical blockers

### F-001 — Intended production domain and application origin are not launchable

- **Measured:** On 2026-08-05, `broey.net` did not resolve and `www.broey.net` returned NXDOMAIN. `broey.com` resolved to `52.20.84.62` and HTTPS returned a `302` redirect to `https://www.atom.com/name/Broey`.
- **Repository evidence:** `.env.local.example:1`, `README.md:27`, `content/seo.ts:5`, and `app/robots.ts:4` use `https://broey.com`. The contact email template also says `broey.com` at `app/api/contact/route.ts:93,108`.
- **Impact:** Visitors cannot reach the intended production domain. If deployed as currently configured, crawlers and shared links receive a domain that points to a sale page.
- **Resolution:** Confirm ownership of `broey.net`; add it to the Vercel project; configure apex and `www` DNS; select one canonical host and redirect the other; set `NEXT_PUBLIC_SITE_URL` to that exact HTTPS origin in Production; update repository fallbacks/examples/copy; redeploy; verify TLS, redirects, canonical tags, robots, sitemap, JSON-LD, OG/Twitter URLs, and email copy from the public deployment.
- **Owners:** Manual owner/DNS/Vercel action plus Codex-implementable code/config changes.
- **Estimate:** S–M engineering/configuration, excluding any domain acquisition or registrar delay.

## 5. Confirmed strengths

- **Clean repository baseline:** `main` matched `origin/main` (0 ahead, 0 behind) and had no pre-audit changes.
- **Stable production build:** Next.js 14.2.35 with React 18.3.1 and strict TypeScript built 56 pages successfully. App Router is used throughout.
- **Core artist journey:** Home, Music, 39 release paths, About, Contact, Press, and Merch render with coherent content and clear calls to action.
- **Music playback:** Browser testing confirmed the FREE audio advanced in time and persisted during client-side navigation from Home to `/music/free`. Range requests returned `206`, so seeking/partial delivery is supported.
- **Responsive implementation:** Five viewport classes were visually inspected. Layout, typography, navigation, carousel, release presentation, forms, and merch grids remained coherent without horizontal overflow.
- **Accessibility foundation:** One H1 per representative page, `lang="en"`, useful landmarks, labeled forms, named media embeds, focus styling, image alt text, and accessible audio controls. Representative automated audits scored 100.
- **SEO foundation:** Unique titles/descriptions/canonicals, OG/Twitter metadata, MusicRecording/MusicAlbum and breadcrumb JSON-LD, Person JSON-LD, robots, sitemap, favicons, manifest, and a generated OG image route.
- **Fast representative pages:** Mobile Lighthouse performance was 98 on Home and 99 on Contact, Merch, and `/music/free`; desktop Home was 100. TBT was 0–20 ms and CLS 0–0.005.
- **Safe baseline form handling:** Required-field validation, length limits, email validation, honeypots, user-content HTML escaping, sanitized sender names, and explicit provider-missing responses are present.
- **Secret hygiene:** `.env*.local`, `.vercel`, `api_token.txt`, and logs are ignored by Git and Vercel (`.gitignore:4-16`, `.vercelignore:4-16`); no local secret file was tracked. No secret values appear in this report.
- **Commerce boundary:** Merch is an outbound Shopify catalog with a curated fallback. There is no local Stripe/payment implementation and therefore no site-owned card-data path to secure for V1.
- **Link health:** The audit crawl found no HTTP error among 63 unique local assets/routes or 110 unique external destinations. This verifies transport health, not every destination’s editorial correctness.

## 6. Validation results

| Command/check | Completion | Result | Root cause when not successful | Launch impact |
| --- | --- | --- | --- | --- |
| `npm ci --dry-run --ignore-scripts` | Completed | Exit 0; lockfile/install plan valid | — | Pass |
| `npm ls --all` | Completed | Exit 0; dependency tree valid | — | Pass |
| `npm run lint` | Completed | Exit 0; no ESLint warnings/errors | Next also warned that `outputFileTracingIgnores` moved; `next.config.js:8` still uses it | Pass with P3 cleanup |
| `npx tsc --noEmit --incremental false` | Completed | Exit 0 | — | Pass |
| `npm run build` | Completed | Exit 0 in about 20 s; 56 pages emitted | Warnings: deprecated tracing key; Edge OG route prevents full static optimization for that route | Pass |
| `npm test` | Did not run a suite | Exit 1: `Missing script: "test"` | No test script or suite exists in `package.json` | Not an immediate runtime failure; P2 assurance gap |
| `npm run format` | Did not run a formatter | Exit 1: `Missing script: "format"` | No format script exists | Non-blocking tooling gap |
| `npx --no-install knip` | Did not run | Exit 1: `npx canceled due to missing packages and no YES option: ["knip@6.31.0"]` | Dead-code tool is not installed and audit rules prohibited installing it silently | Non-blocking; manual dead-code scan performed |
| `npm audit --omit=dev --audit-level=low` | Completed | Exit 1; 2 high production vulnerabilities | Advisories affect Next.js and bundled PostCSS; npm suggests a breaking Next 16.3.0 path | P1 |
| `npm audit --audit-level=low` | Completed | Exit 1; 8 high vulnerabilities total | Production advisories plus development-chain issues including `xlsx`, for which npm reported no fix | P1 for production subset; P2 for dev-only subset |
| `npm outdated --long` | Completed | Exit 1 with an outdated table | Current Next 14.2.35; latest reported 16.3.0. Other major upgrades also exist | Informational; do not bulk-upgrade without migration testing |
| Generated-route HTTP crawl | Completed | All page routes 200; `/gate` 307 to `/`; unknown route 404 with `noindex` | — | Pass, with route-specific content findings |
| Local target crawl | Completed | 63 unique local href/src targets, none >=400 | — | Pass |
| External URL crawl | Completed | 110 unique URLs reached a 2xx/3xx final response | Semantic/editorial accuracy was not exhaustively assessed | Pass with limitation |
| Lighthouse 12.8.2 | Completed | See measured results below | Local production server and installed Chrome | Pass |

### Measured Lighthouse results

| Page/profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS | Transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Home/mobile | 98 | 100 | 100 | 100 | 0.9 s | 2.4 s | 0 ms | 0 | 228 KiB |
| Home/desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0.005 | 536 KiB |
| Contact/mobile | 99 | 100 | 100 | 100 | — | 2.2 s | 20 ms | 0 | 179 KiB |
| Merch/mobile | 99 | 100 | 100 | 100 | — | 2.2 s | 10 ms | 0 | 189 KiB |
| `/music/free`/mobile | 99 | 100 | 100 | 100 | — | 2.2 s | 10 ms | 0 | 440 KiB |

These are local lab measurements, not production field data.

## 7. Detailed findings by severity

### P0 — Critical

- **F-001: Production domain/origin mismatch.** See the full blocker in section 4.

### P1 — Must resolve before V1

- **F-002: High-severity production dependency advisories.** `npm audit --omit=dev` reports two high findings in the deployed tree (Next.js and PostCSS). Evaluate the official supported upgrade path, upgrade in a dedicated change, and repeat lint/type/build/Lighthouse/route smoke tests. Size XL because npm’s suggested fix crosses a major Next version.
- **F-003: Public forms lack a complete abuse-control strategy.** Contact has a honeypot and optional Turnstile, but local Turnstile keys were absent; Newsletter has a honeypot only. Neither route implements rate limiting. Activate Turnstile or an equivalent challenge where appropriate and add edge/server-side throttling with a documented quota/abuse response. Evidence: `components/sections/ContactForm.tsx:18,114-123`; `app/api/contact/route.ts:121-162`; `app/api/newsletter/route.ts`.
- **F-004: Data collection has no public privacy notice.** Contact and newsletter collect personal data, but no Privacy/Terms route or footer link exists. Publish owner/legal-approved, plain-language disclosure covering purpose, providers, retention/contact, and unsubscribe rights; link it at collection points and in the footer.
- **F-005: Contact updates opt-in does not perform the promised action.** The checkbox at `components/sections/ContactForm.tsx:145-148` offers email updates, but `app/api/contact/route.ts:97,112,260,337` only copies the answer into the Resend message; it never calls MailerLite. Connect an explicit MailerLite subscription with consent evidence or remove the checkbox before launch.
- **F-006: `/watch` is a public, indexable placeholder.** `content/watch.ts:27,65,70,75` exposes “Video archive coming soon,” “Coming soon,” “Queued,” and “In progress.” It is hidden from navigation and sitemap but returns 200 with a canonical URL. For the smallest V1, make it unavailable/noindex until it has finished content.
- **F-007: LiNK is promoted while its public links are explicitly pending.** LiNK appears in the home carousel and sitemap; `content/releases.ts:513-524` says platform links are being verified/pending and offers only local/Disco access. Either confirm and publish the intended public destinations and revise the copy or remove it from highlighted/indexable V1 surfaces.
- **F-008: Paradise exposes placeholder artwork/content.** `/music/paradise` is indexable and in the sitemap while `content/releases.ts:2456` says “Paradise artwork pending”; no local cover/audio is present. Streaming links work, but visible placeholder content violates the requested V1 standard. Add approved artwork/content or temporarily exclude/noindex it.

### P2 — Important, acceptable only with explicit risk

- **F-009:** `SITE_VISIBILITY` is documented as a preview gate, but `lib/site-visibility.ts:7-13` hardcodes public behavior and ignores the variable. Restore configuration-aware behavior so previews cannot accidentally become indexable.
- **F-010:** Twenty-two project-track routes are intentionally absent from the sitemap but remain indexable and internally linked. Define a single index/noindex policy and implement it; the unused release indexing field should drive metadata and sitemap behavior.
- **F-011:** The mobile menu opens and closes when a link is followed, but Escape did not close it and source review found no focus capture/return. Add Escape, focus management, and appropriate outside-dismiss behavior.
- **F-012:** Several interactive targets are shorter than the recommended 44 CSS px, including release “Open” links (about 25 px high) and the 36 px mobile-menu button. Increase target boxes without changing the visual language.
- **F-013:** There is no automated test suite, format command, or CI workflow. Add focused tests for route generation, form validation/provider failure, release registry integrity, and core browser journeys; run lint/type/build in CI.
- **F-014:** Local responses do not define CSP, HSTS, Referrer-Policy, Permissions-Policy, or X-Content-Type-Options and expose `X-Powered-By: Next.js`. Define and verify a production-appropriate header policy in application/Vercel config.
- **F-015:** The full development tree reports additional high advisories, including `xlsx` with no available fix. Keep production and tooling risk separate; remove/replace unused vulnerable tooling or document containment.
- **F-016:** Shopify code requests Storefront API `2025-01` (`lib/shopify-merch.ts:5,222`), but the response reported `2025-10`, indicating version fall-forward. Move to a supported pinned version and regression-test the query before Shopify removes compatibility.
- **F-017:** Public assets total about 322.6 MB (about 256.9 MB audio and 65.7 MB images); some artwork is 3–3.8 MB and 3000–4320 px. The home LCP image is not marked priority (`components/ui/ReleaseCarouselTile.tsx:200-207`). Optimize source/social assets and prioritize only the initial LCP candidate.
- **F-018:** Local static audio returned range responses correctly but `Cache-Control: max-age=0`. Confirm immutable/CDN caching on Vercel for versioned art/audio assets and avoid revalidating large files unnecessarily.
- **F-019:** Unknown routes return a correct 404 with `noindex`, but only Next’s default UI is present; there are no route `loading.tsx`, `error.tsx`, or custom `not-found.tsx` files. Add brand-consistent recovery where asynchronous/external content can fail.
- **F-020:** Merch content says “Crewbeck” in visible title, URL, and alt text (`content/merch.ts:71,76,78`), likely a typo for “Crewneck.” Correct both Shopify and fallback data after owner confirmation.
- **F-021:** No analytics, real-user performance telemetry, or error monitoring integration was found. Add privacy-appropriate operational visibility shortly after launch, and preferably basic server/API error alerting before it.

### P3 — Post-launch enhancement

- **F-022:** Several legacy components appear unreferenced outside their own files (Hero, FeaturedRelease, HomepageMerchSection, HomepageConnectSection, AboutPreview, StayConnected, MerchPreview, BroeyAudioPlayer, ActionLinkGrid). The only missing source-referenced asset found belongs to unused Hero. Confirm with tooling, then remove or archive deliberately.
- **F-023:** `app/sitemap.ts` uses the current time as `lastModified` instead of a content date, causing artificial freshness. Use release/content modification dates.
- **F-024:** Deployment hygiene is under-specified: no package `engines`/runtime pin is present, and Vercel’s source upload still includes reports/scripts/data not needed by runtime. Pin a supported Node version and reduce build context after launch stability.
- **F-025:** No Services or Studio page/section exists. Nothing in current navigation promises either, so both are valid future-scope items rather than launch blockers.

### Needs verification

- **F-026:** Actual Resend delivery and MailerLite subscriber creation were not triggered because they create external records/messages. Read-only checks verified the configured MailerLite group (HTTP 200) and a verified Resend sender domain (HTTP 200). Run controlled production submissions and inspect the inbox/list record.
- **F-027:** The repository is linked to a Vercel project, but the audit did not query or change its production environment variables, deployment aliases, DNS ownership, log retention, region, or runtime configuration. Confirm these in the owner’s Vercel account.
- Shopify exposed six products via a successful tokenless Storefront GraphQL request, and category filtering worked. A purchase/checkout was not attempted; complete a production cart-to-checkout smoke test without placing an unintended order.
- Only Chromium-based visual/browser behavior was directly exercised. Safari/iOS and Firefox should receive a short real-device/browser smoke pass.

## 8. Route inventory summary

The complete route-by-route table is in `V1_ROUTE_INVENTORY.md`.

| Surface | Count/state | Summary |
| --- | --- | --- |
| Core static pages | 7 | `/`, `/music`, `/merch`, `/about`, `/contact`, `/press`, and `/watch`; all returned 200. Watch is unfinished. |
| Utility pages | 2 | `/design-system` is public but `noindex,nofollow`; `/gate` redirects to `/` because visibility is hardcoded public. |
| Dynamic release pages | 39 | All generated, returned 200, and had unique title/H1/canonical. Seventeen are in sitemap; 22 project tracks are omitted but indexable. |
| APIs | 3 | Contact, newsletter, and gate endpoints; validation/error paths exercised without creating external records. |
| Metadata endpoints | 4 | `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, and generated OG image route. |
| Missing route behavior | Correct HTTP behavior | Unknown paths return 404 with `noindex`, using the default Next UI. |

## 9. Integration status

| Integration | Status | Evidence | Launch action |
| --- | --- | --- | --- |
| MailerLite | Configuration/provider read-only verified; write flow unverified | Key/group were present locally without values being printed; group lookup returned 200. Newsletter validation/error behavior works. | Submit a controlled production signup, confirm group membership and confirmation/unsubscribe behavior, then remove the record if appropriate. |
| Resend | Configuration/domain read-only verified; delivery unverified | API/domain lookup returned 200 and listed the sender domain as verified. Contact validation/error paths work. | Submit a controlled production message and verify delivery, reply-to, spam placement, and provider logs. |
| Turnstile | Code exists; local activation absent | Both `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` were absent locally; the contact API skips verification without the secret. | Configure matched production keys and test success/failure, then add rate limiting. |
| Shopify | Catalog read verified; checkout unverified | Storefront GraphQL returned 200, six collection products, and no GraphQL errors; browser category filtering worked. API version fell forward. | Pin a supported version and smoke-test product/cart/checkout on production. |
| Streaming/social/video links | Transport verified | 110 external URLs reached 2xx/3xx; embeds have titles and YouTube uses privacy-enhanced host. | Owner should spot-check editorial destination/account accuracy. |
| Stripe/payment | Not present and not required by current design | No Stripe dependency, route, or checkout implementation found; merch links leave the site for Shopify. | No V1 action unless native payment is newly added. |
| Analytics/error monitoring | Not implemented | No analytics/tracking/monitoring integration found. | Optional analytics after privacy approval; basic error monitoring is recommended early. |

## 10. Deployment readiness

### Repository-verified

- Production build, lint, and strict type check pass.
- App Router routes and 39 dynamic paths generate successfully.
- Shopify is server-compatible and has a curated local fallback.
- Remote image patterns permit Shopify hosts.
- Local secret files and Vercel metadata are ignored.
- The repo contains no required native build dependency; optional `sharp` was absent locally, producing only a self-hosting optimization warning.

### Required environment variables for active V1 behavior

Do not copy values into this report. Confirm values separately for Vercel Production and Preview.

- Origin/access: `NEXT_PUBLIC_SITE_URL`, `SITE_VISIBILITY`, optionally `SITE_PASSCODE` after F-009.
- Newsletter: `MAILERLITE_API_KEY`, `MAILERLITE_GROUP_ID`.
- Contact: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optionally `RESEND_FROM_NAME`.
- Abuse controls: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- Merch: `SHOPIFY_STORE_DOMAIN`, optionally `SHOPIFY_MERCH_COLLECTION_HANDLE`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
- Catalog-sync credentials are not required for normal page runtime unless a deployment build starts running those scripts.

### Manual Vercel/DNS checks

- Verify domain ownership, apex/`www` DNS, TLS, canonical redirect, and project production alias.
- Confirm `NEXT_PUBLIC_SITE_URL=https://broey.net` or the owner-approved canonical equivalent.
- Ensure public production visibility and private/noindex previews after F-009.
- Confirm Node runtime version, region, function timeouts, environment scoping, and no preview secrets leak into client bundles.
- Verify production response headers and asset caching at the CDN, not only local `next start`.
- Review function logs after controlled contact/newsletter submissions.

## 11. Remaining effort estimate

### Minimum credible V1

- **Engineering:** approximately **18–32 hours** (XL overall). The largest uncertainty is the security-supported Next upgrade/migration and regression pass. Hiding unfinished routes/content is the low-effort V1 choice; finishing them would increase scope.
- **Manual/configuration/owner work:** approximately **4–8 hours**, excluding registrar propagation, domain purchase/transfer, legal review turnaround, or content/asset creation.

### Critical path

1. Confirm ownership and canonical-host decision for `broey.net`; attach/configure it in Vercel and update all origin references.
2. Remediate the production dependency advisories on an isolated branch; rerun the entire technical and browser validation set.
3. Publish privacy disclosure, activate abuse controls/rate limiting, and resolve the misleading contact opt-in.
4. Hide or complete Watch, LiNK, and Paradise; approve the smallest V1 content set.
5. Configure and verify Vercel Production/Preview variables and headers.
6. Deploy a production candidate and run owner-controlled form, Shopify checkout, DNS/TLS, metadata, mobile, and browser smoke tests.

### Task-size summary

| Workstream | Severity | Size | Codex | Manual/external dependency |
| --- | --- | --- | --- | --- |
| Domain/origin code updates and verification helpers | P0 | S–M | Yes | Domain ownership, DNS, and Vercel access required |
| Next/PostCSS security remediation and regression | P1 | XL | Yes | Owner acceptance of major-upgrade risk |
| Turnstile/rate limiting | P1 | M | Yes | Cloudflare/Vercel credentials and quotas |
| Privacy page/links | P1 | S–M | Yes after copy approval | Owner/legal approval required |
| Contact opt-in correction | P1 | S–M | Yes | Owner decides subscribe vs remove; MailerLite behavior |
| Hide/complete Watch, LiNK, Paradise | P1 | XS–M for smallest scope | Yes | Owner content/link/art approval |
| Production smoke tests and Vercel settings | Required | M | Partly | Owner accounts and intentional test records/order |
| P2 hardening/accessibility/performance | P2 | L–XL combined | Yes | Some provider/Vercel decisions |

## 12. Recommended V1 scope

Ship the smallest finished public surface:

- Home with only release cards whose artwork and destinations are approved.
- Music archive plus complete release pages; temporarily exclude/noindex unfinished LiNK/Paradise content unless completed.
- About, Press, Contact, and outbound Shopify Merch.
- Header/footer links for Music, Merch, About, Press, and Contact.
- Newsletter and contact data collection only after privacy, consent, abuse controls, and end-to-end provider checks.
- Correct `broey.net` production origin, sitemap, robots, JSON-LD, sharing URLs, and redirects.

Do not include Watch, Design System, Gate UI, Services, or Studio in the public V1 navigation. Design System can remain `noindex` if direct production access is intentional; otherwise restrict it.

## 13. Deferred V1.1 improvements

- Services and Studio content.
- Full Watch/video archive.
- Analytics and richer marketing attribution after privacy approval.
- Custom 404/error/loading experiences.
- Comprehensive CI/browser tests and dead-code cleanup.
- Catalog architecture/style-sheet modularization.
- Image/audio optimization and explicit immutable cache policy.
- More complete focus management, skip navigation, and target-size polish.
- Accurate sitemap modification timestamps.

## 14. Audit limitations and unverified items

- External checks reflect the state observed on 2026-08-05 and may change.
- No production deployment was created, aliased, or modified.
- No DNS, Vercel, Resend, MailerLite, Shopify, or Cloudflare setting was changed.
- Provider read-only APIs were checked, but no email, subscriber, checkout, or payment record was intentionally created.
- The local environment’s variable names/presence were inspected without printing secret values; Vercel Production values were not independently read.
- Lighthouse is a local lab result; no Core Web Vitals field data exists.
- Browser visual/interaction checks used a Chromium surface at five viewport classes; Safari/iOS and Firefox were not directly exercised.
- External crawling establishes HTTP reachability, not trademark, licensing, content ownership, account ownership, or destination correctness.
- Automated dead-code tooling was unavailable without installation; unused-code findings are a manual import/reference inference.
- This is a launch-readiness engineering/product audit, not legal advice or a penetration test.

## Final decision

**NO-GO.** The site is close at the application layer, but launch must wait for a working official domain/canonical origin and the P1 security, privacy, consent, abuse-control, and unfinished-content items. Once those are closed, the existing build quality and measured performance suggest a short final production-candidate validation cycle rather than a redesign.
