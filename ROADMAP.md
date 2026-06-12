# Broey. Website Roadmap

Date: 2026-06-09  
Owner: Broey website build  
Status: Active planning document

## Purpose

Use this as the single working roadmap while we continue building the website.  
The goal is to get the site fully usable quickly by reusing what already exists, and then expand it in disciplined phases.

## Current status

### Phase 1 - Functional launch blockers

- [x] Server-side newsletter API route.
- [x] Server-side contact API route.
- [x] Mailing list form submits via fetch.
- [x] Contact form submits via fetch.
- [x] Loading/success/error/not-connected states.
- [x] Honeypot spam field.
- [x] Public bare `#` link cleanup.
- [x] Public release quality gate.
- [x] Six draft releases reviewed and published.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.
- [ ] Add real provider env values.
- [ ] Smoke-test live provider forwarding.

### Phase 2 - Catalogue and release-library reconciliation

- [x] Reviewed all 75 imported catalogue entries.
- [x] 0 entries left pending.
- [x] Manual/ignore classifications applied.
- [x] Release-folder map reconciled.
- [x] Unmapped missing releases reduced to 0.
- [x] No bulk merge of manual candidates.
- [x] Release-library sync preview clean.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.

### Phase 3A - Watch page

- [x] Add public `/watch` route.
- [x] Add lightweight watch content model.
- [x] Add `/watch` to desktop nav.
- [x] Add `/watch` to mobile nav.
- [x] Add `/watch` to footer nav.
- [x] `/watch` added to sitemap.
- [x] Add YouTube, TikTok, and Instagram/Reels links.
- [x] Use fallback featured-video state when no verified YouTube ID exists.
- [x] No fake video embed IDs.
- [x] No bare `#` or empty public URLs.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.

### Phase 3B - Merch/store hub refinement

- [x] Refined `/merch` into a clearer public store hub.
- [x] Replaced placeholder merch data with six live Shopify products.
- [x] Merch product data now includes:
  - `title`
  - `price`
  - `href`
  - `image`
  - `category`
  - `description`
  - `featured`
  - `status`
- [x] Product cards link to Shopify product pages with `View item` CTAs.
- [x] Missing merch image files fall back without breaking the build.
- [x] Shopify embeds render only with real `embedUrl`.
- [x] No bare `#` or empty public URLs.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.

### Phase 4 - SEO and polish

- [x] Sitemap includes all public static routes.
- [x] Sitemap includes visible public release detail routes.
- [x] Release detail pages include breadcrumb UI.
- [x] Release detail pages include `BreadcrumbList` JSON-LD.
- [x] Release metadata uses verified cover art only for release OG images.
- [x] High-value route metadata audited.
- [x] Final public-link hygiene scan passed.
- [x] `npm run lint` passed.
- [x] `npm run build` passed.

### Remaining known caveats

- Live newsletter/contact forwarding still needs real provider env vars.
- Featured `/watch` embed is waiting on a verified YouTube video ID.
- Merch products now use live Shopify product links; Shopify embeds are still not configured.
- `Warning` and `Paradise` intentionally use fallback artwork.
- `LiNK` remains intentionally pending for catalogue/TIDAL enrichment.
- 32 imported entries remain manual draft candidates, not blockers.
- `/lab` remains deferred.

## Current baseline (already in repo)

- Next.js App Router is implemented and running.
- Core routes that are currently live:
  - `/` (home)
  - `/music`
  - `/watch`
  - `/merch`
  - `/about`
  - `/contact`
  - `/music/[slug]` (release detail pages)
- Shared layout and global SEO shell are in place.
- Release data pipeline exists and is wired to the music pages.
- Newsletter/contact capture UI components are present, though provider integrations are still pending.
- Merch cards use live Shopify product links; checkout, shipping, variants, and order updates stay on Shopify.
- Brand direction docs and utility scripts are already in place for iterative content syncing.

## What already exists (Full vs Partial)

### Full or substantially complete

- **Landing shell (Home)**:  
  - Uses `MusicCarouselHero`, `HomepageSelectedReleases`, `HomepageMerchSection`, and connect/footer CTAs.
  - File: [app/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/page.tsx)
- **Music archive**:  
  - `/music` with featured release + release cards.
  - File: [app/music/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/music/page.tsx)
- **Dynamic release detail pages**:
  - SEO + metadata + share + platform links + tracklist handling + fallback artwork.
  - File: [app/music/[slug]/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/music/[slug]/page.tsx)
- **About/Contact/Merch pages**:
  - About page with brand story and release teasers.
  - Contact page form shell + Discord path.
  - Merch page with product cards linked to the official Broey Shopify store.
  - Files:
    - [app/about/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/about/page.tsx)
    - [app/contact/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/contact/page.tsx)
    - [app/merch/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/merch/page.tsx)
- **Global primitives**:
  - Header/footer navs, reusable release cards, embed and social utilities, release actions.
  - Files:
    - [components/site/Header.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/components/site/Header.tsx)
    - [components/site/Footer.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/components/site/Footer.tsx)
- **Brand direction and base roadmap**:
  - Visual direction doc exists.
  - File: [Brand_Styling_Direction.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/Brand_Styling_Direction.md)
- **Release scripts and data sources**:
  - Release import/scan/sync scripts and inventory outputs are present and already partially exercised.
  - Files:
    - [scripts/release-library-inventory.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/release-library-inventory.md)
    - [scripts/released-folder-inventory.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/released-folder-inventory.md)
    - [scripts/release-library-stage-plan.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/release-library-stage-plan.md)
    - [content/releases.ts](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/releases.ts)
    - [content/releases.imported.json](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/releases.imported.json)

### Partial or intentionally incomplete

- **Email signup form / mailing list integration**
  - Component exists with fallback messaging, but no provider endpoint is required yet.
  - File: [components/sections/EmailSignup.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/components/sections/EmailSignup.tsx)
- **Contact form action**
  - Form rendering exists, but submit endpoint is environment-driven and currently optional.
  - File: [app/contact/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/contact/page.tsx)
- **Merch checkout**
  - Product cards link to Shopify for checkout, shipping, variants, and order updates.
  - `ShopifyProductEmbed` remains available for future real `embedUrl` values.
  - File: [components/embed/ShopifyProductEmbed.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/components/embed/ShopifyProductEmbed.tsx)
- **Release metadata completeness**
  - `content/releases.ts` has 17 public entries after the Phase 1 release-quality gate.
  - Imported catalog metadata file has 75 entries: 32 manual candidates and 43 ignored duplicates/track-level entries.
  - Source files:
    - [content/releases.ts](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/releases.ts)
    - [content/releases.imported.json](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/releases.imported.json)
- **Site sections not yet built**
  - No dedicated `/lab`.
  - No dedicated `/store` domain page; `/merch` is the current public storefront gateway.

## Data/inventory state we should continue from

- [scripts/release-library-inventory.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/release-library-inventory.md) snapshot:
  - 8 total release folders in library.
  - 1 exact release date (`FREE`), 7 placeholder date prefixes.
  - 0 blocked for website sync.
- [scripts/released-folder-inventory.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/released-folder-inventory.md) snapshot:
  - 29 folders scanned.
  - 20 unmatched to content catalog.
  - 3 curated carousel releases missing from scan:
    - `4u`, `Fragments (Remixes)`, `LiNK`.
  - 0 unmapped missing releases.
- [scripts/release-library-stage-plan.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/scripts/release-library-stage-plan.md) snapshot:
  - 15 planned "released".
  - 14 planned "needs-review".
  - 0 planned pending.

## Roadmap (Phase-based)

### Phase 0 — Launch-safe baseline (already mostly done)

- [x] Home route, music route, about route, contact route, merch route, release detail routes.
- [x] Shared navigation + global header/footer.
- [x] Release listing and dynamic detail pages integrated with catalog metadata.
- [x] Brand direction and style system established.
- [x] Asset sync scripts and release scripts wired in `package.json`.

### Phase 1 — Make all existing sections truly functional (next)

- [x] Add server-side newsletter API route and form fetch submission.
  - Existing file: [components/sections/EmailSignup.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/components/sections/EmailSignup.tsx)
- [x] Add server-side contact API route and form fetch submission.
  - Existing file: [app/contact/page.tsx](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/contact/page.tsx)
- [x] Finish release quality pass for public items in `content/releases.ts` (audio/source links, description quality, cover availability).
- [x] Resolve and publish `Like That`, `Hold On`, `Warning`, `hysteria`, `After You`, and `Paradise`.
- [ ] Add real provider env values and smoke-test live forwarding.

### Phase 2 — Catalogue completion (catalog + media consistency)

- [x] Run and act on full imported catalog review:
  - [x] 75 entries in `content/releases.imported.json`.
  - [x] 0 pending review, 32 manual candidates, 43 ignored duplicates/track-level entries.
- [x] Reconcile release-library stage plan.
- [x] Finish missing/mapped external or nested folder evidence for `4u`, `blu`, `fragments-remixes`, and related mapped releases.
- [x] Keep `LiNK` pending for catalogue/TIDAL enrichment.
- [x] Settle missing unmapped entries:
  - `After You`, `GLFM`, `I Can't Wait For Love`, `Like That`, `Warning`.

### Phase 3 — Website growth aligned to original expansion plan

- [x] Add `/watch` page with:
  - featured video fallback until a verified YouTube video ID exists,
  - social video links,
  - visual clip placeholders.
- [ ] Add `/lab` page with MVP content:
  - 3–5 demos,
  - 1 tool spotlight,
  - one plugin/stack section,
  - embedded list/join CTA.
- [x] Expand `/merch` into a store hub:
  - better product metadata,
  - embed/shop links per item,
  - optional “drop” and “upcoming” states.

### Phase 4 — SEO and polish

- [x] Add richer metadata and OG images for all canonical release pages.
- [x] Add breadcrumbs and structured data for high-value releases.
- [x] Audit `sitemap.ts` and include important dynamic routes if needed.
  - Current sitemap: [app/sitemap.ts](c:/Users/phill/Desktop/Scripts/Broey.%20Website/app/sitemap.ts)
- [x] Finalize external link hygiene:
  - remove placeholder `#` links where available,
  - keep fallback behavior explicit for anything still not ready.

## Immediate next 2-week plan (recommended)

1. Close the current partial blockers:
   - mail signup provider
   - contact endpoint
   - swap `#` placeholders where possible
2. Resolve the six draft releases already present in `releases.ts` and mark complete or intentionally hidden.
3. Complete at least 3 needs-review items from stage plan with clear catalog evidence.
4. Ship `/watch` or `/lab` (pick one) as a small real section to satisfy "site completeness" while content grows.

## Quick references

- [Website_V1_Plan.md](c:/Users/phill/Desktop/Scripts/Broey.%20Website/Website_V1_Plan.md)
- [Content inventory CSV (source)](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/Broey._InventoryExport_2026-06-08_15_10_45.csv)
- [Release-folder metadata map](c:/Users/phill/Desktop/Scripts/Broey.%20Website/content/release-folder-map.json)
