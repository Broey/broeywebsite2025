# Post-launch Phase 1 crawl and indexing audit

- Audit date: 2026-08-06
- Branch: `seo/phase-1-crawl-indexing`
- Scope: crawl/indexing readiness only; no content rewrite, keyword program, schema expansion, redesign, or deployment environment mutation

## Files inspected

- Visibility/origin/runtime: `lib/site-visibility.ts`, `lib/site-origin.ts`, `proxy.ts`, `next.config.js`, `.vercelignore`, `.env.local.example`, `README.md`
- Metadata routes/layout: `app/layout.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/opengraph-image.tsx`
- Public and internal routes: all `app/**/page.tsx` files, including `app/music/[slug]/page.tsx`, `app/gate/page.tsx`, and `app/design-system/page.tsx`
- Content/routing policy: `content/releases.ts`, `content/release-filters.ts`, `content/release-actions.ts`, `content/release-metadata.ts`, `content/navigation.ts`, `content/seo.ts`, `content/site.ts`, `content/watch.ts`
- Crawl paths: header, mobile navigation, footer, homepage sections, music catalog/cards, release tracklists, and recommendation components
- Tooling/documentation: `package.json`, `package-lock.json`, `.gitignore`, existing launch/audit reports, and repository scripts

No secrets, passcodes, `.env.local` values, generated build output, or local artifacts were added to Git.

## Initial findings

1. Public/private gating was fundamentally sound: production-like missing/invalid visibility failed closed, private mode required a passcode, the proxy bypassed the gate in public mode, private metadata emitted `noindex, nofollow`, private robots blocked `/`, and private sitemap output was empty.
2. Public robots allowed `/` and referenced an absolute sitemap. Static pages already had titles, descriptions, and self-canonicals. Draft releases were removed from the exported release collection, and invalid slugs used `notFound()`.
3. Sitemap entries used a fresh `new Date()` on every build, creating misleading modification dates. Reliable exact dates exist for only some releases; static-page modification dates are not available.
4. Release publication/indexing rules were split across archive, sitemap, recommendations, and dynamic route code. The `indexing`/`catalogStatus` fields were not consistently enforced. Hidden project-track detail pages were excluded from the sitemap but lacked an explicit `noindex` policy.
5. The root layout declared the homepage canonical, causing 404 output to inherit a homepage canonical. The response was a real 404, but the canonical was misleading.
6. Production-like metadata trusted the configured deployment host, allowing a valid preview host to contaminate canonical URLs, JSON-LD, share URLs, robots, and sitemap output.
7. There was no focused automated regression command for these crawl/indexing rules and no explicit standalone TypeScript-check command.
8. `/watch` is intentionally outside the V1 public surface: it returns 404, is absent from navigation, and is excluded from the sitemap. `/design-system` and `/gate` are nonindexable and excluded.

## Changes made

- `lib/site-origin.ts`
  - Centralized the production canonical as `https://broey.net`.
  - Production/preview configurations still require an explicit valid HTTPS origin, but all generated public URLs normalize to the canonical production origin.
  - Added strict canonical-path validation that rejects external origins, query strings, fragments, and malformed paths.
- `lib/crawl-indexing.ts`
  - Added pure robots and sitemap builders.
  - Added URL deduplication and reliable exact release-date handling.
- `content/release-filters.ts`
  - Centralized published and indexable release rules.
  - Draft, draft-catalog, `noindex`, `internal`, and empty-slug entries cannot enter public index collections.
  - Hidden project-track pages remain directly usable but are treated as nonindexable unless explicitly opted into the sitemap.
- `content/seo.ts`
  - Validates canonical paths and emits canonical-origin absolute URLs.
  - Supports intentional route-level `noindex, nofollow` metadata for internal release details.
- `app/layout.tsx`
  - Removed the root homepage canonical/Open Graph URL so 404 pages cannot inherit a homepage canonical. The homepage owns its canonical through its page metadata.
- `app/robots.ts`
  - Uses the tested pure public/private robots policy.
- `app/sitemap.ts`
  - Uses the tested sitemap builder, keeps the established seven static routes, includes 15 intended indexable release routes, deduplicates output, and applies exact factual release dates only.
  - Static pages and releases with partial/unknown dates omit `lastModified`; no dates were fabricated.
- `app/music/[slug]/page.tsx`
  - Uses centralized publication rules for route lookup/static params.
  - Adds explicit noindex metadata to routable internal project-track detail pages.
  - Invalid/unpublished slugs continue to return a real 404.
- `tests/crawl-indexing.test.mjs`, `package.json`
  - Added `npm test` coverage for both robots modes, public sitemap contents/deduplication, stable dates, release inclusion/exclusion, production absolute URLs, and canonical validation.
  - Added `npm run typecheck`.
- `.env.local.example`, `README.md`
  - Clarified canonical-origin normalization and the Vercel/DNS ownership of the `www` redirect.

## Validation commands and results

| Command/check | Result |
| --- | --- |
| `npm ci` | Passed; 403 packages installed from `package-lock.json`. npm reported one existing high-severity dependency advisory for manual review. |
| `npm run lint` | Passed with no ESLint errors. |
| `npm run typecheck` | Passed (`tsc --noEmit`). |
| `npm test` | Passed: 5 tests, 0 failures. Node emitted expected experimental type-stripping/module-format warnings. |
| Public `npm run build` with canonical origin and `SITE_VISIBILITY=public` | Passed; 54 pages generated. |
| Private-config `npm run build` using the existing local private-preview configuration | Passed; 54 pages generated. No environment values were printed or changed. |
| `git diff --check` | Passed. |
| Public production server route smoke test | Passed for `/`, `/about`, `/music`, `/music/free`, `/contact`, `/merch`, `/press`, `/privacy`, `/robots.txt`, and `/sitemap.xml`. |
| Public invalid/internal route checks | `/music/not-a-real-release` and `/watch` returned 404 plus noindex; internal `/music/shake` returned 200 plus `noindex, nofollow`. |
| Public metadata checks | Every intended indexable HTML page checked returned a nonempty title, description, and self-canonical with no noindex directive. |
| Public robots check | Returned 200, `User-Agent: *`, `Allow: /`, and `Sitemap: https://broey.net/sitemap.xml`. |
| Public sitemap check | Returned valid XML with 22 URLs (7 static + 15 releases), 22 unique URLs, no invalid-domain/query/internal URLs, and all 22 resolved locally to 200 with matching self-canonicals. |
| Private production server route smoke test | `/`, `/about`, and `/music/free` redirected to `/gate`; `/gate` returned 200 with `noindex, nofollow`. |
| Private robots/sitemap check | Robots returned global disallow; sitemap returned a valid empty `<urlset>`. |

Next.js serializes the root canonical link as `https://broey.net` while the sitemap serializes the equivalent root URL as `https://broey.net/`. Both identify the same HTTPS origin without a redirect or duplicate path; interior URLs consistently omit trailing slashes.

## Deferred/manual dependencies

- Do not change production visibility from code. In Vercel, explicitly confirm `SITE_VISIBILITY=public` for the production deployment and `SITE_VISIBILITY=private` plus a nonempty `SITE_PASSCODE` only where preview protection is intended.
- Confirm `NEXT_PUBLIC_SITE_URL` is explicitly set to a valid HTTPS origin in production and preview. Generated indexable URLs normalize to `https://broey.net`.
- Verify Vercel domain behavior externally after deployment: `http` to `https`, `www.broey.net` to `broey.net`, and no redirect chain on canonical URLs.
- Verify Vercel/CDN response headers do not inject `X-Robots-Tag: noindex` in public production.
- Submit/inspect `https://broey.net/sitemap.xml` in Google Search Console and Bing Webmaster Tools after the public deployment.
- Review the one high-severity advisory reported by `npm ci` separately; dependency remediation was outside this crawl/indexing scope.
- Static-page source modification dates are unavailable, and many releases have only year-level dates. Their sitemap `lastModified` values are intentionally omitted.

## Post-deployment checklist

- Fetch `/robots.txt` and `/sitemap.xml` without authentication on the production hostname.
- Inspect rendered title, description, canonical, robots meta, status, and `X-Robots-Tag` for every static sitemap route and a sample of release routes.
- Confirm every sitemap URL returns one 200 response with no redirect chain.
- Confirm a random invalid release slug and `/watch` return 404, not 200/soft-404 output.
- Confirm `/gate`, `/design-system`, internal project-track pages, API paths, and preview-only content are absent from the sitemap.
- Confirm preview deployments remain gated and globally nonindexable.
- Confirm production requests are not gated once `SITE_VISIBILITY=public` is active.

## Acceptance assessment

| Criterion | Assessment |
| --- | --- |
| Public mode allows indexing | Pass |
| Private mode blocks indexing and access | Pass |
| Robots is valid in both modes | Pass |
| Public sitemap is valid; private sitemap is intentionally empty | Pass |
| Intended routes included once; internal/draft/invalid/404 routes excluded | Pass |
| Every indexable page has a unique self-canonical | Pass |
| No interior or 404 page inherits the homepage canonical | Pass |
| Every indexable page has title and description | Pass |
| Invalid release slug returns real 404 | Pass |
| Important pages/releases use crawlable links | Pass |
| Production absolute URLs use `https://broey.net` | Pass |
| Install, lint, type checks, tests, and builds pass | Pass (dependency advisory noted above) |
| Domain redirects and deployed headers | Manual post-deployment check required |

Overall Phase 1 code assessment: **pass**, with the listed Vercel/domain checks required after deployment.
