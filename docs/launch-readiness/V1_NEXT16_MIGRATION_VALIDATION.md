# Broey V1 Next.js 16 Migration Validation

Validation date: August 5, 2026

Branch: `codex/next16-security-migration`

Branch base: `fbcfa041304ccd6f4122b8130f659ada2833e1b3` (`main`, finalized Phase 1)

Migration target record: `1a41b8e42b689431e4e956db87b10d8b62fc6b01`

This record covers the isolated Next.js production-security migration. It does not authorize or record a merge, push, pull request, deployment, DNS change, hosting selection, or external-provider mutation.

## Determination

**Ready for owner review, with documented launch dependencies.** The approved Next.js 16, React 19, and ESLint 9 migration is complete on the isolated branch. The exact dependency tree, direct lint target, strict TypeScript check, Turbopack build, webpack comparison build, route behavior, private-preview gate, metadata, responsive layouts, audio behavior, catalog filters, forms, merch handoff, and representative Lighthouse runs passed.

The branch remains unmerged and unpublished. Production launch still depends on the owner-controlled environment, provider write tests, rate limiting, hosting, TLS, DNS, and canonical redirect work already identified by the V1 readiness plan.

## Approved dependency decision

The owner approved `eslint@9.39.5` in place of the originally proposed `eslint@10.8.0`. The trial ESLint 10 installation produced an invalid peer tree because packages bundled by `eslint-config-next@16.3.0` had not declared ESLint 10 support. ESLint 9.39.5 satisfies the verified peer ranges.

No peer override, `--force`, `--legacy-peer-deps`, or package-manager bypass was used. ESLint 10 remains a separate future tooling upgrade.

### Trial-file resolution path

The complete semantic diff of the trial `package.json` and `package-lock.json` was inspected before framework source work. The manifest contained only the intended framework/tooling targets; scripts and unrelated package metadata were unchanged. Lockfile additions, removals, and version changes belonged to the Next.js, React, ESLint, and associated resolution graph.

The approved path was therefore used: update only ESLint to exact 9.39.5, regenerate the lockfile through a normal exact npm installation, and validate the resulting tree. No application source or committed migration evidence was restored or discarded.

### Resolved versions

| Package | Phase 1 resolved | Migrated resolved |
| --- | ---: | ---: |
| Next.js | 14.2.35 | 16.3.0 |
| React | 18.3.1 | 19.2.8 |
| React DOM | 18.3.1 | 19.2.8 |
| ESLint | 8.57.1 | 9.39.5 |
| eslint-config-next | 14.2.35 | 16.3.0 |
| @types/react | 18.3.31 | 19.2.18 |
| @types/react-dom | 18.3.7 | 19.2.4 |
| TypeScript | 5.9.3 | 5.9.3 |
| PostCSS | 8.5.15 | 8.5.23 |

The manifest retains the previously approved TypeScript range; its resolved version remains unchanged. The project declares Node `>=22.13.0 <23`.

## Dependency tree and audits

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 403 packages installed through the committed lockfile |
| `npm ls next react react-dom postcss eslint eslint-config-next` | Pass; one intended Next.js, React, React DOM, ESLint, and eslint-config-next version; PostCSS uniformly resolved/deduped to 8.5.23 |
| `npm ls --all` | Pass, exit 0; 963 tree nodes inspected; no missing/invalid dependency and no `ELSPROBLEMS` |
| `npm audit --omit=dev --audit-level=high` | Pass; zero vulnerabilities |
| `npm audit --audit-level=high` | Expected development-only finding; one high-severity `xlsx` package with no available fix |

After a clean `npm ci`, npm reports `@img/sharp-wasm32@0.35.3` and its nested `@emnapi/runtime@1.11.3` as extraneous while still exiting successfully. The lockfile shows the WASM package as a transitive dependency of platform-conditional optional Sharp packages whose parents are not installed on this Windows platform. This is not an invalid or duplicate framework tree and does not produce `ELSPROBLEMS`.

The accepted full-audit exception remains confined to the development-only `xlsx` release-import tool:

- `GHSA-4r6h-8v6p-xvw6` — prototype pollution
- `GHSA-5pgg-2g8v-p4x9` — regular-expression denial of service
- npm reports no fix available

## Source migration

The implementation is limited to required compatibility work:

- App Router `params` and `searchParams` are awaited, including dynamic music metadata/page behavior and the gate query.
- The lint script now runs direct `eslint .` against an ESLint flat configuration. Generated output, maintenance scripts, and test artifacts are explicitly ignored to preserve the former product-source lint scope.
- `middleware.ts` became `proxy.ts`; matcher, cookie validation, query preservation, and redirect behavior are otherwise unchanged.
- Output-tracing excludes moved from the deprecated experimental block to the supported top-level configuration.
- Next.js now owns separate development output under `.next/dev`; the old custom `.next-dev` phase configuration was removed.
- `turbopack.root` is explicit so an unrelated lockfile above the repository cannot affect root discovery.
- The deprecated Edge declaration was removed from the static Open Graph image route.
- Next.js 16's generated TypeScript references and `react-jsx` setting were accepted.
- React 19 ref initialization is explicit. External local-volume and media-state synchronization runs after commit, preserving the server render and hydration boundary.
- Carousel child injection was isolated from ref-backed render analysis without changing its public interaction model.
- Internal design-system navigation uses `next/link`.
- The generated registry no longer emits an obsolete blanket ESLint disable, and private listening links continue to be removed from the public registry projection.

React Compiler, Cache Components, Partial Prefetching, and unrelated experimental features remain disabled.

## Commit sequence

| Commit | Purpose |
| --- | --- |
| `1a41b8e42b689431e4e956db87b10d8b62fc6b01` | Document Next.js migration target |
| `71a9591305240e2493543b66d51df12f6cb02771` | Exact dependency and lockfile migration |
| `eae4581296976038e3a2423e831e494a03753485` | Async request API migration |
| `36159e3df71a91d05f160a39f63274b5ec1f0060` | ESLint flat configuration and direct script |
| `d331648ede0e5eb76610cd51151ea7442ffe92df` | Middleware-to-Proxy migration |
| `fc1da2afc96a3e04171875f286462bc4ee57a496` | Next.js configuration and build migration |
| `e41414d7f97bb5a5cacd53ba5251dd3351c651eb` | Required React 19 and lint regression fixes |
| `80e9b6baf0e33233b6c5353f82bac095039747ea` | Final migration validation documentation |
| Commit containing this note | Normalize migration evidence formatting |

No finalized Phase 1 commit was amended or rewritten.

## Static validation and builds

| Check | Result |
| --- | --- |
| `npm run lint` (`eslint .`) | Pass; zero warnings or errors |
| `npx tsc --noEmit --incremental false` | Pass |
| `git diff --check` | Pass |
| Public `npx next build --webpack` | Pass; Next.js 16.3.0 webpack build, 54 static pages |
| Public `npm run build` | Pass; default Next.js 16.3.0 Turbopack build, 54 static pages |
| Private `npm run build` | Pass; default Turbopack build with a local-only validation passcode, 54 static pages |

The public validation builds explicitly set `NEXT_PUBLIC_SITE_URL=https://broey.net` and `SITE_VISIBILITY=public`. The private build explicitly set the same origin, `SITE_VISIBILITY=private`, and a disposable local validation passcode. The ignored owner `.env.local` file was not changed.

Both engines produced the same route inventory: core static pages, three dynamic APIs, the dynamic gate and merch pages, 37 generated music paths, metadata routes, and Proxy.

## Routes, visibility, and metadata

The public production crawl checked required/core routes, every sitemap destination, 45 discoverable internal link destinations, and 44 local assets. All approved routes and assets returned successful responses.

| Assertion | Result |
| --- | --- |
| `/`, `/music`, `/merch`, `/about`, `/contact`, `/press`, `/privacy`, `/design-system` | 200 |
| Representative `/music/stereo-luv`, `/music/like-that`, `/music/free`, `/music/contrast` | 200 |
| `/watch`, `/music/link`, `/music/paradise` | 404 |
| Unknown route | 404 |
| Public robots | `Allow: /` with `https://broey.net/sitemap.xml` |
| Public sitemap | 22 approved URLs; Privacy present; Watch, LiNK, and Paradise absent |
| Private robots | `Disallow: /`; no sitemap advertisement |
| Private sitemap | Zero URL entries |

Home, release canonical, Open Graph, structured data, robots, and sitemap output use `https://broey.net`. No crawled page contained the stale `https://broey.com` origin. Representative release metadata remained neutral and factual.

Source parsing identified 165 editorial field occurrences of at least 20 characters (126 unique values) across preserved `description`, `shortDescription`, `seoDescription`, `about`, and `mood` data. A scan of 249 generated `.html`, `.rsc`, and response-body artifacts plus 22 live production responses found zero exact editorial-string matches. Hidden-release and public DISCO URLs/actions did not reappear in discoverable or representative release output.

### Private preview gate

The production private-mode checks passed:

- `/` returned 307 to `/gate?next=%2F`.
- `/music?genre=House` preserved its path and query in the gate destination.
- `/gate` returned 200 with noindex metadata.
- An incorrect passcode returned 303 to the gate error state.
- The local validation passcode returned 303 to `/music`, set `broey_private_preview` with `HttpOnly`, `SameSite=Lax`, and `Path=/`, and unlocked `/music` with 200.
- A protocol-relative `next` value was sanitized to `/`, preventing an external redirect.

## Browser validation

The production Turbopack output was exercised in the in-app browser at five viewport classes:

| Class | Viewport |
| --- | ---: |
| Small mobile | 360 × 800 |
| Large mobile | 430 × 932 |
| Tablet | 768 × 1024 |
| Desktop | 1440 × 900 |
| Wide desktop | 1920 × 1080 |

Home, Contact, Privacy, Music, and `/music/stereo-luv` were checked at every size: 25 route/viewport combinations, zero horizontal overflow, present H1/main content, and no not-found or empty render. Mobile and desktop screenshots were visually coherent. The mobile menu opened, exposed its panel with `aria-expanded=true`, closed, and returned to `aria-expanded=false`.

No browser console error, warning, or hydration message was captured during the route, viewport, filter, navigation, and media checks.

Additional targeted results:

- About retained the approved story, highlights, timeline, coverage redesign, and start-here section.
- Merch rendered six Shopify products in its responsive desktop/mobile presentations and retained external `broey-beats.myshopify.com` product handoffs. No checkout or provider write was attempted.
- Fragments (Remixes) retained its catalog artwork treatment (`object-fit: cover`, bottom positioning), detailed genre labels, multi-track local player controls, and no public DISCO action.
- Representative releases retained canonical URLs, detailed genre display tags, local playback actions, and no hidden-release reference.
- Contact retained only the honeypot plus required first name, last name, email, and message fields; no checkbox or `updatesOptIn` field returned. Its Privacy link remains present.
- Both Home newsletter variants retained an email field, honeypot, optional internal source marker, and Privacy disclosure; no additional visitor data field was introduced.
- Privacy retained Contact, Newsletter, abuse/hosting, retention/request/deletion, privacy-contact, and August 5, 2026 effective-date coverage.

### Audio and genre filters

Local FREE playback reached ready state 4, remained unmuted, and advanced normally. Selecting the `Drum & Bass` filter removed FREE from the visible release list while the same `/audio/free.mp3` element continued playing and its time advanced. A client-side navigation from Music to About retained the same playing source and continued advancing. The player then paused successfully. This covers playback, filtering during playback, and App Router persistence without inspecting or exposing stored browser data.

## Form protection checks

No Resend message, MailerLite subscriber, Shopify checkout, or other provider mutation was created.

Controlled production API checks confirmed:

- Contact and Newsletter honeypots return generic 200 responses before validation/provider work.
- With production Turnstile credentials intentionally absent from the local validation environment, otherwise valid requests fail closed with 503.
- Invalid/missing Contact fields and invalid Newsletter email input return 400 before provider work.
- The browser-rendered Contact and Newsletter forms preserve the approved field sets and Privacy disclosures.

The broader safe test-key, timeout, duplicate-token, and HTTP 429 behavior remains covered by the finalized Phase 1 validation; none of those paths or shared helpers changed in this migration.

## Lighthouse

Lighthouse 12.8.2 was run temporarily through `npx` against the local production Turbopack server; it did not change the manifest or lockfile.

| Route | Performance | Accessibility | Best Practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 96 | 100 | 96 | 100 | 0.9 s | 2.7 s | 0.039 | 20 ms |
| `/music` | 96 | 100 | 100 | 100 | 0.9 s | 2.8 s | 0 | 10 ms |
| `/music/stereo-luv` | 95 | 100 | 96 | 100 | 0.9 s | 2.9 s | 0 | 20 ms |

Lighthouse's only failed best-practices audit was legible font size on Home and the release page. This is recorded as a non-migration visual observation and was not used to reopen owner-approved design or unrelated P2/P3 remediation.

## Hosting-neutral assessment

The migrated application remains hosting-neutral at the framework/runtime level. It uses standard Next.js App Router, Node runtime APIs, Proxy, static generation, route handlers, Image optimization, output tracing, and environment variables. No Vercel-only runtime API, hosting project, deployment configuration, DNS record, or provider integration was added or changed.

The selected host must support Node 22.13, Next.js 16 server output, TLS, environment management, image optimization, operational logging, and the external/distributed rate-limiting decision from the readiness plan. The existing `.vercelignore` remains historical preview infrastructure and does not select the production host.

## Remaining findings and owner-controlled work

- The development-only `xlsx` audit finding remains, with no npm fix available. It is outside this framework migration.
- The clean install's two optional Sharp WASM artifacts are reported by npm as extraneous but do not invalidate the dependency tree.
- Lighthouse reports small text on Home and the representative release page; no design change was authorized in this pass.
- Real Contact delivery and Newsletter subscription still require explicit owner authorization and production-like provider configuration.
- Rate limiting/WAF, production secrets, hosting, TLS, DNS, apex attachment, and the `www.broey.net` redirect remain external launch work.
- The eventual deployment must set `NEXT_PUBLIC_SITE_URL=https://broey.net` and an explicit `SITE_VISIBILITY`; private mode also requires `SITE_PASSCODE`.

## Rollback

Because the branch is unmerged, the safest rollback is to leave or delete `codex/next16-security-migration`; `main` remains at the finalized Phase 1 base. If these commits are later merged and must be undone, create normal revert commits in reverse order, beginning with the final evidence-formatting commit, then `80e9b6baf0e33233b6c5353f82bac095039747ea`, and then reverting:

1. `e41414d7f97bb5a5cacd53ba5251dd3351c651eb`
2. `fc1da2afc96a3e04171875f286462bc4ee57a496`
3. `d331648ede0e5eb76610cd51151ea7442ffe92df`
4. `36159e3df71a91d05f160a39f63274b5ec1f0060`
5. `eae4581296976038e3a2423e831e494a03753485`
6. `71a9591305240e2493543b66d51df12f6cb02771`

Do not use a hard reset on a shared or published branch. The migration-target documentation commit may remain as historical evidence or be reverted separately if the migration is abandoned permanently.
