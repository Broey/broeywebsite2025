# Broey Website Content And SEO Action Plan Report

Date: 2026-06-11

This report summarizes the content strategy, SEO, metadata, CTA, press, and final audit work completed after the phase 1-9 design-system and layout consistency pass.

---

## Scope

The source action plan reframed the site away from a complete historical archive and toward a curated current artist world.

Guiding direction:

- Present Broey. as a genre-fluid electronic artist, producer, audio engineer, and self-taught multi-instrumentalist.
- Treat the older lofi/chillhop/instrumental hip-hop era as foundation and origin-story material.
- Keep current-era and transition-era releases in the primary music flow.
- Avoid leading with full-discography, archive, beatmaker, study-beats, or lofi-heavy positioning.
- Preserve the homepage look and layout while allowing copy and metadata adjustments.

---

## Phase 1 - Reframe

Reframed the site language around selected current work instead of a full archive.

Key changes:

- Changed the music page title from general Music/archive framing to `Selected Releases`.
- Replaced release archive language with selected-release language in visible CTAs and helper copy.
- Removed the separate lofi Spotify profile from shared public social links.
- Replaced remaining visible `Full archive`, `Music Archive`, and `release archive` labels in active/public-facing surfaces.
- Kept historical release records intact so existing detail pages and data references remain stable.

Outcome:

- The main music experience now points to a curated Broey. catalog instead of implying complete chronological discovery.

---

## Phase 2 - Rebuild Music Flow

Rebuilt the `/music` page as a curated listening path.

Key changes:

- Added a `Current Era` section for the main selected listening flow.
- Added a smaller `Transition Works` section.
- Added `Warning` to Transition Works after review.
- Added a text-only `Foundations` block with no streaming buttons, embedded players, release cards, or artwork grid.
- Made `FREE` the featured current-focus release on the music page.
- Renamed public-facing `Fragments EP` references to `Fragments` while keeping the existing slug/path stable.
- Updated selected release descriptions, moods, tags, and SEO descriptions in `content/releases.ts`.

Current Era includes:

- `FREE`
- `blu.`
- `STEREO LUV`
- `LiNK`
- `dancing dumpster fire`
- `I Can't Wait For Love`
- `Mean Something`
- `4u`
- `Fragments`
- `Fragments (Remixes)`

Transition Works includes:

- `Warning`
- `Hold On`
- `hysteria`

Outcome:

- The music page now gives visitors a deliberate path through the current sound, a smaller transition context, and a clear foundation note without sending traffic directly into older lofi work.

---

## Phase 3 - Rewrite Biography

Rebuilt the About page around current identity first, with the old catalog as foundation.

Key changes:

- Updated About metadata title and description.
- Updated About Open Graph and Twitter metadata.
- Updated About JSON-LD schema to identify Joe Montaro with Broey. as the alternate/project name.
- Rewrote the About hero positioning around genre-fluid electronic music.
- Replaced the old latest-project-heavy bio with the longer evolution story:
  - current identity
  - early lofi/chillhop/instrumental hip-hop foundation
  - evolution into faster and more physical electronic music
  - current direction and selected releases
  - artist statement
- Updated reusable bio snippets in `content/site.ts`.
- Updated the reusable `AboutPreview` component copy.

Outcome:

- About now owns the older-music context without letting it become the front-facing identity.

---

## Phase 4 - SEO And Metadata

Cleaned primary SEO and metadata around the new positioning.

Key changes:

- Updated homepage metadata description without changing homepage styling or layout.
- Updated global default SEO title to `Broey. | Genre-Fluid Electronic Artist & Producer`.
- Updated global default SEO description around genre-fluid electronic artist/producer/audio engineer language.
- Updated default Open Graph alt text.
- Updated generated Open Graph image text and alt.
- Updated web manifest description.
- Confirmed Music and About metadata matched the action-plan direction.

Outcome:

- Search/social metadata now presents Broey. as a current electronic artist and producer rather than a full catalog/archive or lofi-forward project.

---

## Phase 5 - CTA Curation

Aligned calls-to-action with the curated current artist world.

Key changes:

- Homepage lower music block now uses:
  - `selected releases`
  - `Current Broey. catalog`
  - `Explore Selected Releases`
- Homepage mailing-list heading changed to `Join the Community`.
- Music featured-release CTA changed to `Listen to Latest Release`.
- Release detail return links changed to `Back to Selected Releases`.
- Discord/community CTA language changed to `Join the Community`.
- Contact form submit button changed to `Send Inquiry`.
- Contact copy was later softened back from service-heavy `Book / Collaborate` language to broader general inquiry language until a dedicated Services page exists.

Final Contact direction:

- Contact remains broad and flexible.
- Services-specific language is reserved for a future Services page/tab.
- `Join the Community` remains the preferred Discord CTA.

Outcome:

- CTAs now guide visitors toward the latest/current releases, selected catalog, community, and general contact without over-promising a services structure that has not been built yet.

---

## Phase 6 - Final Content QA And Archive Documentation

Performed a final audit and archived this report.

Audit checks:

- Searched active source files for old labels including:
  - `Full discography`
  - `Complete Discography`
  - `All Releases`
  - `Explore the Archive`
  - `Listen From the Beginning`
  - `Stream My Full Catalog`
  - `lofi producer`
  - `chillhop artist`
  - `beatmaker`
  - `study beats`
  - `relaxing beats`
  - `Book / Collaborate`
  - `Work With Broey`
- Confirmed current positioning language appears in active files:
  - `Selected Releases`
  - `Current Era`
  - `Transition Works`
  - `Foundations`
  - `genre-fluid`
  - `Join the Community`
  - `Send an Inquiry`
  - `Listen to Latest Release`
  - `Current Broey. catalog`
- Confirmed homepage layout/styling was not changed for the metadata/CTA pass.
- Confirmed Contact was softened back to a general inquiry page pending a future Services page.

Outcome:

- The content/SEO action plan is complete and archived separately from the phase 1-9 design-system report.

---

## Phase 7 - Press And Mentions

Added curated outside coverage to support Broey.'s current artist positioning without creating a separate press page.

Key changes:

- Rebuilt `content/press.ts` as a reusable Press & Mentions data source.
- Added homepage press preview content limited to three current-era/current-context cards.
- Added a fuller grouped Press & Mentions section on About.
- Grouped About coverage by:
  - `Current Era Coverage`
  - `Fragments Coverage`
  - `Origin Interviews`
- Preserved older interviews as origin-story context instead of primary listening-path content.
- Updated About metadata to include selected press, reviews, interviews, and coverage.
- Added external-link behavior with new-tab targets, `rel="noopener noreferrer"`, and accessible labels.

Homepage press preview includes:

- We Rave You on `dancing dumpster fire`
- Insight Music on `Fragments`
- LOUDNESS on `Fragments`

Outcome:

- The homepage now has a compact credibility strip after selected releases.
- The About page now carries the fuller press/history context in a grouped section.
- Press language stays editorial and artist-site appropriate: `Press & Mentions`, not testimonials or customer reviews.

---

## Phase 7.1 - Media Appearance Rehousing

Cleaned up the About page after review showed the Press & Mentions section was drifting toward a broader content hub.

Key changes:

- Removed podcast and video appearances from the About Press & Mentions display.
- Reserved media appearances for a future Watch page.
- Added a `featuredOnWatch` flag to `content/press.ts`.
- Kept media items in the shared press data file so they are ready for future Watch-page work.
- Updated the About Press & Mentions intro copy to focus on reviews, interviews, and independent music blogs.

Moved out of About display:

- `The Chilled Samples Podcast - Episode 051`
- `The Chilled Samples Podcast - Episode 080`
- `Beats Buffet - Table For Two`

Final About Press & Mentions groups:

- `Current Era Coverage`
- `Fragments Coverage`
- `Origin Interviews`

Outcome:

- About now stays focused on artist story, written press, blog coverage, and origin interviews.
- Future Watch can own video interviews, podcasts, visual content, performances, clips, and external media appearances.

---

## Phase 7.2 - About Story Expansion

Expanded the About page into a fuller artist-story page while keeping the current Broey. era as the lead.

Key changes:

- Expanded the About bio into a fuller artist journey covering current identity, early foundation, independent growth, production background, collaborations, community, merch, release direction, and the current electronic era.
- Added an `Artist Highlights` section with proof points for long-term musicianship, independent growth, producer-led operation, and outside coverage.
- Added `The Path Here`, a compact timeline from first public releases through the current era.
- Kept older lofi/chillhop/instrumental hip-hop material as foundation context, not primary discovery.
- Kept podcast/video media appearances reserved for future Watch use.
- Updated `What You'll Find Here` to align with `Music / Watch / Merch / Community`.
- Updated About metadata to reflect the expanded story, independent artist growth, selected press, reviews, interviews, and the current era.
- Added only the CSS needed for the new highlight cards, compact timeline, and responsive behavior.

Validation performed:

- `npm run lint`
- `npm run build`
- Confirmed About media appearances remain out of rendered About sections while still available in `content/press.ts` for future Watch use.
- Confirmed new About section language appears in active source files.
- Existing Next build note remains: edge runtime disables static generation for that route.

Outcome:

- About now tells the broader Broey. journey without becoming a full archive or EPK.
- Achievements and proof points are present without shifting into resume/KPI framing.
- The timeline gives context without linking into older lofi releases or creating a release archive.
- Press & Mentions remains focused on written/editorial coverage.

---

## Phase 7.3 - Press Layout Refinement

Refined the About Press & Mentions section so it reads as an editorial citation layer instead of another product-style card grid.

Key changes:

- Left homepage Press & Mentions cards unchanged.
- Kept the About Press & Mentions placement after the timeline.
- Changed the About-only full press layout to one featured current-era press item for We Rave You / `dancing dumpster fire`.
- Reworked `Fragments Coverage` into compact two-column ledger rows.
- Reworked `Origin Interviews` into quieter compact context rows.
- Removed full article-title prominence from non-featured About press items while preserving links, outlet names, quotes, summaries, author/date metadata, and CTA labels.
- Reduced repeated card density and made older origin-story coverage visually lighter than current-era and Fragments coverage.
- Preserved existing press data, source links, feature flags, and future Watch media appearance handling.

Validation performed:

- `npm run lint`
- `npm run build`
- Confirmed media appearances still do not render in About/component press output and remain only in `content/press.ts` for future Watch use.
- Confirmed Press & Mentions, Fragments Coverage, and Origin Interviews still render on About.
- Existing Next build note remains: edge runtime disables static generation for that route.

Outcome:

- About press now feels more credible, curated, editorial, and supportive.
- The section no longer visually competes with Selected Releases or merch-style browsing surfaces.

---

## Major Files Updated

- `app/page.tsx`
- `app/music/page.tsx`
- `app/about/page.tsx`
- `app/contact/page.tsx`
- `app/globals.css`
- `app/manifest.ts`
- `app/opengraph-image.tsx`
- `app/design-system/page.tsx`
- `content/site.ts`
- `content/seo.ts`
- `content/socials.ts`
- `content/releases.ts`
- `content/press.ts`
- `components/audio/releaseAudioQueue.ts`
- `components/sections/AboutPreview.tsx`
- `components/sections/ContactForm.tsx`
- `components/sections/Hero.tsx`
- `components/sections/HomepageConnectSection.tsx`
- `components/sections/HomepageMusicArchiveSection.tsx`
- `components/sections/MusicArchivePreview.tsx`
- `components/sections/PressMentionsPreview.tsx`
- `components/sections/PressMentionsSection.tsx`
- `components/sections/ReleaseCarousel.tsx`
- `components/ui/PressCard.tsx`
- `app/music/[slug]/page.tsx`

---

## Validation Performed

Repeated throughout the content/SEO phases:

- `npm run lint`
- `npm run build`
- Targeted text audits with `rg`

Final validation status after Phase 7.3:

- Lint passed.
- Production build passed.
- Targeted stale-language audit passed for active source files.
- Press & Mentions confirmation audit passed for active source files.
- New external press links use new-tab behavior, `rel="noopener noreferrer"`, and accessible labels.
- Phase 7.1 confirmed Media Appearances no longer render on About while remaining available in `content/press.ts` for future Watch use.
- Phase 7.2 confirmed the expanded About story, Artist Highlights, timeline, and Music / Watch / Merch / Community section render cleanly.
- Phase 7.3 confirmed About Press & Mentions now uses one featured current-era item plus compact Fragments and Origin Interview ledger rows.
- Existing Next build note remains: edge runtime disables static generation for that route.

---

## Future Services Page Note

The contact page was intentionally kept broad for now.

Recommended future Services page direction:

- Page label: `Services` or `Sound`
- Possible CTAs:
  - `Work With Broey.`
  - `Book a Session`
  - `Track Feedback`
  - `Mix / Master`
  - `Production Direction`
  - `Artist Coaching`
- Possible headline:
  - `Sound feedback, production direction, and mix perspective from a real sound guy.`

This should be treated as a separate future build so the current Contact page does not need to carry services, booking, community, press, and general inquiry duties at the same time.
