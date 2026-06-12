# Current Release Platform Links Implementation

Date: 2026-06-12

Scope: populated current public release page platform links from `broey_current_release_platform_links_draft_2026-06-12.json`. This pass only changed active listening/platform links in `content/releases.ts`.

## Updated Releases

| Release | Links added or replaced |
|---|---|
| FREE | Added Spotify and YouTube. Preserved existing Apple Music and TIDAL catalog fallback. |
| blu. | Added Spotify, YouTube, TIDAL, SoundCloud, Amazon Music, and Deezer. Preserved Apple Music, Bandcamp, and existing CreateMusic hub data. |
| STEREO LUV | Added Spotify, YouTube, TIDAL, SoundCloud, Amazon Music, and Deezer. Preserved Apple Music, Bandcamp, and existing CreateMusic hub data. |
| dancing dumpster fire | Replaced incorrect Spotify URL with `https://open.spotify.com/album/1oZeVU9ghK6owsQFnYDPdY`. Added YouTube. Preserved Apple Music, Bandcamp, and existing TIDAL catalog fallback. |
| I Can't Wait For Love | Added YouTube, SoundCloud, Amazon Music, and Deezer. Preserved Spotify, Apple Music, TIDAL, and existing CreateMusic hub data. |
| Mean Something | Added YouTube, TIDAL, SoundCloud, Amazon Music, and Deezer. Preserved Spotify, Apple Music, and existing CreateMusic hub data. |
| 4u | Added YouTube, TIDAL, SoundCloud, Amazon Music, and Deezer. Preserved Spotify, Apple Music, and existing CreateMusic hub data. |
| Fragments | Added TIDAL, SoundCloud, Amazon Music, and Deezer. Preserved Spotify, Apple Music, and existing CreateMusic hub data. |
| Fragments (Remixes) | Added Spotify, YouTube, TIDAL, SoundCloud, and Deezer. Preserved Apple Music and existing CreateMusic hub data. |
| Warning | Added Spotify and Deezer. Preserved TIDAL and Apple Music. |
| Hold On | Added Spotify and Bandcamp. Preserved TIDAL and Apple Music. |
| hysteria | Added Spotify and YouTube. Preserved TIDAL and Apple Music. |
| After You | Added Spotify and YouTube. Preserved TIDAL and Apple Music. |
| Like That | Added YouTube only. Spotify was intentionally not added because the JSON flags the standalone/remix ambiguity. |
| Paradise | Added Spotify, YouTube, and Bandcamp. Preserved TIDAL and Apple Music. |

## Intentionally Skipped

- YouTube Music links were skipped because the visible platform module does not currently support a separate YouTube Music platform label.
- Beatport links were skipped because the visible platform module does not currently support Beatport.
- Official hub/smart-link additions were skipped except where existing CreateMusic links were already present.
- FREE Apple Music was preserved as an existing link, but not newly expanded based on medium-confidence/manual-review notes.
- Fragments (Remixes) Amazon Music was skipped because the JSON flags it for manual confirmation.
- Like That Spotify was skipped to avoid adding the notminimal remix or parent EP fallback to the original Like That page.

## Checks

- LiNK was not modified.
- The Spotify URL `https://open.spotify.com/album/5bLOPMvddqpng76Lj5ZRKt` now appears only on FREE.
- dancing dumpster fire now uses `https://open.spotify.com/album/1oZeVU9ghK6owsQFnYDPdY`.
- No `Not found`, `needs manual`, `placeholder`, or `example.com` strings were added to active release links.
- No credits, legal metadata, release dates, SEO fields, visibility/indexing, sitemap behavior, project-track pages, DNS, Vercel settings, private gate, or public launch state were changed.

## Validation

- `npm run lint`: passed.
- `npm run build`: passed.
- Smoke-tested current release routes on the built app. All actual release routes returned 200 and had no duplicate release platform buttons.
- `/music/fragments` returned 404 because the actual site slug is `/music/fragments-ep`; `/music/fragments-ep` passed.
