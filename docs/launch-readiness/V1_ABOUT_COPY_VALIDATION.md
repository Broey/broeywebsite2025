# V1 About Page Copy Validation

## Branch and source
- Branch: `codex/refine-about-copy`
- Starting commit: `afb94f6` (origin/main)
- Ending commit: `fb56e5d`

## Commit list
1. `1f03092` — `Refine About page copy`
2. `fb56e5d` — `Document About copy validation`

## Files changed
- `app/about/page.tsx`
- `docs/launch-readiness/V1_ABOUT_COPY_VALIDATION.md`

## Final hero copy
- Headline: `A Real Sound Guy.`
- Subheading: `Lo-fi roots. Club instincts. Electronic music from Scranton, Pennsylvania.`
- Body paragraph:
  `Broey is the electronic project of Joe Montaro, a Scranton, Pennsylvania artist, producer, audio engineer, and self-taught multi-instrumentalist. His work moves between live instrumentation, sampling, synthesis, sequencing, and hands-on production.`
- Closing sentence:
  `Sound in the technical sense, and sound in the human one.`

## Final six highlight cards
1. `15+ years behind the sound`
   - `Producing, engineering, mixing, and building a catalog across lo-fi, house, garage, jungle, drum and bass, and left-field electronic music.`
2. `Hands-on production`
   - `Broey builds records through live instrumentation, sampling, synthesis, sequencing, engineering, and detailed production.`
3. `Digital releases and physical records`
   - `The catalog spans streaming platforms, independent releases, and physical editions, including vinyl from Broey's earlier lo-fi work.`
4. `Independent by design`
   - `Releases have moved between self-released projects and selective label partnerships without locking Broey into one sound or scene.`
5. `Press and editorial recognition`
   - `Broey's music has received editorial support and coverage from outlets including We Rave You, Insight Music, and LOUDNESS.`
6. `Self-directed production`
   - `Broey remains self-directed from production and engineering through mixing, release planning, and presentation.`

## Sax-reference audit
### General artist-biography or About-page copy
- `app/about/page.tsx` (line 96): `Projects like Fragments opened the catalog into house, processed vocals, sax lines, and breakbeats.`
  - Classification: release-history context (fragment-era catalog summary).
  - Action: preserved (sax reference is release-related, not general biography of current practice).
- `app/page.tsx` (line 10): `... with releases across lo-fi, house, UK garage, jungle, drum and bass, sax, and guitar.`
  - Classification: general artist-biography copy.
  - Action: preserved (outside scoped About-page copy request).
- `components/sections/AboutPreview.tsx` (line 13): `...sax, guitar...`
  - Classification: general artist-biography copy.
  - Action: preserved (outside scoped About-page copy request).
- `content/site.ts` (line 72): `...sax, and guitar.`
  - Classification: general artist-biography copy.
  - Action: preserved (shared site content outside requested About-page scope).

### Release-specific credits / factual track content
- `app/about/page.tsx` (line 96): Fragments summary includes `sax lines`.
- `content/releases.ts` (1169, 1170, 1177, 1179): Fragments release description mentions sax.
- `content/press.ts` (186): press quotation mentions saxophone.
- `docs/copy-rewrite-notes.md`, `docs/copy-audit.md`, `reports/browser-mobile-qa-data-2026-06-15.json`: historical notes/QA copies and archival snapshots with sax references.
  - Classification: historical/archival documentation.
  - Action: preserved.

## Metadata checks
- About page metadata (`app/about/page.tsx`) does not include sax, guitar, or a narrow instrument list.
- JSON-LD `Person` fields remain accurate and unchanged.
- No lockfile or dependency changes.

## Validation commands and results
- `npm ls --depth=0` — success
- `npx eslint .` — success
- `npx tsc --noEmit --incremental false` — success
- `NEXT_PUBLIC_SITE_URL=https://broey.net npm run build`
  - In PowerShell, executed as: `$env:NEXT_PUBLIC_SITE_URL='https://broey.net'; npm run build` — success
- `git diff --check` — clean (no whitespace/trailing issues)
- Targeted browser validation for `/about` was not executed due environment execution policy blocking background start-process checks.

## Additional continuity edits
- No additional copy lines outside approved Hero paragraph and six highlight cards were modified.
- No metadata/social-image or lockfile edits were made.

## Remaining owner decisions
- Whether to extend the same sax-removal cleanup to `app/page.tsx`, `content/site.ts`, and `components/sections/AboutPreview.tsx` for global consistency.

## Deployment instructions
- Branch is committed and ready for review.
- Do not merge or deploy from this environment until owner approval.
- Push and open PR using normal repo flow when approved:
  1. `git push -u origin codex/refine-about-copy`
  2. open/update PR from `codex/refine-about-copy` to `main`
