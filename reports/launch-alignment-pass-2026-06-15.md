# Broey. Website Launch Alignment Pass

Date: 2026-06-15

Scope: focused launch-readiness pass for critical blockers and high-priority pre-launch fixes from the current-state audit. No redesign, new feature buildout, analytics, automated UI tests, provider wiring changes, or medium-priority polish were included.

## Files Changed

- `content/releases.ts`
- `content/release-filters.ts`
- `content/navigation.ts`
- `app/music/[slug]/page.tsx`
- `README.md`

## Decisions Made

- `FREE` is the current/latest public release for launch.
- `LiNK` remains visible as a preview/manual-style release page, but it is not marked as the current release.
- `LiNK` public DSP links were not added because the local reports intentionally exclude it from link expansion and no verified public Spotify, Apple Music, YouTube/YouTube Music, or TIDAL release links were found in repo data.
- `/watch` remains directly accessible, but it is hidden from primary navigation and footer navigation until real media content exists.
- `/press` remains accessible through existing homepage/about CTAs and remains in the sitemap. It was not added to primary navigation.

## What Was Fixed

- Moved the release `featured` source of truth from `LiNK` to `FREE`.
- Set `FREE` to carousel priority 1 and `LiNK` to carousel priority 2 so the homepage carousel opens around the public current release.
- Updated `LiNK` copy/tags/details so the page presents as pending preview/manual listening content instead of implying public DSP availability.
- Updated release date display logic so `YYYY-00-00` renders as the release year rather than "Release date TBA".
- Added month/year handling for possible `YYYY-MM-00` dates.
- Updated sitemap release filtering so hidden archive pages, including project-track child pages with `showInArchive: false`, are excluded unless explicitly opted back in with `showInSitemap: true`.
- Removed `/watch` from shared visible navigation, which also removes it from the footer because the footer consumes `primaryNavItems`.
- Added concise README environment documentation for public/private visibility, canonical site URL, Shopify merch runtime, Resend contact delivery, MailerLite newsletter delivery, and Turnstile.

## Platform Links

No platform links were added in this pass.

Still needing manual verification:

- `LiNK`: public Spotify, Apple Music, YouTube/YouTube Music, or TIDAL links.
- `Fragments` / `fragments-ep`: YouTube or YouTube Music link.
- `Hold On`: YouTube or YouTube Music link.
- `Warning`: YouTube or YouTube Music link.
- `Like That`: standalone Spotify link. The local draft warns not to use the notminimal remix URL or parent EP fallback without manual approval.

## Sitemap And Indexing Changes

- Hidden project-track child pages remain directly routable and still work for parent project tracklists/audio context.
- Hidden project-track child pages are no longer included in `/sitemap.xml` by default.
- Any intentionally enriched hidden page can still opt into the sitemap with `showInSitemap: true`.

## Watch/Nav Changes

- `/watch` was removed from `content/navigation.ts`.
- Header, mobile menu, and footer no longer surface `/watch`.
- `app/watch/page.tsx` was not deleted, and `/watch` was not added to the sitemap.

## Intentionally Deferred

- Exact date replacement for placeholder dates. Local TIDAL notes contain candidate exact dates, but the previous reconciliation report explicitly marked those as review-only for date overwrites. The launch-safe fix is display-only year fallback.
- New platform-link research or external lookup.
- YouTube Music as a distinct platform label.
- Press nav promotion.
- Watch page buildout and `watchPressItems` rendering.
- Provider runtime verification for Shopify, Resend, MailerLite, and Turnstile.
- Analytics/instrumentation and Playwright smoke tests.
- Global audio player close/minimize polish.

## Validation Results

`npm run lint`

- Result: passed.
- Output summary: `next lint` reported no ESLint warnings or errors.
- Warning: Next still reports that `outputFileTracingIgnores` has moved to `experimental.outputFileTracingExcludes`.

`npm run build`

- Result: passed.
- Output summary: production build compiled successfully, type/lint checks completed, and static generation finished.
- Build generated 52 static pages, including `/watch` as a direct static route and 35 `/music/[slug]` paths.
- Warnings:
  - `outputFileTracingIgnores` has moved to `experimental.outputFileTracingExcludes`.
  - Using edge runtime on a page currently disables static generation for that page.
