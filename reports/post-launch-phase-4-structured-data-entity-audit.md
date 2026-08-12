# Post-Launch Phase 4 Structured Data and Entity Audit

Date: August 12, 2026

Production baseline: `afe313bf94b449d80c12993467011c5c66adbd7d`

Implementation branch: `codex/phase-4-structured-data-entity-clarity`

## Executive summary

Phase 4 replaces disconnected page-level markup with a factual, reusable entity graph. Broey is now represented consistently as Joe Montaro, a `Person` with the stable identifier `https://broey.net/#artist`. The homepage identifies the official site with `https://broey.net/#website`. Every release has a stable `https://broey.net/music/{slug}#release` identifier and points back to the canonical artist where the release credit includes Broey.

The implementation adds no speculative facts, ratings, reviews, awards, events, offers, or site-search action. It does not assume that music schema earns a Google rich result. No `llms.txt` was added because the audit found no standards-based requirement for one.

The production-rendered audit covered 22 routes: `/`, `/about`, `/music`, all 15 indexable release pages, `/music/4u-vip`, `/press`, `/contact`, and `/merch`. Every route returned HTTP 200, every JSON-LD block parsed, and the audit found no invalid context, conflicting entity ID, null/empty property, `undefined`, or noncanonical Broey URL.

## Standards basis

The implementation follows:

- [Google's general structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): JSON-LD is recommended; markup must be visible, relevant, truthful, and specific.
- [Google's site-name guidance](https://developers.google.com/search/docs/appearance/site-names): one `WebSite` node belongs on the domain homepage, with a consistent name and optional alternate name.
- [Google's breadcrumb guidance](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): ordered `ListItem` nodes use `position`, `name`, and canonical item URLs.
- [Schema.org `Person`](https://schema.org/Person), [`MusicRecording`](https://schema.org/MusicRecording), [`MusicAlbum`](https://schema.org/MusicAlbum), [`byArtist`](https://schema.org/byArtist), [`isrcCode`](https://schema.org/isrcCode), and [`inAlbum`](https://schema.org/inAlbum).

Google's supported structured-data gallery does not include a dedicated music recording or album rich-result type. Music markup is therefore treated as semantic entity information, not a promised search enhancement.

## Initial structured-data inventory

| Route | Initial schema | Initial properties | Visible/factual | Initial linkage and issue |
| --- | --- | --- | --- | --- |
| `/` | None | None | N/A | No `WebSite` entity for site-name understanding. |
| `/about` | `Person` | `name`, `alternateName`, `url`, `description`, `jobTitle`, `image`, `homeLocation` | Values matched the page's artist identity and visible biography. | No `@id`, `sameAs`, site relationship, or explicit page relationship. |
| `/music` | None | None | N/A | Appropriate to leave as an unmarked catalog page in this phase. |
| All `/music/[slug]` routes | `MusicRecording` for singles/remixes; `MusicAlbum` otherwise, plus `BreadcrumbList` | `name`, anonymous `byArtist`, date/year, description, genre, image, URL; three breadcrumb items | Core facts came from controlled release data and were visible. | No entity `@id`, no `mainEntityOfPage`, no website relationship, and Broey was redefined on every page as an anonymous `MusicGroup`. Multi-track remix projects could be mistyped as recordings. |
| `/press` | None | None | N/A | No schema added; the phase did not have sufficiently structured visible article/page facts to justify extra markup. |
| `/contact` | None | None | N/A | No schema added; no unsupported organization/contact entity was invented. |
| `/merch` | None | None | N/A | No product schema added because the route's live Shopify data does not provide a stable, complete server-rendered product set for this phase. |

The initial breadcrumb hierarchy was already correct: Home (1), Music (2), release (3), with visible links matching the JSON-LD hierarchy. It was preserved and centralized.

## Problems found

1. Broey was a `Person` on `/about` but a fresh anonymous `MusicGroup` on every release page.
2. No entity used a stable `@id`, so artist, page, site, album, and track references could not join reliably.
3. The homepage had no `WebSite` node.
4. Release entities had no `mainEntityOfPage` relationship.
5. `fragments-remixes` is a multi-track project but the old type rule classified every `remix` as `MusicRecording`.
6. Controlled ISRC, duration, tracklist, local audio, external release links, collaboration, remixer, and parent-project facts were mostly unused.
7. JSON-LD construction and `<` escaping were repeated inline instead of sharing one safe serializer and model.

## Entity model adopted

- Artist: `https://broey.net/#artist`
- Website: `https://broey.net/#website`
- Release: `https://broey.net/music/{slug}#release`
- Canonical release page: `https://broey.net/music/{slug}`
- Album track with an existing child route: the child's release entity ID
- Album track without a child route: a stable child ID under the album entity

Release entities use `mainEntityOfPage` with a canonical `WebPage` node. The page node uses `isPartOf` to reference the official website. Known project-track pages use `inAlbum` to reference the parent release.

## Artist structured data

The canonical artist is a `Person`, not a `MusicGroup`:

- `name`: `Joe Montaro`
- `alternateName`: `Broey.`
- `url`: `https://broey.net/about`
- canonical portrait: `https://broey.net/assets/brand/broey-headshot-2025.jpg`
- factual description from approved site copy
- `homeLocation`: Scranton, Pennsylvania
- `jobTitle`: Electronic artist, Producer, Audio engineer
- `mainEntityOfPage`: `/about`

`jobTitle` is retained because these professional roles are stated repeatedly in visible biography copy and Schema.org explicitly supports the property. `knowsAbout` was omitted because it would add broad expertise assertions without improving identity clarity.

## Website structured data

The homepage now emits exactly one `WebSite` node:

- `@id`: `https://broey.net/#website`
- `url`: `https://broey.net/`
- `name`: `Broey.`
- `alternateName`: `Broey`
- existing factual site description
- `publisher`: reference to `https://broey.net/#artist`

No `SearchAction` was added because the site has no functional site search.

## Verified `sameAs` sources

The following profile URLs are centralized in `content/socials.ts`. They were verified from the site's visible footer/profile data or controlled release links and unambiguously use the Broey identity:

- TikTok: `https://tiktok.com/@broeybeats`
- Instagram: `https://instagram.com/broeybeats`
- X: `https://x.com/broeybeats`
- YouTube: `https://www.youtube.com/channel/UCiPFLFHcbBW0RE5oHBPAvAw`
- Apple Music: `https://music.apple.com/us/artist/broey/1444936978`
- Audius: `https://audius.co/broeybeats`
- Spotify: `https://open.spotify.com/artist/6HmeISbko4bc0zsZQvIAco`
- SoundCloud: `https://soundcloud.com/broeybeats`
- TIDAL: `https://tidal.com/browse/artist/10677705`
- Bandcamp: `https://broey.bandcamp.com/`

The Spotify identity URL was normalized by removing session/tracking query parameters. The site's SuperCollector artist link was not used as `sameAs`; it is a release/collector surface and was not needed for core identity disambiguation.

### Deferred identity links

- Discogs: no confirmed official Broey artist URL was found in controlled repository/site data.
- MusicBrainz: no confirmed official Broey artist URL was found in controlled repository/site data.

No URL was invented for either service.

## Release-property coverage

All 15 indexable releases now include `@context`, an appropriate main type, unique `@id`, canonical `url`, `mainEntityOfPage`, connected `byArtist`, description, and factual properties available in source data.

| Property | Indexable coverage | Rule |
| --- | ---: | --- |
| `datePublished` | 15/15 | Complete controlled date, otherwise controlled year only. |
| `image` | 15/15 | Only verified non-fallback local artwork, emitted as canonical HTTPS URL. |
| external `sameAs` | 15/15 | Controlled public streaming/video release URLs only. |
| `audio` | 11/15 | Only single/recording pages with a visible local player source. |
| `duration` | 11/15 | Converted from controlled `m:ss` or `mm:ss` data to ISO 8601. |
| top-level `isrcCode` | 5/15 | Only where the controlled generated track registry supplies an ISRC for the recording. |
| `numTracks` and `track` | 4/15 | Multi-track `MusicAlbum` pages: dancing dumpster fire (7), Fragments (6), Fragments Remixes (7), Contrast (3). |

Album track nodes use controlled titles, order, artists, durations, ISRCs, remixer/featured contributors, and `inAlbum` relationships when present. The implementation does not synthesize track facts that are absent from source data.

`blu` remains a `MusicRecording` because the site's approved visible model and tile type treat it as a single with two versions. `fragments-remixes` is now a `MusicAlbum` because controlled data identifies it as a seven-track collection.

## Collaboration and role decisions

- `I Can't Wait For Love`: Broey and Broken Blythe are both primary `byArtist` entities.
- `4u` and `4u vip`: Broey and notminimal. are both primary `byArtist` entities.
- `Warning`: Cryztal Grid and Broey are both primary `byArtist` entities.
- `After You`: Broey and Mr. Hilroy are both primary `byArtist` entities.
- Remix tracks: the source recording artist remains `byArtist`; a remixer is a `contributor`, not automatically a primary artist.
- Featured performers in controlled registry data are contributors unless controlled distribution data identifies them as primary artists.
- Broey always resolves to the canonical `Person` ID. Other stage-name entities use `MusicGroup` conservatively because the repository does not establish whether each name is a legal person identity or a group. No external `@id` is invented for collaborators.
- `producer` is emitted only where an explicit release credit or controlled registry credit names a producer. Joseph Montaro resolves to the canonical artist ID.

## Breadcrumb findings

Every release page retains the visible and structured hierarchy:

1. Home — `https://broey.net/`
2. Music — `https://broey.net/music`
3. Current release — canonical release URL

Positions are complete and sequential. Visible breadcrumb names and links match JSON-LD. Internal/noindex project-track policy is unchanged; `/music/4u-vip` remains `noindex, nofollow` while its breadcrumb and `inAlbum` relationship remain semantically correct.

## Route-by-route final inventory

| Route group | Final schema |
| --- | --- |
| `/` | One `WebSite` |
| `/about` | One canonical `Person` |
| `/music` | None |
| `/music/stereo-luv`, `/free`, `/i-cant-wait-for-love`, `/4u`, `/mean-something`, `/blu`, `/like-that`, `/hold-on`, `/warning`, `/hysteria`, `/after-you` | `MusicRecording` plus `BreadcrumbList` |
| `/music/dancing-dumpster-fire`, `/fragments-ep`, `/fragments-remixes`, `/contrast` | `MusicAlbum` plus `BreadcrumbList`, with controlled child recordings |
| `/music/4u-vip` representative internal track | `MusicRecording` plus `BreadcrumbList`; `inAlbum` parent reference; `noindex, nofollow` preserved |
| `/press`, `/contact`, `/merch` | None |

## Tests added

`tests/structured-data.test.mjs` adds regression checks for:

- one stable Broey/Joe `Person` ID and no Broey `MusicGroup` redefinition;
- one stable homepage `WebSite` ID and no unsupported `SearchAction`;
- all 15 indexable releases: type, unique ID, canonical URL, page/site linkage, artist link, factual date/image, clean serialization;
- controlled ISRC provenance;
- representative single, project, remix project, collaboration, producer, audio, and internal project-track relationships;
- remixer contributor handling;
- breadcrumb positions, names, and canonical URLs.

The suite now has 25 passing tests (19 pre-existing and 6 Phase 4 structured-data tests).

## Production-rendered validation

The generated machine-readable artifact is `reports/phase-4-structured-data-rendered-audit.json`.

- Routes audited: 22
- Indexable releases audited: 15
- HTTP 200: 22/22
- JSON parse failures: 0
- Invalid `@context`: 0
- Conflicting duplicate IDs: 0
- `undefined`, null, or empty meaningful values: 0
- Noncanonical internal URLs: 0
- Missing release/breadcrumb blocks: 0
- `/music/4u-vip` robots: `noindex, nofollow`

## External validation

### Schema.org Validator

Rendered code snippets were submitted to the official Schema.org Validator:

- Homepage `WebSite`: 0 errors, 0 warnings.
- About `Person`: 0 errors, 0 warnings; Person and connected CreativeWork detected.
- Representative `MusicAlbum` plus `BreadcrumbList` (`dancing-dumpster-fire`): 0 errors, 0 warnings; MusicAlbum, BreadcrumbList, and connected CreativeWork detected.

### Google Rich Results Test

The same representative album page markup was tested by code input:

- One valid Breadcrumb item detected.
- Eligible breadcrumb result: valid.
- No music enhancement detected, as expected: Google does not support `MusicAlbum` or `MusicRecording` as a dedicated rich-result feature.
- `WebSite` site-name markup is not supported by the Rich Results Test; Google's site-name documentation directs publishers to a schema validator and post-deployment URL inspection instead.

URL-based Rich Results Test, Schema.org validation, and Search Console URL Inspection must be repeated against the deployed branch after approval. This phase did not deploy.

## AI/machine readability assessment

The page graph now gives machine consumers consistent answers to the core identity questions:

- Broey is consistently the alternate/stage name of Joe Montaro's canonical `Person` entity.
- The official site has its own stable `WebSite` ID and references the artist.
- Release pages have stable entity IDs distinct from canonical page URLs.
- Broey release credits point to the same artist ID instead of creating anonymous competing groups.
- Collaborators and remixers remain factually distinct.
- Albums connect known child recordings with order, identifiers, and `inAlbum` relationships.
- Official external identity profiles are centralized and explicit.

This improves general semantic readability without claiming adoption by any specific AI system.

## Scope explicitly not changed

- Canonical URL logic
- Sitemap policy or the 22-URL sitemap
- Robots policy
- IndexNow implementation
- URL structure
- Publication/indexing policy
- Phase 3 metadata titles/descriptions
- Bing image-alt reconciliation
- Release facts
- DigitalOcean, DNS, deployment, or external search-engine configuration
- Application visual design
- No `llms.txt` added

The only visible-link data normalization is removal of tracking parameters from the official Spotify artist profile URL; the destination identity is unchanged.

## Validation commands and results

- `npm ci` — passed; 403 packages installed. npm reported one existing high-severity dependency advisory for later dependency review.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm test` — passed, 25/25.
- `SITE_VISIBILITY=public npm run build` — passed, 54 static pages generated.
- `npm run audit:structured-data -- http://127.0.0.1:3347` — passed, 22/22 routes, 0 errors.
- Rendered sitemap — 22 URLs, unchanged.
- `/music/4u-vip` — `noindex, nofollow`, unchanged.
- `git diff --check` — required immediately before commit.

## Deployment verification requirements

After review and an authorized deployment:

1. Confirm the public homepage contains one `WebSite` node with `https://broey.net/#website`.
2. Confirm `/about` contains the canonical Person node and crawlable portrait.
3. Run the Schema.org Validator by public URL for `/`, `/about`, a single, a collaboration, an album, a remix project, and `/music/4u-vip`.
4. Run Google's Rich Results Test by public URL for a representative release breadcrumb.
5. Use Search Console URL Inspection for the homepage and representative release pages.
6. Reconfirm the 22 sitemap URLs, public robots policy, canonical tags, and `/music/4u-vip` noindex policy.
7. Monitor Search Console structured-data reports for new breadcrumb errors after recrawl.

## Deferred questions

- Add Discogs or MusicBrainz only after an official artist entity URL is confirmed.
- Revisit collaborator entity types only if controlled official profile/person-vs-group data is added.
- Address the npm dependency advisory in a dedicated dependency-maintenance change, not this semantic-markup phase.

## Final Phase 4 pre-production assessment

Ready for pull-request review and pre-production verification. The entity model is internally consistent, factual, safely serialized, standards-valid, regression-covered, and rendered successfully. No merge, push, deploy, or external configuration change was performed.

## Recommended pull request

Title: `Phase 4: unify structured data and artist entity graph`

Description:

> Adds a canonical Joe Montaro/Broey Person entity, homepage WebSite markup, stable release IDs, connected artist/page/site relationships, controlled album tracks/ISRC/audio data, collaboration-aware credits, centralized sameAs profiles, safe shared JSON-LD serialization, regression tests, and a production-rendered audit. Preserves Phase 3 canonical, sitemap, robots, metadata, IndexNow, noindex, and image-alt behavior. External validation: Schema.org 0 errors/0 warnings; Google detects one valid representative breadcrumb. No deployment or external configuration changes.
