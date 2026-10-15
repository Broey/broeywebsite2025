# OnlyU release preparation — October 14, 2026

The release candidate is staged on `codex/onlyu-release` for review and controlled deployment. Production remains on `main` commit `8d23eae` until the owner authorizes publishing. Two goals were saved in the existing Umami Cloud website.

## Release behavior

- The owner subsequently approved immediate website publication on October 14, 2026 at 11:26:52 PM Eastern (`2026-10-15T03:26:52Z`). The distributor release date remains October 15.
- Before launch: home presave, release-route redirect, locked MP3, and exclusion from the sitemap remain active.
- At launch: the first home card plays OnlyU, the countdown disappears without flashing during hydration, and `/music` highlights OnlyU and includes it in Selected Catalog.
- `/music/only-u` uses the existing shared release template, artwork, credits, metadata, sharing, recommendations, and player.
- The supplied Downloads MP3 replaces the staged audio. The committed payload remains AES-256-GCM encrypted with the existing local key; its decrypt roundtrip matches the supplied file byte for byte. Plaintext audio stays ignored by Git.
- The reminder appears after 60 seconds of actual playback, roughly one minute into an uninterrupted listen. Seeking, pauses, and track changes do not count toward listening time. It leaves playback running, supports its close button and Escape, and is suppressed after its first appearance in the browser tab's session.
- OnlyU remains first in the home highlight rotation and becomes eligible for other releases' suggested-track rotation once released. Its own suggestions are pinned in order to FREE, Hold Me Back, and STEREO LUV. Vultures remains a draft; its future relationship to OnlyU is not activated.
- Current focus is now derived from the newest published highlight via `content/release-focus.ts`. FREE loses the gold styling and out-now pill when OnlyU launches, and future approved releases take over the same way. Streaming-service buttons have equal styling on the track page and popup. See `RELEASE_POLICY.md` for the standing policy.

## Streaming destinations

The track page exposes Spotify, Apple Music, YouTube, YouTube Music, TIDAL, Deezer, Amazon Music, iTunes, VK Music, and the official All platforms hub. The popup uses the listening services and hub, omitting iTunes and the duplicate YouTube destination.

Sources:

- [Official smartlink](https://bfan.link/onlyustores): Spotify, YouTube, YouTube Music, Amazon Music. Corrected the Spotify album ID's uppercase `I` to the source's lowercase `l`.
- [Spotify metadata](https://open.spotify.com/oembed?url=https://open.spotify.com/album/3ZMHlWgHbaboU9PlbvgUcf): confirms the title OnlyU.
- [Apple catalog lookup](https://itunes.apple.com/lookup?id=6807108697&entity=song&country=au): confirms both artists, release title, album ID, and track ID.
- TIDAL official API lookup by `FRX452645232`: confirms title, both artists, album UPC `3618114985136`, and [track 550245641](https://tidal.com/browse/track/550245641).
- [Deezer lookup by ISRC](https://api.deezer.com/track/isrc:FRX452645232): confirms OnlyU and the exact recording ID for [track 4209089652](https://www.deezer.com/track/4209089652).
- Artist-supplied iTunes and VK links are retained. Regional store access can unlock at different times; metadata availability does not guarantee playback in every territory before release.

Evidence is in `reports/only-u-store-links.json`, `reports/only-u-tidal-lookup.json`, and `reports/only-u-deezer-lookup.json`. The smartlink's own TIDAL/Deezer fields were empty; direct recording-ID lookups supplied the missing destinations. No search results are presented as release links.

## Analytics

[Open the saved Umami goals dashboard](https://cloud.umami.is/analytics/us/websites/a48e8dfd-e4d8-42db-a2fe-970ae6cf373e/goals).

Saved goals:

- **OnlyU — playlist reminder shown**: `playlist_prompt_view`.
- **OnlyU — playlist streaming clicks**: `playlist_prompt_click`.

Existing Music plays (`audio_play`), Completed listens (`audio_complete`), and Streaming platform clicks (`streaming_click`) goals remain available. The player also records 25%, 50%, and 75% milestones. The popup records `playlist_prompt_dismiss` and continues to emit `streaming_click` with `source_surface=playlist_prompt` for consistency with other outbound placements.

Use the [Events dashboard](https://cloud.umami.is/analytics/us/websites/a48e8dfd-e4d8-42db-a2fe-970ae6cf373e/events) and its Properties tab to inspect event totals and platforms. Filter `release_slug=only-u` for playback events, and `source_surface=playlist_prompt` for popup handoffs. These new properties become selectable once production receives matching events. Outbound clicks retain platform and campaign attribution; the hub has `destination_type=smartlink` on `playlist_prompt_click` so it can be excluded from direct-service totals.

Umami goal conversion rates use site visitors as the denominator. For reminder click-through, compare popup-click totals with popup-view totals over the same time period and distinguish total clicks from unique visitors. Repeated service clicks can produce more than one click per impression. These events measure intent and handoffs; they cannot verify playlist additions inside Spotify, Apple Music, or another service. Consult the artist/distributor dashboards for actual saves and playlist activity.

The production build needs the existing `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. Tracking is intentionally absent on localhost/private previews. Live receipt of the new events can only be verified after deployment; no synthetic events were sent into production analytics.

## Validation and deployment handoff

- TypeScript, ESLint, production build, and all 53 tests passed, including the revised one-minute reminder, pause/seek behavior, and automatic focus handoff from FREE to OnlyU to a future approved release. A targeted recommendation check also passed: OnlyU's pre/postlaunch eligibility, highlight membership, the three pinned suggestions across three dates, and Vultures draft exclusion.
- Tested the same production build with the normal clock and with a local server clock after release; source launch timing was not changed.
- HTTP checks confirm prelaunch redirect/404/sitemap exclusion and postlaunch track page/featured release/range-seek MP3/sitemap inclusion. See `reports/only-u-release-prep-validation.json`.
- Earlier browser checks confirmed home-card playback of the supplied 198.947-second MP3, navigation through `/music` to the shared track page, and the popup during actual playback at its original outro timing. At 390×844 the popup stayed inside the viewport and above the player; dismissal removed it without pausing audio. The revised one-minute timing is covered by the updated playback tests. Screenshots: `reports/only-u-release-home-desktop.png`, `reports/only-u-release-music-desktop.png`, `reports/only-u-release-track-mobile.png`, and `reports/only-u-playlist-prompt-mobile.png`.
- Before deploying, retain the production `ONLY_U_AUDIO_KEY` matching the encrypted asset. The sample environment file now documents this requirement.
- After deployment, verify the production commit, home playback, countdown removal, featured music card, store availability in the target territory, and real receipt of popup/play events in Umami.
- Existing unrelated draft vultures work and pre-existing untracked files were preserved.

## Midnight deployment plan

Launch time is October 15, 2026 at 12:00 AM America/New_York (04:00 UTC). DigitalOcean production currently tracks `main` with autodeploy off. The app already gates OnlyU by that timestamp: deploying the candidate before midnight allows the release to unlock on schedule, while a deployment started at midnight becomes available only after the build and rollout finish. No deployment scheduler or production change has been created by this staging step. Vultures source changes/assets and local secrets are excluded from the candidate.

## Owner launch authorization

The owner approved publishing the release immediately on October 14, ahead of the previously planned midnight unlock. Website availability was advanced to 23:26:52 Eastern; the distributor release date remains October 15. The owner also requested a matching release newsletter for October 15 at 10:00 AM Eastern.
