# TIDAL Current-Release Reconciliation

Date: 2026-06-12

## Executive Summary

Mode: report only. Existing TIDAL dry-run output from `scripts/catalog-sync-report.json` was used. No write or merge command was run, and `content/releases.ts` was not modified.

TIDAL dry-run executed: Yes. Credentials available: Yes. Catalog entries found: 58 normalized entries, including 31 collections and 52 tracks. Existing-site matches reported by the dry run: 34. Ambiguous matches: 0.

LiNK remains pending/manual and is intentionally excluded from current-release alignment.

## Scoped Release Results

| Slug | Site title | Current TIDAL link | Catalog source URL | TIDAL match | TIDAL artist | TIDAL date | TIDAL ID | Confidence | Link status | Proposed status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| free | FREE | None | https://tidal.com/browse/album/514645954 | FREE (https://tidal.com/browse/album/514645954) | Broey. | 2026-05-07 | 514645954 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| blu | blu. | None | https://tidal.com/browse/album/489787750 | blu. (https://tidal.com/browse/album/489787750) | Broey. | 2025-09-12 | 489787750 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| stereo-luv | STEREO LUV | None | https://tidal.com/browse/album/458541065 | STEREO LUV (https://tidal.com/browse/album/458541065) | Broey. | 2025-10-03 | 458541065 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| dancing-dumpster-fire | dancing dumpster fire | None | https://tidal.com/browse/album/441546103 | dancing dumpster fire (https://tidal.com/browse/album/441546103) | Broey. | 2025-08-02 | 441546103 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| i-cant-wait-for-love | I Can't Wait For Love | None | None | I Can't Wait For Love (https://tidal.com/browse/album/427566340) | Broey. & Broken Blythe | 2025-05-02 | 427566340 | High | TIDAL link missing but high-confidence match found | Safe candidate for future TIDAL link add |
| mean-something | Mean Something | None | https://tidal.com/browse/album/391217958 | Mean Something (https://tidal.com/browse/album/391217958) | Broey. | 2024-11-01 | 391217958 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| 4u | 4u | None | https://tidal.com/browse/album/369907613 | 4u (https://tidal.com/browse/album/369907613) | Broey. & notminimal. | 2024-07-19 | 369907613 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| fragments-ep | Fragments | None | https://tidal.com/browse/album/344095853 | Fragments (https://tidal.com/browse/album/344095853) | Broey. | 2024-03-29 | 344095853 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| fragments-remixes | Fragments (Remixes) | None | https://tidal.com/browse/album/359004950 | Fragments (Remixes) (https://tidal.com/browse/album/359004950) | Broey. | 2024-05-10 | 359004950 | High | TIDAL fallback present but should be reviewed | Already present / no action needed |
| warning | Warning | https://tidal.com/browse/album/279433677 | https://tidal.com/browse/album/279433677 | Warning (https://tidal.com/browse/album/279433677) | Cryztal Grid & Broey. | 2023-03-10 | 279433677 | High | TIDAL link already correct | Already present / no action needed |
| hold-on | Hold On | https://tidal.com/browse/album/291346877 | https://tidal.com/browse/album/291346877 | Hold On (https://tidal.com/browse/album/291346877) | Broey. | 2023-05-08 | 291346877 | High | TIDAL link already correct | Already present / no action needed |
| hysteria | hysteria | https://tidal.com/browse/album/210567515 | https://tidal.com/browse/album/210567515 | hysteria (https://tidal.com/browse/album/210567515) | Broey. | 2022-01-13 | 210567515 | High | TIDAL link already correct | Already present / no action needed |
| after-you | After You | https://tidal.com/browse/album/340981922 | https://tidal.com/browse/album/340981922 | After You (https://tidal.com/browse/album/340981922) | Broey. & Mr. Hilroy | 2020-11-30 | 340981922 | High | TIDAL link already correct | Already present / no action needed |
| like-that | Like That | https://tidal.com/browse/album/344685076 | https://tidal.com/browse/album/344685076 | Like That (https://tidal.com/browse/album/344685076) | Broey. | 2024-03-15 | 344685076 | High | TIDAL link already correct | Already present / no action needed |
| paradise | Paradise | https://tidal.com/browse/album/314502943 | https://tidal.com/browse/album/314502943 | Paradise (https://tidal.com/browse/album/314502943) | Broey. | 2019-03-23 | 314502943 | High | TIDAL link already correct | Already present / no action needed |

## High-Confidence Matches

| Slug | TIDAL title | TIDAL URL | Reasons |
| --- | --- | --- | --- |
| free | FREE | https://tidal.com/browse/album/514645954 | slug, title, date, year |
| blu | blu. | https://tidal.com/browse/album/489787750 | slug, title, year |
| stereo-luv | STEREO LUV | https://tidal.com/browse/album/458541065 | slug, title, year |
| dancing-dumpster-fire | dancing dumpster fire | https://tidal.com/browse/album/441546103 | slug, title, year |
| i-cant-wait-for-love | I Can't Wait For Love | https://tidal.com/browse/album/427566340 | title |
| mean-something | Mean Something | https://tidal.com/browse/album/391217958 | slug, title |
| 4u | 4u | https://tidal.com/browse/album/369907613 | slug, title, year |
| fragments-ep | Fragments | https://tidal.com/browse/album/344095853 | title, year |
| fragments-remixes | Fragments (Remixes) | https://tidal.com/browse/album/359004950 | slug, title, year |
| warning | Warning | https://tidal.com/browse/album/279433677 | slug, title, date, year |
| hold-on | Hold On | https://tidal.com/browse/album/291346877 | slug, title, date, year |
| hysteria | hysteria | https://tidal.com/browse/album/210567515 | slug, title, date, year |
| after-you | After You | https://tidal.com/browse/album/340981922 | slug, title, date, year |
| like-that | Like That | https://tidal.com/browse/album/344685076 | slug, title, date, year |
| paradise | Paradise | https://tidal.com/browse/album/314502943 | slug, title, date, year |

## Missing Or Mismatched TIDAL Links

| Slug | Status | TIDAL URL | Notes |
| --- | --- | --- | --- |
| i-cant-wait-for-love | TIDAL link missing but high-confidence match found | https://tidal.com/browse/album/427566340 | Safe candidate for future TIDAL link add only after manual approval. |

## Fallbacks To Review

| Slug | Fallback URL | TIDAL match | Notes |
| --- | --- | --- | --- |
| free | https://tidal.com/browse/album/514645954 | https://tidal.com/browse/album/514645954 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. |
| blu | https://tidal.com/browse/album/489787750 | https://tidal.com/browse/album/489787750 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-09-12; do not overwrite dates in this phase. |
| stereo-luv | https://tidal.com/browse/album/458541065 | https://tidal.com/browse/album/458541065 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-10-03; do not overwrite dates in this phase. |
| dancing-dumpster-fire | https://tidal.com/browse/album/441546103 | https://tidal.com/browse/album/441546103 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-08-02; do not overwrite dates in this phase. |
| mean-something | https://tidal.com/browse/album/391217958 | https://tidal.com/browse/album/391217958 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2024-11-01; do not overwrite dates in this phase. |
| 4u | https://tidal.com/browse/album/369907613 | https://tidal.com/browse/album/369907613 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-07-19; do not overwrite dates in this phase. |
| fragments-ep | https://tidal.com/browse/album/344095853 | https://tidal.com/browse/album/344095853 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-03-29; do not overwrite dates in this phase. |
| fragments-remixes | https://tidal.com/browse/album/359004950 | https://tidal.com/browse/album/359004950 | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-05-10; do not overwrite dates in this phase. |

## Known Concerns

- LiNK remains pending/manual.
- FREE exists on TIDAL as https://tidal.com/browse/album/514645954; current site uses a TIDAL catalog fallback.
- blu. exists on TIDAL as https://tidal.com/browse/album/489787750; current site uses a TIDAL catalog fallback and TIDAL reports a 2-track EP shape.
- STEREO LUV exists on TIDAL as https://tidal.com/browse/album/458541065; current site uses a TIDAL catalog fallback.
- dancing dumpster fire exists on TIDAL as https://tidal.com/browse/album/441546103; dry-run matched the current release page and the fallback URL agrees with the catalog match.
- Current fallback links that match dry-run output are report-only confirmations, not approval to change release data.
- Possible duplicates/unrelated catalog items from the dry run remain outside the scoped current-release list unless manually approved.

## Project-Track TIDAL Check

Project-track pages with TIDAL data were found; review whether these should render platform links or remain parent-project only.

| Slug | Parent | Direct TIDAL links | Catalog fallback |
| --- | --- | --- | --- |
| glfm | dancing-dumpster-fire | https://tidal.com/browse/track/441546108 | https://tidal.com/browse/track/441546108 |

## Recommended Future Safe Apply List

| Slug | Recommendation |
| --- | --- |
| free | Already present / no action needed |
| blu | Already present / no action needed |
| stereo-luv | Already present / no action needed |
| dancing-dumpster-fire | Already present / no action needed |
| i-cant-wait-for-love | Safe candidate for future TIDAL link add |
| mean-something | Already present / no action needed |
| 4u | Already present / no action needed |
| fragments-ep | Already present / no action needed |
| fragments-remixes | Already present / no action needed |
| warning | Already present / no action needed |
| hold-on | Already present / no action needed |
| hysteria | Already present / no action needed |
| after-you | Already present / no action needed |
| like-that | Already present / no action needed |
| paradise | Already present / no action needed |

## Manual Review Items

| Slug | Reason |
| --- | --- |
| free | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. |
| blu | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-09-12; do not overwrite dates in this phase. |
| stereo-luv | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-10-03; do not overwrite dates in this phase. |
| dancing-dumpster-fire | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2025-08-02; do not overwrite dates in this phase. |
| mean-something | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2025-00-00 differs from TIDAL 2024-11-01; do not overwrite dates in this phase. |
| 4u | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-07-19; do not overwrite dates in this phase. |
| fragments-ep | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-03-29; do not overwrite dates in this phase. |
| fragments-remixes | TIDAL currently renders through catalogSource fallback, not a direct release.links entry. Site releaseDate 2024-00-00 differs from TIDAL 2024-05-10; do not overwrite dates in this phase. |

## Unrelated Or Not-In-Scope TIDAL Results

The dry run reported 24 possible new catalog entries. They were not added and should remain research/review-only unless separately approved.

## No Apply Confirmation

No release links, dates, credits, legal metadata, UPC, ISRC, BPM, key, visibility, indexing, sitemap, SEO metadata, DNS, broey.net, Vercel settings, private gate, or public launch state were changed. Write and merge commands were not run.
