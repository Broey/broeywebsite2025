# Website release and playlist CTA policy

This document records the owner's standing release priorities. It governs content and presentation; the browser's install manifest is reserved for app identity and install metadata.

## Release focus

The newest published, non-project-track release enabled for highlights is the current focus. `currentFocusRelease` in `content/release-focus.ts` resolves this at request time using release dates and scheduled availability. A stale `featured` flag cannot keep an older song in focus.

Only the current focus receives gold home-card styling, its “out now” pill, the `/music` featured slot, and the Current badge on its track page. When a newer release launches, it takes over those placements. Prior releases remain playable and discoverable in highlight rotation, catalog, and recommendations without retaining the focus treatment. An explicitly staged presave tile may lead the home carousel before release; it does not become the published focus early. Owner update October 26, 2026: feature Vultures with its direct streaming links; home tile priorities now place Vultures first and OnlyU second. Focus styling and badges continue to follow `currentFocusRelease`.

For a new release, verify its date, set `availableAt` for an exact timed launch, finish approved assets and links, and enable public visibility and `carouselEnabled` when authorized. Keep drafts excluded until launch is authorized. The owner authorized Vultures publication and both pages' curated suggestions on October 25, 2026.

## Preferred streaming service

All DSP buttons use equal visual styling. No service receives a gold/primary CTA based on presumed listener preference. The playlist prompt says “Add OnlyU to your playlist” and “Choose your preferred streaming service”; each service is an equally styled outbound option. Retain platform attribution in analytics without interpreting clicks as confirmed playlist adds.

## Release verification

Check the release boundary, the home lead and badges, `/music` focus, the track-page Current badge, service-button parity, playback, recommendations, and popup behavior. Confirm the previous focus has lost its focus pill and gold styling. Verify production analytics after deployment.
