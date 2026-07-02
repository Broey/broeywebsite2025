# Broey. Website Browser/Mobile QA

Date: 2026-06-15

QA target: local public QA server at `http://localhost:3101` with `SITE_VISIBILITY=public` and `NEXT_PUBLIC_SITE_URL=http://localhost:3101`. The existing `localhost:3000` instance was also checked for current private robots behavior.

Artifacts:

- Raw sweep data: `reports/browser-mobile-qa-data-2026-06-15.json`
- Screenshots: `reports/browser-mobile-qa-screenshots/`

## Executive Summary

Overall browser/mobile readiness rating: 8/10.

The launch-alignment pass is visually and functionally holding up. FREE opens as the homepage current release, LiNK remains visible without being marked current, `/watch` is hidden from nav/footer, release platform pills wrap cleanly, merch/about/contact/press layouts are stable, and no horizontal overflow was detected at 390, 430, 768, 1024, or 1440px across the tested routes.

No critical launch blockers or obvious high-priority layout bugs were found. No code fixes were made in this QA pass.

The main remaining launch risks are operational/content verification items: production must not inherit private visibility, local provider credentials should be protected/rotated if exposed, and a few platform links still need manual lookup.

## Issues Found By Severity

### Critical Launch Blockers

None found in browser/mobile QA.

### High-Priority Pre-Launch Fixes

- Production visibility check: the existing `localhost:3000` instance returned private robots behavior (`Disallow: /`). This is correct for the local private env, but production must run public visibility before launch.
- Secret hygiene: local `.env.local` appears to contain real provider credentials. Do not commit it; rotate any value that may have been exposed outside the local machine.

### Medium Polish

- Mobile global player intentionally hides volume/mute controls visually. Core playback, previous/next, seek, and route persistence work, but mobile users do not get visible mute/volume controls.
- Contact/newsletter empty submissions rely on native form validation; no custom inline validation message was captured in the DOM sweep.
- Mobile menu still lacks explicit Escape/outside-click handling. It opens/closes and no longer includes Watch, but keyboard/outside-click polish remains.
- Exact placeholder release dates now display as year-only, which is launch-safe but less precise than verified exact dates.

### Post-Launch Items

- Add Playwright smoke tests for the same route/viewport matrix.
- Add link verification for press and platform links.
- Add analytics for audio plays, release CTA clicks, newsletter submits, and merch clicks.
- Consider a player minimize/dismiss state after launch.

## Route-By-Route Findings

### `/`

- FREE is the first active carousel card and has the visible Current badge.
- LiNK appears as a neighboring preview release, not current.
- Mobile carousel scrolls horizontally without page overflow.
- CTA, newsletter, press preview, and footer spacing are stable at 390px and 1440px.
- No Watch link appears in header or footer.

### `/music`

- FREE is the featured/current focus with “Listen to Latest Release.”
- Curated current-era and transition sections render as expected.
- Hidden project-track pages do not appear as release cards.
- Release cards and CTAs are consistent across mobile and desktop.

### `/music/free`

- Current badge is present.
- Artwork, title, metadata, date, tags, share CTA, platform pills, details, More Music, and footer render cleanly.
- Platform pills: Spotify, Apple Music, YouTube, TIDAL.
- Date displays as `May 7, 2026`.

### `/music/link`

- No Current badge.
- Page reads as preview/manual-style content with pending public platform links.
- No platform pill section is shown, and the page does not look broken because the about/details copy explains the pending state.
- Local player CTA, share CTA, More Music, and footer render cleanly.

### `/music/stereo-luv`

- Platform pills wrap cleanly across mobile: Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Bandcamp, Amazon Music.
- Placeholder date displays as `2025`, not TBA.
- Long title fits well on mobile and desktop.

### `/music/blu`

- Platform pills wrap cleanly.
- Versions tracklist renders with playable rows.
- Placeholder date displays as `2025`.
- Artwork crop was verified with direct panel inspection and is acceptable despite dark full-page screenshot scaling.

### `/music/dancing-dumpster-fire`

- Long title wraps correctly on mobile.
- Project player starts the queue.
- Tracklist rows and View Track buttons fit at 390px.
- Platform pills and More Music cards render cleanly.

### `/music/fragments-ep`

- Project layout and tracklist fit at 390px.
- Platform pills wrap cleanly.
- Missing YouTube/YouTube Music remains a manual verification item, not a browser layout issue.

### `/merch`

- Products render from the available Shopify/fallback source.
- Featured product and mobile horizontal merch browser are stable.
- Product imagery, filters, prices, and CTAs remain visible.
- No horizontal page overflow detected.

### `/about`

- Mobile portrait crop is acceptable.
- Long bio reads cleanly.
- Press mention integration and final CTA flow are stable.
- No Watch nav/footer regression after hiding Watch.

### `/contact`

- Layout is stable at mobile and desktop widths.
- Honeypot inputs are present but not visible to users.
- Empty submit attempts are blocked by client/native validation.
- Successful provider-side submission was not performed to avoid sending real data to configured external services.

### `/press`

- Route remains accessible and sitemap-visible.
- Mobile archive layout wraps long outlet/title text without overflow.
- Press CTA links are visible; external destination verification remains a separate link-check task.

### `/sitemap.xml`

- Public QA sitemap includes `/press`.
- Public QA sitemap excludes `/watch`.
- Hidden project-track child pages are absent by default.
- Public QA sitemap URL count: 22.

### `/robots.txt`

- Public QA robots allows crawling and points to the local QA sitemap.
- Current `localhost:3000` robots disallows all crawling, matching the local private visibility state.

## Viewport-Specific Findings

- 390px: no horizontal overflow across all tested routes. Homepage carousel, release pages, merch browser, contact form, and footer stack cleanly.
- 430px: no horizontal overflow across all tested routes.
- 768px: no horizontal overflow; tablet layouts remain readable. Header still uses mobile menu at this width.
- 1024px: no horizontal overflow; desktop/tablet transitions are stable.
- 1440px: desktop hero, release detail pages, footer, and merch layout are stable.

## Audio Player Findings

- Audio starts from homepage carousel, `/music`, `/music/free`, and `/music/dancing-dumpster-fire`.
- Fixed player appears above the bottom edge with safe spacing at 390px.
- Previous/next controls work for project queues.
- Seek input is enabled and accepts changes.
- Mobile mute control exists in markup but is visually hidden by responsive CSS; desktop mute/volume controls are available.
- Client-side navigation from `/music/free` to `/music` and desktop navigation to `/about`/`/merch` preserves the player.
- Hard page reloads reset the player, which is expected.

## Sitemap/Robots Findings

- Public QA server:
  - `/watch`: absent from sitemap.
  - `/press`: present in sitemap.
  - Hidden project-track slugs: absent from sitemap.
  - Robots: `Allow: /`.
- Current local private server on port 3000:
  - Robots: `Disallow: /`.
  - This is correct for private local visibility but must not be the production launch state.

## Recommended Fix Sequence

1. Confirm production env uses public visibility and the correct canonical `NEXT_PUBLIC_SITE_URL`.
2. Protect or rotate any real local provider credentials that may have been exposed.
3. Manually verify remaining platform links: LiNK public DSPs, Fragments YouTube/YouTube Music, Hold On YouTube/YouTube Music, Warning YouTube/YouTube Music, Like That standalone Spotify.
4. Run a real provider smoke check for Resend, MailerLite, Shopify, and Turnstile in the intended deployment environment.
5. Add automated smoke tests for the tested route/viewport matrix after launch readiness stabilizes.

## Fixes Made

No code fixes were made. The QA pass found no critical launch blockers or obvious high-priority browser/mobile layout bugs.

Generated QA artifacts:

- `reports/browser-mobile-qa-2026-06-15.md`
- `reports/browser-mobile-qa-data-2026-06-15.json`
- `reports/browser-mobile-qa-screenshots/`

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
