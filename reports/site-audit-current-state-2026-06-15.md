# Broey. Website Current-State Audit

Audit date: 2026-06-15

Scope: static code/content audit of the current Next.js App Router repo before the next build phase. No application code was changed.

## Executive Summary

Overall launch-readiness rating: 7/10, near-launch but not ready for a clean public launch without a focused pass.

The site has a strong music-first foundation: a polished homepage carousel, curated music index, generated release pages, local audio queues, platform-link normalization, responsive merch layout, grouped press content, private preview gating, sitemap/robots behavior, and working form APIs with friendly fallback states.

The main launch risks are content/routing alignment rather than broad implementation gaps. The homepage marks `LiNK` as the current featured release while the music index calls `FREE` the current/latest release. `LiNK` has local audio and a Disco embed, but no visible streaming platform pills because the platform module filters Disco out. The sitemap currently exposes all 35 release detail routes, including 19 hidden project-track child pages that are intentionally absent from the music archive and mostly have no platform links. `/watch` is visible in nav/footer but is still placeholder content and is missing from the sitemap. Several past/current releases use `YYYY-00-00` release dates, which renders as "Release date TBA" on detail pages.

The next phase should be a launch-readiness tightening pass, not a redesign.

## Route Inventory

| Route | Present | Nav/footer | Sitemap | Status |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | Brand link only | Yes | Strong music-first homepage, but current-release alignment needs work |
| `/music` | `app/music/page.tsx` | Yes | Yes | Curated and current; hard-coded featured release conflicts with homepage |
| `/music/[slug]` | `app/music/[slug]/page.tsx` | Linked from cards/tracklists | Yes, 35 generated release routes | Template is complete; sitemap visibility is too broad |
| `/merch` | `app/merch/page.tsx` | Yes | Yes | Functional, Shopify/fallback ready; runtime source needs verification |
| `/about` | `app/about/page.tsx` | Yes | Yes | Strong content direction; needs mobile crop/manual copy pass |
| `/contact` | `app/contact/page.tsx` | Yes | Yes | Form/API implemented; provider env and Turnstile need production verification |
| `/watch` | `app/watch/page.tsx` | Yes | No | Placeholder; should be hidden or built before launch |
| `/press` | `app/press/page.tsx` | No primary nav/footer link | Yes | Functional archive; reachable from home/about CTAs |
| `/gate` | `app/gate/page.tsx` | No | No | Private preview gate, noindex |
| `/design-system` | `app/design-system/page.tsx` | No | No | Internal noindex route, but still publicly accessible |
| `/api/contact` | `app/api/contact/route.ts` | N/A | No | Contact form delivery endpoint |
| `/api/newsletter` | `app/api/newsletter/route.ts` | N/A | No | MailerLite signup endpoint |
| `/api/gate` | `app/api/gate/route.ts` | N/A | No | Private gate submit endpoint |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/opengraph-image` | Generated app routes | N/A | N/A | Present |

Route/nav/sitemap mismatches:

- `/watch` is in primary nav and footer but is excluded from `app/sitemap.ts` and is still placeholder content.
- `/press` is in the sitemap and linked from homepage/about CTAs, but not primary nav/footer.
- `/design-system` is noindex but remains a public route. Acceptable for internal QA only if this is intentional.
- All non-draft releases are included in the sitemap by `showReleaseInSitemap`, including project-track child pages with `showInArchive: false`.
- When `SITE_VISIBILITY=private`, `robots.ts` disallows all crawling and `sitemap.ts` returns an empty array. Production must explicitly run public visibility before launch.

## Completed Areas

- App Router structure exists for the intended site sections.
- Shared metadata helper, default OG image route, manifest, sitemap, robots, and private preview gate are implemented.
- Homepage is music-first and uses the release carousel, selected-catalog CTA/newsletter split, and press preview.
- Music index is curated around current-era and transition works rather than dumping the entire catalog.
- Release detail pages include artwork fallback, title, artist, type/year/date, description, tags, share CTA, back navigation, platform pills, details, credits, tracklists, More Music cards, page metadata, MusicRecording/MusicAlbum JSON-LD, and breadcrumb JSON-LD.
- Local audio is present for 33 of 35 release entries; project queues and archive/highlighted queues are modeled.
- Global player persists across routes, stores volume, supports seek/mute/previous/next, and auto-advances to the next queue track.
- Merch page uses Shopify Storefront data when available and falls back to curated manual products.
- About page implements the "A Real Sound Guy." direction with bio, highlights, timeline, portrait, press mentions, and CTA flow.
- Press content is grouped and reused on homepage/about/archive.
- Contact/newsletter have client validation, honeypots, API routes, and provider-missing fallback messages.
- CSS includes explicit tablet/mobile breakpoints and mobile-specific carousel/merch/player behavior.

## Partially Complete Areas

- Homepage has no rendered merch preview or about/contact CTA section. Those components exist, but `app/page.tsx` currently renders only `MusicCarouselHero`, `HomepageMusicArchiveSection`, and `PressMentionsPreview`.
- Release pages are structurally complete, but many entries rely on generated/fallback copy, fallback artist-only credits, and limited custom details.
- The platform module supports many platforms, but several visible/current routes are missing core links.
- Watch has a route and metadata, but no verified YouTube embed or real media content yet.
- Press media appearances are modeled in `content/press.ts` but are filtered out of `/press` and not rendered by `/watch`.
- Newsletter sender/reply-to env values are documented/configured but not used by the signup endpoint, which only adds subscribers to MailerLite.
- Contact form `updatesOptIn` is included in the email notification but does not subscribe the user to the newsletter.

## Missing or Unbuilt Areas

- Real Watch page content: no `featuredVideo.youtubeId`, no embedded YouTube video, no visualizers, no podcast/video cards, and no use of `watchPressItems`.
- Current-release platform links for `LiNK`: Spotify, Apple Music, YouTube/YouTube Music, and TIDAL are not visible yet.
- Exact release dates for multiple past/current releases using `YYYY-00-00`.
- Production verification for Resend, MailerLite, Turnstile, and Shopify runtime behavior.
- Analytics: no analytics env or instrumentation was found.
- Automated UI/mobile tests were not found.

## Homepage Audit

Rendered sections:

- `components/sections/MusicCarouselHero.tsx`
- `components/sections/HomepageMusicArchiveSection.tsx`
- `components/sections/PressMentionsPreview.tsx`
- Global footer with newsletter and links

Findings:

- The first viewport is strongly music-first and release-artwork driven.
- The visible hero label says `/ Broey` and `/ Now out`; the actual H1 is screen-reader-only as "Highlighted Releases". SEO can still see an H1, but the visual first viewport may feel less explicit as the artist homepage without browser/manual verification.
- Carousel order is driven by `carouselEnabled` and `carouselPriority`; `LiNK` is `featured: true` and priority 1.
- The homepage current feature conflicts with `/music`, where `FREE` is hard-coded as the featured/current focus and CTA label says "Listen to Latest Release".
- The selected-catalog/newsletter split is useful and includes `id="homepage-mailing-list"`, matching footer/social mailing-list links.
- Press preview shows three featured items and links to `/press`.
- Merch preview and broader connect/about CTA sections exist as components but are not rendered on the homepage.
- Mobile carousel has a native-scroll mode below 768px. Needs browser/manual verification for card height, horizontal overflow, and first-viewport framing.

Homepage readiness: partially launch-ready. It looks focused, but current-release alignment and `LiNK` platform coverage need to be fixed before launch.

## Music Index Audit

Current-era slugs rendered on `/music`:

- `free`
- `blu`
- `stereo-luv`
- `link`
- `dancing-dumpster-fire`
- `i-cant-wait-for-love`
- `mean-something`
- `4u`
- `fragments-ep`
- `fragments-remixes`

Transition slugs rendered on `/music`:

- `warning`
- `hold-on`
- `hysteria`

Findings:

- The page feels curated and current. Older/less relevant archive-visible items such as `like-that`, `after-you`, and `paradise` do not leak into the rendered `/music` sections.
- The curated lists are hard-coded in `app/music/page.tsx`, so content updates require code edits.
- The music page selects `FREE` as the featured release regardless of the homepage carousel's `featured` flag.
- Cards use shared `ReleaseCard` and local queue buttons, keeping CTA behavior consistent.
- Mobile grid collapses through Tailwind `sm:grid-cols-2 lg:grid-cols-3`; needs browser/manual verification for long titles and button wrapping.

Music index readiness: close, but current/latest release alignment should be fixed.

## Release Detail Pages

All non-draft release entries generate detail routes. Current count from `content/releases.ts`: 35.

Archive-visible release detail audit:

| Release | Slug | Audio | Visible platform pills | Gaps/risks |
| --- | --- | --- | --- | --- |
| FREE | `free` | 1 local track | Spotify, Apple Music, YouTube, TIDAL | Good core coverage |
| LiNK | `link` | 1 local track, Disco embed | None | Critical: current featured release has no visible platform pills |
| STEREO LUV | `stereo-luv` | 1 local track | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Bandcamp, Amazon Music | Date renders as TBA because `2025-00-00` |
| dancing dumpster fire | `dancing-dumpster-fire` | 7-track local project | Spotify, Apple Music, YouTube, TIDAL, Bandcamp | Date renders as TBA; child pages are sitemap-visible |
| Mean Something | `mean-something` | 1 local track | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Amazon Music | Date renders as TBA |
| blu. | `blu` | 2 local versions | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Bandcamp, Amazon Music | Date renders as TBA; version handling is good |
| Like That | `like-that` | 1 local track | Apple Music, YouTube, TIDAL | Missing Spotify |
| I Can't Wait For Love | `i-cant-wait-for-love` | 1 local track | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Amazon Music | Good core coverage |
| Fragments | `fragments-ep` | 6-track local project | Spotify, Apple Music, SoundCloud, TIDAL, Deezer, Amazon Music | Missing YouTube/YouTube Music; date renders as TBA |
| 4u | `4u` | 1 local track | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Amazon Music | Date renders as TBA |
| Fragments (Remixes) | `fragments-remixes` | 7-track local project | Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer | Date renders as TBA |
| Hold On | `hold-on` | 1 local track | Spotify, Apple Music, TIDAL, Bandcamp | Missing YouTube/YouTube Music |
| Warning | `warning` | 1 local track | Spotify, Apple Music, TIDAL, Deezer | Missing YouTube/YouTube Music |
| hysteria | `hysteria` | 1 local track | Spotify, Apple Music, YouTube, TIDAL | Good core coverage |
| After You | `after-you` | No local audio | Spotify, Apple Music, YouTube, TIDAL | No local player |
| Paradise | `paradise` | No local audio | Spotify, Apple Music, YouTube, TIDAL, Bandcamp | Artwork pending/fallback, no local player |

Additional sitemap-visible child/detail routes:

- `shake`
- `old-fashion`
- `lil-luv`
- `brainrot`
- `i-can-do-better-broey-remix`
- `4u-vip`
- `run-for-cover`
- `wanted`
- `numbers`
- `breathing-room`
- `eyes-on-me`
- `numbers-tom-ecko-remix`
- `eyes-on-me-dreamsuite-remix`
- `like-that-notminimal-remix`
- `wanted-almost-anyone-remix`
- `eyes-on-me-vivid-fever-dreams-remix`
- `wanted-kaiyo-remix`
- `eyes-on-me-exmaxhina-remix`
- `glfm`

Child-route findings:

- These pages are intentionally hidden from the music archive via `showInArchive: false`, but they remain indexable through the sitemap.
- Most child pages have local audio and parent context, but no platform links.
- `glfm` has a TIDAL-only platform pill and is correctly modeled as a track-level catalog source inside `dancing dumpster fire`.
- This can be valuable for deep links from tracklists, but it is risky for SEO/indexing if thin child pages are not intended as public search landing pages.

Release template findings:

- Every release detail page has share CTA and Back to Selected Releases navigation.
- More Music navigation is generated from sorted archive releases, excluding the active release.
- Metadata is generated per release; release social image uses verified local cover art when available.
- JSON-LD is emitted as `MusicRecording` for singles/remixes and `MusicAlbum` for EP/mix/set, plus breadcrumb JSON-LD.
- `releasePlatformLinks` supports Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Audius, Bandcamp, and Amazon Music. It does not separately model YouTube Music.
- TIDAL links can be injected from `catalogSource.sourceUrl` when the catalog source is TIDAL.
- Platform sections are hidden completely when no supported platform links exist. For `LiNK`, the only modeled link is Disco, so the page has no "Find Your Platform" section.
- Most release `about` sections fall back to generated copy because `about` is absent.
- Most release credits fall back to Artist only. `4u` has custom credits; most others have no custom credits/details.
- Several releases use `releaseDate: "YYYY-00-00"`. `formatReleaseDate` converts this to "Release date TBA", which is awkward for past releases.
- Mobile spacing around artwork/platform pills has explicit CSS, but needs browser/manual verification on release pages with long titles and many platform pills.

## Global Audio Player

Findings:

- `AudioPlayerProvider` wraps the whole app in `app/layout.tsx`, so the global player persists across routes.
- Queue playback auto-advances on `onEnded` when `canGoNext` is true.
- Archive/highlighted queues flatten playable single/remix releases; project releases keep project queues.
- Release detail pages correctly attach project-track child pages to their parent queue when track keys/titles match.
- `blu.` is modeled as a single with two local versions and should render a "versions" tracklist.
- `GLFM` is modeled as an individual project track with a parent link to `dancing dumpster fire`; naming appears intentional.
- Mobile player hides volume controls and uses a two-row compact layout.
- There is no close/dismiss control for the global player. Once audio is started, the fixed player remains until reload or state reset.
- Player error state disables controls and announces "Audio unavailable"; needs browser/manual verification with missing/blocked audio.
- Fixed player spacing depends on `body.has-global-player` and some `:has()` selectors. Needs mobile Safari verification.

## Merch Audit

Findings:

- `/merch` is `force-dynamic` and calls `getMerchProducts()`.
- `lib/shopify-merch.ts` attempts Shopify Storefront GraphQL using `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_MERCH_COLLECTION_HANDLE`.
- If `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is absent, the request is intentionally tokenless. Local env keys inspected did not include `SHOPIFY_STOREFRONT_ACCESS_TOKEN`, so local runtime is set up to attempt tokenless Shopify.
- If Shopify fails, returns errors, or returns an empty collection, the page falls back to the six curated products in `content/merch.ts`.
- Fallback products: Beats Hoodie, Broey. Crewneck Sweater - Colors, Broey. Dad Hat (The Original), Broey. Unisex Crewbeck Sweatshirt (The Classic), Broey. Unisex Hoodie, Broey. Unisex Hoodie - Pastels.
- Fallback product images exist under `public/images/merch`.
- Featured item prefers `beats-hoodie`.
- Availability is modeled through `availableForSale` for Shopify or `status` for fallback products.
- Mobile has a separate filterable horizontal merch browser; desktop grid is hidden below 768px.

Risks:

- Tokenless Shopify Storefront access needs runtime/API verification against the live collection.
- `SHOPIFY_CLIENT_ID` and `SHOPIFY_CLIENT_SECRET` appear in local env but are not used by the runtime merch code.
- Product order is stabilized against fallback handles, which is good, but live collection product count/order needs manual verification.
- Launch is not blocked if Shopify fails because fallback products remain usable external links.

## About Audit

Findings:

- "A Real Sound Guy." direction is implemented clearly in `app/about/page.tsx`.
- Page structure: hero, portrait, bio, highlights, timeline, press mentions, final CTA.
- The copy is substantive and current-era aligned.
- About page includes `Person` JSON-LD.
- CTAs route to `/music`, `/contact`, and `/press`.
- The portrait uses `object-position: center 18%` on mobile, which should be visually verified.
- Final CTA copy mentions watch/merch/press, but final buttons only route to music and press.

Risks:

- Needs browser/manual verification for mobile portrait crop and long bio flow.
- About uses custom metadata instead of `createPageMetadata`; root private robots metadata should still apply, but rendered private-preview metadata should be verified if staging privacy is important.

## Press Audit

Findings:

- Press data is centralized in `content/press.ts`.
- Homepage preview uses `homePressItems` and shows three featured items.
- About page uses `aboutPressItems`, featuring current-era coverage with supporting items.
- `/press` uses grouped archive rendering and filters out `media-appearance` items.
- Written coverage is separated from podcasts/videos by `pressArchiveItems = pressItems.filter((item) => item.group !== "media-appearance")`.

Risks:

- Media appearances are modeled but not currently rendered on `/press` or `/watch`.
- `needsVerification` exists on some press items, but the UI does not expose that internal state.
- External press links need browser/manual verification before launch.
- `/press` is in sitemap but not primary nav/footer; decide if that is intentional.

## Watch Audit

Findings:

- `/watch` exists and has metadata.
- The content source says "Visuals are warming up"; no `youtubeId` is set.
- The hero falls back to a designed placeholder panel.
- Video links point to YouTube, TikTok, and Instagram/Reels social profiles.
- Clip placeholders are "Coming soon", "Queued", and "In progress".
- `watchPressItems` exists in press data but is not rendered.

Watch readiness: not launch-ready as a primary nav item. Either build it out or remove it from nav/footer until it has real embeds/media.

## Contact and Newsletter Audit

Contact form:

- Client validation checks name, valid email, and message.
- Server validation checks name, email, message length, honeypot, optional Turnstile, and provider config.
- Honeypot field is `website`.
- Turnstile widget renders only when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` exists.
- Server verifies Turnstile only when `TURNSTILE_SECRET_KEY` exists.
- Resend delivery requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.
- Destination email is `siteConfig.contact.email`, currently `broey@broey.net`.
- `reply_to` is set to the visitor email.
- Missing provider config returns a friendly 503 fallback message.
- The UI has no subject field; server defaults subject to "Website contact message".
- `updatesOptIn` is included in the email body but is not connected to MailerLite.

Newsletter:

- Homepage and footer signup use `EmailSignup`.
- Homepage signup ID is `homepage-mailing-list`, matching `siteConfig` and social mailing-list links.
- Footer signup ID is `site-footer-mailing-list`.
- Client validation requires an email and uses the same honeypot pattern.
- MailerLite delivery requires `MAILERLITE_API_KEY` and `MAILERLITE_GROUP_ID`.
- Missing provider config returns a friendly 503 fallback.
- The API posts to `/subscribers` with `email` and `groups`.
- `MAILERLITE_SENDER_NAME`, `MAILERLITE_SENDER_EMAIL`, and `MAILERLITE_REPLY_TO_EMAIL` are documented, but not used by this subscriber endpoint.
- Source fields are set by forms but not forwarded to MailerLite.

Launch risks:

- Production env vars must be verified on Vercel.
- Turnstile should have both client and server keys if spam protection is expected at launch.
- Decide whether contact opt-in should subscribe the user or only be included in the contact notification.

## SEO, Metadata, Sitemap, Robots, Social Sharing

Findings:

- `app/layout.tsx` sets default metadata, metadataBase, default OG/Twitter images, manifest, icons, and private robots metadata.
- Most pages use `createPageMetadata`, which includes canonical, OG, Twitter, and private robots metadata.
- Release pages generate per-release metadata and use release cover art when local cover art is verified.
- Release pages emit MusicRecording/MusicAlbum JSON-LD and BreadcrumbList JSON-LD.
- `/opengraph-image` is a generic branded OG image route.
- `app/sitemap.ts` returns static routes plus all releases where `showInSitemap !== false`.
- Static sitemap routes are `/`, `/music`, `/about`, `/contact`, `/merch`, `/press`.
- `/watch` is excluded from sitemap despite being in nav/footer.
- `/design-system` and `/gate` are excluded from sitemap and have noindex metadata.
- `app/robots.ts` allows all public crawling and points to `${NEXT_PUBLIC_SITE_URL}/sitemap.xml`.
- Private visibility disallows all robots and returns an empty sitemap.

Risks:

- `NEXT_PUBLIC_SITE_URL` must be correct in production or sitemap/absolute release URLs/JSON-LD will point to the wrong host.
- Project-track child pages may create thin indexed pages.
- `YYYY-00-00` dates create TBA detail rows for past releases.
- `Paradise` has no local cover image, so release OG image falls back to default social image.
- Social share behavior uses Web Share API or clipboard fallback; needs browser/manual verification.

## Environment and Deployment Readiness

Runtime/public env vars:

- `NEXT_PUBLIC_SITE_URL`: required for canonical URLs, sitemap host, JSON-LD/share URLs.
- `SITE_VISIBILITY`: `private` activates preview gate, noindex metadata, robots disallow, and empty sitemap. Anything else is public.
- `SITE_PASSCODE`: required when `SITE_VISIBILITY=private`.
- `SHOPIFY_STORE_DOMAIN`: required for live Shopify fetch.
- `SHOPIFY_MERCH_COLLECTION_HANDLE`: optional; defaults to `broey-site-merch`.
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`: optional; if absent, Shopify fetch is tokenless.
- `SHOPIFY_MERCH_DEBUG_SOURCE`: optional logging flag.
- `RESEND_API_KEY`: required for contact delivery.
- `RESEND_FROM_EMAIL`: required for contact delivery.
- `RESEND_FROM_NAME`: optional; defaults to `Broey Website`.
- `RESEND_API_BASE_URL`: optional override.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: optional client Turnstile widget key.
- `TURNSTILE_SECRET_KEY`: optional server Turnstile verification key.
- `MAILERLITE_API_KEY`: required for newsletter delivery.
- `MAILERLITE_GROUP_ID`: required for newsletter delivery.
- `MAILERLITE_API_BASE_URL`: optional override.

Documented/local script env vars:

- `BROEY_RELEASE_ROOT`
- `BROEY_ASSET_SOURCE`
- `TIDAL_CLIENT_ID`
- `TIDAL_CLIENT_SECRET`
- `BROEY_CATALOG_ARTIST`
- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

Notes:

- No analytics env usage was found.
- `.env.local.example` is more complete than `README.md`; README omits private gate and Shopify runtime env documentation.
- Vercel preview/private behavior should be explicitly checked before launch. A public launch with `SITE_VISIBILITY=private` would block indexing.

## Mobile QA Risk Scan

Needs browser/manual verification:

- Header mobile menu: no visible Escape/outside-click handling; verify menu does not block content or remain open unexpectedly.
- Homepage carousel: native horizontal scrolling below 768px uses 100vw width and negative margins; verify no horizontal page overflow and that the first viewport frames correctly.
- Release detail pages: long remix titles and multi-button CTA rows need checks at 390px/430px widths.
- Release artwork: mobile width drops to `min(18.5rem, calc(100vw - 5.5rem))` below 560px; verify it does not feel too small.
- Platform pills: many-platform pages such as `blu.` and `STEREO LUV` need wrapping checks.
- Global player: fixed bottom player plus route padding should be checked on mobile Safari, especially after starting audio from the homepage and navigating to release pages.
- Merch: mobile filter row and horizontal product browser should be checked for scroll snapping, image crop, and CTA visibility.
- About: portrait crop at `object-position: center 18%` needs real-device visual QA.
- Footer/newsletter: stacked footer newsletter and link columns should be checked on pages that already have newsletter/contact forms.
- Press archive: ledger rows collapse on mobile; verify external link placement and long outlet/title wrapping.

## Design System Consistency

Findings:

- Color, spacing, radii, card borders, artwork treatments, and CTA surfaces are centralized in `app/globals.css`.
- Shared components are used for PageIntro, SectionHeader, ReleaseCard, ReleaseArtwork, PlatformLinkList, MerchCard, EmailSignup, and PressMentionsSection.
- The visual system is mostly consistent: dark surfaces, amber/cyan accents, compact radii, uppercase section labels, pill buttons, and artwork-first release cards.
- There is some copy/case inconsistency across CTAs and labels: `Open`, `View Release`, `Listen to Latest Release`, `READ COVERAGE`, `find your platform`, `available elsewhere`.
- Some legacy sections/components remain unused: `Hero`, `FeaturedRelease`, `HomepageMerchSection`, `HomepageConnectSection`, `AboutPreview`, `StayConnected`, `MerchPreview`, `ReleaseEmbed`, `BroeyAudioPlayer`, and `AudioPreview` are present but not part of current routes.
- Design-system route is useful internally, but should remain excluded/noindex and ideally protected or removed for public launch.

## Critical Launch Blockers

1. Resolve current-release alignment. Choose whether `LiNK` or `FREE` is the current/latest release and update homepage carousel flags, `/music` featured release, CTA labels, and copy accordingly.
2. Add or intentionally suppress public platform pills for `LiNK`. As the homepage featured/current release, it should not launch with no visible Spotify/Apple/YouTube/TIDAL options unless the release is intentionally pre-save/Disco-only and copy explains that.
3. Decide sitemap/indexing for child track pages. Either enrich/index them intentionally or set `showInSitemap: false`/noindex for hidden project-track pages.
4. Remove `/watch` from nav/footer or build it with real media before launch.
5. Verify production env before public launch: `SITE_VISIBILITY=public`, correct `NEXT_PUBLIC_SITE_URL`, and live Resend/MailerLite/Shopify/Turnstile settings as needed.

## High-Priority Pre-Launch Fixes

- Replace `YYYY-00-00` release dates with exact dates, year-only display logic, or a non-TBA details row for already released music.
- Add YouTube/YouTube Music links where available for `Fragments`, `Hold On`, and `Warning`.
- Add Spotify for `Like That` if available.
- Decide whether `After You` and `Paradise` should remain archive/sitemap-visible; `Paradise` needs artwork and both need local audio or a clear external-listen flow.
- Add `/watch` to sitemap only after it has real content, or remove it from visible navigation.
- Add `/press` to nav/footer if it is meant to be a first-class public route.
- Verify all external platform and press links in a browser.
- Confirm tokenless Shopify live collection behavior on Vercel.
- Confirm contact and newsletter provider success states with production env.

## Medium-Priority Polish

- Add custom `about`, `details`, and `credits` for top current releases.
- Add a player close/dismiss control or a compact minimized state for the global player.
- Add source/UTM fields to MailerLite subscribers if campaign attribution matters.
- Decide whether contact `updatesOptIn` should also trigger newsletter signup.
- Render press media appearances on `/watch` or a separate media section.
- Tighten homepage CTA coverage if merch/contact should be visible before the footer.
- Clean up unused legacy components after launch readiness stabilizes.
- Update README env documentation to include private gate and Shopify runtime behavior.

## Post-Launch Enhancements

- Add analytics/instrumentation for release CTA clicks, audio plays, newsletter submits, and merch clicks.
- Add Playwright smoke tests for homepage, music index, release page, merch, contact, and mobile widths.
- Add a link verification script for release platform links and press links.
- Add YouTube Music as a distinct platform label if those URLs differ from YouTube playlists.
- Add structured data for merch/products if product pages become more SEO-critical.

## Recommended Next Build Sequence

1. Content alignment pass: choose current release, fix `LiNK`/`FREE` flags and labels, and normalize release dates.
2. Platform-link pass: add missing core links for current/archive-visible releases; decide child page platform/indexing policy.
3. Route readiness pass: hide or build `/watch`; decide nav/footer treatment for `/press`; protect/remove `/design-system` if desired.
4. Provider readiness pass: verify Vercel env, Shopify source, Resend delivery, MailerLite signup, and Turnstile.
5. Mobile/browser QA pass: homepage carousel, release pages, global player, merch, about crop, footer/newsletter, and contact.
6. Final SEO pass: inspect generated metadata, sitemap, robots, JSON-LD, and OG images on production-like deployment.

## File-by-File Notes

- `app/page.tsx`: homepage renders carousel, music/newsletter split, and press preview only.
- `app/music/page.tsx`: curated hard-coded release sections; hard-coded `free` featured/current focus conflicts with homepage `LiNK`.
- `app/music/[slug]/page.tsx`: strong release template with metadata/JSON-LD/share/tracklist/platforms; date placeholder and child-page indexing policies need work.
- `content/releases.ts`: 35 public non-draft entries; 16 archive-visible; many child pages hidden from archive but sitemap-visible; `LiNK` has Disco only; multiple `YYYY-00-00` dates.
- `content/release-actions.ts`: platform module supports Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Audius, Bandcamp, Amazon Music; filters Disco out of platform pills.
- `content/release-filters.ts`: archive and sitemap filters are simple; sitemap defaults to include everything unless explicitly false.
- `components/audio/AudioPlayerProvider.tsx`: global queue/player state, persistence, autoplay-next, volume storage.
- `components/audio/releaseAudioQueue.ts`: handles highlighted/archive/project/single queues and project-track fallback.
- `components/audio/GlobalAudioPlayer.tsx`: polished fixed player; no dismiss/minimize state.
- `components/ui/ReleaseCarousel.tsx`: advanced desktop carousel with mobile native-scroll mode and reduced-motion handling.
- `components/ui/ReleaseCarouselTile.tsx`: carousel card play/open actions; `featured` maps to "Current" badge.
- `components/ui/ReleaseArtwork.tsx`: local artwork existence/hash fallback; good guard against placeholder art.
- `components/ui/PlatformLinkList.tsx`: hides empty platform section when `hidePending` is true.
- `app/merch/page.tsx`: dynamic merch route with featured product and mobile/desktop product surfaces.
- `lib/shopify-merch.ts`: token or tokenless Shopify Storefront fetch with fallback to manual merch.
- `content/merch.ts`: six available fallback products; one title has "Crewbeck" typo in product name, likely copied from Shopify handle.
- `components/sections/MerchMobileBrowser.tsx`: mobile-only filter/slider; needs browser verification.
- `app/about/page.tsx`: strong about page and Person JSON-LD; custom metadata path should be checked under private mode.
- `app/press/page.tsx` and `content/press.ts`: grouped written press archive; media appearances are modeled but not rendered.
- `app/watch/page.tsx` and `content/watch.ts`: placeholder route in visible nav; not launch-ready.
- `app/contact/page.tsx`, `components/sections/ContactForm.tsx`, `app/api/contact/route.ts`: contact surface implemented with validation, honeypot, optional Turnstile, and Resend.
- `components/sections/EmailSignup.tsx`, `app/api/newsletter/route.ts`: newsletter form and MailerLite endpoint implemented; no sender/reply-to use and no source forwarding.
- `app/sitemap.ts`: static routes plus all sitemap-visible releases; excludes `/watch`; includes `/press`; private mode returns empty sitemap.
- `app/robots.ts`: private mode disallows all; public mode allows all and links sitemap.
- `lib/site-visibility.ts`, `middleware.ts`, `app/gate/page.tsx`, `app/api/gate/route.ts`: private preview gate implemented.
- `app/design-system/page.tsx`: noindex internal page but public route exists.
- `app/globals.css`: comprehensive responsive/design system CSS; mobile QA should focus on carousel, fixed player, release detail, merch browser, about portrait, and footer/newsletter.
- `.env.local.example`: complete for private, providers, Shopify, and catalog scripts.
- `README.md`: useful, but missing private gate and Shopify runtime env details.

## Codex-Ready Implementation Tasks For Next Phase

1. Update current-release source of truth: align `featured`, `carouselPriority`, `/music` featured slug, labels, and homepage/music copy around the chosen current release.
2. Add `LiNK` public platform links or adjust the release page copy to make its pre-release/Disco-only state explicit.
3. Replace placeholder release dates or update `formatReleaseDate` to display year-only dates without "Release date TBA" for known past releases.
4. Add missing Spotify/Apple/YouTube links for archive-visible releases where available, especially `Fragments`, `Hold On`, `Warning`, and `Like That`.
5. Add `showInSitemap: false` to hidden child tracks that should not be indexed, or add noindex metadata for `isProjectTrack` pages.
6. Either remove `/watch` from `content/navigation.ts` or build `content/watch.ts` with a real `youtubeId` and render `watchPressItems`.
7. Decide `/press` nav/footer visibility and update `content/navigation.ts`/`components/site/Footer.tsx` if it should be first-class.
8. Add local artwork for `Paradise` or intentionally set it noindex/hidden until artwork is ready.
9. Wire contact `updatesOptIn` to MailerLite if opt-in is meant to subscribe users.
10. Add source/custom fields to newsletter API payload if MailerLite attribution is required.
11. Update README env section with `SITE_VISIBILITY`, `SITE_PASSCODE`, Shopify runtime env, and provider verification notes.
12. Add Playwright smoke checks for mobile homepage carousel, release page platform pills, global player, merch mobile browser, and contact/newsletter forms.

## Validation Results

`npm run lint`

- Result: passed.
- Output summary: `next lint` reported no ESLint warnings or errors.
- Warning: Next reported that `outputFileTracingIgnores` has moved to `experimental.outputFileTracingExcludes`; update `next.config.js` in a future cleanup pass.

`npm run build`

- Result: passed.
- Output summary: production build compiled successfully, type/lint checks completed, and static generation finished.
- Build generated 52 static pages, including `/`, `/music`, `/about`, `/contact`, `/press`, `/watch`, `/design-system`, and 35 `/music/[slug]` paths.
- Dynamic/server-rendered routes: `/api/contact`, `/api/gate`, `/api/newsletter`, `/gate`, `/merch`, `/opengraph-image`.
- Warnings:
  - `outputFileTracingIgnores` has moved to `experimental.outputFileTracingExcludes`.
  - Using edge runtime on a page currently disables static generation for that page. This corresponds to the edge OG image route.
