# Broey. Website Copy Rewrite Notes

Date: 2026-06-26

Source: `docs/copy-audit.md`

Scope: controlled public-facing copy pass. No layout, styling, navigation behavior, audio behavior, platform links, or product data were intentionally changed.

## Summary Of Changes

- Rewrote homepage/catalog/newsletter copy toward concrete production language: house pulse, UKG swing, breakbeat edges, first links, drop notes, and odd scraps.
- Reworked the Music page intro, selected catalog note, transition section, and foundations copy to reduce abstract "current era" framing.
- Replaced the generic release-detail hero eyebrow with data-driven labels such as Single, EP, Remix, or Track.
- Shortened the top release-detail back CTA from "Back to Selected Releases" to "All Music" to reduce repeated copy weight.
- Rewrote Tier 1 release card/hero/about copy for FREE, LiNK, blu., STEREO LUV, and dancing dumpster fire.
- Updated About page hero summary, bio, highlights, timeline, and final CTA while keeping "A Real Sound Guy."
- Lightly tightened Press, Merch, Contact, footer signup, global SEO/meta, and legacy section copy.
- Replaced public-facing "Shopify store" labels with "Official store" where the wording was editorial rather than technical.
- Separated email list language from Discord/community language: email now uses list/drop-notes framing; Discord keeps "Join the Community."
- Rewrote Tier 2 release card/hero/about copy for Fragments, Fragments (Remixes), 4u, I Can't Wait For Love, Mean Something, Like That, Hold On, Warning, and hysteria.
- Rewrote Tier 3/archive and child-track copy for dancing dumpster fire tracks, Fragments tracks, Fragments (Remixes) track pages, After You, Paradise, and GLFM.
- Removed authored track-description blocks from Fragments (Remixes) child remix pages; those direct-access remix pages now skip the release-description/about copy surface.
- Added a conservative Contrast project page to the Music discography/transition section without adding it to the homepage carousel.

## Implementation Decisions

- `content/releases.ts` now preserves manual `description` and manual `seoDescription` when a release has authored `about` copy. This lets Tier 1 hand-authored copy render instead of being overwritten by generated registry `shortDescription` values.
- Generated registry details, links, tags, dates, tracklists, and audio still merge as before.
- Manual `about` copy continues to take precedence over generated `pageDescription`.
- `lo-fi` is used in edited public prose. Existing external source titles and URLs that contain `lofi` were left unchanged.
- `Broey` is used in normal prose. `Broey.` remains where it is a brand/title/artist-name moment.
- Watch remains a minimal placeholder because there is no verified featured video embed in the current content.

## Release Facts Kept Conservative

- FREE: copy names only confirmed broad traits from the existing site/audit: house-leaning, concise, direct club pulse, stripped-down/tighter arrangement.
- LiNK: copy treats the page as a preview/manual listen with a local radio edit and pending public platform links.
- blu.: copy stays format-led because fuller artist narrative is not confirmed; it names the radio edit, extended mix, deep-house shape, and longer club-facing groove.
- STEREO LUV: copy uses existing confirmed registry/audit facts around home-studio calibration, dusty 90s deep-house feel, drum machines, bass sequencing, samplers, and stereo field.
- dancing dumpster fire: copy keeps the known EP framing: rough club sketches, UKG, bassline, trance, speed-house, and intentionally unsanded edges.
- Fragments: copy frames the EP as a turning point from lo-fi roots into house pulse, processed vocals, sax, breakbeats, and warmer bass movement.
- Fragments (Remixes): copy stays companion-release focused and names broad remix directions without inventing unverified remixer-specific stories.
- 4u: copy names the notminimal. collaboration, deeper dance pulse, low-end weight, melodic pull, and credited Dreameater artwork.
- I Can't Wait For Love: copy names Broken Blythe and frames the single as vocal-led/song-shaped without overexplaining the collaboration.
- Mean Something: copy keeps the story reflective and production-led: melody, negative space, and emotional weight.
- Like That, Hold On, Warning, and hysteria: copy positions these as transition/Fragments-era context without overclaiming unverified artist narratives.
- Tier 3 child-track pages: copy is intentionally short, specific, and direct-access friendly. It avoids turning hidden child routes into oversized release essays.
- Remix child-track pages are the exception: they do not need track descriptions and should stay lean.
- GLFM: copy stays minimal and catalog-entry focused because its exact public role still needs artist confirmation.
- After You and Paradise: copy frames them as older archive entries rather than part of the current club-facing run.
- Contrast: copy uses confirmed catalog facts only: August 4, 2023, three tracks, Falling, and two Almost Anyone remixes.

## Needs Artist Input

- What FREE should be known for more specifically: vocal chop, sample source, synth behavior, house/deep-house/UKG lane, or club-tool intent.
- Whether LiNK is a teaser, pre-release, private/manual listen, or public release waiting on DSP verification.
- The fuller artist-approved story for blu. beyond radio/extended versions and deep-house framing.
- Whether Watch should stay hidden until real embeds exist, or become a public video hub.
- GLFM's intended public role: EP, track from dancing dumpster fire, or standalone catalog item.
- Whether any Tier 2 pages should carry more specific artist stories beyond the conservative production-led framing now in place.
- Whether child track pages should remain sitemap-visible now that they have minimal authored copy, or be hidden/noindexed anyway.

## Remaining Later Passes

- External press titles/URLs were not normalized, including the EDM Reviewer title using `lofi`.
