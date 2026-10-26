# Vultures release preparation — October 25, 2026

The page is prepared at `/music/vultures` using the shared release template. The owner authorized public launch and manual DigitalOcean deployment on October 25, 2026. The release is now configured as public.

## Assets and metadata

- `public/assets/cover-art/vultures.png` is 2400 × 2400 and visually matches the distributor screenshot. The differently designed `Downloads/vultures artwork final.png` was not substituted.
- `assets/releases/vultures.mp3` is the existing 256 kbps website MP3. Its decoded audio matches the newly supplied `Downloads/suncrn, Broey. - vultures (1).mp3` exactly. The smaller website file omits the supplied file's large embedded PNG; it does not re-encode the recording. Duration is approximately 3:28.
- Audio is served through `/api/release-audio/vultures`, which checks publication before returning bytes and supports GET, HEAD, and byte ranges. The old `/audio/vultures.mp3` path no longer contains the file. The production tracing configuration includes the server-side asset. No new environment secret is required.
- Distributor screenshots supply both primary artists, composers, production roles, UPC `708208997091`, ISRC `QZWDD2674390`, catalogue number `CAT2341160`, and the 2026 Broey. copyright lines. The page includes these credits and catalog details.
- Owner-approved credit presentation uses one Artist row, one Composer row with both composers, one Producer row with Broey. and sunscrn, and Lead vocals for sunscrn. The synthesizer programming row is omitted. Original distributor roles remain preserved in the source evidence JSON.
- `sunscrn` is the distributor's artist spelling and is used on the page. The MP3's embedded artist tag spells it `suncrn`; the filename was not treated as the authoritative artist credit.
- The supplied lyrics, language, non-explicit status, recording country/year, and other source facts are retained in `data/source/vultures-release-2026-10-25.json`. The local workbook and generated registry have no Vultures entry; the authored release data is its current website source.

## Publication configuration

- Distributor overview https://www.symphonicms.com/release/overview/3416032 confirms October 26, 2026 as the general release date (verified October 25).
- Public website playback is authorized immediately; no availability timer or preview flag is configured.
- Verified streaming destinations have not been supplied. The page uses its local audio player without placeholder service links.
- Home carousel order follows the owner's explicit priorities: OnlyU first, Vultures second. Current-release badges and the music-page feature continue to use the date-based shared focus resolver.
- OnlyU suggestions: Free, Vultures, Fragments EP. Vultures suggestions: Free, OnlyU, Fragments EP.
- DigitalOcean production tracks main with autodeploy off; retain those settings. Previous healthy production commit: 73d75e7.

## Verification

- All 53 existing tests passed; ESLint and the production build passed, including TypeScript.
- Production-mode local checks with public site visibility confirmed draft page/audio/direct-audio 404 responses and exclusion from home, `/music`, and sitemap. The slug can occur in a 404 request payload without publishing the release data.
- A temporary local public preview at a simulated October 26, 04:00 UTC verified the shared page at widths 1440, 390, and 320: HTTP 200, visible credits, no horizontal overflow, actual browser playback, and HTTP 206 byte-range responses. Source was restored to draft afterward; no preview override remains.
- Screenshots: `reports/vultures-track-1440.png`, `reports/vultures-track-390.png`, `reports/vultures-track-320.png`, `reports/vultures-home-1440.png`, and `reports/vultures-music-1440.png`.
- Machine-readable checks: `reports/vultures-preview-validation.json` and `reports/vultures-draft-verification.json`.

After the approved production deployment, verify the page, full playback and seeking, home order and current-release badges, metadata/share image, streaming links, sitemap, and production playback/outbound analytics. No production analytics events were generated during local testing.
