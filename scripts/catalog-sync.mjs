#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

loadEnvLocal();

const DEFAULT_ARTIST = "Broey";
const DEFAULT_COUNTRY = "US";
const DEFAULT_LIMIT = 200;
const SUPPORTED_PROVIDERS = new Set(["tidal", "itunes"]);
const REPORT_PATH = path.join(__dirname, "catalog-sync-report.json");
const IMPORT_PATH = path.join(repoRoot, "content", "releases.imported.json");
const RELEASES_PATH = path.join(repoRoot, "content", "releases.ts");
const REVIEW_STATUSES = new Set(["pending", "accept", "ignore", "manual"]);
const REVIEW_VISIBILITIES = new Set(["draft", "public"]);

const args = parseArgs(process.argv.slice(2));
const artist = args.artist ?? process.env.BROEY_CATALOG_ARTIST ?? DEFAULT_ARTIST;
const hasTidalCredentials = hasUsableTidalCredentials();
const provider = String(args.provider ?? args.source ?? (hasTidalCredentials ? "tidal" : "itunes")).toLowerCase();
const country = args.country ?? DEFAULT_COUNTRY;
const limit = Number(args.limit ?? DEFAULT_LIMIT);
const writeMode = Boolean(args.write);
const dryRun = !writeMode;

if (!SUPPORTED_PROVIDERS.has(provider)) {
  fail(`Unsupported catalog provider "${provider}". Use one of: ${[...SUPPORTED_PROVIDERS].join(", ")}.`);
}

if (provider === "tidal" && !hasTidalCredentials) {
  fail(
    [
      "TIDAL catalog sync requires credentials.",
      "Set TIDAL_CLIENT_ID and TIDAL_CLIENT_SECRET in your environment, plus optional BROEY_CATALOG_ARTIST=Broey.",
      "Example PowerShell:",
      "$env:TIDAL_CLIENT_ID='your-client-id'",
      "$env:TIDAL_CLIENT_SECRET='your-client-secret'",
      "$env:BROEY_CATALOG_ARTIST='Broey'",
      "Then run: npm run sync:catalog:tidal:dry",
      "Use --provider itunes only when you intentionally want the optional fallback provider.",
    ].join("\n"),
  );
}

if (!Number.isFinite(limit) || limit < 1 || limit > 200) {
  fail("--limit must be a number from 1 to 200.");
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});

async function main() {
  const localReleases = readLocalReleases();
  const catalogReleases =
    provider === "tidal"
      ? await fetchTidalCatalog({ artist, country, limit })
      : await fetchItunesCatalog({ artist, country, limit });
  const report = buildReport({
    artist,
    country,
    source: provider,
    dryRun,
    localReleases,
    catalogReleases,
  });

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeJson(REPORT_PATH, report);

  if (writeMode) {
    writeJson(IMPORT_PATH, buildImportedDraft(report));
  }

  printSummary(report, writeMode);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }

    if (arg === "--write") {
      parsed.write = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [rawKey, rawValue] = arg.slice(2).split("=", 2);
      const key = toCamelCase(rawKey);

      if (rawValue !== undefined) {
        parsed[key] = rawValue;
        continue;
      }

      const next = argv[index + 1];
      if (!next || next.startsWith("--")) {
        parsed[key] = true;
        continue;
      }

      parsed[key] = next;
      index += 1;
    }
  }

  return parsed;
}

function loadEnvLocal() {
  const envPath = path.join(repoRoot, ".env.local");
  if (!existsSync(envPath)) return;

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;

    process.env[key] = normalizeEnvValue(rawValue);
  }
}

function normalizeEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function hasUsableTidalCredentials() {
  return isUsableSecret(process.env.TIDAL_CLIENT_ID, "your_client_id_here") &&
    isUsableSecret(process.env.TIDAL_CLIENT_SECRET, "your_client_secret_here");
}

function isUsableSecret(value, placeholder) {
  return Boolean(value && value.trim() && value.trim() !== placeholder);
}

function toCamelCase(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function readLocalReleases() {
  const sourceText = readFileSync(RELEASES_PATH, "utf8");
  const blocks = extractReleaseObjectBlocks(sourceText);

  return blocks.map((block, index) => {
    const title = readStringProperty(block, "title") ?? `Untitled release ${index + 1}`;
    const slug = readStringProperty(block, "slug") ?? slugify(title);
    const releaseDate = readStringProperty(block, "releaseDate");
    const year = readNumberProperty(block, "year") ?? yearFromDate(releaseDate);

    return {
      title,
      slug,
      type: readStringProperty(block, "type"),
      year,
      releaseDate,
      featured: readBooleanProperty(block, "featured"),
    };
  });
}

function extractReleaseObjectBlocks(sourceText) {
  const marker = "export const releases";
  const markerIndex = sourceText.indexOf(marker);

  if (markerIndex === -1) {
    fail(`Could not find "${marker}" in content/releases.ts.`);
  }

  const assignmentIndex = sourceText.indexOf("=", markerIndex);
  if (assignmentIndex === -1) {
    fail("Could not find releases array assignment in content/releases.ts.");
  }

  const arrayStart = sourceText.indexOf("[", assignmentIndex);
  if (arrayStart === -1) {
    fail("Could not find releases array start in content/releases.ts.");
  }

  const blocks = [];
  let depth = 0;
  let objectStart = -1;
  let inString = false;
  let quote = "";
  let escaping = false;

  for (let index = arrayStart + 1; index < sourceText.length; index += 1) {
    const char = sourceText[index];
    const previous = sourceText[index - 1];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{" && depth === 0 && previous !== "=") {
      objectStart = index;
      depth = 1;
      continue;
    }

    if (char === "{" && depth > 0) {
      depth += 1;
      continue;
    }

    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        blocks.push(sourceText.slice(objectStart, index + 1));
        objectStart = -1;
      }
      continue;
    }

    if (char === "]" && depth === 0) {
      break;
    }
  }

  return blocks;
}

function readStringProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(["'\`])([\\s\\S]*?)\\1`));
  return match ? unescapeString(match[2]).trim() : undefined;
}

function readNumberProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(\\d{4})`));
  return match ? Number(match[1]) : undefined;
}

function readBooleanProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(true|false)`));
  return match ? match[1] === "true" : undefined;
}

function unescapeString(value) {
  return value.replace(/\\(["'`\\])/g, "$1");
}

async function fetchItunesCatalog({ artist, country, limit }) {
  const [albumResults, songResults] = await Promise.all([
    fetchItunesSearch({ artist, country, entity: "album", limit }),
    fetchItunesSearch({ artist, country, entity: "song", limit }),
  ]);

  const albumReleases = albumResults
    .filter((item) => isArtistMatch(item, artist))
    .map((item) => releaseFromItunesCollection(item));

  const albumTitleKeys = new Set(albumReleases.map((release) => release.normalizedTitle));
  const songReleases = songResults
    .filter((item) => isArtistMatch(item, artist))
    .filter((item) => {
      const collectionTitle = normalizeTitle(item.collectionName ?? "");
      const trackTitle = normalizeTitle(item.trackName ?? "");
      return !collectionTitle || collectionTitle === trackTitle || !albumTitleKeys.has(collectionTitle);
    })
    .map((item) => releaseFromItunesSong(item));

  const deduped = dedupeCatalogReleases([...albumReleases, ...songReleases]);
  return deduped.sort((a, b) => compareDateDesc(a.releaseDate, b.releaseDate));
}

async function fetchItunesSearch({ artist, country, entity, limit }) {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", artist);
  url.searchParams.set("country", country);
  url.searchParams.set("media", "music");
  url.searchParams.set("entity", entity);
  url.searchParams.set("attribute", "artistTerm");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`iTunes catalog request failed for ${entity}: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return Array.isArray(payload.results) ? payload.results : [];
}

async function fetchTidalCatalog({ artist, country, limit }) {
  const accessToken = await fetchTidalAccessToken();
  const tidalArtist = await resolveTidalArtist({ accessToken, artist, country });
  const albumIds = await fetchTidalArtistAlbumIds({ accessToken, artistId: tidalArtist.id, country, limit });
  const albumDocuments = await fetchTidalAlbumsByIds({ accessToken, albumIds, country });
  const albumCollections = albumDocuments
    .flatMap((document) => {
      const includedByKey = buildJsonApiResourceMap([...jsonApiResources(document), ...jsonApiIncluded(document)]);
      return jsonApiResources(document)
        .filter((resource) => resource.type === "albums")
        .map((resource) => collectionFromTidalAlbum(resource, includedByKey, tidalArtist));
    })
    .filter((release) => isArtistNameMatch(release.artistName, artist));

  const catalogEntries = albumCollections.flatMap((collection) => [
    collection,
    ...(collection.trackCount > 1 ? collection.tracks ?? [] : []),
  ]);

  return dedupeCatalogReleases(catalogEntries).sort(compareCatalogEntryDesc);
}

async function resolveTidalArtist({ accessToken, artist, country }) {
  const preferredDisplayName = artist.endsWith(".") ? artist : `${artist}.`;
  const searchQueries = artist.endsWith(".") ? [artist] : [preferredDisplayName, artist];
  const candidates = [];
  const seenArtistIds = new Set();

  for (const query of searchQueries) {
    const searchId = encodeURIComponent(query);
    const relationshipDocument = await tidalApiGet({
      accessToken,
      pathName: `/searchResults/${searchId}/relationships/artists`,
      params: { countryCode: country, "page[limit]": "10" },
    });
    const artistIdentifiers = jsonApiResources(relationshipDocument).filter((resource) => resource.type === "artists");

    for (const identifier of artistIdentifiers.slice(0, 8)) {
      if (seenArtistIds.has(identifier.id)) continue;
      seenArtistIds.add(identifier.id);

      const document = await tidalApiGet({
        accessToken,
        pathName: `/artists/${identifier.id}`,
        params: { countryCode: country },
      });
      const candidate = jsonApiResources(document)[0];
      if (candidate) candidates.push(candidate);
    }
  }

  const selected =
    candidates.find((resource) => sameDisplayName(resource.attributes?.name, preferredDisplayName)) ??
    candidates.find((resource) => sameDisplayName(resource.attributes?.name, artist)) ??
    candidates.find((resource) => normalizeArtist(resource.attributes?.name) === normalizeArtist(artist)) ??
    candidates.find((resource) => isArtistNameMatch(resource.attributes?.name, artist));

  if (!selected) {
    throw new Error(`Could not resolve a TIDAL artist matching "${artist}".`);
  }

  return {
    id: selected.id,
    name: selected.attributes?.name ?? artist,
  };
}

function sameDisplayName(left, right) {
  return String(left ?? "").trim().toLowerCase() === String(right ?? "").trim().toLowerCase();
}

async function fetchTidalArtistAlbumIds({ accessToken, artistId, country, limit }) {
  const albumIds = [];
  const seenAlbumIds = new Set();
  const seenCursors = new Set();
  let cursor;

  while (albumIds.length < limit) {
    const document = await tidalApiGet({
      accessToken,
      pathName: `/artists/${artistId}/relationships/albums`,
      params: {
        countryCode: country,
        "page[limit]": String(Math.max(1, limit - albumIds.length)),
        ...(cursor ? { "page[cursor]": cursor } : {}),
      },
    });

    const pageAlbumIds = jsonApiResources(document)
      .filter((resource) => resource.type === "albums")
      .map((resource) => resource.id)
      .filter((albumId) => {
        if (seenAlbumIds.has(albumId)) return false;
        seenAlbumIds.add(albumId);
        return true;
      });

    albumIds.push(...pageAlbumIds);

    const nextCursor = document?.links?.meta?.nextCursor;
    if (!nextCursor || seenCursors.has(nextCursor) || !pageAlbumIds.length) {
      break;
    }

    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }

  return albumIds.slice(0, limit);
}

async function fetchTidalAlbumsByIds({ accessToken, albumIds, country }) {
  const chunks = chunk(albumIds, 20);
  const documents = [];

  for (const ids of chunks) {
    documents.push(
      await tidalApiGet({
        accessToken,
        pathName: "/albums",
        params: {
          countryCode: country,
          "filter[id]": ids.join(","),
          include: ["artists", "coverArt", "items", "items.artists", "items.albums"],
        },
      }),
    );
  }

  return documents;
}

async function fetchTidalAccessToken() {
  const credentials = Buffer.from(`${process.env.TIDAL_CLIENT_ID}:${process.env.TIDAL_CLIENT_SECRET}`).toString("base64");
  const response = await fetch("https://auth.tidal.com/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TIDAL token request failed: ${response.status} ${response.statusText}\n${body}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("TIDAL token response did not include access_token.");
  }

  return payload.access_token;
}

async function tidalApiGet({ accessToken, pathName, params }) {
  return tidalApiGetWithRetry({ accessToken, pathName, params, attempt: 0 });
}

async function tidalApiGetWithRetry({ accessToken, pathName, params, attempt }) {
  const url = new URL(`https://openapi.tidal.com/v2${pathName}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          url.searchParams.append(key, item);
        }
      }
    } else if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 1500 * (attempt + 1);
      await sleep(delayMs);
      return tidalApiGetWithRetry({ accessToken, pathName, params, attempt: attempt + 1 });
    }

    const body = await response.text();
    throw new Error(`TIDAL API request failed for ${url.pathname}: ${response.status} ${response.statusText}\n${body}`);
  }

  return response.json();
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function safeTidalApiGet(options) {
  try {
    return await tidalApiGet(options);
  } catch {
    return null;
  }
}

function jsonApiResources(document) {
  if (!document) return [];
  if (Array.isArray(document.data)) return document.data;
  return document.data ? [document.data] : [];
}

function jsonApiIncluded(document) {
  return Array.isArray(document?.included) ? document.included : [];
}

function buildJsonApiResourceMap(resources) {
  const map = new Map();
  for (const resource of resources) {
    if (resource?.type && resource?.id) {
      map.set(`${resource.type}:${resource.id}`, resource);
    }
  }
  return map;
}

function collectionFromTidalAlbum(resource, includedByKey, tidalArtist) {
  const collection = releaseFromTidalAlbum(resource, includedByKey, tidalArtist);
  const tracks = tracksFromTidalAlbum(resource, includedByKey, collection, tidalArtist);
  const trackCount = tracks.length || collection.trackCount || 1;
  const collectionType = inferCollectionType({ title: collection.title, trackCount });
  const type = releaseTypeFromCollectionType(collectionType);
  const suggestedTileType = suggestedTileTypeFor({
    isCollection: true,
    collectionType,
    trackCount,
  });

  return {
    ...collection,
    type,
    collectionType,
    trackCount,
    suggestedTileType,
    tracks: tracks.map((track) => ({
      ...track,
      trackCount,
      parentCollectionType: collectionType,
    })),
  };
}

function releaseFromTidalAlbum(resource, includedByKey, tidalArtist) {
  const attributes = resource.attributes ?? {};
  const title = cleanCatalogTitle(tidalTitleFor(attributes));
  const releaseDate = dateOnly(attributes.releaseDate ?? attributes.streamStartDate ?? attributes.createdAt);
  const trackCount = Number(attributes.numberOfItems ?? attributes.numberOfTracks ?? attributes.trackCount ?? 1);
  const artistName = artistNamesFor(resource, includedByKey).join(" & ") || attributes.artistName || tidalArtist?.name;
  const collectionType = inferCollectionType({ title, trackCount });

  return {
    source: "tidal",
    provider: "tidal",
    sourceId: String(resource.id),
    tidalId: String(resource.id),
    title,
    slug: slugify(title),
    normalizedTitle: normalizeTitle(title),
    type: releaseTypeFromCollectionType(collectionType),
    collectionType,
    year: yearFromDate(releaseDate),
    releaseDate,
    artistName,
    collectionName: title,
    isCollection: true,
    suggestedTileType: suggestedTileTypeFor({ isCollection: true, collectionType, trackCount }),
    trackCount,
    sourceUrl: tidalSharingUrlFor(resource) ?? `https://tidal.com/browse/album/${resource.id}`,
    artworkUrl: artworkUrlFor(resource, includedByKey),
    rawKind: resource.type,
  };
}

function tracksFromTidalAlbum(albumResource, includedByKey, collection, tidalArtist) {
  const itemRelationship = albumResource.relationships?.items?.data;
  const itemIdentifiers = Array.isArray(itemRelationship) ? itemRelationship : itemRelationship ? [itemRelationship] : [];
  const trackCount = itemIdentifiers.filter((identifier) => identifier.type === "tracks").length || collection.trackCount || 1;

  return itemIdentifiers
    .filter((identifier) => identifier.type === "tracks")
    .map((identifier, index) => {
      const trackResource = includedByKey.get(`${identifier.type}:${identifier.id}`) ?? identifier;
      return releaseFromTidalTrack(trackResource, includedByKey, {
        collection,
        tidalArtist,
        trackCount,
        trackNumber: Number(identifier.meta?.trackNumber ?? index + 1),
      });
    });
}

function releaseFromTidalTrack(resource, includedByKey, { collection, tidalArtist, trackNumber, trackCount }) {
  const attributes = resource.attributes ?? {};
  const title = cleanCatalogTitle(tidalTitleFor(attributes, `Track ${trackNumber}`));
  const releaseDate = collection.releaseDate ?? dateOnly(attributes.releaseDate ?? attributes.streamStartDate ?? attributes.createdAt);
  const artistName = artistNamesFor(resource, includedByKey).join(" & ") || attributes.artistName || tidalArtist?.name;
  const parentCollectionSlug = collection.slug ?? slugify(collection.title);
  const trackSlug = slugify(title);
  const uniqueSlug = trackSlug === parentCollectionSlug
    ? `${parentCollectionSlug}-track-${trackNumber}`
    : `${parentCollectionSlug}-${trackSlug}`;

  return {
    source: "tidal",
    provider: "tidal",
    sourceId: String(resource.id),
    tidalId: String(resource.id),
    title,
    slug: uniqueSlug,
    normalizedTitle: normalizeTitle(title),
    type: inferReleaseType({ title, trackCount: 1 }),
    year: yearFromDate(releaseDate),
    releaseDate,
    artistName,
    collectionName: collection.title,
    collectionType: "Track",
    isCollection: false,
    suggestedTileType: suggestedTileTypeFor({ isCollection: false }),
    parentCollectionTitle: collection.title,
    parentCollectionSlug,
    parentCollectionId: collection.sourceId,
    parentCollectionType: collection.collectionType,
    trackNumber,
    trackCount,
    sourceUrl: tidalSharingUrlFor(resource) ?? `https://tidal.com/browse/track/${resource.id}`,
    artworkUrl: collection.artworkUrl ?? artworkUrlFor(resource, includedByKey),
    rawKind: resource.type,
  };
}

function tidalTitleFor(attributes, fallback = "Untitled release") {
  const baseTitle = attributes.title ?? attributes.name ?? fallback;
  const version = typeof attributes.version === "string" ? attributes.version.trim() : "";

  if (!version || String(baseTitle).toLowerCase().includes(version.toLowerCase())) {
    return baseTitle;
  }

  return `${baseTitle} (${version})`;
}

function tidalSharingUrlFor(resource) {
  const link = resource.attributes?.externalLinks?.find((entry) => entry?.href);
  return typeof link?.href === "string" ? link.href : undefined;
}

function artistNamesFor(resource, includedByKey) {
  return relatedResources(resource, includedByKey, "artists")
    .map((artistResource) => artistResource.attributes?.name ?? artistResource.attributes?.title)
    .filter(Boolean);
}

function relatedResources(resource, includedByKey, type) {
  const relationship = resource.relationships?.[type]?.data;
  const related = Array.isArray(relationship) ? relationship : relationship ? [relationship] : [];
  return related
    .map((identifier) => includedByKey.get(`${identifier.type ?? type}:${identifier.id}`))
    .filter(Boolean);
}

function firstRelatedResource(resource, includedByKey, type) {
  return relatedResources(resource, includedByKey, type)[0];
}

function artworkUrlFor(resource, includedByKey) {
  const artwork = firstRelatedResource(resource, includedByKey, "coverArt");
  const attributes = artwork?.attributes ?? {};
  const href =
    attributes.url ??
    attributes.href ??
    attributes.imageUrl ??
    attributes.templateUrl ??
    attributes.files?.[0]?.url;

  if (typeof href === "string") {
    return href.replace("{width}", "1000").replace("{height}", "1000");
  }

  return undefined;
}

function releaseFromItunesCollection(item) {
  const title = cleanCatalogTitle(item.collectionName ?? item.trackName ?? "Untitled release");
  const releaseDate = dateOnly(item.releaseDate);
  const trackCount = Number(item.trackCount ?? 1);

  return {
    source: "itunes",
    sourceId: String(item.collectionId ?? `${title}-${releaseDate}`),
    title,
    slug: slugify(title),
    normalizedTitle: normalizeTitle(title),
    type: inferReleaseType({ title, trackCount }),
    year: yearFromDate(releaseDate),
    releaseDate,
    artistName: item.artistName,
    collectionName: item.collectionName,
    trackCount,
    sourceUrl: item.collectionViewUrl,
    artworkUrl: normalizeArtworkUrl(item.artworkUrl100),
    rawKind: item.collectionType ?? "collection",
  };
}

function releaseFromItunesSong(item) {
  const title = cleanCatalogTitle(item.trackName ?? item.collectionName ?? "Untitled release");
  const releaseDate = dateOnly(item.releaseDate);

  return {
    source: "itunes",
    sourceId: String(item.trackId ?? `${title}-${releaseDate}`),
    title,
    slug: slugify(title),
    normalizedTitle: normalizeTitle(title),
    type: inferReleaseType({ title, trackCount: 1 }),
    year: yearFromDate(releaseDate),
    releaseDate,
    artistName: item.artistName,
    collectionName: item.collectionName,
    trackCount: 1,
    sourceUrl: item.trackViewUrl ?? item.collectionViewUrl,
    artworkUrl: normalizeArtworkUrl(item.artworkUrl100),
    rawKind: item.kind ?? "song",
  };
}

function dedupeCatalogReleases(releases) {
  const byKey = new Map();

  for (const release of releases) {
    const key = catalogDedupeKey(release);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, release);
      continue;
    }

    if ((release.trackCount ?? 1) > (existing.trackCount ?? 1)) {
      byKey.set(key, release);
    }
  }

  return [...byKey.values()];
}

function catalogDedupeKey(release) {
  if (release.source && release.sourceId) {
    return `${release.source}:${release.rawKind ?? "catalog"}:${release.sourceId}`;
  }

  return `${release.normalizedTitle}:${release.releaseDate ?? release.year ?? ""}`;
}

function buildReport({ artist, country, source, dryRun, localReleases, catalogReleases }) {
  const matchesByLocalSlug = new Map();
  const outcomesByCatalogKey = new Map();
  const matchedExistingReleases = [];
  const possibleNewReleases = [];
  const ambiguousMatches = [];

  for (const catalogRelease of catalogReleases) {
    const candidates = localReleases
      .map((localRelease) => ({
        localRelease,
        score: scoreMatch(catalogRelease, localRelease),
        reasons: matchReasons(catalogRelease, localRelease),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);

    const strongCandidates = candidates.filter((candidate) => candidate.score >= 70);
    const top = candidates[0];
    const second = candidates[1];

    if (
      strongCandidates.length > 1 &&
      second &&
      top.score - second.score <= 20
    ) {
      const ambiguousMatch = {
        catalogRelease: compactCatalogRelease(catalogRelease),
        candidates: strongCandidates.slice(0, 4).map((candidate) => ({
          localRelease: compactLocalRelease(candidate.localRelease),
          score: candidate.score,
          reasons: candidate.reasons,
        })),
      };
      ambiguousMatches.push(ambiguousMatch);
      outcomesByCatalogKey.set(catalogEntryKey(catalogRelease), {
        status: "ambiguous",
        possibleNewSiteTile: false,
        candidates: ambiguousMatch.candidates,
      });
      continue;
    }

    if (top && top.score >= 70) {
      const matchedExistingRelease = {
        catalogRelease: compactCatalogRelease(catalogRelease),
        localRelease: compactLocalRelease(top.localRelease),
        score: top.score,
        reasons: top.reasons,
      };
      matchedExistingReleases.push(matchedExistingRelease);
      outcomesByCatalogKey.set(catalogEntryKey(catalogRelease), {
        status: "matched",
        possibleNewSiteTile: false,
        localRelease: matchedExistingRelease.localRelease,
        score: top.score,
        reasons: top.reasons,
      });
      matchesByLocalSlug.set(top.localRelease.slug, catalogRelease.slug);
      continue;
    }

    const possibleNewRelease = {
      catalogRelease: compactCatalogRelease(catalogRelease),
      suggestedDraft: suggestedDraftEntry(catalogRelease),
      bestLocalCandidate: top
        ? {
            localRelease: compactLocalRelease(top.localRelease),
            score: top.score,
            reasons: top.reasons,
          }
        : null,
    };
    possibleNewReleases.push(possibleNewRelease);
    outcomesByCatalogKey.set(catalogEntryKey(catalogRelease), {
      status: "possible-new",
      possibleNewSiteTile: true,
      bestLocalCandidate: possibleNewRelease.bestLocalCandidate,
    });
  }

  const localReleasesMissingFromDSP = localReleases
    .filter((localRelease) => !matchesByLocalSlug.has(localRelease.slug))
    .map((localRelease) => ({
      localRelease: compactLocalRelease(localRelease),
      note: "Local-only/manual release candidate. Keep this if it is unreleased, non-DSP, promotional, or intentionally managed by hand.",
    }));
  const catalogCollections = catalogReleases.filter((release) => release.isCollection);
  const catalogTracks = catalogCollections.flatMap((collection) => collection.tracks ?? []);
  const tileCandidates = catalogReleases.filter((release) => release.suggestedTileType);
  const tidalCatalogOverview =
    source === "tidal" ? buildTidalCatalogOverview(catalogCollections, outcomesByCatalogKey) : undefined;

  return {
    generatedAt: new Date().toISOString(),
    mode: dryRun ? "dry-run" : "write",
    provider: source,
    source,
    artist,
    country,
    reportPath: relativePath(REPORT_PATH),
    importedDraftPath: relativePath(IMPORT_PATH),
    note:
      "Catalog sync is a local review tool only. It does not add runtime DSP calls, hosted audio, or replace Disco/Link/Shopify behavior.",
    summary: {
      catalogReleaseCount: catalogReleases.length,
      catalogCollectionCount: catalogCollections.length,
      catalogTrackCount: catalogTracks.length,
      catalogTileCandidateCount: tileCandidates.length,
      localReleaseCount: localReleases.length,
      matchedExistingReleaseCount: matchedExistingReleases.length,
      possibleNewReleaseCount: possibleNewReleases.length,
      possibleNewTileCount: possibleNewReleases.length,
      ambiguousMatchCount: ambiguousMatches.length,
      localMissingFromDspCount: localReleasesMissingFromDSP.length,
    },
    tidalCatalogOverview,
    matchedExistingReleases,
    possibleNewReleases,
    ambiguousMatches,
    localReleasesMissingFromDSP,
  };
}

function scoreMatch(catalogRelease, localRelease) {
  const catalogTitle = catalogRelease.normalizedTitle;
  const localTitle = normalizeTitle(localRelease.title);
  const catalogSlug = catalogRelease.slug;
  const localSlug = localRelease.slug;

  let score = 0;

  if (catalogSlug === localSlug) score += 65;
  if (catalogTitle === localTitle) score += 65;
  if (catalogTitle && localTitle && (catalogTitle.includes(localTitle) || localTitle.includes(catalogTitle))) {
    score += 25;
  }
  if (tokenOverlap(catalogTitle, localTitle) >= 0.8) score += 25;
  if (catalogRelease.releaseDate && localRelease.releaseDate && catalogRelease.releaseDate === localRelease.releaseDate) {
    score += 25;
  }
  if (catalogRelease.year && localRelease.year && catalogRelease.year === localRelease.year) {
    score += 10;
  }

  return Math.min(score, 100);
}

function matchReasons(catalogRelease, localRelease) {
  const reasons = [];
  const catalogTitle = catalogRelease.normalizedTitle;
  const localTitle = normalizeTitle(localRelease.title);

  if (catalogRelease.slug === localRelease.slug) reasons.push("slug");
  if (catalogTitle === localTitle) reasons.push("title");
  if (catalogRelease.releaseDate && localRelease.releaseDate && catalogRelease.releaseDate === localRelease.releaseDate) {
    reasons.push("date");
  }
  if (catalogRelease.year && localRelease.year && catalogRelease.year === localRelease.year) {
    reasons.push("year");
  }
  if (!reasons.length && tokenOverlap(catalogTitle, localTitle) > 0) {
    reasons.push("title-token-overlap");
  }

  return reasons;
}

function compactCatalogRelease(release) {
  return {
    title: release.title,
    slug: release.slug,
    type: release.type,
    collectionType: release.collectionType,
    isCollection: release.isCollection,
    suggestedTileType: release.suggestedTileType,
    year: release.year,
    releaseDate: release.releaseDate,
    artistName: release.artistName,
    collectionName: release.collectionName,
    parentCollectionTitle: release.parentCollectionTitle,
    parentCollectionSlug: release.parentCollectionSlug,
    parentCollectionId: release.parentCollectionId,
    parentCollectionType: release.parentCollectionType,
    trackNumber: release.trackNumber,
    trackCount: release.trackCount,
    rawKind: release.rawKind,
    source: release.source,
    provider: release.provider,
    sourceId: release.sourceId,
    tidalId: release.tidalId,
    sourceUrl: release.sourceUrl,
    artworkUrl: release.artworkUrl,
  };
}

function compactLocalRelease(release) {
  return {
    title: release.title,
    slug: release.slug,
    type: release.type,
    year: release.year,
    releaseDate: release.releaseDate,
    featured: release.featured,
  };
}

function suggestedDraftEntry(release) {
  const platform = release.source === "tidal" ? "TIDAL" : "Apple Music";

  return {
    reviewStatus: "pending",
    visibility: "draft",
    title: release.title,
    slug: release.slug,
    type: release.type,
    isCollection: release.isCollection,
    suggestedTileType: release.suggestedTileType,
    parentCollectionTitle: release.parentCollectionTitle,
    parentCollectionSlug: release.parentCollectionSlug,
    parentCollectionId: release.parentCollectionId,
    trackNumber: release.trackNumber,
    trackCount: release.trackCount,
    year: release.year,
    releaseDate: release.releaseDate,
    description: `Catalog metadata draft for ${release.title} by ${artist}. Review and replace with hand-written site copy before publishing.`,
    mood: "Draft imported from public catalog metadata; replace with an intentional mood line.",
    links: release.sourceUrl
      ? [
          {
            label: platform,
            platform,
            url: release.sourceUrl,
            kind: "streaming",
            primary: false,
          },
        ]
      : [],
    catalogSource: {
      provider: release.provider ?? release.source,
      source: release.source,
      sourceId: release.sourceId,
      tidalId: release.tidalId,
      artistName: release.artistName,
      collectionName: release.collectionName,
      collectionType: release.collectionType,
      isCollection: release.isCollection,
      suggestedTileType: release.suggestedTileType,
      parentCollectionTitle: release.parentCollectionTitle,
      parentCollectionSlug: release.parentCollectionSlug,
      parentCollectionId: release.parentCollectionId,
      parentCollectionType: release.parentCollectionType,
      trackNumber: release.trackNumber,
      trackCount: release.trackCount,
      rawKind: release.rawKind,
      sourceUrl: release.sourceUrl,
      artworkUrl: release.artworkUrl,
    },
  };
}

function buildImportedDraft(report) {
  const existingReviews = readExistingImportReviews();
  const existingDraftEntries = readExistingImportedDraftEntries();
  const retainedDraftEntries = existingDraftEntries.filter((entry) => entry.catalogSource?.source !== report.source);
  const providerDraftEntries = report.possibleNewReleases.map((entry) => ({
    ...entry.suggestedDraft,
    reviewStatus: report.source === "tidal"
      ? "pending"
      : existingReviews.get(reviewKeyFor(entry.suggestedDraft.catalogSource))?.reviewStatus ??
        entry.suggestedDraft.reviewStatus ??
        "pending",
    visibility: report.source === "tidal"
      ? "draft"
      : existingReviews.get(reviewKeyFor(entry.suggestedDraft.catalogSource))?.visibility ??
        entry.suggestedDraft.visibility ??
        "draft",
  }));

  return {
    generatedAt: report.generatedAt,
    artist: report.artist,
    provider: report.source,
    source: report.source,
    note:
      "Review-only draft entries. Do not import blindly; hand-edit content/releases.ts so manual releases, Disco links, local cover art, and SEO copy remain intentional.",
    draftEntries: [...retainedDraftEntries, ...providerDraftEntries],
    ambiguousCatalogReleases: report.ambiguousMatches,
  };
}

function readExistingImportedDraftEntries() {
  if (!existsSync(IMPORT_PATH)) {
    return [];
  }

  try {
    const imported = JSON.parse(readFileSync(IMPORT_PATH, "utf8"));
    return Array.isArray(imported.draftEntries) ? imported.draftEntries : [];
  } catch {
    return [];
  }
}

function readExistingImportReviews() {
  if (!existsSync(IMPORT_PATH)) {
    return new Map();
  }

  try {
    const imported = JSON.parse(readFileSync(IMPORT_PATH, "utf8"));
    return new Map(
      (imported.draftEntries ?? [])
        .map((entry) => [
          reviewKeyFor(entry.catalogSource),
          {
            reviewStatus: REVIEW_STATUSES.has(entry.reviewStatus) ? entry.reviewStatus : "pending",
            visibility: REVIEW_VISIBILITIES.has(entry.visibility) ? entry.visibility : "draft",
          },
        ])
        .filter(([sourceId]) => Boolean(sourceId)),
    );
  } catch {
    return new Map();
  }
}

function reviewKeyFor(catalogSource) {
  const sourceId = catalogSource?.sourceId ?? catalogSource?.tidalId;
  if (!sourceId) return undefined;
  return `${catalogSource.source ?? catalogSource.provider ?? "unknown"}:${sourceId}`;
}

function cleanCatalogTitle(title) {
  return title
    .replace(/\s+-\s+Single$/i, "")
    .replace(/\s+-\s+EP$/i, " EP")
    .replace(/\s+/g, " ")
    .trim();
}

function inferReleaseType({ title, trackCount }) {
  const normalized = normalizeTitle(title);

  if (normalized.includes("remix") || normalized.includes("remixes")) return "remix";
  if (trackCount > 1 && trackCount <= 7) return "ep";
  if (trackCount > 7) return "mix";
  return "single";
}

function inferCollectionType({ title, trackCount }) {
  const normalized = normalizeTitle(title);

  if (normalized.includes("remix") || normalized.includes("remixes")) return "Remix";
  if (trackCount === 1) return "Single";
  if (trackCount > 1 && trackCount <= 7) return "EP";
  if (trackCount > 7) return "Album";
  return "Unknown";
}

function releaseTypeFromCollectionType(collectionType) {
  if (collectionType === "Remix") return "remix";
  if (collectionType === "EP") return "ep";
  if (collectionType === "Album") return "mix";
  return "single";
}

function suggestedTileTypeFor({ isCollection, collectionType, trackCount }) {
  if (!isCollection) return "trackTile";
  if (collectionType === "Single" && trackCount === 1) return "singleTile";
  if (["Album", "EP", "Remix"].includes(collectionType)) return "collectionTile";
  return "collectionTile";
}

function isArtistMatch(item, artistName) {
  const target = normalizeArtist(artistName);
  const candidates = [
    item.artistName,
    item.collectionArtistName,
    item.trackArtistName,
  ];

  return candidates
    .filter(Boolean)
    .map(normalizeArtist)
    .some((candidate) => candidate === target || candidate.includes(target));
}

function isArtistNameMatch(candidate, artistName) {
  const target = normalizeArtist(artistName);
  const normalized = normalizeArtist(candidate);
  return Boolean(normalized && (normalized === target || normalized.includes(target)));
}

function normalizeArtist(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeTitle(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(single|ep)\b/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalizeTitle(value).replace(/\s+/g, "-") || "untitled-release";
}

function tokenOverlap(left, right) {
  const leftTokens = new Set(left.split(/\s+/).filter(Boolean));
  const rightTokens = new Set(right.split(/\s+/).filter(Boolean));

  if (!leftTokens.size || !rightTokens.size) return 0;

  const shared = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return shared / Math.max(leftTokens.size, rightTokens.size);
}

function dateOnly(value) {
  return typeof value === "string" && value ? value.slice(0, 10) : undefined;
}

function yearFromDate(value) {
  return typeof value === "string" && /^\d{4}/.test(value) ? Number(value.slice(0, 4)) : undefined;
}

function compareDateDesc(left, right) {
  return new Date(right ?? "1900-01-01").getTime() - new Date(left ?? "1900-01-01").getTime();
}

function compareCatalogEntryDesc(left, right) {
  const dateComparison = compareDateDesc(left.releaseDate, right.releaseDate);
  if (dateComparison !== 0) return dateComparison;

  const leftParent = left.isCollection ? left.sourceId : left.parentCollectionId;
  const rightParent = right.isCollection ? right.sourceId : right.parentCollectionId;
  if (leftParent && rightParent && leftParent === rightParent) {
    if (left.isCollection !== right.isCollection) return left.isCollection ? -1 : 1;
    return (left.trackNumber ?? 0) - (right.trackNumber ?? 0);
  }

  return left.title.localeCompare(right.title);
}

function catalogEntryKey(release) {
  return `${release.source ?? release.provider ?? "unknown"}:${release.rawKind ?? "catalog"}:${release.sourceId ?? release.tidalId ?? release.slug}`;
}

function buildTidalCatalogOverview(collections, outcomesByCatalogKey) {
  return collections.sort(compareCatalogEntryDesc).map((collection) => {
    const collectionOutcome = outcomesByCatalogKey.get(catalogEntryKey(collection)) ?? {
      status: "unknown",
      possibleNewSiteTile: false,
    };

    return {
      title: collection.title,
      slug: collection.slug,
      collectionType: collection.collectionType ?? "Unknown",
      suggestedTileType: collection.suggestedTileType,
      year: collection.year,
      releaseDate: collection.releaseDate,
      trackCount: collection.trackCount,
      tidalId: collection.tidalId ?? collection.sourceId,
      sourceUrl: collection.sourceUrl,
      matchedLocalRelease: collectionOutcome.localRelease ?? null,
      matchStatus: collectionOutcome.status,
      possibleNewSiteTile: Boolean(collectionOutcome.possibleNewSiteTile),
      tracks: (collection.tracks ?? []).map((track) => {
        const trackOutcome = outcomesByCatalogKey.get(catalogEntryKey(track)) ?? {
          status: "in-collection",
          possibleNewSiteTile: false,
        };

        return {
          title: track.title,
          slug: track.slug,
          suggestedTileType: track.suggestedTileType,
          trackNumber: track.trackNumber,
          tidalId: track.tidalId ?? track.sourceId,
          sourceUrl: track.sourceUrl,
          matchedLocalRelease: trackOutcome.localRelease ?? null,
          matchStatus: trackOutcome.status,
          possibleNewSiteTile: Boolean(trackOutcome.possibleNewSiteTile),
        };
      }),
    };
  });
}

function normalizeArtworkUrl(url) {
  return typeof url === "string" ? url.replace(/100x100bb\.jpg$/i, "1000x1000bb.jpg") : undefined;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function relativePath(value) {
  return path.relative(repoRoot, value).replace(/\\/g, "/");
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function printSummary(report, didWriteDraft) {
  const { summary } = report;

  console.log(`Catalog sync report written to ${report.reportPath}`);
  console.log(`Artist: ${report.artist}`);
  console.log(`Provider: ${report.provider ?? report.source}`);
  console.log(`Mode: ${report.mode}`);
  console.log(`✓ matched existing releases: ${summary.matchedExistingReleaseCount}`);
  console.log(`+ possible new releases: ${summary.possibleNewReleaseCount}`);
  console.log(`? ambiguous matches: ${summary.ambiguousMatchCount}`);
  console.log(`- local releases missing from DSP: ${summary.localMissingFromDspCount}`);

  if (didWriteDraft) {
    console.log(`Draft entries written to ${report.importedDraftPath}`);
  } else {
    console.log("No draft entries written. Run npm run sync:catalog:write to create content/releases.imported.json.");
  }
}

function fail(message) {
  console.error(`Catalog sync failed: ${message}`);
  process.exit(1);
}
