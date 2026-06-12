# Broey. Release Metadata Reconciliation Report

Date: 2026-06-12

Status: review artifact only. This report compares the current website catalog against the draft public-source research foundation files:

- `C:\Users\phill\Downloads\broey_release_metadata_foundation_draft_2026-06-12.json`
- `C:\Users\phill\Downloads\broey_release_metadata_foundation_draft_2026-06-12.md`

No live release data was changed. The draft foundation is not final truth and should not be merged directly into the site.

---

## Executive Summary

The current website release model already supports many release-page needs: titles, slugs, release type, `year`, `releaseDate`, public/private draft filtering, platform-style links, credits/details, tracklists, audio, embeds, catalog source metadata, carousel flags, archive visibility, and sitemap visibility.

The biggest reconciliation issues are not missing TypeScript capacity so much as verification granularity:

- The current site has only one public date field, `releaseDate`, plus `year`; it cannot distinguish original Bandcamp date, DSP date, and chosen display date.
- `visibility` only supports `draft` and `public`, and undefined entries are still public after the final filter. There is no explicit `internal`, `noindex`, `archive`, or `pending` state.
- `showInSitemap` defaults to true for every non-draft release, including project-track detail pages with `showInArchive: false`.
- Release pages generate fallback credits of `Artist`, `Release`, and `Label: Independent` when no explicit credits exist. That fallback can read like verified metadata even when it is generic presentation copy.
- Several live platform links are smart links, Disco links, TIDAL catalog-source links, or older Apple/TIDAL links. The draft foundation suggests useful additions, but many still require direct-link resolution or manual verification.
- LiNK should remain pending/manual. The research foundation found no high-confidence public source for it.
- Foundation-era and older releases should stay internal/noindex unless deliberately approved later.

Recommended first safe action after approval: add only high-confidence direct platform links to current public current-era releases, while holding credits, legal details, UPC/ISRC, BPM/key, distributors, labels, and archive expansion for later manual verification.

---

## Current Data Model Audit

Primary source inspected: `content/releases.ts`.

### Current release fields

`ReleaseEntry` currently supports:

| Field | Purpose | Notes |
|---|---|---|
| `title` | Display title | Required. |
| `slug` | Release detail URL key | Required. |
| `type` | `single`, `ep`, `remix`, `mix`, `set` | Required. |
| `visibility` | `draft` or `public` | Optional; final export filters out only `draft`. Undefined means live/public. |
| `year` | Year display/sort fallback | Optional. |
| `releaseDate` | Single date string | Optional; supports placeholder values like `2025-00-00`. |
| `artistName` | Release artist display override | Optional. |
| `description`, `about`, `mood`, `tags` | Page/card copy and generated about copy | Optional except `description`. |
| `seoTitle`, `seoDescription` | Release page metadata | Optional. |
| `coverImage`, `coverAlt` | Artwork | Optional. |
| `audioPreview`, `audio` | Local audio / player queue data | Optional. |
| `tracklist` | Project or version list | Optional; string or object entries. |
| `credits` | Explicit credit rows | Optional. |
| `details` | Explicit detail rows | Optional. |
| `links` | Main release links | Required array. |
| `platformLinks` | Optional override for platform buttons | Optional. |
| `disco`, `embed`, `listenAction` | Playback/listen routing | Optional. |
| `catalogSource`, `catalogStatus` | Imported or manually curated source metadata | Optional. |
| `carouselEnabled`, `carouselPriority`, `featured` | Homepage/carousel treatment | Optional. |
| `parentReleaseSlug`, `isProjectTrack` | Track pages nested under projects | Optional. |
| `showInArchive`, `showInSitemap`, `isFocusTrack` | Display/index controls | Optional. |

### Current platform link fields

`ExternalLink` supports:

| Field | Purpose |
|---|---|
| `label` | Button label. |
| `platform` | Platform matching and sort key. |
| `url` | Link URL. |
| `kind` | `streaming`, `disco`, `video`, `download`, `promo`, `social`, or `shop`. |
| `primary` | Used for primary listen fallback. |

`releasePlatformLinks()` only shows known streaming platforms: Spotify, Apple Music, SoundCloud, YouTube, TIDAL, Deezer, Audius, Bandcamp, and Amazon Music. It excludes Disco from the platform section and can add a TIDAL link from `catalogSource.sourceUrl`.

### Current credit/details fields

The model has simple rows:

- `credits?: { role: string; name: string }[]`
- `details?: { label: string; value: string }[]`

There is no verification status, source, date checked, credit type taxonomy, or separation between public artist/feature labels and formal legal credits.

Release pages use fallback credits when explicit credits are absent:

- `Artist`: derived artist name
- `Release`: `Broey.`
- `Label`: `Independent`

This should be reviewed before formal metadata expansion, because generic fallback credits can be mistaken for verified legal/distributor metadata.

### Current visibility/indexing fields

Current controls:

| Field/function | Current behavior |
|---|---|
| `visibility` | Only `draft` is removed from the exported `releases` array. |
| `showInArchive` | Hides from archive/music grids when explicitly false, unless `isFocusTrack` is true. |
| `showInSitemap` | Only excluded when explicitly false. |
| `isProjectTrack` | Hides from archive by default, but does not hide from generated static params or sitemap. |
| `generateStaticParams()` | Generates a detail page for every exported release, including project tracks. |
| `generateMetadata()` | Uses normal page metadata for every exported release; no per-release noindex. |
| `app/sitemap.ts` | Includes every release where `showInSitemap !== false`. |
| `app/robots.ts` | Sitewide allow/disallow only, depending on private gate state. |

### Current date fields

The site supports:

- `year?: number`
- `releaseDate?: string`

The release detail formatter handles exact dates and placeholder dates like `YYYY-00-00`, displaying those as `Release date TBA`. Sorting tries `Date.parse(releaseDate)` first, then falls back to a parsed year or `year`.

The model does not support:

- `original_release_date`
- `dsp_release_date`
- `display_date`
- date source
- date confidence
- date conflict notes

### Current release slugs/titles

| Slug | Title | Type | Date/year | Current visibility notes |
|---|---|---:|---|---|
| `link` | LiNK | single | 2025 | Current-era, pending-tidal, public by default. |
| `stereo-luv` | STEREO LUV | single | `2025-00-00` / 2025 | Current-era, public by default. |
| `free` | FREE | single | `2026-05-07` / 2026 | Featured current focus, public by default. |
| `dancing-dumpster-fire` | dancing dumpster fire | ep | `2025-00-00` / 2025 | Current-era project, public by default. |
| `shake` | shake! | single | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `old-fashion` | old fashion | single | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `lil-luv` | lil luv | single | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `brainrot` | brainrot | single | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `i-can-do-better-broey-remix` | i can do better (broey. remix) | remix | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `4u-vip` | 4u vip | remix | 2025 | Project track, hidden from archive, still in sitemap unless changed. |
| `i-cant-wait-for-love` | I Can't Wait For Love | single | 2024 | Current-era, public by default. |
| `fragments-ep` | Fragments | ep | `2024-00-00` / 2024 | Current-era project, slug still says `-ep`. |
| `run-for-cover` | Run For Cover | single | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `wanted` | Wanted | single | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `numbers` | Numbers | single | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `breathing-room` | Breathing Room | single | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `eyes-on-me` | Eyes On Me | single | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `4u` | 4u | single | `2024-00-00` / 2024 | Current-era, public by default. |
| `mean-something` | Mean Something | single | `2025-00-00` / 2025 | Current-era, public by default. |
| `fragments-remixes` | Fragments (Remixes) | remix | `2024-00-00` / 2024 | Current-era project/remix companion, public by default. |
| `numbers-tom-ecko-remix` | Numbers (tom_ecko Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `eyes-on-me-dreamsuite-remix` | Eyes On Me (dreamsuite Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `like-that-notminimal-remix` | Like That (notminimal. Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `wanted-almost-anyone-remix` | Wanted (Almost Anyone Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `eyes-on-me-vivid-fever-dreams-remix` | Eyes On Me (Vivid Fever Dreams Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `wanted-kaiyo-remix` | Wanted (Kaiyo Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `eyes-on-me-exmaxhina-remix` | Eyes On Me (exmaxhina Remix) | remix | 2024 | Project track, hidden from archive, still in sitemap unless changed. |
| `glfm` | GLFM | ep | 2025 | Project track from `dancing dumpster fire`, hidden from archive, still in sitemap unless changed. |
| `blu` | blu. | single | `2025-00-00` / 2025 | Current-era, public by default. |
| `like-that` | Like That | single | `2024-03-15` / 2024 | Public older/current-context single. |
| `hold-on` | Hold On | single | `2023-05-08` / 2023 | Transition work, explicit public. |
| `warning` | Warning | single | `2023-03-10` / 2023 | Transition work, explicit public. |
| `hysteria` | hysteria | single | `2022-01-13` / 2022 | Transition work, explicit public. |
| `after-you` | After You | single | `2020-11-30` / 2020 | Public archive candidate; research has low/medium confidence. |
| `paradise` | Paradise | single | `2019-03-23` / 2019 | Foundation/early release; public now, should be reconsidered for noindex/archive treatment. |

### Model limitations

- No explicit release era field.
- No explicit indexing state beyond `showInSitemap`.
- No per-release metadata robots override.
- No source/verification layer for links, dates, credits, or details.
- No distinction between official smart links and resolved direct DSP links.
- No support for conflicting dates or display-date strategy.
- No support for internal-only metadata on exported release entries.
- No field to keep older foundation releases as internal/noindex while retaining source metadata.
- Project tracks are generated and indexed by default unless every entry sets `showInSitemap: false`.

---

## Release Matching Table

| Current slug | Current title | Matched research title | Confidence | Reason | Title/capitalization issues | Bucket |
|---|---|---|---|---|---|---|
| `free` | FREE | FREE | High | Exact title and current-era release. | None. | Current-era |
| `blu` | blu. | blu. | High | Exact punctuation/case match. | Preserve lowercase plus trailing period. | Current-era |
| `stereo-luv` | STEREO LUV | STEREO LUV | High | Exact uppercase title. | Preserve all caps. | Current-era |
| `link` | LiNK | LiNK | Low | Research has only the site title; no public source found. | Preserve stylized `LiNK`, but keep pending/manual. | Pending |
| `dancing-dumpster-fire` | dancing dumpster fire | dancing dumpster fire | High | Exact lower-case project title. | Preserve lowercase. | Current-era |
| `shake` | shake! | dancing dumpster fire | Medium | Track appears in the research tracklist for the project. | Track-level page, not a separate research release. | Current-era project track |
| `old-fashion` | old fashion | dancing dumpster fire | Medium | Track appears in the research tracklist for the project. | Track-level page, not a separate research release. | Current-era project track |
| `lil-luv` | lil luv | dancing dumpster fire | Medium | Track appears in the research tracklist for the project. | Track-level page, not a separate research release. | Current-era project track |
| `brainrot` | brainrot | dancing dumpster fire | Medium | Track appears in the research tracklist with Vivid Fever Dreams feature context. | Site title omits feature in title but uses artistName/audio artist. | Current-era project track |
| `i-can-do-better-broey-remix` | i can do better (broey. remix) | dancing dumpster fire | Medium | Track appears in the research tracklist as a remix on the project. | Research wording includes original artists; keep formal credit manual. | Current-era project track |
| `4u-vip` | 4u vip | dancing dumpster fire | Medium | Track appears in the research tracklist as `4u vip ft. notminimal`. | Site artistName handles collaborator; formal credit manual. | Current-era project track |
| `glfm` | GLFM | dancing dumpster fire | Medium | Track appears in the research tracklist as `glfm`. | Site title uppercase `GLFM`; research tracklist lower-case. Needs title approval if shown independently. | Current-era project track |
| `i-cant-wait-for-love` | I Can't Wait For Love | I Can't Wait For Love | High | Exact title and direct research entry. | None. | Current-era |
| `mean-something` | Mean Something | Mean Something | High | Exact title and direct research entry. | None. | Current-era |
| `4u` | 4u | 4u | High | Exact title and direct research entry. | Preserve lowercase `u`. | Current-era |
| `fragments-ep` | Fragments | Fragments | High | Exact public display title; site slug remains legacy/stable. | Keep display `Fragments`, not `Fragments EP`; slug can stay. | Current-era |
| `run-for-cover` | Run For Cover | Fragments | Medium | Track appears in site project tracklist; no standalone research release. | Track-level page, not separate research entry. | Current-era project track |
| `wanted` | Wanted | Fragments | Medium | Track appears in site project tracklist; no standalone research release. | Track-level page, not separate research entry. | Current-era project track |
| `numbers` | Numbers | Fragments | Medium | Track appears in site project tracklist and remix set. | Track-level page, not separate research entry. | Current-era project track |
| `breathing-room` | Breathing Room | Fragments | Medium | Track appears as `Breathing Room (feat. Vivid Fever Dreams)`. | Site title omits feature, artistName carries collaboration. | Current-era project track |
| `eyes-on-me` | Eyes On Me | Fragments | Medium | Track appears in site project tracklist; no standalone research release. | Track-level page, not separate research entry. | Current-era project track |
| `fragments-remixes` | Fragments (Remixes) | Fragments (Remixes) | High | Exact current display title. | Research source registry also says `Fragments Remixes`; site title with parentheses is acceptable. | Current-era |
| `numbers-tom-ecko-remix` | Numbers (tom_ecko Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | Remixer styling `tom_ecko` should be verified before formal credits. | Current-era project track |
| `eyes-on-me-dreamsuite-remix` | Eyes On Me (dreamsuite Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | Remixer lower-case styling should be verified. | Current-era project track |
| `like-that-notminimal-remix` | Like That (notminimal. Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | Collaborator/remixer formatting manual. | Current-era project track |
| `wanted-almost-anyone-remix` | Wanted (Almost Anyone Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | None beyond formal credit verification. | Current-era project track |
| `eyes-on-me-vivid-fever-dreams-remix` | Eyes On Me (Vivid Fever Dreams Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | None beyond formal credit verification. | Current-era project track |
| `wanted-kaiyo-remix` | Wanted (Kaiyo Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | None beyond formal credit verification. | Current-era project track |
| `eyes-on-me-exmaxhina-remix` | Eyes On Me (exmaxhina Remix) | Fragments (Remixes) | Medium | Track appears in remix companion tracklist. | Remixer lower-case styling should be verified. | Current-era project track |
| `like-that` | Like That | Fragments / possible standalone Like That | Medium | Site has standalone single; research covers it as Fragments track and Apple source registry has Apple Like That indirectly through site data only. | Needs manual decision whether standalone page belongs in current catalog. | Archive/current-context |
| `hold-on` | Hold On | Hold On | High | Direct research entry, official Bandcamp match; site also has Apple/TIDAL. | None. | Transition |
| `warning` | Warning | Warning | High | Direct research entry and matching Apple/Spotify/Qobuz data. | None. | Transition |
| `hysteria` | hysteria | hysteria | High | Direct research entry, official Bandcamp match; site also has Apple/TIDAL. | Preserve lowercase. | Transition |
| `after-you` | After You | After You | Low/Medium | Research treats it as additional public DSP reference needing verification; site has direct Apple/TIDAL. | Collaborator display needs manual verification. | Public archive candidate |
| `paradise` | Paradise | Paradise | High for existence, Medium for DSP/date | Direct research entry, but dates and third-party sources conflict. | None. | Foundation/archive |

Unmatched research-only entries should not be added to the live catalog yet: ALKALiNE LEAK, PROPPA, Back When, Eternity, Gimmie Dat, Think About It, imu, daisies., Tarot's, Where the Crawfish Sing, pines, Neapolitan ft. Pointy Features, Uncertainty, Pillow Thoughts, Cloud Surfing., Daydreams, Vol. 1, November Rain, KUDOS, A Walk in the Park, Closure / Closer, New Beginnings, Roam, Cedar and Candles, When There's Nothing Else, and After the Rain.

---

## Safe Platform-Link Candidates

Only direct, official, high-confidence links are marked `Safe to add`. Smart links are generally useful but should not be expanded into individual DSP URLs until direct destinations are resolved.

| Release | Platform | URL | Confidence | Source | Recommended status |
|---|---|---|---|---|---|
| FREE | Apple Music | `https://music.apple.com/us/album/free-single/1892157471` | High | Apple FREE | Safe to add |
| FREE | Spotify | Not captured as direct URL | Medium | Spotify artist page | Needs direct-link resolution |
| FREE | Linktree / official hub | `https://linktr.ee/broeybeats` | High | Official Linktree | Needs manual verification; hub link, not release platform |
| blu. | Apple Music | `https://music.apple.com/us/album/blu-single/1869157131` | High | Apple blu. | Safe to add |
| blu. | Bandcamp | `https://broey.bandcamp.com/album/blu` | High | Bandcamp blu. | Safe to add |
| blu. | CreateMusic smart link | `https://createmusic.fm/blu` | High | CreateMusic blu.; Official Linktree | Safe to keep/add as smart link, but do not infer direct DSP URLs |
| STEREO LUV | Apple Music | `https://music.apple.com/us/album/stereo-luv-single/1837799560` | High | Apple STEREO LUV | Safe to add |
| STEREO LUV | Bandcamp | `https://broey.bandcamp.com/track/stereo-luv` | High | Bandcamp STEREO LUV | Safe to add |
| STEREO LUV | CreateMusic smart link | `https://createmusic.fm/stereoluv` | High | CreateMusic STEREO LUV; Official Linktree | Already present; safe as smart link |
| LiNK | All platforms | No high-confidence official public link found | Low | Public search pass | Do not add |
| dancing dumpster fire | Apple Music | `https://music.apple.com/us/album/dancing-dumpster-fire/1820012666` | High | Apple dancing dumpster fire | Safe to add |
| dancing dumpster fire | Spotify | `https://open.spotify.com/album/1oZeVU9ghK6owsQFnYDPdY` | High | Spotify dancing dumpster fire | Needs manual verification before replacing current site Spotify URL, because the site currently uses a different Spotify album URL |
| dancing dumpster fire | Bandcamp | `https://broey.bandcamp.com/album/dancing-dumpster-fire` | High | Bandcamp dancing dumpster fire | Safe to add |
| dancing dumpster fire | We Rave You press | `https://weraveyou.com/2025/08/broey-dancing-dumpster-fire-ep-review/` | High | We Rave You; Linktree | Do not add as platform link; already belongs in press layer |
| I Can't Wait For Love | Apple Music | `https://music.apple.com/us/album/i-cant-wait-for-love-single/1805900957` | High | Apple I Can't Wait For Love | Safe to add |
| I Can't Wait For Love | Spotify | `https://open.spotify.com/album/2nqHG03NQFtKUm4grl9DAj` | High | Spotify I Can't Wait For Love | Safe to add after direct page check |
| I Can't Wait For Love | CreateMusic smart link | `https://createmusic.fm/icantwaitforlove` | High | CreateMusic; Linktree | Site has tracked URL; safe to normalize after approval |
| Mean Something | Apple Music | `https://music.apple.com/us/album/mean-something-single/1772176805` | High | Apple Mean Something | Safe to add |
| Mean Something | Spotify | `https://open.spotify.com/album/1IOco7DVpyPuePje8qZEnZ` | High | Spotify Mean Something | Safe to add after direct page check |
| Mean Something | CreateMusic smart link | `https://createmusic.fm/meansomething` | High | CreateMusic; Linktree | Already present; safe as smart link |
| 4u | Apple Music | `https://music.apple.com/us/album/4u-single/1752540493` | High | Apple 4u | Safe to add |
| 4u | Spotify | `https://open.spotify.com/album/0lvaKQqHglh6aHU78gB42M` | High | Spotify 4u | Safe to add after direct page check |
| 4u | CreateMusic smart link | `https://createmusic.fm/4u` | High | CreateMusic; Linktree | Already present; safe as smart link |
| Fragments | Apple Music | `https://music.apple.com/us/album/fragments-ep/1729476600` | High | Apple Fragments | Safe to add |
| Fragments | Spotify | `https://open.spotify.com/album/5HzzutixZ8qVwIqUdhrRe7` | High | Spotify Fragments; Insight Music | Safe to add after direct page check |
| Fragments | CreateMusic smart link | `https://createmusic.fm/fragments` | High | CreateMusic; Linktree | Already present; safe as smart link |
| Fragments | Press links | Insight, LOUDNESS, EDM Reviewer, Palms Out URLs | High | Press sources | Do not add as platform links; press layer only |
| Fragments (Remixes) | Apple Music | `https://music.apple.com/us/album/fragments-remixes/1742637606` | High | Apple Fragments Remixes | Safe to add |
| Fragments (Remixes) | CreateMusic smart link | `https://createmusic.fm/fragments-remixes` | High | CreateMusic; Linktree | Already present; safe as smart link |
| Warning | Apple Music | `https://music.apple.com/us/album/warning-single/1673797798` | High | Apple Warning | Already present with `?uo=4`; safe |
| Warning | Spotify album | `https://open.spotify.com/album/0m7quPpvC0EVQ21J86apaa` | High | Spotify Warning album | Safe to add after direct page check |
| Warning | Spotify track | `https://open.spotify.com/track/7r5cCLB4dwN8RAW7WEzYlR` | High | Spotify Warning track | Prefer album link for release platform; track link can be secondary if approved |
| Warning | Qobuz | `https://www.qobuz.com/no-en/album/warning-cryztal-grid-broey/h32yv6ppq80wc` | Medium | Qobuz Warning | Needs manual verification; do not use credits yet |
| Hold On | Bandcamp | `https://broey.bandcamp.com/track/hold-on` | High | Bandcamp Hold On | Safe to add if transition releases remain public |
| Hold On | Apple/TIDAL current site links | Existing direct site data | Existing internal site data | Current site | Keep pending manual comparison with dashboard/source |
| hysteria | Bandcamp | `https://broey.bandcamp.com/track/hysteria` | High | Bandcamp hysteria | Safe to add if transition releases remain public |
| hysteria | Apple/TIDAL current site links | Existing direct site data | Existing internal site data | Current site | Keep pending manual comparison with dashboard/source |
| Paradise | Bandcamp | `https://broey.bandcamp.com/track/paradise` | High | Bandcamp Paradise | Safe only if foundation page remains public; otherwise internal/noindex |
| Paradise | Spotify | `https://open.spotify.com/album/2nkJjtXF1s41m8DscqlMK2` | Medium | Spotify Paradise; MusicBrainz | Needs manual verification |
| Paradise | Apple/Deezer/TIDAL from MusicBrainz | MusicBrainz-derived URLs | Medium | MusicBrainz Paradise | Needs manual verification |
| After You | Apple Music | Research did not open exact URL | Medium | Apple related listing | Needs direct-link resolution despite current site having an Apple URL |
| After You | Current site Apple/TIDAL links | Existing site data | Existing internal site data | Current site | Needs manual verification before treating as reconciled |

---

## Links Requiring Direct Resolution

- Direct Spotify URL for FREE.
- Direct DSP destinations behind CreateMusic smart links for blu., STEREO LUV, I Can't Wait For Love, Mean Something, 4u, Fragments, and Fragments (Remixes).
- Exact TIDAL/Spotify/YouTube/Deezer/Amazon/SoundCloud links for blu., STEREO LUV, and other smart-link-only current releases.
- The discrepancy between the current site Spotify URL for `dancing dumpster fire` and the draft research Spotify URL.
- Any MusicBrainz-derived Apple/Deezer/TIDAL links for Paradise.
- After You direct release links and canonical collaborator metadata.
- Any YouTube/thebootlegboy context for Paradise, if it is ever linked.

---

## Credits And Details Requiring Manual Verification

No formal credits should be approved from this public research foundation alone.

### Credits present in current site

Most live entries do not define explicit `credits`; release pages therefore display fallback credit rows:

- `Artist`: derived from `artistName`, `catalogSource.artistName`, or `Broey.`
- `Release`: `Broey.`
- `Label`: `Independent`

Some public-facing artist labels are present through `artistName`, `audio.tracks[].artist`, and track titles:

- Cryztal Grid & Broey. for Warning.
- Broey. and Broken Blythe for I Can't Wait For Love.
- Broey. & notminimal. for 4u and 4u vip contexts.
- Broey. & Vivid Fever Dreams for brainrot, Breathing Room, and related remix contexts.
- Dreameater, Broken Blythe & Broey. for `i can do better (broey. remix)`.
- Broey. & Mr. Hilroy for After You.

These are acceptable as simple public-facing artist/feature labels only where already displayed by the site or high-confidence public platform pages. They should not be converted into writer, producer, mixer, masterer, publisher, distributor, or rights credits without manual verification.

### Research-suggested credits that should not be published yet

Do not publish without dashboard/session/label verification:

- Writer/composer credits.
- Producer credits.
- Mixing credits.
- Mastering credits.
- Artwork/design credits, including CVLTLUNA for Hold On, until permission/spelling/context is approved.
- Label, distributor, publisher, rights-line, copyright, or legal owner fields.
- UPCs and ISRCs.
- BPM/key.
- Sample/interpolation details, including Paradise / Erik Satie context.
- Qobuz credits for Warning.
- Press-source claims like Fragments being written/produced by Broey. as formal credits.

### Public-facing labels that can be considered after approval

- Primary artist display where Apple/Bandcamp/CreateMusic clearly matches the site.
- Featured/collaborator labels when they are already in public track titles or platform artist displays.
- Remixer display labels for Fragments (Remixes), but not formal legal remix/producer/writer splits.

---

## Date Conflicts

| Release | Current site date | Research dates | Suggested display strategy | Manual verification needed |
|---|---|---|---|---|
| FREE | `2026-05-07` | May 7, 2026 on Apple | Use exact date if approved. | Verify whether this is release date or DSP date. |
| blu. | `2025-00-00` | Bandcamp: Dec. 1, 2025; Apple: Feb. 6, 2026 | Store both original and DSP dates. Display either `2026` until approved, or `Original release: Dec. 1, 2025 / DSP release: Feb. 6, 2026` if page design supports it. | Yes. |
| STEREO LUV | `2025-00-00` | Apple: Oct. 3, 2025; Bandcamp: Oct. 9, 2025 | Store both dates; display chosen public date after approval. | Yes. |
| dancing dumpster fire | `2025-00-00` | Bandcamp: Aug. 1, 2025; Apple: Aug. 2, 2025 | Store original and DSP dates; display one chosen date or a neutral month/year until approved. | Yes. |
| I Can't Wait For Love | year only | Apple: May 2, 2025 | Current site year appears wrong/incomplete relative to research and current-era placement. Do not update until verified. | Yes. |
| Mean Something | `2025-00-00` | Apple: Nov. 1, 2024 | Resolve whether site year/date is intentional current-era grouping or a factual mismatch. | Yes. |
| 4u | `2024-00-00` | Apple: July 19, 2024 | Use exact date after approval. | Verify collaborator/formal metadata. |
| Fragments | `2024-00-00` | Mar. 29, 2024 | Use exact date after approval. | Verify source and display title. |
| Fragments (Remixes) | `2024-00-00` | Apple: May 10, 2024; early promo/SoundCloud may differ | Store DSP and optional original/promo dates separately. | Yes. |
| Warning | `2023-03-10` | Mar. 10, 2023 | Current date matches research. | Verify Apple/TIDAL/Qobuz source hierarchy. |
| Hold On | `2023-05-08` | Bandcamp: Apr. 25, 2023 | Conflict between current site and Bandcamp research. | Yes. |
| hysteria | `2022-01-13` | Jan. 13, 2022 | Current date matches research. | Verify Apple/TIDAL vs Bandcamp if adding links. |
| Paradise | `2019-03-23` | Bandcamp: Jan. 8, 2019; MusicBrainz worldwide event: Mar. 23, 2019 | Keep as foundation/internal until date source is approved; if public, store both original and DSP/global event dates. | Yes. |
| After You | `2020-11-30` | Research only says 2020 related listing, exact date/link not opened | Treat current site date as internal existing data pending verification. | Yes. |
| November Rain | Not in current site catalog | Research flags conflicts/public references | Backlog only; do not add public release page yet. | Yes. |

---

## Visibility And Indexing Recommendations

### A. Public current catalog / safe to keep indexed

Recommended, subject to link/date cleanup:

- FREE
- blu.
- STEREO LUV
- dancing dumpster fire
- I Can't Wait For Love
- Mean Something
- 4u
- Fragments
- Fragments (Remixes)

Project-track pages under these releases should be reviewed. They may be useful for the audio player, but they should likely be `noindex` or excluded from sitemap unless intentionally positioned as standalone public pages.

### B. Public archive candidate / verify before indexing

- Like That
- Warning
- Hold On
- hysteria
- After You

Warning, Hold On, and hysteria are already part of the visible Transition Works flow, but formal indexing should still be intentional. After You is not part of the curated `/music` sections and should be verified before remaining indexed.

### C. Internal metadata only / noindex or not shown publicly

- Paradise
- Foundation-era releases from research: PROPPA, Back When, Eternity, Gimmie Dat, Think About It, imu, daisies., pines, Neapolitan ft. Pointy Features, Uncertainty, Pillow Thoughts, Cloud Surfing., Daydreams, Vol. 1, KUDOS, A Walk in the Park.
- Label/collaboration/archive releases: Tarot's, Where the Crawfish Sing, Equinox references, Closure / Closer.
- Project-track detail pages unless explicitly approved for SEO.

### D. Pending/manual / do not update yet

- LiNK.
- Any release with no direct public source in the draft.
- Any credits, UPC/ISRC, BPM/key, sample details, label/distributor/publisher/legal fields.
- Any MusicBrainz-derived destination links.

### E. Unresolved extra public references / backlog only

- November Rain.
- New Beginnings.
- Roam.
- Cedar and Candles.
- When There's Nothing Else.
- After the Rain.
- ALKALiNE LEAK, unless approved as current-era Bandcamp-only release.

---

## Recommended Data Model Changes

Do not implement yet, but the model should be extended before importing more metadata.

Recommended fields:

```ts
type ReleaseIndexing = "index" | "noindex" | "internal";
type ReleaseVisibility = "draft" | "public" | "archive" | "internal" | "pending";
type VerificationStatus = "verified" | "source-backed" | "manual-review" | "unverified";

type ReleaseDateInfo = {
  originalReleaseDate?: string;
  dspReleaseDate?: string;
  displayDate?: string;
  dateSource?: string;
  dateConfidence?: VerificationStatus;
  dateNotes?: string;
};

type VerifiedExternalLink = ExternalLink & {
  source?: string;
  confidence?: VerificationStatus;
  verificationNotes?: string;
  resolvedFromSmartLink?: boolean;
};

type VerifiedCredit = ReleaseCredit & {
  creditType?: "display-artist" | "feature" | "remixer" | "writer" | "producer" | "mixing" | "mastering" | "artwork" | "label" | "publisher" | "rights";
  source?: string;
  confidence?: VerificationStatus;
  publishApproved?: boolean;
};
```

Implementation notes:

- Keep `releaseDate` temporarily for backward compatibility, then migrate rendering to `displayDate`.
- Add an explicit `indexing` field and use it in `generateMetadata()`, `sitemap.ts`, and any future archive pages.
- Make project-track sitemap behavior explicit instead of relying on `showInArchive: false`.
- Separate `links` into official direct platform links, smart links, press links, and internal/admin links.
- Add source/confidence metadata to imported catalog-source fields before exposing them.

---

## Proposed Implementation Phases

### Phase 1A

Add only high-confidence platform links to current public releases:

- Apple Music for FREE, blu., STEREO LUV, dancing dumpster fire, I Can't Wait For Love, Mean Something, 4u, Fragments, and Fragments (Remixes).
- Bandcamp for blu., STEREO LUV, dancing dumpster fire, Hold On, and hysteria if approved.
- Spotify for I Can't Wait For Love, Mean Something, 4u, Fragments, and Warning after direct page checks.
- Hold the dancing dumpster fire Spotify update until the current-site URL discrepancy is resolved.
- Keep LiNK unchanged.

### Phase 1B

Add data-model fields for:

- `display_date`
- `original_release_date`
- `dsp_release_date`
- `visibility`
- `indexing`
- verification status/source notes for dates, links, and credits

### Phase 1C

Add approved credits/details after manual validation:

- Public-facing artist/feature/remixer labels first.
- Formal writer/producer/mixing/mastering/artwork/legal credits only after dashboard/session/label verification.

### Phase 1D

Handle archive/foundation releases separately:

- Keep foundation releases internal/noindex by default.
- Decide whether Paradise, After You, and Like That stay public, move to archive, or become internal metadata only.
- Do not add research-only old catalog entries to the curated `/music` flow without explicit approval.

### Phase 1E

Final release-page QA:

- Platform links.
- Release metadata.
- Sitemap output.
- Structured data.
- Mobile layout.
- Audio/player behavior.
- Noindex behavior for archive/internal/project-track pages.

---

## Manual Approval Checklist

- [ ] Confirm which current releases should be indexed.
- [ ] Confirm whether project-track pages should be indexed or noindexed.
- [ ] Confirm exact display dates for blu., STEREO LUV, dancing dumpster fire, Mean Something, Hold On, Paradise, and After You.
- [ ] Resolve the dancing dumpster fire Spotify URL discrepancy.
- [ ] Resolve FREE direct Spotify URL.
- [ ] Resolve direct DSP links behind CreateMusic smart links.
- [ ] Decide whether Bandcamp links belong on current release pages.
- [ ] Keep LiNK pending/manual until internal distributor/site data confirms public metadata.
- [ ] Decide whether Paradise remains public or becomes internal/noindex.
- [ ] Verify all formal credits from distributor/admin dashboards, session files, label docs, or approved source-of-truth records.
- [ ] Do not publish UPC, ISRC, BPM/key, sample details, legal rights, distributor, label, or publishing fields until explicitly approved.
- [ ] Keep foundation-era research-only releases out of the live catalog unless separately approved.

---

## Validation Notes

This report itself does not import into the Next.js app. Production source files should remain unchanged.

Validation requested:

- `npm run lint`
- `npm run build`
- Smoke test `/music`
- Smoke test at least three current release pages
- Smoke test `/sitemap.xml` if easy

Results should be recorded in the final task response.
