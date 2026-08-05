# Broey Website V1 Remediation Plan

Plan date: 2026-08-05  
Source audit: `docs/launch-readiness/V1_LAUNCH_READINESS_REPORT.md`  
Target canonical origin: `https://broey.net`  
Planning constraint: no fixes, dependency changes, environment changes, deployments, or external-service mutations were made while producing this plan

## Executive recommendation

The smallest safe V1 is the existing mature artist site with only finished core surfaces exposed:

- Home, Music, approved release pages, About, Press, Contact, Privacy, and outbound Shopify Merch.
- The dedicated MailerLite form is the only newsletter-subscription path.
- `/watch`, LiNK, and Paradise return 404/not-found behavior and are absent from carousel, archive, sitemap, and other discoverable surfaces until approved.
- `https://broey.net` is the only generated application origin; `www.broey.net` permanently redirects to it.
- Contact and newsletter retain their honeypots, add shared Turnstile verification, and receive basic Vercel WAF rate limits.
- All P0/P1 items are closed before launch. F-009 is also pulled forward because Preview visibility cannot be configured safely while `SITE_VISIBILITY` is ignored.

The dependency work must be isolated. There is no patched release in the Next.js 14 line. The recommended security path is **Option C: a separately reviewable migration to the audited current major set—Next.js 16.3.0, React/React DOM 19.2.8, ESLint 10.8.0, and matching Next/React type packages**. It is the only examined upstream-published package tree that both clears the audited Next ranges and carries patched PostCSS 8.5.23 without a transitive override.

## 1. Recommended minimum V1 scope

### Public surfaces

- `/`
- `/music`
- Only releases present in the post-remediation public release collection
- `/merch`
- `/about`
- `/contact`
- `/press`
- `/privacy`
- Generated `robots.txt`, `sitemap.xml`, manifest, icons, and sharing images
- Contact API, newsletter API, and private-preview gate behavior

### Required journeys

- Discover and play highlighted music.
- Continue audio playback across client-side navigation.
- Browse the approved music catalog and reach verified streaming destinations.
- Browse Shopify-backed merch and hand off to Shopify checkout.
- Read artist and press information.
- Send a contact message through Resend.
- Subscribe through the dedicated MailerLite form.
- Read a concise privacy notice before or from either data-collection surface.

### Required operational posture

- Apex `broey.net` is canonical.
- `www.broey.net` returns a permanent redirect to the equivalent apex URL.
- Production fails to build when its canonical origin is missing or invalid.
- Preview deployments are private/noindex behind the existing gate; Production is public.
- Turnstile validates both forms server-side; production misconfiguration fails closed.
- Vercel WAF rate-limits both form endpoints without adding Redis or another datastore.
- The production dependency audit has no unaccepted high or critical finding.

## 2. Explicitly deferred scope

The following are not prerequisites for V1 unless implementation reveals a direct dependency on a launch blocker:

- Completing Watch or creating replacement video content.
- Creating LiNK platform links or rewriting its release story.
- Creating/finding Paradise artwork or replacement media.
- Services or Studio routes/sections.
- Native Stripe/payment functionality.
- Analytics or marketing attribution.
- Custom 404/error/loading design.
- Global security-header program beyond headers directly required by the chosen Turnstile/provider implementation.
- Broad accessibility polish, media optimization, cache tuning, dead-code cleanup, catalog refactors, or stylesheet modularization.
- Automated test/CI expansion beyond focused validation necessary for changed launch-blocker paths.

### Post-launch audit backlog

- **F-010:** Project-track index/sitemap policy.
- **F-011:** Mobile-menu Escape/focus management.
- **F-012:** Touch-target sizing.
- **F-013:** Full test suite and CI.
- **F-014:** Complete security-header policy.
- **F-015:** Development-only dependency advisories, including `xlsx`.
- **F-016:** Shopify Storefront API version update.
- **F-017:** Large artwork and home LCP optimization.
- **F-018:** Production media cache policy.
- **F-019:** Custom loading/error/not-found recovery.
- **F-020:** Owner-confirmed “Crewbeck” correction.
- **F-021:** Analytics/error monitoring.
- **F-022:** Legacy/dead component cleanup.
- **F-023:** Content-based sitemap modification dates.
- **F-024:** Broader deployment/source-upload hygiene after the dependency migration.
- **F-025:** Services and Studio future scope.

F-009 is intentionally not deferred: Production/Preview visibility configuration in Phase 3 depends on restoring its repository behavior.

## 3. Owner decisions and inputs required

| Decision/input | Default used by this plan | Needed by | Blocking effect |
| --- | --- | --- | --- |
| Confirm `broey.net` ownership and registrar control | Apex is canonical; `www` permanently redirects to apex | Phase 0 before public configuration | P0 remains open without it |
| Confirm the local `.vercel` link points to the intended project/team | Use the existing project only after owner confirmation | Phase 0 | Prevents configuring the wrong project |
| Confirm DNS changes will use the records Vercel currently supplies | Do not hardcode historical Vercel IP/CNAME values | Phase 3 | Domain/TLS cannot be completed |
| Approve privacy facts/copy | Use a concise factual notice; no promises beyond approved facts | Phase 1 privacy commit | Privacy route cannot be finalized |
| Approve data collected | Contact: first/last name, email, subject, message, source, and abuse-check data; Newsletter: email, source, and abuse-check data | Phase 1 | Required privacy detail |
| Approve purposes | Reply to inquiries; operate the requested mailing list; prevent abuse; maintain service reliability | Phase 1 | Required privacy detail |
| Approve Resend disclosure | Resend processes contact-form email delivery | Phase 1 | Required privacy detail |
| Approve MailerLite disclosure | MailerLite stores/manages newsletter subscribers and unsubscribe state | Phase 1 | Required privacy detail |
| Approve Cloudflare/Vercel abuse-control disclosure | Turnstile and Vercel Firewall process request/browser/network signals for abuse prevention | Phase 1 | Required privacy detail |
| Approve retention/deletion wording and request channel | Do not state a fixed retention term unless the owner can honor it; identify how deletion questions are requested | Phase 1 | Required privacy detail |
| Approve unsubscribe wording | Use the link in each marketing email; identify a contact path for problems | Phase 1 | Required privacy detail |
| Confirm public contact email | Reuse `siteConfig.contact.email` only after owner confirmation | Phase 1 | Privacy/contact copy incomplete otherwise |
| Supply privacy effective date | Owner-approved date, not automatically the implementation date | Phase 1 | Privacy copy incomplete otherwise |
| Confirm LiNK/Paradise launch disposition | Hide both by setting existing visibility to draft | Phase 1 | Only blocks re-inclusion, not the default hide plan |
| Confirm Watch launch disposition | Return not found; leave draft data for later | Phase 1 | Only blocks re-inclusion, not the default hide plan |
| Confirm Vercel WAF rate limiting is available/acceptable for the project plan | Use WAF, not an application datastore | Phase 3 | If unavailable, choose a small external counter service before launch |
| Confirm provider credentials and sender/list targets | Production Resend, MailerLite, Turnstile, and Shopify values are owner-controlled | Phase 3 | Forms/merch cannot be production-verified |
| Confirm dependency migration approval | Use exact Option C versions in an isolated branch; no force flags | Phase 2 | F-002 remains open without it |

The implementation can begin with hiding unfinished content and preparing code structure, but it should not finalize privacy text or production configuration until the relevant owner inputs are supplied.

## 4. Phase-by-phase implementation plan

### 4.1 Watch, LiNK, and Paradise

#### `/watch`: `notFound()`

Plan:

- Reduce `app/watch/page.tsx` to a deliberate V1 unavailable route that calls Next.js `notFound()`.
- Remove the page’s public metadata and placeholder-content imports.
- Keep `content/watch.ts` as non-public draft material for later rather than deleting owner content.
- Keep Watch absent from navigation and sitemap.

Why this is cleaner than `noindex`: `noindex` would still let visitors reach a visibly unfinished page. `notFound()` removes the public promise, returns the correct status, and allows reactivation later without producing replacement content.

Why no new feature flag: Watch has no existing visibility model, and an environment flag would create configuration branches for a route that is simply out of V1 scope. A direct V1 `notFound()` is easier to test and harder to misconfigure.

#### LiNK and Paradise: existing `visibility: "draft"`

Plan:

- Set both release entries to `visibility: "draft"` in `content/releases.ts`.
- Remove the stale explicit `"link"` entry from the current-era list in `app/music/page.tsx`.
- Do not create replacement content or artwork.

Why this is the cleanest option: the release model already supports `"draft"`, and the exported `releases` collection already filters drafts before every downstream consumer. One content decision therefore removes each release from static params, archive selection, carousel selection, sitemap selection, audio queues based on the public list, and direct lookup. The existing dynamic page already calls `notFound()` when the slug is absent.

Why not only `noindex`: the requested minimum V1 also requires the pages to be undiscoverable and not visibly unfinished. `noindex` would leave direct and internal access possible.

Why not separate carousel/sitemap flags: toggling several flags can drift and still leave a direct 200 page. The existing draft visibility is a single source of truth.

### 4.2 Contact updates checkbox

The dedicated MailerLite form remains the only newsletter path.

Remove:

- Checkbox markup and `updatesOptIn` field from `components/sections/ContactForm.tsx`.
- `normalizeOptIn` from `app/api/contact/route.ts`.
- `updatesOptIn` extraction and forwarded payload property from the contact API.
- “Updates opt-in” lines from contact email text and HTML templates.
- Checkbox-only CSS selectors from `app/globals.css` after confirming no other component uses the class.

Preserve:

- Contact name/email/subject/message/source fields.
- The dedicated `EmailSignup`/MailerLite flow.
- Existing contact success/error/loading behavior.

Validation: repository search returns no `updatesOptIn`, “Updates opt-in,” or `contact-form-checkbox`; a submitted contact email contains no newsletter-consent line; newsletter signup remains unchanged except for privacy/abuse controls.

### 4.3 Privacy route and disclosures

Plan:

- Add `content/privacy.ts` as a small structured copy source with an explicit effective-date field and owner-review markers before final approval.
- Add `app/privacy/page.tsx` using existing page/metadata/layout components; do not create a new visual system.
- Add `/privacy` to the footer and sitemap.
- Add a concise contact-form disclosure linked to `/privacy`.
- Add a concise newsletter disclosure linked to `/privacy` for both panel and footer variants.

Minimum approved subject matter:

- The fields collected by each form.
- Why each form collects them.
- Resend’s role in delivering contact messages.
- MailerLite’s role in storing/managing newsletter subscriptions.
- Cloudflare Turnstile and Vercel Firewall’s abuse-prevention role.
- Whether basic provider/security logs may contain request/network information.
- How to request deletion or ask a privacy question.
- How newsletter unsubscribe works.
- The public contact email.
- The effective date.

Copy constraints:

- Do not promise deletion within a fixed period unless an operational process exists to meet it.
- Do not claim data is never retained, shared, transferred, or logged.
- Do not call the notice legal advice or imply regulatory certification.
- Keep the component structure independent from final prose so owner-approved text can replace draft fields cleanly.

### 4.4 Form-abuse controls

#### Control stack

1. **Keep existing honeypots.** Bots that fill them receive a generic success response and no provider call.
2. **Use one shared Turnstile client component.** It explicitly renders the managed/interstitial-as-needed widget for Contact and EmailSignup, holds the token in component state, and resets after every submission attempt because tokens are single-use.
3. **Use one shared server verifier.** Both APIs call `lib/turnstile.ts`; the verifier sends the token and optional client IP to Siteverify, applies a timeout, and returns a discriminated result without exposing secrets/provider details.
4. **Use Vercel WAF path/method rate limits.** This is the smallest distributed limit for serverless deployment and avoids an application datastore. Initial conservative thresholds: Contact 5 POSTs per 10 minutes per IP; Newsletter 10 POSTs per 10 minutes per IP, with 429 responses. Review actual traffic before tightening.
5. **Handle 429 in both clients.** Display a neutral “too many attempts; wait and retry” status; do not expose matching rules.

Cloudflare requires server-side Siteverify; tokens expire after five minutes and are single-use. Official test keys exist for development/test environments. See [Cloudflare server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) and [Cloudflare testing guidance](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

Vercel WAF can rate-limit by request path and client characteristics without a project-local persistence layer. See [Vercel rate-limiting guidance](https://vercel.com/kb/guide/add-rate-limiting-vercel) and [WAF custom rules](https://vercel.com/docs/vercel-firewall/vercel-waf/custom-rules).

#### Failure behavior

| Condition | API behavior | UI behavior |
| --- | --- | --- |
| Honeypot filled | Generic 200; no provider or Turnstile call | Generic success; reveal nothing |
| Production site/secret key missing | 503; log only a configuration code | “Form is temporarily unavailable”; offer direct contact only on Contact |
| Token missing/invalid/expired/duplicate | 400 | Ask visitor to retry; reset widget |
| Siteverify timeout/unavailable | 502 or 503; no provider call | Neutral retry-later message; reset widget |
| WAF limit exceeded | 429, ideally with `Retry-After` | Wait/retry message |
| Resend/MailerLite unavailable after valid token | Existing 502/503 behavior | Existing provider-unavailable message; reset token before retry |
| Provider accepts | Existing 200 success | Reset form and Turnstile state |

#### Environment behavior

- **Development:** use Cloudflare’s published test key pair when exercising Turnstile. A bypass is permitted only when `NODE_ENV === "development"` and both keys are absent; it must not be controlled by a client-exposed bypass flag.
- **Preview:** use Cloudflare test credentials or a dedicated preview widget; keep `SITE_VISIBILITY=private`. Preview is a production build and must not silently bypass verification.
- **Production:** real site/secret pair restricted to `broey.net` (and `www` only if the redirect flow needs it); missing/mismatched keys fail closed.
- **Secrets:** only `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is client-visible. `TURNSTILE_SECRET_KEY` remains server-only and is never logged.

#### Privacy implications

Turnstile evaluates browser/device/request signals and Siteverify can receive the visitor IP. Vercel Firewall evaluates request/network attributes. The privacy notice should identify these services and abuse-prevention purpose without claiming a retention term the site owner cannot verify. The application should avoid adding its own persistent IP log or rate-limit database under the WAF plan.

### 4.5 Domain and canonical origin

#### Central utility

Add `lib/site-origin.ts` and make it the only parser/validator of `NEXT_PUBLIC_SITE_URL`.

Required behavior:

- In `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL` is required.
- Production permits HTTPS only.
- The value must be an origin: no credentials, query, hash, or non-root path.
- Normalize with `URL.origin`, which removes a trailing slash.
- Throw a clear build-time error for missing or invalid production values.
- In development only, absence falls back to `http://localhost:3000`.
- Development may accept `http://localhost`, `http://127.0.0.1`, or a valid configured HTTPS origin.
- Export `siteOrigin` and `absoluteUrl(path)`; do not duplicate fallback strings elsewhere.

This intentionally makes a local `npm run build` require an explicit valid origin, because Next sets `NODE_ENV=production` for a production build. `.env.local.example` and README must make that requirement obvious.

#### Verified references to change

| Reference | Planned change |
| --- | --- |
| `.env.local.example` | Change example to `NEXT_PUBLIC_SITE_URL=https://broey.net`; document dev fallback and strict production validation |
| `README.md` | Replace `broey.com`; document apex canonical, `www` redirect, origin rules, and environment matrix |
| `content/seo.ts` | Remove its fallback; import the central origin for metadata helpers as needed |
| `app/robots.ts` | Remove independent environment parsing/fallback; use central origin |
| `app/sitemap.ts` | Use `absoluteUrl`; add `/privacy`; no scattered URL construction policy |
| `app/layout.tsx` | Use central origin for `metadataBase` and author URL |
| `app/about/page.tsx` | Use central helper for Person JSON-LD URLs |
| `app/music/[slug]/page.tsx` | Use central helper for canonical/asset/breadcrumb structured-data URLs |
| `app/api/contact/route.ts` | Generate “from broey.net” email heading from the central host or use neutral “Broey website”; remove hardcoded `broey.com` |
| `Launch_Ready_Release_Note.md` | Replace obsolete `broey.com` launch verification guidance with apex/`www` policy |

The audit documents should retain their dated observations as historical evidence; they should not be rewritten to pretend the previous `broey.com` finding never existed.

#### Recommended URL policy decisions

- **Require in Production:** Yes.
- **Localhost fallback in Development:** Yes, only `http://localhost:3000` when absent.
- **Fail production build when absent/invalid:** Yes.
- **Normalize trailing slash:** Yes, through `URL.origin`.
- **Reject non-HTTPS production origins:** Yes.
- **Canonical host enforcement in app code:** Metadata uses apex. The network-level `www` to apex redirect belongs in Vercel domain configuration; do not add duplicate application redirect logic unless Vercel cannot express it.

### Execution phases

### Phase 0 — Owner and external prerequisites

No repository or external changes are made by Codex in this phase.

Owner actions:

1. Confirm `broey.net` ownership, registrar access, and renewal status.
2. Confirm the linked Vercel project/team is the intended production target.
3. Confirm apex canonical and permanent `www` to apex policy.
4. Approve the privacy facts listed in section 3, including effective date and contact email.
5. Confirm default hiding of Watch, LiNK, and Paradise; supply final assets/links only if the owner wants to reverse that default before implementation.
6. Confirm access to production/preview Resend, MailerLite, Shopify, Cloudflare Turnstile, and Vercel Firewall settings.
7. Confirm the MailerLite group and Resend sender identity intended for production.
8. Approve the isolated Option C dependency branch.

Exit criterion: domain/project ownership and privacy facts are known; the owner accepts hiding unfinished content; required service access exists; no secret value is copied into the plan or issue tracker.

### Phase 1 — Repository launch blockers

Use a dedicated branch such as `codex/v1-launch-blockers`. Keep changes in small commits:

1. **Origin and visibility commit — F-001 + F-009.** Add strict central origin utility; move all consumers; update examples/docs; restore env-aware public/private visibility with validation.
2. **Unfinished-content commit — F-006/F-007/F-008.** Make Watch return not found; mark LiNK/Paradise draft; remove stale music-list reference.
3. **Privacy/consent commit — F-004/F-005.** Remove the contact opt-in end to end; add Privacy route/copy source, footer link, form disclosures, and sitemap entry.
4. **Abuse-control commit — F-003.** Add shared Turnstile widget/verifier; apply to both forms; add 429 handling and environment documentation. WAF thresholds remain an owner configuration task in Phase 3.

Focused validation after each commit:

- Type check and lint.
- Production build with a valid explicit origin.
- Build must fail with missing, malformed, path-bearing, or HTTP production origins.
- Route assertions: Privacy 200; Watch/LiNK/Paradise 404; core routes 200.
- Home/Music/sitemap contain no LiNK or Paradise URLs; sitemap includes Privacy.
- Repository search finds no `broey.com` in active code/docs and no contact opt-in field/copy/CSS.
- Local Turnstile success/failure/expired-token flows use official test keys; no provider call occurs when abuse checks fail.

Exit criterion: F-001 and F-003 through F-009 repository work is complete; all changed behavior passes locally; external settings remain untouched.

### Phase 2 — Dependency remediation

Use a separate branch such as `codex/v1-next16-security`. Do not mix content/privacy/origin changes into the dependency commit. Base it on the accepted Phase 1 branch only when ready for integration.

Recommended sequence:

1. Record the current audit JSON and dependency tree in the PR description, not the repository.
2. Install exact Option C versions without `--force`, `--legacy-peer-deps`, or an audit-fix command.
3. Migrate async `params`/`searchParams` consumers.
4. Replace `next lint` and legacy ESLint config with direct ESLint flat config.
5. Rename `middleware.ts`/export to `proxy.ts`/`proxy` for Next 16, preserving gate behavior.
6. Move/remove deprecated output-file tracing configuration and verify the current exclusions are still necessary.
7. Run both default Turbopack build and, for comparison/recovery, `next build --webpack` once during migration; choose the validated production command explicitly.
8. Resolve real compile/runtime regressions manually. Do not suppress type errors or bulk-force dependency changes.
9. Require a clean production audit for the selected package tree.

Exit criterion: exact package tree is reviewed; `npm audit --omit=dev` has no unaccepted high/critical advisory; lint/type/build/routes/interactions/Lighthouse pass; the dependency commit can be reverted independently.

### Phase 3 — Production configuration

Owner-controlled actions after Phase 1 and Phase 2 are approved:

#### Vercel environment matrix

| Variable/service | Production | Preview | Development |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://broey.net` | `https://broey.net` as canonical while preview is private/noindex | Omit for localhost fallback or set an allowed local origin |
| `SITE_VISIBILITY` | `public` | `private` | Explicit as needed; default public only in development |
| `SITE_PASSCODE` | Unset | Strong owner-managed value | Optional local value when testing gate |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Real production widget site key | Official test or dedicated preview site key | Official test site key |
| `TURNSTILE_SECRET_KEY` | Matching real secret | Matching test/dedicated preview secret | Matching test secret or dev-only absent-key bypass |
| Resend | Production API key and verified `broey.net` sender | Omit or use an owner-approved safe test identity | Local owner-controlled test only |
| MailerLite | Production API key and approved group | Omit or use safe test group/account | Local owner-controlled test only |
| Shopify | Production store domain/collection/token policy | Read-only production catalog only if owner accepts | Existing read-only configuration |

#### Domain and service actions

1. Add `broey.net` and `www.broey.net` to the confirmed Vercel project.
2. Apply the current DNS records supplied by Vercel; do not reuse a stale IP/CNAME from documentation.
3. Set apex as primary and configure `www` as a permanent redirect preserving path/query.
4. Wait for and verify Vercel TLS issuance on both hosts.
5. Configure a Turnstile widget restricted to required production hostnames; keep production secrets out of Preview unless deliberately needed.
6. Configure WAF rules for POST `/api/contact` and POST `/api/newsletter`, initially using the thresholds in section 4.4 and a 429 action.
7. Confirm the Resend sender domain/address is verified for the new origin; add owner-approved DNS records if needed.
8. Confirm MailerLite group, consent/unsubscribe behavior, and API-key scope.
9. Confirm Shopify collection and product targets.
10. Redeploy after environment changes; never rely on a deployment built with the old public origin.

Exit criterion: production candidate is deployed privately or without public DNS cutover; environment scopes are verified; domain/TLS/WAF/provider configurations are ready; no external write test has been accidentally performed.

### Phase 4 — Production-candidate validation

Run the full validation plan in section 9. Owner-authorized write tests are required here:

- One contact submission received and inspectable in Resend/inbox.
- One newsletter signup visible in the correct MailerLite group with unsubscribe behavior confirmed.
- Shopify product-to-checkout handoff without an unintended purchase.
- Turnstile success, invalid/expired token, missing-token, provider-down simulation, and WAF 429 behavior.
- Canonical/DNS/TLS/redirect and metadata checks from the public network.
- Browser/device, audio, menu, route, Lighthouse, and log checks.

Exit criterion: definitions in sections 12 and 13 are both met, the owner signs off, and rollback targets are recorded.

### Phase 5 — Post-launch backlog

Move F-010 through F-025 to a separate V1.1 backlog as listed in section 2. Do not expand the launch branch for them. F-026 and F-027 are not deferred improvements; they are closed by Phase 3/4 production verification.

## 5. File-level change map

Line numbers are intentionally omitted here; paths and behavior were verified against the current working tree.

| Finding | File | Current behavior | Planned behavior | Reason | Dependencies | Size | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-001 | `lib/site-origin.ts` (new) | No central strict origin parser | Require/validate HTTPS production origin; dev localhost fallback; export normalized origin/URL helper | Remove scattered unsafe fallbacks | Canonical-host decision | S | Build matrix for valid/invalid/missing/trailing-slash values |
| F-001 | `content/seo.ts` | Own `broey.com` fallback | Consume central origin; retain metadata factory only | One URL policy | New origin utility | S | Inspect representative canonical/OG/Twitter metadata |
| F-001 | `app/layout.tsx` | Imports origin via content SEO | Use central origin for metadata base/author URL | Clear ownership of origin logic | New utility | XS | Render Home metadata |
| F-001 | `app/about/page.tsx` | Builds absolute JSON-LD URLs from old export | Use central absolute URL helper | Structured-data consistency | New utility | XS | Parse Person JSON-LD URLs |
| F-001/F-007/F-008/F-002 | `app/music/[slug]/page.tsx` | Uses old origin; synchronous params; missing releases already call notFound | Phase 1: central URLs. Phase 2: async params/metadata for Next 16 | Origin consistency and framework migration | Phase-specific commits | M | 37 retained slugs 200; hidden slugs 404; JSON-LD/canonical correct |
| F-001/F-004 | `app/sitemap.ts` | Old origin import; no Privacy | Use absolute helper; add Privacy; draft releases remain absent | Correct origin and discovery | Origin/Privacy files | S | Parse XML; expected route set only |
| F-001 | `app/robots.ts` | Independent environment fallback to `broey.com` | Use central origin and visibility policy | Prevent policy drift | Origin/visibility helpers | S | Inspect Production/Preview robots output |
| F-001/F-003/F-005 | `app/api/contact/route.ts` | Hardcoded `broey.com`; inline optional Turnstile; forwards opt-in | Neutral/central host copy; shared required verifier; no opt-in fields; 429-compatible errors | Close domain, abuse, and consent blockers | Origin, verifier, owner/provider config | M | Payload validation; no opt-in email line; Turnstile branch tests; controlled delivery |
| F-001/F-003/F-009 | `.env.local.example` | Old origin example; Turnstile optional; visibility promise mismatches runtime | `broey.net` example; environment matrix comments; no secret values | Safe configuration handoff | Chosen policies | S | Manual variable-name review; secret scan |
| F-001/F-003/F-009 | `README.md` | Old origin and inaccurate gate behavior | Document strict origin, apex/`www`, Turnstile, WAF, and visibility matrix | Operator clarity | Final implementation | S | Documentation review against code |
| F-001 | `Launch_Ready_Release_Note.md` | Tells owner to verify `broey.com` | Replace with `broey.net` apex/`www` policy | Remove obsolete launch direction | Domain decision | XS | Repository `broey.com` search |
| F-006 | `app/watch/page.tsx` | Public 200 placeholder | Deliberate V1 `notFound()`; no public metadata/content imports | Hide unfinished content | Owner accepts default hide | S | Direct 404/noindex; absent nav/sitemap |
| F-007/F-008 | `content/releases.ts` | LiNK/Paradise are public | Set existing `visibility: "draft"` on both; preserve content data | One-source removal from all public consumers | Owner accepts default hide | XS | Static-param/archive/carousel/sitemap/direct-route assertions |
| F-007 | `app/music/page.tsx` | Explicitly names LiNK in current-era list | Remove stale LiNK slug | No dead discoverability reference | Draft visibility | XS | Music page contains neither hidden release |
| F-004/F-005/F-003 | `components/sections/ContactForm.tsx` | Updates checkbox; inline Turnstile widget; no privacy disclosure | Remove opt-in; use shared token/reset component; add concise Privacy link; handle 429/config error | Honest consent and robust abuse UX | Approved short disclosure; Turnstile component | M | Keyboard/form/Turnstile/error/success smoke |
| F-005 | `app/globals.css` | Checkbox-only styles | Remove now-unused consent-checkbox selectors only | Avoid dead misleading UI styles | Checkbox removal | XS | Reference search and visual regression |
| F-004 | `content/privacy.ts` (new) | No approved privacy copy source | Structured owner-approved facts/effective date/contact | Clean copy insertion/review | Owner approvals | S | Content checklist review |
| F-004 | `app/privacy/page.tsx` (new) | No Privacy route | Existing design-system page with metadata and approved notice | Required disclosure | Privacy content/origin | M | 200, canonical, headings, links, mobile/a11y |
| F-004 | `components/site/Footer.tsx` | No Privacy link | Add Privacy under Site/legal area | Site-wide access | Privacy route | XS | Footer link on representative pages |
| F-004/F-003 | `components/sections/EmailSignup.tsx` | MailerLite form has unsubscribe text only and no Turnstile | Add Privacy/provider disclosure; shared token/reset; 429 handling for both variants | Newsletter transparency and abuse control | Privacy route; Turnstile component | M | Home/footer forms, duplicate widgets, token reset, provider smoke |
| F-003 | `components/forms/TurnstileWidget.tsx` (new) | Contact has one inline implicit widget; Newsletter none | Reusable explicit-render client widget with token callback/reset/error state and interaction-only appearance | Correct single-use behavior without duplicated scripts | Public site key; Cloudflare script | M | Official pass/fail/expired test keys; two widgets on Home |
| F-003 | `lib/turnstile.ts` (new) | Contact-only verifier silently bypasses missing secret | Shared verifier with timeout, dev-only bypass, fail-closed production, remote IP, normalized result | Server-side protection for both APIs | Server secret | M | Unit-like route cases and provider stubs/test keys |
| F-003 | `app/api/newsletter/route.ts` | Honeypot and validation only | Honeypot first, then shared Turnstile, then MailerLite; 429-compatible response | Protect provider/list | Shared verifier; WAF | S–M | Invalid/valid token, honeypot, controlled signup |
| F-009 | `lib/site-visibility.ts` | Always public; ignores environment | Parse/validate `public`/`private`; development-safe default; require valid non-dev values; private requires passcode | Make Preview/Production policy real | Vercel env matrix | M | Public/private robots/sitemap/gate matrix |
| F-009/F-002 | `middleware.ts` then `proxy.ts` | Gate middleware works only if helper says private; old Next filename | Phase 1 relies on restored helper. Phase 2 renames file/export for Next 16 with identical matcher | Preview safety and supported framework convention | Visibility fix; Option C | S | Preview gate, cookie, redirect, robots/assets exclusions |
| F-002 | `package.json` | Next 14/React 18/ESLint 8; `next lint` | Exact selected package versions; `lint: eslint .`; Node engine compatible with Next 16 | Close production advisories and restore lint command | Option C approval | M | `npm ls`, lint, audit, engine check |
| F-002 | `package-lock.json` | Locks vulnerable Next/PostCSS tree | Regenerate only from exact reviewed install | Reproducible patched tree | Package manifest | M | Clean `npm ci`; integrity/diff review; `npm ls` |
| F-002 | `.eslintrc.json` → `eslint.config.mjs` | Legacy config consumed by `next lint` | ESLint flat config using Next 16 plugin/config | Next 16 removes `next lint`; config requires ESLint 9+ | Exact ESLint/Next config packages | M | Direct ESLint run with zero unexpected errors |
| F-002 | `app/gate/page.tsx` | Synchronous `searchParams` | Async `searchParams` access | Required by Next 16 | Option C | S | Gate next/error query behavior |
| F-002/F-024 | `next.config.js` | Deprecated nested tracing ignore/excludes | Remove obsolete ignore; move supported excludes to documented location; choose tested Turbopack/webpack build mode | Eliminate migration warnings/build failure | Option C and trace validation | M | Both build modes once; inspect server traces and route behavior |
| F-002 | `tsconfig.json` | Current Next 14-generated settings | Accept only necessary Next 16/typegen changes; do not weaken strictness | Framework/type migration | Option C | S | Strict `tsc`; diff review |

No other application file should change unless a compiler/runtime error demonstrates a direct migration dependency. Any newly discovered file must be added to the change map in the implementation PR before modification.

## 6. Dependency-security investigation

### Commands and current graph

Read-only commands used:

- `npm audit --omit=dev --json`
- `npm ls next postcss --all`
- `npm view next@14.2 version --json`
- `npm view next@15.5 version --json`
- `npm view next@16.3 version --json`
- `npm view next@<version> engines peerDependencies dependencies.postcss --json`
- Official GitHub repository security-advisory API reads for every GHSA below

Current installed production path:

```text
broey-website@0.1.0
└─ next@14.2.35 (direct production dependency)
   └─ postcss@8.4.31 (transitive exact dependency)
```

The development toolchain separately resolves PostCSS 8.5.15 through Tailwind/Autoprefixer. That path belongs to F-015; F-002’s production audit is specifically the PostCSS 8.4.31 nested under Next.

`npm audit --omit=dev --json` reported 2 vulnerable package nodes (Next and its PostCSS), 2 high package-level findings, 21 production dependencies, and 432 total installed dependencies including dev/optional packages. The Next package aggregates advisories of several severities, so its package-level result is high.

### Exact Next.js advisory inventory

All listed ranges include installed Next 14.2.35. “Patched versions” are the vendor-published branches returned by the `vercel/next.js` advisory records, not npm’s automatic fix suggestion.

| Advisory / CVE | Severity | Summary | Vendor-published patched versions | Current-app exposure assessment |
| --- | --- | --- | --- | --- |
| `GHSA-9g9p-9gw9-jx7f` / CVE-2025-59471 | Moderate | Image Optimizer DoS | 15.5.10; 16.1.5 (no 14 patch) | `next/image` and remote patterns are used; Vercel manages the optimizer, reducing self-hosted risk, but public image requests exist |
| `GHSA-h25m-26qc-wcjf` / CVE-2026-23864 | High | Server Components DoS | 15.0.8/15.1.12/15.2.9/15.3.9/15.4.11/15.5.10; 16.0.11/16.1.5 | App Router is public; conservatively treat as reachable |
| `GHSA-ggv3-7p47-pfv8` / CVE-2026-29057 | Moderate | Request smuggling in rewrites | 15.5.13; 16.1.7 | No `rewrites()` configuration; not currently reachable |
| `GHSA-3x4c-7xq6-9pq8` / CVE-2026-27980 | Moderate | Unbounded Image Optimizer disk cache | 15.5.14; 16.1.7 | Image optimizer is used; Vercel-managed storage reduces the self-hosted condition, but upgrade remains required |
| `GHSA-q4gf-8mx6-v5v3` / CVE-2026-23869 | High | Server Components DoS | 15.5.15; 16.2.3 | App Router is used; public RSC request surface warrants treating it as exposed |
| `GHSA-8h8q-6873-q5fj` / CVE-2026-23870 | High | Server Components DoS | 15.5.16; 16.2.5 | App Router is used; conservatively exposed |
| `GHSA-3g8h-86w9-wvmq` / CVE-2026-44572 | Low | Middleware/Proxy redirect cache poisoning | 15.5.16; 16.2.5 | Middleware redirects only for private gate; low Production reach while public, but Preview uses it |
| `GHSA-ffhc-5mcf-pf4q` / CVE-2026-44581 | Moderate | CSP-nonce App Router XSS | 15.5.16; 16.2.5 | No CSP nonce implementation found; not currently reachable |
| `GHSA-vfv6-92ff-j949` / CVE-2026-44582 | Low | RSC cache-busting collision/cache poisoning | 15.5.16; 16.2.5 | App Router used; potential framework request surface |
| `GHSA-gx5p-jg67-6x7h` / CVE-2026-44580 | Moderate | XSS in `beforeInteractive` with untrusted input | 15.5.16; 16.2.5 | No `beforeInteractive` usage found; not currently reachable |
| `GHSA-h64f-5h5j-jqjh` / CVE-2026-44577 | Moderate | Image Optimization API DoS | 15.5.16; 16.2.5 | Public optimizer exists; Vercel mitigates some infrastructure impact, not a reason to remain unpatched |
| `GHSA-c4j6-fc7j-m34r` / CVE-2026-44578 | High | WebSocket-upgrade SSRF | 15.5.16; 16.2.5 | No custom WebSocket upgrade handling; not currently reachable |
| `GHSA-wfc6-r584-vfw7` / CVE-2026-44576 | Moderate | RSC response cache poisoning | 15.5.16; 16.2.5 | App Router used; potential framework request surface |
| `GHSA-36qx-fr4f-26g5` / CVE-2026-44573 | High | Pages Router i18n middleware bypass | 15.5.16; 16.2.5 | App Router, no i18n config; not currently reachable |
| `GHSA-m99w-x7hq-7vfj` / CVE-2026-64641 | High | Server Action DoS | 15.5.21; 16.2.11 | Repository has no `use server`/Server Actions; vendor says apps without Server Actions are not vulnerable |
| `GHSA-89xv-2m56-2m9x` / CVE-2026-64649 | High | Server Action SSRF on custom servers | 15.5.21; 16.2.11 | No Server Actions and Vercel managed hosting; vendor says managed hosting pins host and is not affected |
| `GHSA-68g3-v927-f742` / CVE-2026-64648 | Moderate | Request-body response cache confusion | 15.5.21; 16.2.11 | Server fetches with bodies use `cache: "no-store"`; low reachability |
| `GHSA-4633-3j49-mh5q` / CVE-2026-64647 | Moderate | Invalid-UTF-8 request-body cache confusion | 15.5.21; 16.2.11 | Provider payloads are UTF-8 and `no-store`; low reachability |
| `GHSA-4c39-4ccg-62r3` / CVE-2026-64646 | Moderate | Unbounded Edge Server Action payload | 15.5.21; 16.2.11 | No Server Actions; not currently reachable |
| `GHSA-p9j2-gv94-2wf4` / CVE-2026-64645 | High | SSRF in attacker-hostname rewrites | 15.5.21; 16.2.11 | No rewrite/redirect function with dynamic host; not currently reachable |
| `GHSA-955p-x3mx-jcvp` / CVE-2026-64643 | Moderate | Internal Server Function endpoint disclosure | 15.5.21; 16.2.11 | No Server Actions or `use cache`; not currently reachable |

Vendor examples: [Server Component DoS advisory](https://github.com/vercel/next.js/security/advisories/GHSA-q4gf-8mx6-v5v3), [Server Action DoS advisory](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj), and [dynamic-host rewrite SSRF advisory](https://github.com/vercel/next.js/security/advisories/GHSA-p9j2-gv94-2wf4).

Reachability reduces urgency for several individual exploit paths, but does not create a patched/supported Next 14 release. App Router/RSC and image surfaces are real, and future code could activate currently absent features. F-002 should therefore be remediated rather than accepted wholesale.

### Exact PostCSS advisory inventory

| Advisory / CVE | Severity | Affected range | Patched version | Exposure assessment |
| --- | --- | --- | --- | --- |
| `GHSA-qx2v-qp2m-jg93` / CVE-2026-41305 | Moderate | `<8.5.10` | 8.5.10 | Installed 8.4.31 affected |
| `GHSA-6g55-p6wh-862q` / CVE-2026-45623 | High | `<=8.5.11` | 8.5.12 | Installed 8.4.31 affected |
| `GHSA-r28c-9q8g-f849` | High | `<=8.5.17` | 8.5.18 | Installed 8.4.31 affected |
| `GHSA-fxqj-rqcc-2cmp` / CVE-2026-69153 | Moderate | `<=8.5.22` | 8.5.23 | Installed 8.4.31 affected |

PostCSS is **transitive**, not a direct production dependency: `next@14.2.35 -> postcss@8.4.31`. The newest advisory requires attacker-controlled CSS containing a source-map annotation, processing without a `from` option, and exposure of the generated map. This application accepts no user CSS and processes repository-controlled styles during build, so remote exploitability is not evident. It remains a vulnerable production-tree/build dependency and prevents a clean audit. The vendor’s detailed conditions and 8.5.23 patch are in the [PostCSS advisory](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp).

### Version availability observed

- Next 14’s npm backport tag is 14.2.35; no later 14.2 patch exists.
- Latest examined 15 backport is 15.5.22; it clears the Next advisory ranges but still declares exact `postcss: 8.4.31`.
- Examined current major is Next 16.3.0; it declares exact `postcss: 8.5.23` and requires Node 20.9+.
- Current local Node 22.14.0 satisfies Next 16.3.0.
- Next 16 removes `next lint`, requires async request APIs, defaults builds to Turbopack, and deprecates `middleware` in favor of `proxy`. See the [Next 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16).
- Next 15 introduces async request APIs and changed fetch/router caching defaults. See the [Next 15 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-15).

## 7. Dependency remediation options

### Option A — Lowest-risk patch within Next 14

**Status: unavailable. Do not implement.**

| Item | Assessment |
| --- | --- |
| Proposed versions | None. Installed `next@14.2.35` is the latest 14.2/npm backport tag observed. |
| Advisories addressed | A PostCSS override alone would not address the 21 Next advisories. No vendor-published Next 14 patch closes them. |
| Breaking changes | None because there is no viable package change. |
| Required code/config | None. |
| Regression risk | Low application risk but unacceptable residual security/audit risk. |
| Validation | `npm audit --omit=dev` would remain non-zero/high. |
| Effort | N/A. |
| Recommendation | Reject. Do not treat reachability notes as a substitute for supported patches. |

### Option B — Intermediate Next 15 backport plus controlled PostCSS override

**Status: technically plausible, conditional, not preferred.**

Exact proposed package set:

- `next@15.5.22`
- `eslint-config-next@15.5.22`
- `react@19.2.8`
- `react-dom@19.2.8`
- `@types/react@19.2.18`
- `@types/react-dom@19.2.4`
- Keep `eslint@8.57.1` initially; Next 15’s config peer range allows it.
- npm override scoped to Next’s transitive `postcss@8.5.23`.

| Item | Assessment |
| --- | --- |
| Advisories addressed | Next 15.5.22 is beyond every audited 15.x fixed threshold. PostCSS override targets all four PostCSS advisories. A clean audit must be proven after lock generation. |
| Expected breaking changes | React 19 migration; async `params`/`searchParams` migration; Next 15 fetch/router caching changes; possible type/hydration differences. Synchronous compatibility exists temporarily but should not be relied on. |
| Required code/config | Async conversions in release/gate pages; package/lock changes; React types; regression review. `next lint` can remain temporarily but should not be considered strategic. |
| Special risk | Next 15.5.22 itself declares exact PostCSS 8.4.31. The override is an npm resolution, not the package combination published/tested by Next. CSS build behavior requires focused regression tests. |
| Validation | `npm ci`; `npm ls next postcss`; clean production audit; lint/type/build; CSS/Tailwind visual diff; all Phase 4 journeys. |
| Effort | L–XL, approximately 8–14 engineering hours. |
| Recommendation | Use only if Option C has a demonstrated blocking regression and the owner accepts the narrow override risk. Remove the override as soon as an upstream 15 package carries PostCSS 8.5.23. |

### Option C — Current-major migration

**Status: recommended.**

Exact audited package target:

- `next@16.3.0`
- `eslint-config-next@16.3.0`
- `react@19.2.8`
- `react-dom@19.2.8`
- `@types/react@19.2.18`
- `@types/react-dom@19.2.4`
- `eslint@10.8.0`
- Keep TypeScript 5.9.3 initially; it exceeds Next 16’s 5.1 minimum.
- Pin/declare Node 22 for Vercel (Next 16 minimum is 20.9); do not change the local runtime during the same commit.

| Item | Assessment |
| --- | --- |
| Advisories addressed | Next 16.3.0 is beyond all audited 16.x patch thresholds (highest 16.2.11) and publishes PostCSS 8.5.23, closing all four PostCSS ranges without an override. |
| Expected breaking changes | Mandatory async `params`/`searchParams`; React 19 behavior/types; `next lint` removal; ESLint flat config and ESLint 9+ requirement; Turbopack default; `middleware`→`proxy`; supported tracing-config location; changed caching/navigation defaults inherited from Next 15. |
| Required code/config | Files identified in Phase 2/file map; no feature redesign. Keep React Compiler/cache components disabled unless already required. |
| Regression risks | Audio/carousel client hydration, dynamic release generation, gate/proxy behavior, CSS/Tailwind output under Turbopack, image behavior, route caching, and lint-rule changes. |
| Validation | Exact dependency-tree/audit checks plus all Phase 4 validation; compare Turbopack and webpack build once; visually inspect five viewport classes and audio persistence. |
| Effort | XL, approximately 12–20 engineering hours including regression and fixes. |
| Recommendation | Choose this option. It is more migration work but is the only examined fully upstream-published tree that closes both Next and PostCSS findings without a package override. Keep it on an isolated branch/commit so rollback is mechanical. |

No option should use `npm audit fix --force`, a canary/preview version, `--force`, or `--legacy-peer-deps`. If exact versions are no longer available or new advisories appear when implementation starts, stop and refresh this investigation rather than substituting “latest” silently.

## 8. Risk register

| Risk | Likelihood/impact | Mitigation | Trigger/owner |
| --- | --- | --- | --- |
| Domain is not owned or cannot be attached | Medium / Critical | Confirm before coding is considered launch-complete; do not deploy metadata to an unowned host | Owner |
| Strict origin validator blocks builds/previews | Medium / High | Document env matrix; test negative/positive cases; clear error text | Codex + Vercel owner |
| Draft filtering removes an audio/list dependency unexpectedly | Low / Medium | Crawl carousel/archive/static params/audio queues; retained release count assertion | Codex |
| Watch still emits public metadata despite notFound | Low / Medium | Direct HTTP/HTML/robots inspection; remove page metadata export | Codex |
| Privacy copy over-promises retention/deletion | Medium / High | Owner/legal factual approval; avoid unsupported guarantees | Owner |
| Turnstile blocks legitimate users or cannot reset | Medium / High | Interaction-only managed widget, explicit reset, accessible error, direct email fallback on Contact | Codex + owner |
| WAF limits shared-IP visitors | Low / Medium | Conservative thresholds, observe logs, reversible rule, tune after traffic | Vercel owner |
| WAF feature/price differs from assumption | Medium / Medium | Confirm current plan before Phase 3; fallback to a small managed counter only if required | Owner |
| Provider production test creates unwanted records/messages | Medium / Low | Named controlled test identities, one write each, cleanup where appropriate | Owner |
| Next 16/React 19 causes hydration/audio/carousel regression | Medium / High | Isolated branch, exact packages, five-view visual/interaction regression, reversible commit | Codex |
| Async route API migration changes metadata/404 behavior | Medium / High | Route crawl and metadata assertions across all generated slugs | Codex |
| Turbopack changes CSS or tracing behavior | Medium / High | Compare one webpack build; visual regression; keep explicit validated build command | Codex |
| Proxy rename breaks private previews | Medium / High | Public/private environment matrix and gate-cookie/redirect tests | Codex |
| Option B PostCSS override diverges from Next’s published tree | Medium / High | Prefer Option C; if B is used, isolate override and require CSS/build regression plus expiry issue | Owner + Codex |
| DNS/TLS propagation produces split traffic | Medium / High | Lower TTL in advance if appropriate, use Vercel-supplied records, verify multiple resolvers, preserve rollback records | Owner |

## 9. Validation plan

### Repository and build

1. `git status --short --branch` and review expected file scope.
2. `npm ci` from the final lockfile.
3. `npm ls --all` and `npm ls next postcss react react-dom eslint eslint-config-next`.
4. `npm run lint` using direct ESLint after Option C.
5. `npx tsc --noEmit --incremental false`.
6. `npm run build` using the selected production bundler.
7. One comparison `npx next build --webpack` during migration if Turbopack is selected, or inverse comparison if webpack is temporarily retained.
8. `npm audit --omit=dev --audit-level=high` and retain command output in PR/launch evidence, not as a generated dependency fix.
9. `npm audit --audit-level=high` to track F-015 separately; dev-only findings do not silently fail the production decision.

### Origin/config negative tests

- Production build succeeds with `NEXT_PUBLIC_SITE_URL=https://broey.net`.
- Production build fails when the variable is absent.
- Production build fails for `http://broey.net`, a relative value, credentials, query/hash, or a non-root path.
- `https://broey.net/` normalizes to `https://broey.net`.
- Development without the variable uses `http://localhost:3000`.
- Invalid `SITE_VISIBILITY` fails non-development configuration.
- Public Production emits indexable robots/sitemap; private Preview emits noindex/disallow/empty sitemap and gates page routes.

### Route/content crawl

- 200: `/`, `/music`, retained release routes, `/merch`, `/about`, `/contact`, `/press`, `/privacy`.
- 404/noindex: `/watch`, `/music/link`, `/music/paradise`, and a random unknown path.
- `/gate` behavior matches visibility environment.
- Home carousel, Music lists, generated static params, audio queues, internal-link crawl, and sitemap contain neither hidden release.
- Sitemap includes Privacy and only the intended release set.
- No primary navigation points to deferred surfaces.

### Metadata/domain

- Every sampled canonical, OG URL, Twitter image URL, JSON-LD URL, robots sitemap URL, and sitemap entry begins with `https://broey.net`.
- No active-code/documentation `broey.com` reference remains except dated audit evidence.
- `curl -I https://www.broey.net/path?x=1` returns a permanent redirect to the equivalent apex path/query.
- Apex returns HTTPS 200 with a valid certificate and no redirect to another registrable domain.
- Share debugger/fetch checks succeed for Home and representative release pages.

### Form/privacy

- `/privacy` contains every owner-approved topic and the approved effective date/contact.
- Footer, Contact, and both EmailSignup variants link to Privacy.
- Contact UI/payload/email contain no updates checkbox or opt-in line.
- Honeypot returns generic success without Resend/MailerLite/Turnstile provider calls.
- Missing production Turnstile configuration returns 503.
- Missing/invalid/expired/duplicate token fails before provider calls and resets the widget.
- Valid token reaches provider once; retry requires a fresh token.
- WAF returns 429 at the configured threshold; normal traffic resumes after the window.
- One controlled contact message verifies UI success, delivery, sender, reply-to, formatting, and logs.
- One controlled newsletter signup verifies correct group, duplicate behavior, consent state, and unsubscribe.
- No secret or raw token is logged.

### Browser/device and performance

- Small mobile, large mobile, tablet, standard desktop, and wide desktop.
- Current iOS/macOS Safari, Firefox desktop, and Android Chrome sample.
- Mobile navigation open/follow/close behavior remains unchanged.
- Carousel interaction and layout remain unchanged.
- FREE audio starts, seeks, persists across navigation, pauses/resumes, and reports errors accessibly.
- Shopify filtering and product-to-checkout handoff work without an unintended purchase.
- YouTube/Disco and representative streaming/social links work.
- Lighthouse on Home, Contact, Merch, and `/music/free`; compare against the audit baseline and investigate material regressions rather than requiring identical lab numbers.
- Browser console and Vercel logs show no new hydration, route, proxy, image, provider, or Turnstile errors.

## 10. Rollback, commit, and branch plan by phase

| Phase | Main regression risks | Tests | Revert method | Separate commit? | Separate branch? |
| --- | --- | --- | --- | --- | --- |
| 0 — Prerequisites | Wrong domain/project/provider target | Read-only ownership/project checks | No mutation; correct the decision record | No | No |
| 1a — Origin/visibility | Build failure, wrong canonical, preview lockout/public indexing | Origin negative tests; metadata; public/private gate/robots/sitemap | Revert the origin/visibility commit and do not deploy publicly until corrected | Yes | Shared Phase 1 branch |
| 1b — Content hiding | Hidden releases remain linked or valid content disappears | Route/static-param/carousel/archive/sitemap/audio checks | Revert only after content is approved; otherwise keep hidden | Yes | Shared Phase 1 branch |
| 1c — Privacy/opt-in | Broken form layout; incomplete/incorrect notice | Form payload/email, privacy links/content/a11y | Revert commit in candidate only; public launch remains blocked until corrected | Yes | Shared Phase 1 branch |
| 1d — Turnstile client/server | Legitimate submissions blocked; duplicate token; provider bypass | Official pass/fail keys, timeout/reset, no-provider-on-fail, controlled writes | Revert abuse commit in private candidate; do not launch forms without replacement controls | Yes | Shared Phase 1 branch |
| 2 — Dependencies | Build/hydration/routing/proxy/CSS/audio regressions | Full dependency, route, browser, Lighthouse plan | Revert the single dependency/migration commit or promote the prior private candidate; never mix lock rollback with Phase 1 rollback | Yes, one reviewable migration series squashed or ordered | **Yes, required** |
| 3 — Production config | DNS/TLS split, wrong env scope, overly strict WAF | External matrix, headers, DNS, provider read/write tests | Restore previous Vercel env values/deployment; disable/revert WAF rule; restore recorded DNS values if needed | Config log, not code commit | No code branch |
| 4 — Validation | Test records or accidental order | Predeclared identities and no-purchase checkout boundary | Remove test subscriber if appropriate; no order placement; redeploy last good candidate | Only regression fixes, each isolated | Candidate branch |
| 5 — Backlog | Scope creep | Separate acceptance criteria | Revert individual V1.1 changes | Yes | Separate post-launch branch(es) |

Dependency rollback rule: if Option C fails validation, first attempt a scoped migration fix. If a blocker remains, revert the entire dependency/migration series and keep the site private. Option B is a deliberate new decision requiring owner acceptance; it is not an automatic fallback.

Domain rollback rule: record the pre-change DNS values and Vercel primary-domain state before mutation. If cutover fails, restore the previous known records/alias or remove the broken public alias while the candidate stays available on its Vercel URL. Do not point `broey.net` back to `broey.com`.

## 11. Updated effort estimate

Estimates assume the minimum hide/remove choices in this plan, Option C, no redesign, and prompt owner responses. They exclude DNS propagation, domain purchase/transfer, legal review turnaround, and provider support delays.

| Phase/workstream | Engineering | Owner/configuration |
| --- | ---: | ---: |
| Phase 0 decisions/evidence | 0–1 h support | 2–4 h |
| Origin + visibility | 3–5 h | 0.5–1 h review |
| Hide unfinished content | 1–2 h | 0.5 h approval |
| Remove opt-in + Privacy route/disclosures | 4–7 h | 1–3 h copy approval |
| Shared Turnstile client/server + 429 UX | 5–8 h | 1–2 h Cloudflare/WAF decisions |
| Option C dependency migration | 12–20 h | 0.5–1 h approval |
| Production-candidate automation/crawl/browser validation | 6–10 h | 2–4 h provider/device smoke |
| Vercel/DNS/provider configuration support | 1–2 h | 3–6 h |
| **Total** | **32–55 engineering hours** | **10–20 owner/configuration hours** |

The increase from the audit’s preliminary estimate comes from exact evidence that no Next 14 patch exists, Next 16 requires async request, ESLint, Proxy, and bundler validation, and both forms need a reusable Turnstile token/reset implementation rather than only setting environment variables.

If Option B is deliberately accepted, expected engineering drops to roughly 26–45 hours, but the PostCSS override risk and future removal work make it strategically weaker.

## 12. Definition of “ready for production candidate”

All of the following must be true:

- Phase 0 decisions are recorded and no required owner fact is unknown.
- Phase 1 and the chosen Phase 2 branch are reviewed and merged with separate commit history.
- F-001 through F-009 repository work is implemented; all 1 P0 and 7 P1 audit findings are addressed in code or by intentional hiding/removal.
- Exact dependency tree is installed reproducibly with no unaccepted high/critical production advisory.
- Lint, strict type check, production build, route crawl, origin negative tests, and local integration tests pass.
- Privacy copy is owner-approved and linked from all required surfaces.
- Watch/LiNK/Paradise return 404 and are absent from discoverable/indexable surfaces.
- Contact has no updates opt-in; newsletter remains the only subscription path.
- Both forms require shared server-validated Turnstile in non-development builds and handle token reset/errors.
- Production/Preview environment matrix is documented; a private Preview candidate proves gate/noindex behavior.
- No application source, lockfile, or environment change is unexplained in the file map/PR.

A production candidate may still be on a private Vercel URL and may not yet have public DNS cut over.

## 13. Definition of “ready to launch”

All production-candidate criteria plus:

- `broey.net` resolves to the intended Vercel project over valid HTTPS.
- `www.broey.net` permanently redirects to apex while preserving path/query.
- Public pages, canonical metadata, JSON-LD, robots, sitemap, sharing URLs, and contact email copy use `https://broey.net`.
- Production is public; Preview is private/noindex and gate-tested.
- WAF rate limits are active and a controlled 429 test succeeded without locking out normal traffic.
- One real contact message and one real newsletter signup succeeded and were verified in their providers.
- Shopify product-to-checkout handoff succeeded without an unintended purchase.
- Audio persistence, mobile navigation, core routes, external links, Safari, Firefox, Android Chrome, and representative Lighthouse checks passed.
- Vercel/browser/provider logs contain no unresolved launch-blocking error.
- Owner approved privacy text, content set, sender/list/store targets, and final launch.
- DNS, deployment, environment, WAF, and dependency rollback targets are recorded and accessible to the owner.

## 14. Recommended next Codex implementation prompt

Use this only after the Phase 0 domain/project and privacy inputs are supplied:

> Implement **Phase 1 only** from `docs/launch-readiness/V1_REMEDIATION_PLAN.md` on a dedicated `codex/v1-launch-blockers` branch. Do not modify dependencies, `package-lock.json`, DNS, Vercel, or external services. Use `https://broey.net` as the required production origin; make `www` an external Vercel redirect concern. Set LiNK and Paradise to the existing draft visibility, make Watch return `notFound()`, remove the contact updates opt-in end to end, add the owner-approved Privacy route/disclosures, restore environment-aware site visibility, and add shared Turnstile client/server behavior for Contact and Newsletter with development test-key support and production fail-closed behavior. Do not add Redis or another rate-limit datastore; implement 429-aware clients and document the Vercel WAF rules for the owner to configure in Phase 3. Preserve the existing design and user journeys. Use small commits matching Phase 1a–1d, run the Phase 1 validation matrix, and stop before dependency remediation.

## Exact next action

The owner should first confirm all three of these in one response:

1. `broey.net` is owned and the existing Vercel project is the intended target.
2. Watch, LiNK, and Paradise should be hidden exactly as planned.
3. The privacy facts/effective date/contact email in section 3 are approved or supplied with corrections.

After that response, run the Phase 1 prompt above. Do not begin Option C until Phase 1 is reviewed and the owner separately approves the dependency branch.
