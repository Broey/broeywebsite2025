# Launch-ready Broey website pass

## Summary

This milestone brings the Broey. Website into a launch-ready local state for production deployment and domain QA.

## Completed

- Added guarded local asset sync for release, merch, latest release artwork, and latest release audio media.
- Cleaned the homepage into a focused artist landing experience centered on the current Broey release.
- Reworked `/music` as a structured release catalog with newest-first ordering, consistent metadata, verified cover paths, and honest pending states.
- Reworked `/merch` as a small branded storefront surface with consistent product cards, synced merch paths, Shopify/external checkout handling, and no fake product actions.
- Added centralized SEO/OG metadata helpers and canonical `https://broey.com` URL handling.
- Added a generated default social preview image route.
- Completed local launch QA for routes, links, assets, metadata, robots, sitemap, and generated OG image.

## Production QA Focus

- Verify `https://broey.com` loads and redirects correctly.
- Confirm canonical URLs, robots, sitemap, OG/Twitter metadata, and social preview images on the live domain.
- Confirm release art, merch art, logo, latest release artwork, and latest release audio load in production.
- Check `/`, `/music`, `/merch`, `/about`, and `/contact` on desktop and mobile.
- Fix only production-specific issues discovered after deploy.

## 2026-06-10 Launch Readiness Pass

- Public contact references should use `broey@broey.net`.
- `updates@broey.net` is reserved for the MailerLite newsletter sender identity.
- Newsletter submission forwarding is ready once `MAILERLITE_API_KEY` and `MAILERLITE_GROUP_ID` are set in production.
- Contact form notification forwarding is ready once `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, and Turnstile production keys are set in production.
- `/watch` is hidden from navigation and sitemap, and the route returns 404 until verified video content is ready.

## Release Data Audit

Checked `content/releases.ts` against local generated catalog and distributor inventory outputs.

- SEO title/description fields are present for the current public release entries.
- No archive release is missing every listening path; each visible archive entry has a link, embed, local audio, or listen action.
- 21 public entries have no exact `releaseDate` and rely on `year` sorting only.
- 7 public entries use placeholder dates ending in `-00-00`.
- `LiNK` and `FREE` have shorter descriptions than the rest of the release set.
- Credits are intentionally left untouched unless a verified source is available.
