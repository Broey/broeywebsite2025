# Broey. Website

Broey. Website is the branded presentation layer and SEO/content hub for Broey.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- App Router

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run indexnow -- --dry-run /music/new-release
npm run sync:assets:dry
npm run sync:assets:go
npm run sync:latest-release-media:dry
npm run sync:latest-release-media
```

## Environment

```text
NEXT_PUBLIC_SITE_URL=https://broey.net
SITE_VISIBILITY=public
SITE_PASSCODE=
INDEXNOW_KEY=
NEXT_PUBLIC_UMAMI_SCRIPT_URL=
NEXT_PUBLIC_UMAMI_WEBSITE_ID=
SHOPIFY_STORE_DOMAIN=
SHOPIFY_MERCH_COLLECTION_HANDLE=broey-site-merch
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
MAILERLITE_API_KEY=
MAILERLITE_GROUP_ID=
MAILERLITE_SENDER_NAME=Broey.
MAILERLITE_SENDER_EMAIL=updates@broey.net
MAILERLITE_REPLY_TO_EMAIL=broey@broey.net
RESEND_API_KEY=
RESEND_FROM_EMAIL=
RESEND_FROM_NAME=Broey Website
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

`NEXT_PUBLIC_SITE_URL` supplies the deployment origin configuration used by metadata, sitemap URLs, JSON-LD, and share links. Production and preview builds require an explicit valid HTTPS origin, then normalize generated public URLs to the canonical `https://broey.net`; this prevents Vercel preview domains from leaking into indexable URLs. Credentials, query strings, fragments, and non-root paths are rejected. A trailing slash is normalized away. Local development may omit the variable and use `http://localhost:3000`, or explicitly use HTTP with `localhost` or `127.0.0.1`.

`SITE_VISIBILITY` accepts only `public` or `private` outside local development. `public` allows normal indexing. `private` requires `SITE_PASSCODE` and enables the preview gate, noindex metadata, robots disallow, and an empty sitemap. Local development defaults to `public` when the variable is absent.

### IndexNow operations

`INDEXNOW_KEY` is a server-only runtime value used for the public `/{key}.txt` ownership response and controlled operator submissions. It must be 8-128 letters, numbers, or hyphens. Store the production value in DigitalOcean App Platform, never in Git and never in a `NEXT_PUBLIC_` variable.

Review and submit only URLs changed by a release:

```bash
npm run indexnow -- --dry-run /music/new-release
npm run indexnow -- --yes /music/new-release /music
```

The command accepts only canonical `https://broey.net` URLs or application paths, deduplicates them, and requires `--yes` to send. It does not read the sitemap or run during builds/startup. HTTP 200 means the request was received, not that indexing is guaranteed. See `reports/post-launch-phase-2-indexnow-implementation.md` for deployment and response handling.

Umami analytics is optional and requires both `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID`. The root layout loads the tracker once, after hydration, only for a public production build. Development, private preview builds, and builds missing either value do not load analytics. The tracker is restricted to `broey.net`; custom events safely become no-ops if the script is absent or blocked. These two `NEXT_PUBLIC_` values are intentionally browser-visible configuration, not secrets. The approved production values are documented in `docs/launch-readiness/V1_UMAMI_ANALYTICS_VALIDATION.md`.

Do not add manual pageview calls. Umami automatically records initial page loads and client-side App Router navigation. Standard UTM parameters remain in normal URLs and are reported by Umami without application redirects or rewriting.

The canonical production host is `https://broey.net`. The `www.broey.net` to `broey.net` redirect belongs in Vercel and DNS configuration, not in application routing.

Shopify merch runtime uses `SHOPIFY_STORE_DOMAIN`, optional `SHOPIFY_MERCH_COLLECTION_HANDLE`, and optional `SHOPIFY_STOREFRONT_ACCESS_TOKEN`. If Shopify is unavailable or returns no products, the merch page falls back to curated local product links.

Resend/contact delivery requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; `RESEND_FROM_NAME` is optional. MailerLite/newsletter delivery requires `MAILERLITE_API_KEY` and `MAILERLITE_GROUP_ID`; sender/reply-to values document the intended email identity. Turnstile uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the widget and the server-only `TURNSTILE_SECRET_KEY` for verification. Never commit real secret values.

### Example environment (copy to `.env.local`)

Create `.env.local` from `.env.local.example`:

```bash
cp .env.local.example .env.local
```

### Launch Email Setup

Public contact mail should point to `broey@broey.net`.

MailerLite sender identity should be `Broey. <updates@broey.net>`. Reply-to/contact identity should be `broey@broey.net`.

To enable newsletter signups in production, generate a MailerLite API token, create or choose the target group, then set `MAILERLITE_API_KEY` and `MAILERLITE_GROUP_ID`. The newsletter API uses MailerLite's subscriber upsert endpoint and adds visitors to that group. If either required env var is missing, newsletter submissions return a friendly paused-state fallback instead of attempting provider delivery.

To enable contact form email notifications in production, create a Resend API key and verify the sending domain/address, then set `RESEND_API_KEY` and `RESEND_FROM_EMAIL`. The contact API sends notifications to `broey@broey.net` and uses the visitor email as `reply_to`, not as the sender address. If either required Resend env var is missing, contact submissions return a friendly fallback pointing visitors to the public contact email instead of failing silently.

Both Contact and newsletter submissions use the same Cloudflare Turnstile client and server verifier while preserving their honeypots. Local development may omit both Turnstile keys and use the documented development-only bypass. If only one key is present, verification fails closed. Preview and production builds never bypass verification: configure both keys, using Cloudflare's published test credentials for safe preview validation or real restricted credentials for production. Tokens are single-use and reset after every server attempt.

Both form clients handle HTTP 429 responses and `Retry-After` guidance. Application-level counters, Redis, and a rate-limit datastore are intentionally not included. Distributed rate limiting remains an open requirement to configure with the eventual production host.

## V1 Public Content Policy

The V1 public surface intentionally excludes `/watch` and the draft LiNK and Paradise releases. Their source material remains in the repository, but the routes return 404 and the items are excluded from public collections, metadata, sitemaps, and audio queues.

Release and track descriptions are retained as private draft data in the content sources but are not rendered, serialized to public components where avoidable, or used in public metadata. Release and track metadata instead uses neutral factual templates built from approved titles, artists, dates, types, and normalized genres.

Genre display and filtering share the centralized taxonomy in `content/genres.ts`. The `/music` filters run entirely in the browser, default to `All`, preserve active audio, and do not create query parameters, genre routes, alternate canonical URLs, or sitemap entries. Review `docs/launch-readiness/V1_GENRE_INVENTORY.md` before changing taxonomy mappings; unresolved or missing factual genres should remain unlabeled until the owner approves them.

The checked-in `.vercelignore` supports the current preview workflow, but application runtime behavior does not depend on a Vercel-only API. Permanent hosting, distributed rate limiting, production Turnstile restrictions, environment configuration, TLS, and the `www.broey.net` redirect remain launch tasks for the eventual host.

## Branding Assets

- Canonical logo asset is now set to:
  - `public/assets/logos/broey-logo-white-no-background.png`
- Source file used: `D:\Broey\Broey Website 2025\Assets\Brand Assets\T Shirt PNG\broey logo white no background.png`
- Use this logo wherever the Broey logo appears across the site (header, footer, and social/OG placements).

## Asset Sync

Use the sync scripts to populate media from local files into the website’s `public/assets` tree.

## Release Registry Import

The human-editable release metadata workbook lives at:

```text
data/source/broey_website_release_metadata_registry_updated.xlsx
```

After editing the workbook, regenerate the site registry:

```bash
npm run import:releases
```

The importer reads the workbook sheets, validates release/track counts and required fields, and writes `content/musicRegistry.generated.ts`. Review the generated file before committing, then run:

```bash
npm run lint
npm run build
```

### Asset Sync Usage Notes

The npm helper commands are intended for the default Broey asset folders documented in this project.

Use these for the normal workflow:

```bash
npm run sync:assets:dry
npm run sync:assets:go
npm run sync:latest-release-media:dry
npm run sync:latest-release-media
```

For custom source folders, one-off tests, or flag-heavy runs, call the script directly:

```bash
node scripts/asset-sync.mjs --source "D:\Path\To\Custom\Assets" --dry-run
node scripts/asset-sync.mjs "D:\Path\To\Custom\Assets" --dry-run
```

Use `--overwrite` only when you intentionally want to replace existing copied assets.

### Full Catalog Asset Sync

Use this when updating release cover art and merch images for all known slugs in
`content/releases.ts` and `content/merch.ts`.

```bash
npm run sync:assets:dry

# Or, if using a custom source root:
node scripts/asset-sync.mjs "D:\Broey\Broey Website 2025\Assets" --dry-run
```

Safe workflow:

1. Dry-run review:

   ```bash
   npm run sync:assets:dry
   ```

2. Check `scripts/asset-sync-report.json`.
3. Apply content paths only after review:

   ```bash
   npm run sync:assets:go
   ```

4. Use overwrite only when you intentionally want to replace existing files:

   ```bash
   node scripts/asset-sync.mjs "D:\Broey\Broey Website 2025\Assets" --write-content --overwrite
   ```

   or simply run the shorthand for your default folder:

   ```bash
   npm run sync:assets:go
   ```

   (adds content paths without overwrite)

What this sync mode does:

- Scans image files recursively from the source root.
- Matches images to `slug` entries in `content/releases.ts` and `content/merch.ts` by name similarity.
- Copies the best matches into:
  - `public/assets/cover-art/<slug>.<ext>`
  - `public/assets/merch/<slug>.<ext>`
- Writes a report at `scripts/asset-sync-report.json`.

### Latest Release Media Sync

Use this when you only need the most recent WAV and PNG from:

`D:\Broey\Releases\Already Released`

Dry-run:

```bash
npm run sync:latest-release-media:dry
```

Copy:

```bash
npm run sync:latest-release-media
```

This writes/updates:

- `public/assets/cover-art/latest-release.png` (or latest image extension found)
- `public/assets/audio/latest-release.wav`

If you prefer direct script invocation:

```bash
node scripts/asset-sync.mjs --source "D:\Broey\Releases\Already Released" --latest-media --dry-run
```

To avoid passing source every run, set:

```text
BROEY_RELEASE_ROOT=D:\Broey\Releases\Already Released
```

That default is used automatically by latest-media mode.

## Architecture

- Broey. Website presents the brand, routes, SEO content, releases, merch previews, visuals, and contact surfaces.
- Disco handles music playback, hosted music assets, promo links, and download delivery.
- Shopify will handle merch product embeds, checkout, payments, inventory, and orders.

The site should stay lightweight and use native text content around embeds so pages remain crawlable and maintainable.

If you prefer, you can run the script directly and pass args without npm parsing:

```bash
node scripts/asset-sync.mjs --source "D:\Broey\Broey Website 2025\Assets" --dry-run
node scripts/asset-sync.mjs "D:\Broey\Broey Website 2025\Assets" --dry-run
```
