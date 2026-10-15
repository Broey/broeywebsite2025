<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Release priority and streaming destinations

- The newest published release enabled for highlights is the current focus. Use `currentFocusRelease` in `content/release-focus.ts`; do not hard-code a song or retain an older song's `featured` flag as the focus source.
- At the scheduled release time, the new focus takes over the home highlight lead, exclusive gold treatment and “out now” pill, `/music` featured area, and release-page Current badge. Older releases remain playable in rotation/catalog but lose focus styling and badges.
- Drafts and unreleased scheduled tracks must not take over the released focus. An explicitly staged presave tile can lead the home carousel before launch.
- When preparing a release, configure its confirmed `releaseDate`, timed `availableAt` where applicable, public visibility, and `carouselEnabled: true` when it is ready for highlight rotation. Keep Vultures in draft until its launch is authorized.
- Give streaming services equal visual weight. Playlist CTAs ask listeners to add the track on their preferred service; do not highlight Spotify or assume a preferred DSP.
- See `docs/launch-readiness/RELEASE_POLICY.md` for the website's release and CTA policy.
