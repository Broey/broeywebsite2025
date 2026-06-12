# Phase 1A-QA: Approved Listening Links

Date: 2026-06-12

Scope: verify the approved current-release platform links added in Phase 1A. This pass did not add metadata, credits, dates, legal fields, visibility changes, sitemap changes, or additional platform links.

---

## Summary

Result: Pass, with no code fixes made.

The updated release pages render the approved platform links in the release platform module, with no duplicates, no localhost hrefs, no placeholder hrefs, and no press links mixed into streaming buttons. External platform buttons render with `target="_blank"` and `rel="noopener noreferrer"`.

CreateMusic smart links remain in release data where they already existed, but they do not render inside the release platform module because the existing `releasePlatformLinks()` filter only displays known music platforms such as Spotify, Apple Music, TIDAL, Bandcamp, etc. This is pre-existing behavior and prevents CreateMusic from pretending to be a direct DSP link.

TIDAL appears on some updated pages through the existing `catalogSource.sourceUrl` fallback. That was already part of the release action logic and was not added in Phase 1A.

---

## Checked Updated Pages

| Page | Expected approved buttons | Actual platform-module buttons | Result |
|---|---|---|---|
| `/music/free` | Apple Music | Apple Music, TIDAL | Pass. Apple Music present; TIDAL is existing catalog fallback. |
| `/music/blu` | Apple Music, Bandcamp, existing CreateMusic if present | Apple Music, TIDAL, Bandcamp | Pass. CreateMusic is not rendered in platform module by existing filter. |
| `/music/stereo-luv` | Apple Music, Bandcamp, existing CreateMusic if present | Apple Music, TIDAL, Bandcamp | Pass. CreateMusic is not rendered in platform module by existing filter. |
| `/music/dancing-dumpster-fire` | Apple Music, Bandcamp, existing Spotify unchanged | Spotify, Apple Music, TIDAL, Bandcamp | Pass. Existing Spotify URL unchanged. |
| `/music/i-cant-wait-for-love` | Spotify, Apple Music, existing CreateMusic if present | Spotify, Apple Music | Pass. CreateMusic is not rendered in platform module by existing filter. |
| `/music/mean-something` | Spotify, Apple Music, existing CreateMusic if present | Spotify, Apple Music, TIDAL | Pass. TIDAL is existing catalog fallback. |
| `/music/4u` | Spotify, Apple Music, existing CreateMusic if present | Spotify, Apple Music, TIDAL | Pass. TIDAL is existing catalog fallback. |
| `/music/fragments-ep` | Spotify, Apple Music, existing CreateMusic if present | Spotify, Apple Music, TIDAL | Pass. TIDAL is existing catalog fallback. |
| `/music/fragments-remixes` | Apple Music, existing CreateMusic if present | Apple Music, TIDAL | Pass. TIDAL is existing catalog fallback. |

---

## Href Results

| Page | Button | Href | External behavior |
|---|---|---|---|
| `/music/free` | Apple Music | `https://music.apple.com/us/album/free-single/1892157471` | `_blank`, `noopener noreferrer` |
| `/music/blu` | Apple Music | `https://music.apple.com/us/album/blu-single/1869157131` | `_blank`, `noopener noreferrer` |
| `/music/blu` | Bandcamp | `https://broey.bandcamp.com/album/blu` | `_blank`, `noopener noreferrer` |
| `/music/stereo-luv` | Apple Music | `https://music.apple.com/us/album/stereo-luv-single/1837799560` | `_blank`, `noopener noreferrer` |
| `/music/stereo-luv` | Bandcamp | `https://broey.bandcamp.com/track/stereo-luv` | `_blank`, `noopener noreferrer` |
| `/music/dancing-dumpster-fire` | Spotify | `https://open.spotify.com/album/5bLOPMvddqpng76Lj5ZRKt` | `_blank`, `noopener noreferrer` |
| `/music/dancing-dumpster-fire` | Apple Music | `https://music.apple.com/us/album/dancing-dumpster-fire/1820012666` | `_blank`, `noopener noreferrer` |
| `/music/dancing-dumpster-fire` | Bandcamp | `https://broey.bandcamp.com/album/dancing-dumpster-fire` | `_blank`, `noopener noreferrer` |
| `/music/i-cant-wait-for-love` | Spotify | `https://open.spotify.com/album/2nqHG03NQFtKUm4grl9DAj` | `_blank`, `noopener noreferrer` |
| `/music/i-cant-wait-for-love` | Apple Music | `https://music.apple.com/us/album/i-cant-wait-for-love-single/1805900957` | `_blank`, `noopener noreferrer` |
| `/music/mean-something` | Spotify | `https://open.spotify.com/album/1IOco7DVpyPuePje8qZEnZ` | `_blank`, `noopener noreferrer` |
| `/music/mean-something` | Apple Music | `https://music.apple.com/us/album/mean-something-single/1772176805` | `_blank`, `noopener noreferrer` |
| `/music/4u` | Spotify | `https://open.spotify.com/album/0lvaKQqHglh6aHU78gB42M` | `_blank`, `noopener noreferrer` |
| `/music/4u` | Apple Music | `https://music.apple.com/us/album/4u-single/1752540493` | `_blank`, `noopener noreferrer` |
| `/music/fragments-ep` | Spotify | `https://open.spotify.com/album/5HzzutixZ8qVwIqUdhrRe7` | `_blank`, `noopener noreferrer` |
| `/music/fragments-ep` | Apple Music | `https://music.apple.com/us/album/fragments-ep/1729476600` | `_blank`, `noopener noreferrer` |
| `/music/fragments-remixes` | Apple Music | `https://music.apple.com/us/album/fragments-remixes/1742637606` | `_blank`, `noopener noreferrer` |

No checked platform-module href used localhost, `#`, unresolved placeholder text, or press URLs.

---

## Duplicate Check

No duplicate platform buttons were found in the release platform module for the updated pages.

Notes:

- Footer/social Apple Music and Spotify links are separate global artist links and were excluded from duplicate analysis.
- TIDAL catalog fallback links appear once where applicable.
- No page had duplicate Apple Music, duplicate Spotify, duplicate Bandcamp, or duplicated CreateMusic/platform buttons.

---

## Section Placement

Result: Pass.

- Spotify, Apple Music, TIDAL, and Bandcamp appear in the release platform section.
- Bandcamp appears as a music platform.
- Press links do not appear in the streaming/platform module.
- CreateMusic smart links do not render as Spotify/Apple/etc. and do not appear as duplicate platform buttons.

---

## Mobile Layout

Result: Pass by structural check.

The platform button container uses `flex flex-wrap gap-2`, so added buttons wrap instead of overflowing. The densest updated page, `/music/dancing-dumpster-fire`, has four short platform labels: Spotify, Apple Music, TIDAL, and Bandcamp.

Attempted headless Chrome screenshots at a 390px mobile viewport, but Chrome produced blank captures in this environment. Because the screenshots were blank, they were not used as visual evidence. Rendered HTML and CSS structure were checked instead.

No overflow-prone long labels, unresolved placeholder spans, or fixed-width platform controls were found.

---

## Regression Check

| Page | Result |
|---|---|
| `/music/link` | No platform section rendered; LiNK remains unchanged/pending. |
| `/music/after-you` | Existing Apple Music and TIDAL links still render; no Phase 1A links added. |
| `/music/paradise` | Existing Apple Music and TIDAL links still render; no Phase 1A links added. |
| `/music/like-that` | Existing Apple Music and TIDAL links still render; no Phase 1A links added. |
| `/music/shake` | No platform section rendered; project-track page unchanged. |
| `/music/run-for-cover` | No platform section rendered; project-track page unchanged. |
| `/music/numbers-tom-ecko-remix` | No platform section rendered; project-track page unchanged. |

---

## Fixes Made

None.

---

## Remaining Issues

- Direct Spotify URL for FREE remains unresolved, as intended.
- Dancing dumpster fire Spotify URL discrepancy remains unresolved; existing site URL was intentionally left unchanged.
- CreateMusic smart links are not displayed in the release platform module because of existing platform filtering. This is acceptable for Phase 1A-QA and avoids presenting smart hubs as direct DSP links.
- Mobile screenshot capture was unavailable due blank headless Chrome output in this environment.
