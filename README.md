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

`NEXT_PUBLIC_SITE_URL` is the canonical public origin used for metadata, sitemap URLs, JSON-LD, and share links. The intended public origin is `https://broey.net`. Production and preview builds require an explicit HTTPS origin-only value; credentials, query strings, fragments, and non-root paths are rejected. A trailing slash is normalized away. Local development may omit the variable and use `http://localhost:3000`, or explicitly use HTTP with `localhost` or `127.0.0.1`.

`SITE_VISIBILITY` accepts only `public` or `private` outside local development. `public` allows normal indexing. `private` requires `SITE_PASSCODE` and enables the preview gate, noindex metadata, robots disallow, and an empty sitemap. Local development defaults to `public` when the variable is absent.

The permanent production host has not been selected. Keep the app deployable with conventional `next build` and `next start` commands. The future `www.broey.net` to `broey.net` redirect belongs in the selected hosting or DNS configuration, not in application routing.

Shopify merch runtime uses `SHOPIFY_STORE_DOMAIN`, optional `SHOPIFY_MERCH_COLLECTION_HANDLE`, and optional `SHOPIFY_STOREFRONT_ACCESS_TOKEN`. If Shopify is unavailable or returns no products, the merch page falls back to curated local product links.

Resend/contact delivery requires `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; `RESEND_FROM_NAME` is optional. MailerLite/newsletter delivery requires `MAILERLITE_API_KEY` and `MAILERLITE_GROUP_ID`; sender/reply-to values document the intended email identity. Turnstile uses `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for the widget and `TURNSTILE_SECRET_KEY` for server verification. Never commit real secret values.

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

For contact form spam protection, create a Cloudflare Turnstile widget and set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` plus `TURNSTILE_SECRET_KEY`. Server-side verification runs only when `TURNSTILE_SECRET_KEY` is present.

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
