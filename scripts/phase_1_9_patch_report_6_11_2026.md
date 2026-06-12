# Broey Website Patch Report - Phases 1-9

Date: 2026-06-11

This report summarizes the design-system, layout, cohesion, and publish-readiness work completed across phases 1 through 9 of the Broey website consistency pass.

---

## Phase 1 - Design System Foundation

Created the core visual system so page styles could be reused instead of rewritten page by page.

Key changes:

- Added shared design tokens in `app/globals.css` for page width, gutters, header height, spacing, radii, borders, card surfaces, shadows, color roles, type scale, buttons, inputs, and focus ring.
- Added a noindex design-system reference page at `app/design-system/page.tsx`.
- Standardized the reusable button component in `components/ui/Button.tsx`.
- Extended `components/ui/SectionLabel.tsx` with semantic label tones.

Outcome:

- The site now has one source of truth for key spacing, typography, buttons, surfaces, and metadata labels.

---

## Phase 2 - Global Shell Normalization

Aligned the global site wrapper, header, navigation, and footer behavior.

Key changes:

- Added Home to the primary navigation in `content/navigation.ts`.
- Updated `components/site/Header.tsx` so the Home nav item receives the same active state as other pages.
- Wrapped all routes in a consistent `<main className="site-main">` via `app/layout.tsx`.
- Standardized `.site-shell`, `.site-header`, and responsive menu behavior in `app/globals.css`.
- Hid the desktop menu pill where the full desktop nav is already visible.

Important user-directed adjustment:

- The home carousel was restored to its previous open, full-bleed feeling after the boxed version felt too constrained.

Outcome:

- All pages now share the same global shell while the home page keeps its cinematic carousel.

---

## Phase 3 - Standard Page Intros

Created one reusable page intro pattern for inner pages.

Key changes:

- Added `components/ui/PageIntro.tsx`.
- Added shared `.inner-page`, `.page-intro`, `.page-intro-title`, and `.page-intro-copy` styles.
- Applied the intro pattern to:
  - `app/music/page.tsx`
  - `app/merch/page.tsx`
  - `app/about/page.tsx`
  - `app/contact/page.tsx`
- Changed About and Contact hero titles from page-level H1s to inner H2s, leaving the new page intro as the true H1.

Outcome:

- Music, Merch, About, and Contact now share the same opening rhythm:
  `/ section`, page title, one-sentence description, primary panel/content below.

---

## Phase 4 - Hero Variant System

Reworked hero sections as variants of one card/panel language.

Key changes:

- Added shared `.hero-panel` styling in `app/globals.css`.
- Applied the shared hero panel system to:
  - Music featured release
  - Merch featured product
  - About artist identity
  - Contact routing panel
- Updated hero copy and hierarchy to use more consistent labels, titles, descriptions, and CTA treatment.
- Removed the redundant Contact routes hero after user feedback.

Outcome:

- Page heroes now feel related while still serving different page purposes.
- Contact became cleaner: page intro, contact form, Discord tile.

---

## Phase 5 - Section Header System

Created one reusable section-heading pattern for lower-page sections.

Key changes:

- Added `components/ui/SectionHeader.tsx`.
- Added shared `.section-header` CSS.
- Migrated section headings on:
  - Music archive
  - Merch available pieces
  - About bio
  - About "What you'll find here"
  - About selected releases
  - Contact form
  - Contact Discord tile

Outcome:

- Lower-page content now uses a consistent eyebrow/title/description/meta/action pattern.

---

## Phase 6 - Release And Product Card Unification

Unified release cards and merch cards as sibling components.

Key changes:

- Rebuilt `components/ui/ReleaseCard.tsx` around a shared `.release-grid-card` card system.
- Updated `components/ui/MerchCard.tsx` to use the same arrow convention and card rhythm.
- Added shared release-card CSS for border, radius, image radius, metadata, title scale, description, CTA row, and hover state.
- Tuned merch-card CSS so product cards match the same card family.
- Updated the home merch preview cards to align with the same card token system.
- Replaced remaining old `-&gt;` arrow text with `&rarr;`.

Outcome:

- Music release cards, merch cards, and home merch previews now read as one component family.

---

## Phase 7 - Page-Specific Imbalance Fixes

Cleaned up specific layout and hierarchy issues after the system pieces were in place.

Key changes:

- Added a subtle `/ Broey` release spotlight label above the home carousel without boxing in the carousel.
- Tightened the Music featured release layout and copy alignment.
- Softened the Merch hero so it feels less like a separate storefront.
- Removed remaining mobile merch divider behavior.
- Reduced and systematized the About hero display scale.
- Constrained About bio copy width and line-height for readability.
- Balanced the Contact form and Discord tile as matching panels.

Outcome:

- The pages now feel more consistent without losing their individual purpose.

---

## Phase 8 - Publish-Readiness Pass

Audited and fixed final launch-readiness details.

Key changes:

- Added global visible focus styles for links, buttons, inputs, textareas, and selects.
- Replaced fake `href="#"` links in the design-system preview with real internal links.
- Optimized oversized public PNG assets while keeping existing paths stable.
- Corrected Open Graph image metadata dimensions after image optimization.
- Removed unused `public/assets/audio/latest-release.wav`, which was about 60 MB and no longer used by the active player.
- Removed old public backup image artifacts from `public/assets/cover-art`.
- Removed the legacy `audioPreview` reference from `content/releases.ts`.

Outcome:

- The site is lighter, focus-visible states are present, fake links are gone, and the public asset folder is cleaner.

---

## Phase 9 - Shared Page Margins And Dimensions

Added after user review revealed Music and Merch were not lining up with About and Contact.

Key changes:

- Made `.inner-page` the canonical inner-page shell:
  - `width: min(100%, 82rem)`
  - `margin-inline: auto`
  - shared top page offset
- Removed the extra Merch-specific top padding.
- Removed the redundant Merch wrapper width behavior from `.merch-page-shell`.
- Updated mobile overrides so all inner pages share the same mobile top spacing.

Outcome:

- Music, Merch, About, Contact, release detail pages, Watch, and future pages using `.inner-page` now inherit the same page width, centering, and top offset.

---

## Major Files Added

- `app/design-system/page.tsx`
- `components/ui/PageIntro.tsx`
- `components/ui/SectionHeader.tsx`
- `scripts/phase_1_9_patch_report_6_11_2026.md`

---

## Major Files Updated

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/music/page.tsx`
- `app/merch/page.tsx`
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `content/navigation.ts`
- `content/releases.ts`
- `components/site/Header.tsx`
- `components/ui/Button.tsx`
- `components/ui/SectionLabel.tsx`
- `components/ui/ReleaseCard.tsx`
- `components/ui/MerchCard.tsx`
- `components/sections/MusicCarouselHero.tsx`
- `components/sections/HomepageMerchSection.tsx`

---

## Assets Updated Or Removed

Optimized:

- Large PNG assets in `public/assets/cover-art`
- Large PNG assets in `public/assets/merch`

Removed:

- `public/assets/audio/latest-release.wav`
- Public backup artifacts such as:
  - `public/assets/cover-art/blu.png.backup-*`
  - `public/assets/cover-art/free.png.backup-*`
  - `public/assets/cover-art/stereo-luv.png.backup-*`

---

## Validation Performed

Repeated throughout the phases:

- `npm run lint`
- `npm run build`
- Local route smoke checks with `Invoke-WebRequest`

Final verified routes included:

- `/`
- `/music`
- `/merch`
- `/about`
- `/contact`
- `/music/link`
- `/music/stereo-luv`
- `/watch`
- `/sitemap.xml`
- `/robots.txt`

Final status:

- Lint passed.
- Production build passed.
- Smoke checks returned `200`.
- Existing Next build note remains: edge runtime disables static generation for that route.

---

## Design Direction Preserved

The final implementation keeps the original Broey identity:

- Dark atmospheric background
- Industrial/electronic mood
- Yellow primary action color
- Cyan metadata/breadcrumb color
- Bold condensed typography
- Album-art/product-card presentation
- Full-bleed cinematic home carousel
- Clean global header and footer

The main change is that those ingredients now belong to a repeatable system instead of separate page templates.
