#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_INVENTORY_PATH = path.join(__dirname, "released-folder-inventory.json");
const OUTPUT_JSON_PATH = path.join(__dirname, "released-folder-metadata-preview.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "released-folder-metadata-preview.md");
const RELEASES_TS_PATH = path.join(repoRoot, "content", "releases.ts");
const RELEASES_IMPORTED_PATH = path.join(repoRoot, "content", "releases.imported.json");
const RELEASE_FOLDER_MAP_PATH = path.join(repoRoot, "content", "release-folder-map.json");
const DEFAULT_DISTRIBUTOR_INVENTORY_PATH = path.join(__dirname, "distributor-inventory.json");
const TIDAL_PROVIDER = "tidal";

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inventoryPath = args.inventory || DEFAULT_INVENTORY_PATH;
  if (!existsSync(inventoryPath)) {
    fail(`Missing input report. Run npm run sync:released-folders:scan first or provide --inventory <path>.`);
  }

  const inventory = readInventory(inventoryPath);
  if (!inventory || !Array.isArray(inventory.entries)) {
    fail("Invalid inventory payload: expected { entries: [] }.");
  }

  const contentReleases = readContentReleases();
  const imported = readImportedCatalog();
  const distributorInventory = args.distributor
    ? readDistributorInventory(args.distributor, true)
    : (existsSync(DEFAULT_DISTRIBUTOR_INVENTORY_PATH)
      ? readDistributorInventory(DEFAULT_DISTRIBUTOR_INVENTORY_PATH, false)
      : null);
  const distributorCatalog = buildDistributorIndex(distributorInventory?.entries || []);
  const releaseFolderMap = readReleaseFolderMap();
  const releaseFolderMapReport = inventory.releaseFolderMap?.curatedCarouselMissingFromScan
    ? inventory.releaseFolderMap
    : buildReleaseFolderMapReport({
        scannedEntries: inventory.entries,
      contentReleases,
      releaseFolderMap,
      scanRoot: inventory.summary?.scanRoot,
    });

  const preview = inventory.entries.map((entry) => createPreviewEntry(entry, {
    contentReleases,
    imported,
    distributorCatalog,
  }));

  const summary = buildSummary(preview, releaseFolderMapReport);
  const output = {
    generatedAt: new Date().toISOString(),
    sourceInventoryPath: path.relative(repoRoot, path.resolve(inventoryPath)),
    summary,
    releaseFolderMap: releaseFolderMapReport,
    entries: preview,
  };

  writeJson(OUTPUT_JSON_PATH, output);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, output);

  console.log(`Released folder metadata preview written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Released folder metadata markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Candidates: ${summary.total}`);
  console.log(`High / medium / low: ${summary.highConfidenceCount} / ${summary.mediumConfidenceCount} / ${summary.lowConfidenceCount}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/released-folder-metadata-preview.mjs [--inventory <path>] [--distributor <path>] [--help]");
  console.log("");
  console.log("Default inventory:");
  console.log(`  ${path.relative(repoRoot, DEFAULT_INVENTORY_PATH)}`);
  console.log(`Default distributor inventory: ${path.relative(repoRoot, DEFAULT_DISTRIBUTOR_INVENTORY_PATH)}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/released-folder-metadata-preview.json");
  console.log("  scripts/released-folder-metadata-preview.md");
  console.log("");
  console.log("This is a preview-only script. It does not write release.json files or mutate source folders.");
}

function parseArgs(args) {
  const parsed = { help: false, inventory: null, distributor: null };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--inventory") {
      if (index + 1 >= args.length) fail("Missing value for --inventory. Use --inventory <path>.");
      parsed.inventory = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--inventory=")) {
      parsed.inventory = arg.replace(/^--inventory=/, "");
      continue;
    }

    if (arg === "--distributor") {
      if (index + 1 >= args.length) fail("Missing value for --distributor. Use --distributor <path>.");
      parsed.distributor = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--distributor=")) {
      parsed.distributor = arg.replace(/^--distributor=/, "");
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function readInventory(inventoryPath) {
  const raw = JSON.parse(readFileSync(inventoryPath, "utf8"));
  return raw;
}

function createPreviewEntry(entry, context) {
  const matches = normalizeMatches(entry.matches ?? {});
  const audioCandidate = entry.likelyMasterAudioFile || null;
  const coverCandidate = entry.likelyCoverImage || null;
  const hasAudio = Boolean(audioCandidate);
  const hasCover = Boolean(coverCandidate);

  const contentMatch = matches.contentRelease;
  const tidalMatch = matches.tidalImportedMatch;

  const fallbackTitle = entry.possibleTitle || entry.inferredTitle || entry.folderName || "";
  const fallbackSlug = entry.possibleSlug || entry.inferredSlug || sanitizeSlug(fallbackTitle);
  const fallbackType = entry.possibleType || entry.inferredType || "Unknown";

  const contentEntry = pickContentEntry(context.contentReleases, contentMatch);
  const releaseJson = readOptionalJson(entry.releaseJsonPath);
  const releaseJsonData = releaseJson && typeof releaseJson === "object"
    ? {
      title: readTextValue(releaseJson.title),
      slug: readTextValue(releaseJson.slug),
      type: normalizeTypeValue(releaseJson.type),
      releaseDate: readTextValue(releaseJson.releaseDate),
      year: readYearValue(releaseJson.year),
      catalogStatus: readTextValue(releaseJson.catalogStatus),
      upc: readTextValue(releaseJson.upc),
      catalogNumber: readTextValue(releaseJson.catalogNumber),
      trackList: normalizeTrackList(readArrayValue(releaseJson.trackList)),
      carouselEnabled: releaseJson.carouselEnabled === true,
      listenAction: readObjectValue(releaseJson.listenAction),
    }
    : null;

  const tidalEntry = pickImportedEntry(context.imported, tidalMatch, contentEntry, fallbackSlug, fallbackTitle);
  const pickedDistributor = pickDistributorMatch({
    distributorIndex: context.distributorCatalog,
    contentMatch,
    tidalMatch,
    contentEntry,
    fallbackSlug,
    fallbackTitle,
    fallbackReleaseDate: entry.suggestedWebsiteReleaseFields?.releaseDate || null,
  });
  const chosenSource = chooseSource({
    contentEntry,
    distributorEntry: pickedDistributor,
    releaseJsonData,
    tidalEntry,
    fallback: {
      title: fallbackTitle,
      slug: fallbackSlug,
      type: normalizeTypeValue(fallbackType),
      releaseDate: null,
      year: null,
      upc: null,
      catalogNumber: null,
      trackList: [],
      catalogStatus: null,
      carouselEnabled: false,
      listenAction: null,
    },
  });

  const title = chosenSource.title || fallbackTitle;
  const slug = chosenSource.slug || sanitizeSlug(title);
  const resolvedType = chosenSource.type || "Unknown";
  const releaseDate = chosenSource.releaseDate || null;
  const year = typeof chosenSource.year === "number" ? chosenSource.year : null;
  const catalogStatus = chosenSource.catalogStatus || null;
  const upc = chosenSource.upc || null;
  const catalogNumber = chosenSource.catalogNumber || null;
  const trackList = normalizeTrackList(chosenSource.trackList);
  const isrcs = dedupeIsrcValues(trackList.map((track) => track.ISRC));
  const carouselCandidate = Boolean(chosenSource.carouselEnabled);
  const listenAction = resolveListenAction(chosenSource, contentEntry);

  const warnings = Array.isArray(entry.warnings) ? entry.warnings.slice() : [];
  if (!contentEntry && !chosenSource.isFromTidal && !chosenSource.isFromReleaseJson && !entry.inferredTitle) {
    warnings.push("missing inference basis");
  }

  const hasTypeWarning = warnings.includes("unclear type") || resolvedType === "Unknown" && !chosenSource.isFromContent;
  const hasSlugMismatch = entry.slugMismatch || warnings.includes("slugMismatch");
  const hasNoMatch = !contentMatch.match && !pickedDistributor.match && !tidalMatch.match;
  const suspiciousInference = !contentMatch.match && !pickedDistributor.match && !tidalMatch.match
    && (Number(entry.titleConfidence || 0) < 0.7 || Number(entry.slugConfidence || 0) < 0.7);

  const confidence = deriveConfidence({
    hasAudio,
    hasCover,
    hasTypeWarning,
    hasSlugMismatch,
    hasNoMatch,
    suspiciousInference,
    hasContentMatch: contentMatch.match,
    hasDistributorMatch: pickedDistributor.match,
    hasCleanTidalMatch: tidalMatch.match && tidalMatch.provider === TIDAL_PROVIDER,
  });

  const notes = buildConfidenceNotes({
    title,
    slug,
    resolvedType,
    hasAudio,
    hasCover,
    confidence,
    contentMatch,
    distributorMatch: pickedDistributor,
    tidalMatch,
    hasTypeWarning,
    hasSlugMismatch,
    suspiciousInference,
    hasNoMatch,
    source: chosenSource,
  });

  return {
    folderName: entry.folderName,
    sourceFolder: entry.folderPath,
    title,
    slug,
    type: resolvedType,
    status: "released",
    releaseDate,
    year,
    upc,
    catalogNumber,
    trackList,
    isrcs,
    coverCandidate,
    audioCandidate,
    websiteMatch: contentMatch.match,
    distributorMatch: {
      ...pickedDistributor,
    },
    tidalMatch: tidalMatch.match,
    carouselCandidate,
    listenAction,
    catalogStatus,
    confidence,
    reviewStatus: "pending",
    warnings,
    notes,
  };
}

function normalizeMatches(matches) {
  return {
    contentRelease: {
      match: Boolean(matches.contentRelease?.match),
      title: readTextValue(matches.contentRelease?.title),
      slug: readTextValue(matches.contentRelease?.slug),
      type: normalizeTypeValue(matches.contentRelease?.type),
      method: readTextValue(matches.contentRelease?.method) || "none",
      source: readTextValue(matches.contentRelease?.source) || "content/releases.ts",
    },
    tidalImportedMatch: {
      match: Boolean(matches.tidalImportedMatch?.match),
      title: readTextValue(matches.tidalImportedMatch?.title),
      slug: readTextValue(matches.tidalImportedMatch?.slug),
      type: normalizeTypeValue(matches.tidalImportedMatch?.type),
      method: readTextValue(matches.tidalImportedMatch?.method) || "none",
      source: readTextValue(matches.tidalImportedMatch?.source) || "content/releases.imported.json",
      provider: readTextValue(matches.tidalImportedMatch?.provider),
      available: matches.tidalImportedMatch?.available ?? true,
    },
  };
}

function readDistributorInventory(inputPath, required) {
  if (!existsSync(inputPath)) {
    if (required) fail(`Missing distributor inventory file: ${inputPath}`);
    return null;
  }

  const raw = readJson(inputPath);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    if (required) fail(`Invalid distributor inventory payload: expected object at ${inputPath}`);
    return null;
  }

  return raw;
}

function buildDistributorIndex(entries) {
  if (!Array.isArray(entries)) return {
    available: false,
    bySlug: new Map(),
    byTitle: new Map(),
    bySlugDate: new Map(),
    byTitleDate: new Map(),
    byUpc: new Map(),
    byUpcDate: new Map(),
  };

  const bySlug = new Map();
  const byTitle = new Map();
  const bySlugDate = new Map();
  const byTitleDate = new Map();
  const byUpc = new Map();
  const byUpcDate = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const title = readTextValue(entry.title) || readTextValue(entry.slug);
    if (!title) continue;

    const slug = sanitizeSlug(readTextValue(entry.slug) || title);
    const dateKey = normalizeDate(readTextValue(entry.releaseDate));
    const upc = normalizeUpc(readTextValue(entry.UPC || entry.upc));

    const normalized = {
      source: "scripts/distributor-inventory.json",
      title,
      slug,
      type: normalizeTypeValue(readTextValue(entry.inferredType) || readTextValue(entry.type)),
      releaseDate: dateKey || null,
      year: readYearValue(entry.year),
      upc,
      catalogNumber: readTextValue(entry.catalogNumber),
      trackList: normalizeTrackList(readArrayValue(entry.trackList)),
    };

    const normalizedTitle = normalizeTitle(title);
    if (!bySlug.has(slug)) bySlug.set(slug, normalized);
    if (!byTitle.has(normalizedTitle)) byTitle.set(normalizedTitle, normalized);
    if (dateKey) {
      const bySlugDateKey = `${slug}||${dateKey}`;
      const byTitleDateKey = `${normalizedTitle}||${dateKey}`;
      if (!bySlugDate.has(bySlugDateKey)) bySlugDate.set(bySlugDateKey, normalized);
      if (!byTitleDate.has(byTitleDateKey)) byTitleDate.set(byTitleDateKey, normalized);
      if (upc) {
        const byUpcDateKey = `${upc}||${dateKey}`;
        if (!byUpcDate.has(byUpcDateKey)) byUpcDate.set(byUpcDateKey, normalized);
      }
    }

    if (upc) {
      if (!byUpc.has(upc)) byUpc.set(upc, normalized);
    }
  }

  return {
    available: true,
    bySlug,
    byTitle,
    bySlugDate,
    byTitleDate,
    byUpc,
    byUpcDate,
  };
}

function pickDistributorMatch({
  distributorIndex,
  contentMatch,
  tidalMatch,
  contentEntry,
  fallbackSlug,
  fallbackTitle,
  fallbackReleaseDate,
}) {
  if (!distributorIndex?.available) {
    return {
      match: false,
      source: "scripts/distributor-inventory.json",
      method: "none",
      slug: null,
      title: null,
      type: null,
      releaseDate: null,
      year: null,
      upc: null,
      catalogNumber: null,
      trackList: [],
      isrcs: [],
      available: false,
    };
  }

  const slugCandidates = Array.from(new Set([
    sanitizeSlug(fallbackSlug),
    sanitizeSlug(contentMatch?.slug || contentEntry?.slug || ""),
    sanitizeSlug(tidalMatch?.slug || ""),
  ])).filter(Boolean);

  const titleCandidates = Array.from(new Set([
    normalizeTitle(fallbackTitle),
    normalizeTitle(contentMatch?.title || ""),
    normalizeTitle(tidalMatch?.title || ""),
    normalizeTitle(contentEntry?.title || ""),
  ])).filter(Boolean);

  const dateCandidates = Array.from(new Set([
    normalizeDate(fallbackReleaseDate),
    normalizeDate(contentMatch?.releaseDate || ""),
    normalizeDate(contentEntry?.releaseDate || ""),
    normalizeDate(tidalMatch?.releaseDate || ""),
  ])).filter(Boolean);

  const upcCandidates = Array.from(new Set([
    normalizeUpc(contentMatch?.upc || ""),
    normalizeUpc(tidalMatch?.upc || ""),
    normalizeUpc(contentEntry?.upc || ""),
  ])).filter(Boolean);

  const matched = findDistributorMatch({
    distributorIndex,
    slugCandidates,
    titleCandidates,
    dateCandidates,
    upcCandidates,
  });

  if (!matched) {
    return {
      match: false,
      source: "scripts/distributor-inventory.json",
      method: "none",
      slug: null,
      title: null,
      type: null,
      releaseDate: null,
      year: null,
      upc: null,
      catalogNumber: null,
      trackList: [],
      isrcs: [],
      available: true,
    };
  }

  return {
    match: true,
    source: "scripts/distributor-inventory.json",
    method: matched.method,
    slug: matched.entry.slug,
    title: matched.entry.title,
    type: normalizeTypeValue(matched.entry.type),
    releaseDate: matched.entry.releaseDate || null,
    year: readYearValue(matched.entry.year),
    upc: matched.entry.upc || null,
    catalogNumber: matched.entry.catalogNumber || null,
    trackList: matched.entry.trackList || [],
    isrcs: dedupeIsrcValues((matched.entry.trackList || []).map((track) => track.ISRC)),
    available: true,
  };
}

function findDistributorMatch({ distributorIndex, slugCandidates, titleCandidates, dateCandidates, upcCandidates }) {
  for (const upc of upcCandidates) {
    const upcMatch = distributorIndex.byUpc.get(upc);
    if (upcMatch) return { method: "upc", entry: upcMatch };
  }

  for (const upc of upcCandidates) {
    for (const date of dateCandidates) {
      const byUpcDate = distributorIndex.byUpcDate.get(`${upc}||${date}`);
      if (byUpcDate) return { method: "upc+date", entry: byUpcDate };
    }
  }

  for (const date of dateCandidates) {
    for (const slug of slugCandidates) {
      const bySlugDate = distributorIndex.bySlugDate.get(`${slug}||${date}`);
      if (bySlugDate) return { method: "slug+date", entry: bySlugDate };
    }
    for (const title of titleCandidates) {
      const byTitleDate = distributorIndex.byTitleDate.get(`${title}||${date}`);
      if (byTitleDate) return { method: "title+date", entry: byTitleDate };
    }
  }

  for (const slug of slugCandidates) {
    const bySlug = distributorIndex.bySlug.get(sanitizeSlug(slug));
    if (bySlug) return { method: "slug", entry: bySlug };
  }

  for (const title of titleCandidates) {
    const byTitle = distributorIndex.byTitle.get(title);
    if (byTitle) return { method: "title", entry: byTitle };
  }

  return null;
}

function readContentReleases() {
  if (!existsSync(RELEASES_TS_PATH)) {
    return {
      bySlug: new Map(),
      byTitle: new Map(),
      bySource: new Map(),
    };
  }

  const source = readFileSync(RELEASES_TS_PATH, "utf8");
  const blocks = extractReleaseObjectBlocks(source);
  const entries = blocks
    .map(parseReleaseEntryFromBlock)
    .filter((entry) => entry !== null && Boolean(entry.title) && Boolean(entry.slug));

  const bySlug = new Map();
  const byTitle = new Map();
  const bySource = new Map();

  for (const entry of entries) {
    const slug = sanitizeSlug(entry.slug);
    bySlug.set(slug, entry);
    byTitle.set(normalizeTitle(entry.title), entry);
    if (entry.slug || entry.title) {
      bySource.set(`${readTextValue(entry.source) || ""}:${slug}`, entry);
      bySource.set(`${readTextValue(entry.source) || "content"}:${normalizeTitle(entry.title)}`, entry);
    }
  }

  return { bySlug, byTitle, bySource };
}

function parseReleaseEntryFromBlock(block) {
  const title = readStringProperty(block, "title");
  if (!title) return null;

  const slug = readStringProperty(block, "slug") || sanitizeSlug(title);
  const rawType = readStringProperty(block, "type");
  const releaseDate = readStringProperty(block, "releaseDate");
  const catalogStatus = readStringProperty(block, "catalogStatus");
  const year = readNumberProperty(block, "year");
  const carouselEnabled = readBooleanProperty(block, "carouselEnabled");
  const audioPreview = readStringProperty(block, "audioPreview");
  const listenActionText = extractObjectValue(block, "listenAction");
  const embedText = extractObjectValue(block, "embed");
  const linkSeed = {
    catalogStatus,
    carouselEnabled: carouselEnabled ?? false,
    year,
    releaseDate,
  };

  return {
    source: RELEASES_TS_PATH,
    title,
    slug,
    type: normalizeTypeValue(rawType),
    releaseDate,
    year,
    catalogStatus,
    carouselEnabled: Boolean(carouselEnabled),
    audioPreview,
    listenAction: listenActionText ? parseSimpleObject(listenActionText) : null,
    embed: embedText ? parseSimpleObject(embedText) : null,
    ...linkSeed,
  };
}

function pickContentEntry(contentReleases, contentMatch) {
  if (!contentMatch.match) return null;

  const bySlug = contentReleases.bySlug?.get(sanitizeSlug(contentMatch.slug));
  if (bySlug) return bySlug;

  const byTitle = contentReleases.byTitle?.get(normalizeTitle(contentMatch.title));
  if (byTitle) return byTitle;

  return null;
}

function pickImportedEntry(imported, tidalMatch, contentEntry, fallbackSlug, fallbackTitle) {
  if (!tidalMatch.match || !imported?.available) return null;

  const bySlug = imported.bySlug?.get(sanitizeSlug(tidalMatch.slug || fallbackSlug));
  if (bySlug) return bySlug;

  const byTitle = imported.byTitle?.get(normalizeTitle(tidalMatch.title || fallbackTitle));
  if (byTitle) return byTitle;

  if (contentEntry) {
    const byTitle = imported.byTitle?.get(normalizeTitle(contentEntry.title));
    if (byTitle) return byTitle;
  }

  return null;
}

function chooseSource({ contentEntry, distributorEntry, releaseJsonData, tidalEntry, fallback }) {
  if (contentEntry) {
    return {
      ...contentEntry,
      isFromContent: true,
      isFromReleaseJson: false,
      isFromTidal: false,
      isFromDistributor: false,
    };
  }

  if (distributorEntry?.match) {
    return {
      ...distributorEntry,
      isFromContent: false,
      isFromReleaseJson: false,
      isFromTidal: false,
      isFromDistributor: true,
    };
  }

  if (releaseJsonData) {
    return {
      ...releaseJsonData,
      isFromContent: false,
      isFromReleaseJson: true,
      isFromTidal: false,
      isFromDistributor: false,
    };
  }

  if (tidalEntry) {
    return {
      ...tidalEntry,
      isFromContent: false,
      isFromReleaseJson: false,
      isFromTidal: true,
    };
  }

  return {
    ...fallback,
    isFromContent: false,
    isFromReleaseJson: false,
    isFromTidal: false,
    isFromDistributor: false,
  };
}

function resolveListenAction(chosenSource, contentEntry) {
  if (chosenSource.listenAction && isValidListenAction(chosenSource.listenAction)) {
    return chosenSource.listenAction;
  }

  if (contentEntry?.listenAction && isValidListenAction(contentEntry.listenAction)) {
    return contentEntry.listenAction;
  }

  if (contentEntry?.embed && typeof contentEntry.embed === "object" && String(contentEntry.embed.embedUrl || contentEntry.embed.externalUrl || "").trim()) {
    return {
      kind: "disco-embed",
      embedUrl: contentEntry.embed.embedUrl || contentEntry.embed.externalUrl,
      provider: contentEntry.embed.provider || "disco",
      label: "Listen in player",
    };
  }

  if (contentEntry?.audioPreview && typeof contentEntry.audioPreview === "string") {
    return {
      kind: "local-audio",
      audioSrc: contentEntry.audioPreview,
      label: "Listen",
    };
  }

  return null;
}

function deriveConfidence({
  hasAudio,
  hasCover,
  hasTypeWarning,
  hasSlugMismatch,
  hasNoMatch,
  suspiciousInference,
  hasContentMatch,
  hasDistributorMatch,
  hasCleanTidalMatch,
}) {
  if ((hasContentMatch || hasDistributorMatch || hasCleanTidalMatch) && hasAudio && hasCover && !hasTypeWarning && !hasSlugMismatch) {
    return "high";
  }

  if (hasAudio && hasCover && !hasTypeWarning && !hasSlugMismatch && !suspiciousInference) {
    return "medium";
  }

  if (hasNoMatch) {
    if (hasAudio && hasCover && !hasTypeWarning && !hasSlugMismatch) {
      return "medium";
    }
  }

  return "low";
}

function buildConfidenceNotes(context) {
  const notes = [];
  const {
    title,
    slug,
    resolvedType,
    hasAudio,
    hasCover,
    confidence,
    contentMatch,
    distributorMatch,
    tidalMatch,
    source,
    hasTypeWarning,
    hasSlugMismatch,
    suspiciousInference,
    hasNoMatch,
  } = context;

  if (contentMatch.match) {
    notes.push(`Canonical website metadata match: ${title} / ${slug} (${resolvedType}) from ${contentMatch.source}.`);
  } else if (distributorMatch.match) {
    notes.push("Official distributor inventory match found; using distributor data as primary enrichment.");
  } else if (tidalMatch.match) {
    notes.push("No website match found; using TIDAL import metadata as secondary enrichment.");
  } else {
    notes.push("No external metadata match found; inferred from folder scanning.");
  }

  if (!hasAudio) notes.push("Audio missing; media confidence is reduced.");
  if (!hasCover) notes.push("Artwork missing; visual confidence is reduced.");
  if (hasTypeWarning) notes.push("Type remains unclear or inferred with low certainty.");
  if (hasSlugMismatch) notes.push("Title/slug mismatch detected between inferred and canonical sources.");
  if (suspiciousInference) notes.push("Inference scores were weak.");
  if (hasNoMatch && !tidalMatch.match) notes.push("No content or TIDAL match; manual review recommended.");
  if (!hasNoMatch && !contentMatch.match && !source?.isFromContent && distributorMatch.match) {
    notes.push("Distributor metadata selected despite no website match.");
  }

  if (confidence === "high") {
    notes.unshift("High confidence: matched canonical metadata plus both required media candidates present.");
  }

  if (confidence === "medium") {
    notes.unshift("Medium confidence: media present and clear folder/title evidence but incomplete canonical matching.");
  }

  if (confidence === "low") {
    notes.unshift("Low confidence: unclear media/type/slug signals or significant gaps in evidence.");
  }

  return notes;
}

function buildSummary(entries, releaseFolderMapReport) {
  return {
    total: entries.length,
    highConfidenceCount: entries.filter((entry) => entry.confidence === "high").length,
    mediumConfidenceCount: entries.filter((entry) => entry.confidence === "medium").length,
    lowConfidenceCount: entries.filter((entry) => entry.confidence === "low").length,
    websiteMatchCount: entries.filter((entry) => entry.websiteMatch).length,
    distributorMatchCount: entries.filter((entry) => entry.distributorMatch?.match).length,
    tidalMatchCount: entries.filter((entry) => entry.tidalMatch).length,
    carouselCandidateCount: entries.filter((entry) => entry.carouselCandidate).length,
    missingAudioCount: entries.filter((entry) => !entry.audioCandidate).length,
    missingArtworkCount: entries.filter((entry) => !entry.coverCandidate).length,
    slugMismatchCount: entries.filter((entry) => entry.warnings.includes("slugMismatch")).length,
    curatedCarouselMissingFromScanCount: (releaseFolderMapReport?.curatedCarouselMissingFromScan?.length) || 0,
    knownMappedExternalFoldersCount: (releaseFolderMapReport?.knownMappedExternalFolders?.length) || 0,
    unmappedMissingReleasesCount: (releaseFolderMapReport?.unmappedMissingReleases?.length) || 0,
  };
}

function buildReleaseFolderMapReport({
  scannedEntries,
  contentReleases,
  releaseFolderMap,
  scanRoot,
}) {
  const scannedSlugs = new Set(
    (Array.isArray(scannedEntries) ? scannedEntries : []).map((entry) => sanitizeSlug(entry.possibleSlug || entry.inferredSlug || entry.folderName)),
  );
  const bySlug = contentReleases?.bySlug instanceof Map ? contentReleases.bySlug : new Map();
  const mapEntries = Object.entries(releaseFolderMap || {});
  const mappedLookup = new Map(
    mapEntries.map(([slug, value]) => [sanitizeSlug(slug), normalizeReleaseFolderMapEntry(slug, value)]),
  );

  const curatedCarouselMissingFromScan = [];
  const unmappedMissingReleases = [];
  const knownMappedExternalFolders = [];

  for (const [slug, entry] of bySlug.entries()) {
    const scanned = scannedSlugs.has(slug);
    const mapped = mappedLookup.get(slug);

    if (!scanned && entry.carouselEnabled) {
      curatedCarouselMissingFromScan.push({
        slug,
        title: entry.title,
        type: entry.type || "Unknown",
        status: mapped?.status || null,
        sourceFolder: mapped?.sourceFolder || null,
        shouldStageToReleaseLibrary: mapped?.shouldStageToReleaseLibrary ?? null,
      });
    }

    if (!scanned && !mapped) {
      unmappedMissingReleases.push({
        slug,
        title: entry.title,
        type: entry.type || "Unknown",
        status: entry.carouselEnabled ? "carousel" : "catalog",
        carouselEnabled: Boolean(entry.carouselEnabled),
      });
    }
  }

  for (const [slug, entry] of mappedLookup.entries()) {
    const sourceFolder = entry.sourceFolder ? path.resolve(entry.sourceFolder) : "";
    const isExternal =
      entry.status === "external-collab" ||
      !scanRoot ||
      !isPathInside(sourceFolder, scanRoot);

    if (isExternal) {
      knownMappedExternalFolders.push({
        slug,
        status: entry.status,
        sourceFolder: entry.sourceFolder || null,
        notes: entry.notes || "",
        shouldStageToReleaseLibrary: Boolean(entry.shouldStageToReleaseLibrary),
      });
    }
  }

  curatedCarouselMissingFromScan.sort((left, right) => left.title.localeCompare(right.title));
  unmappedMissingReleases.sort((left, right) => left.title.localeCompare(right.title));
  knownMappedExternalFolders.sort((left, right) => left.slug.localeCompare(right.slug));

  return {
    curatedCarouselMissingFromScan,
    knownMappedExternalFolders,
    unmappedMissingReleases,
  };
}

function readReleaseFolderMap() {
  if (!existsSync(RELEASE_FOLDER_MAP_PATH)) return {};
  try {
    const raw = readJson(RELEASE_FOLDER_MAP_PATH);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

    const normalizedMap = {};
    for (const [slug, value] of Object.entries(raw)) {
      if (typeof slug !== "string" || !slug.trim()) continue;
      normalizedMap[sanitizeSlug(slug)] = normalizeReleaseFolderMapEntry(slug, value);
    }

    return normalizedMap;
  } catch (error) {
    console.error(`Warning: unable to read release folder map (${RELEASE_FOLDER_MAP_PATH}): ${error?.message || String(error)}`);
    return {};
  }
}

function normalizeReleaseFolderMapEntry(slug, value) {
  if (!value || typeof value !== "object") return {
    slug,
    status: "pending",
    notes: "missing map payload",
    sourceFolder: "",
    shouldStageToReleaseLibrary: false,
  };

  return {
    slug,
    status: normalizeMappedStatus(value.status),
    notes: String(value.notes ?? ""),
    sourceFolder: String(value.sourceFolder ?? ""),
    shouldStageToReleaseLibrary: Boolean(value.shouldStageToReleaseLibrary),
  };
}

function normalizeMappedStatus(value) {
  const normalized = String(value ?? "pending").toLowerCase();
  if (["released", "pending", "unreleased", "external-collab"].includes(normalized)) return normalized;
  return "pending";
}

function isPathInside(candidatePath, rootPath) {
  if (!candidatePath || !rootPath) return false;
  const normalizedRoot = path.resolve(rootPath).toLowerCase();
  const normalizedCandidate = path.resolve(candidatePath).toLowerCase();
  const rootWithSeparator = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;
  return normalizedCandidate === normalizedRoot || normalizedCandidate.startsWith(rootWithSeparator);
}

function writeMarkdown(filePath, preview) {
  const lines = [];
  const { summary } = preview;
  const entries = preview.entries;

  lines.push("# Released Folder Metadata Preview");
  lines.push("");
  lines.push(`Generated: ${preview.generatedAt}`);
  lines.push(`Source inventory: ${preview.sourceInventoryPath}`);
  lines.push("Status: review-only. No release files are written.");
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total candidates: ${summary.total}`);
  lines.push(`- High-confidence ready: ${summary.highConfidenceCount}`);
  lines.push(`- Medium-confidence: ${summary.mediumConfidenceCount}`);
  lines.push(`- Low-confidence/problem: ${summary.lowConfidenceCount}`);
  lines.push(`- Website matches: ${summary.websiteMatchCount}`);
  lines.push(`- Distributor matches: ${summary.distributorMatchCount}`);
  lines.push(`- TIDAL matches: ${summary.tidalMatchCount}`);
  lines.push(`- Carousel candidates: ${summary.carouselCandidateCount}`);
  lines.push(`- Missing audio: ${summary.missingAudioCount}`);
  lines.push(`- Missing artwork: ${summary.missingArtworkCount}`);
  lines.push(`- Curated carousel releases missing from scan: ${summary.curatedCarouselMissingFromScanCount}`);
  lines.push(`- Known mapped external folders: ${summary.knownMappedExternalFoldersCount}`);
  lines.push(`- Unmapped missing releases: ${summary.unmappedMissingReleasesCount}`);
  lines.push("");

  renderReleaseFolderMapSections(lines, preview.releaseFolderMap);

  renderSection(lines, "High-confidence ready candidates", entries.filter((entry) => entry.confidence === "high"));
  renderSection(lines, "Medium-confidence review candidates", entries.filter((entry) => entry.confidence === "medium"));
  renderSection(lines, "Low-confidence/problem candidates", entries.filter((entry) => entry.confidence === "low"));
  renderCarouselSection(lines, entries.filter((entry) => entry.carouselCandidate));
  renderMissingSection(lines, "Missing artwork", entries.filter((entry) => !entry.coverCandidate), "coverCandidate");
  renderMissingSection(lines, "Missing audio", entries.filter((entry) => !entry.audioCandidate), "audioCandidate");
  renderMismatchSection(lines, entries.filter((entry) => entry.warnings.includes("slugMismatch") || entry.warnings.includes("type mismatch")));

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function renderSection(lines, title, entries) {
  lines.push(`## ${title} (${entries.length})`);
  lines.push("");
  if (!entries.length) {
    lines.push("No entries.");
    lines.push("");
    return;
  }

  for (const entry of entries) {
    lines.push(`- ${entry.title} (${entry.slug})`);
    lines.push(`  - Status: ${entry.status}`);
    lines.push(`  - Type: ${entry.type}`);
    lines.push(`  - Confidence: ${entry.confidence} · reviewStatus: ${entry.reviewStatus}`);
    lines.push(`  - Source folder: \`${path.relative(repoRoot, entry.sourceFolder)}\``);
    lines.push(`  - Release: date ${entry.releaseDate ?? "unknown"} | year ${entry.year ?? "unknown"}`);
    lines.push(`  - Website match: ${entry.websiteMatch ? "yes" : "no"}, TIDAL match: ${entry.tidalMatch ? "yes" : "no"}, carousel candidate: ${entry.carouselCandidate ? "yes" : "no"}`);
    if (entry.distributorMatch) {
      lines.push(`  - Distributor match: ${entry.distributorMatch.match ? "yes" : "no"}`);
    }
    lines.push(`  - Cover candidate: ${entry.coverCandidate ? path.relative(repoRoot, entry.coverCandidate) : "missing"}`);
    lines.push(`  - Audio candidate: ${entry.audioCandidate ? path.relative(repoRoot, entry.audioCandidate) : "missing"}`);
    if (entry.catalogStatus) {
      lines.push(`  - Catalog status: ${entry.catalogStatus}`);
    }
    if (entry.listenAction) {
      lines.push(`  - Listen action: ${renderListenAction(entry.listenAction)}`);
    }
    if (entry.warnings.length) {
      lines.push(`  - Warnings: ${entry.warnings.join("; ")}`);
    }
    if (entry.notes.length) {
      lines.push("  - Notes:");
      for (const note of entry.notes) {
        lines.push(`    - ${note}`);
      }
    }
    lines.push("");
  }
}

function renderCarouselSection(lines, entries) {
  lines.push(`## Existing carousel candidates (${entries.length})`);
  lines.push("");
  if (!entries.length) {
    lines.push("No candidates currently flagged for carousel.");
    lines.push("");
    return;
  }

  for (const entry of entries) {
    lines.push(`- ${entry.title} (${entry.slug})`);
  }

  lines.push("");
}

function renderMissingSection(lines, title, entries, fieldName) {
  lines.push(`## ${title} (${entries.length})`);
  lines.push("");
  if (!entries.length) {
    lines.push("No entries.");
    lines.push("");
    return;
  }

  for (const entry of entries) {
    const value = fieldName === "coverCandidate" ? entry.coverCandidate : entry.audioCandidate;
    lines.push(`- ${entry.title} (${entry.slug}) — ${fieldName}: ${value ?? "missing"}`);
  }
  lines.push("");
}

function renderMismatchSection(lines, entries) {
  lines.push(`## Slug/type mismatch review items (${entries.length})`);
  lines.push("");
  if (!entries.length) {
    lines.push("No slug/type mismatch items.");
    lines.push("");
    return;
  }

  for (const entry of entries) {
    lines.push(`- ${entry.title} (${entry.slug})`);
    if (entry.warnings.length) {
      lines.push(`  - ${entry.warnings.join("; ")}`);
    }
  }
  lines.push("");
}

function renderReleaseFolderMapSections(lines, releaseFolderMap) {
  const curatedCarouselMissingFromScan = releaseFolderMap?.curatedCarouselMissingFromScan ?? [];
  const knownMappedExternalFolders = releaseFolderMap?.knownMappedExternalFolders ?? [];
  const unmappedMissingReleases = releaseFolderMap?.unmappedMissingReleases ?? [];

  lines.push(`## Curated carousel releases missing from scan (${curatedCarouselMissingFromScan.length})`);
  lines.push("");
  if (!curatedCarouselMissingFromScan.length) {
    lines.push("No curated carousel releases are missing from this scan.");
    lines.push("");
  } else {
    for (const release of curatedCarouselMissingFromScan) {
      lines.push(`- ${release.title} (${release.slug})`);
    }
    lines.push("");
  }

  lines.push(`## Known mapped external folders (${knownMappedExternalFolders.length})`);
  lines.push("");
  if (!knownMappedExternalFolders.length) {
    lines.push("No mapped external folders currently reported.");
    lines.push("");
  } else {
    for (const entry of knownMappedExternalFolders) {
      const source = entry.sourceFolder ? `source: ${entry.sourceFolder}` : "source: unknown";
      const status = `status: ${entry.status || "unknown"}`;
      const stage = `stageToReleaseLibrary: ${Boolean(entry.shouldStageToReleaseLibrary) ? "yes" : "no"}`;
      lines.push(`- ${entry.slug} (${source}, ${status}, ${stage})`);
      if (entry.notes) {
        lines.push(`  - ${entry.notes}`);
      }
    }
    lines.push("");
  }

  lines.push(`## Unmapped missing releases (${unmappedMissingReleases.length})`);
  lines.push("");
  if (!unmappedMissingReleases.length) {
    lines.push("No unmapped missing releases.");
    lines.push("");
  } else {
    for (const entry of unmappedMissingReleases) {
      const flags = [];
      if (entry.carouselEnabled) flags.push("carousel");
      flags.push(entry.type || "Unknown");
      lines.push(`- ${entry.title} (${entry.slug})`);
      lines.push(`  - status: ${entry.status}`);
      if (entry.carouselEnabled) {
        lines.push(`  - flags: ${flags.join(", ")}`);
      }
    }
    lines.push("");
  }
}

function renderListenAction(listenAction) {
  const kind = listenAction.kind || "unknown";
  if (kind === "local-audio" && listenAction.audioSrc) return `local-audio (${listenAction.audioSrc})`;
  if (kind === "disco-embed" && listenAction.embedUrl) return `disco-embed (${listenAction.embedUrl})`;
  if (kind === "external" && listenAction.url) return `external (${listenAction.url})`;
  return `${kind}`;
}

function readImportedCatalog() {
  if (!existsSync(RELEASES_IMPORTED_PATH)) {
    return {
      available: false,
      bySlug: new Map(),
      byTitle: new Map(),
      entries: [],
    };
  }

  const imported = readJson(RELEASES_IMPORTED_PATH);
  const rawEntries = Array.isArray(imported?.draftEntries) ? imported.draftEntries : [];
  const parsed = rawEntries
    .map((entry) => {
      if (!entry || (!readTextValue(entry.title) && !readTextValue(entry.slug))) return null;
      return {
        title: readTextValue(entry.title),
        slug: sanitizeSlug(readTextValue(entry.slug) || readTextValue(entry.title)),
        type: normalizeTypeValue(entry.type),
        releaseDate: readTextValue(entry.releaseDate),
        year: readYearValue(entry.year),
        catalogStatus: "pending-tidal",
        source: readTextValue(entry.catalogSource?.source) || readTextValue(entry.catalogSource?.provider) || readTextValue(imported?.provider) || readTextValue(imported?.source) || TIDAL_PROVIDER,
        provider: readTextValue(entry.catalogSource?.provider) || readTextValue(imported?.provider) || readTextValue(imported?.source) || TIDAL_PROVIDER,
      };
    })
    .filter(Boolean);

  const bySlug = new Map();
  const byTitle = new Map();
  for (const entry of parsed) {
    const slug = sanitizeSlug(entry.slug);
    const normalizedTitle = normalizeTitle(entry.title);
    if (!bySlug.has(slug)) bySlug.set(slug, entry);
    if (!byTitle.has(normalizedTitle)) byTitle.set(normalizedTitle, entry);
  }

  return {
    available: true,
    entries: parsed,
    bySlug,
    byTitle,
  };
}

function readOptionalJson(filePath) {
  if (!filePath || !existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function parseSimpleObject(text) {
  const source = text;
  return {
    kind: readStringProperty(source, "kind"),
    label: readStringProperty(source, "label"),
    provider: readStringProperty(source, "provider"),
    url: readStringProperty(source, "url"),
    embedUrl: readStringProperty(source, "embedUrl"),
    audioSrc: readStringProperty(source, "audioSrc"),
  };
}

function isValidListenAction(action) {
  if (!action || typeof action !== "object") return false;
  const kind = String(action.kind || "").toLowerCase();
  return ["external", "disco-embed", "local-audio"].includes(kind) && Boolean(action.url || action.embedUrl || action.audioSrc);
}

function normalizeTypeValue(value) {
  const source = String(value ?? "").toLowerCase().trim();
  if (source === "single") return "Single";
  if (source === "ep") return "EP";
  if (source === "remix") return "Remix";
  if (source === "mix" || source === "album" || source === "set") return "Album";
  return "Unknown";
}

function extractReleaseObjectBlocks(sourceText) {
  const marker = "export const releases";
  const markerIndex = sourceText.indexOf(marker);
  if (markerIndex === -1) return [];

  const assignmentIndex = sourceText.indexOf("=", markerIndex);
  if (assignmentIndex === -1) return [];

  const arrayStart = sourceText.indexOf("[", assignmentIndex);
  if (arrayStart === -1) return [];

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

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{" && depth === 0 && previous !== "=") {
      objectStart = index;
      depth = 1;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart !== -1) {
        blocks.push(sourceText.slice(objectStart, index + 1));
        objectStart = -1;
      }
    } else if (char === "]" && depth === 0) {
      break;
    }
  }

  return blocks;
}

function extractObjectValue(text, key) {
  const pattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*\\{`, "m");
  const startMatch = text.match(pattern);
  if (!startMatch || startMatch.index === undefined) return null;

  const keyIndex = startMatch.index + startMatch[0].length - 1;
  let depth = 0;
  let inString = false;
  let quote = "";
  let escaping = false;
  let end = -1;

  for (let index = keyIndex; index < text.length; index += 1) {
    const char = text[index];
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

    if (char === "\"" || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
  }

  if (end < 0) return null;
  return text.slice(keyIndex, end + 1);
}

function readStringProperty(source, key) {
  const keyPattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`);
  const match = source.match(keyPattern);
  return match ? unescapeString(match[2]).trim() : undefined;
}

function readNumberProperty(source, key) {
  const keyPattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*([0-9]+)`, "i");
  const match = source.match(keyPattern);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBooleanProperty(source, key) {
  const keyPattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*(true|false)`, "i");
  const match = source.match(keyPattern);
  if (!match) return null;
  return match[1].toLowerCase() === "true";
}

function readTextValue(value) {
  if (typeof value === "string") return value.trim();
  return "";
}

function readObjectValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value;
}

function readArrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTrackList(value) {
  return readArrayValue(value)
    .map((track, index) => {
      if (!track || typeof track !== "object") return null;
      return {
        trackNumber: parseTrackNumber(readTextValue(track.trackNumber) || String(index + 1)),
        title: readTextValue(track.title),
        mixVersion: readTextValue(track.mixVersion),
        ISRC: readTextValue(track.ISRC || track.isrc || ""),
        primaryArtists: parseArtistList(readTextValue(track.primaryArtists)),
        featuringArtists: parseArtistList(readTextValue(track.featuringArtists)),
        remixers: parseArtistList(readTextValue(track.remixers)),
        duration: normalizeDuration(readTextValue(track.duration || track.trackLength || track["track length"])),
        genre: readTextValue(track.genre),
        subgenre: readTextValue(track.subgenre),
      };
    })
    .filter((track) => track && track.title)
    .sort((left, right) => (left.trackNumber || 0) - (right.trackNumber || 0));
}

function normalizeDate(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return trimmed;
  return date.toISOString().slice(0, 10);
}

function parseTrackNumber(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function parseArtistList(value) {
  if (!value) return [];
  return String(value)
    .split(/[,/;]| & /)
    .map((entry) => sanitizeText(entry))
    .filter(Boolean)
    .filter((artist, index, list) => index === list.findIndex((other) => normalizeTitle(other) === normalizeTitle(artist)));
}

function dedupeIsrcValues(values) {
  const seen = new Set();
  const deduped = [];
  for (const value of values) {
    const text = readTextValue(value).toUpperCase();
    if (!text || seen.has(text)) continue;
    seen.add(text);
    deduped.push(text);
  }
  return deduped;
}

function readYearValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDuration(value) {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(normalized)) return normalized;
  const parsed = Number(normalized);
  if (Number.isFinite(parsed) && parsed > 0) {
    const minutes = Math.floor(parsed / 60);
    const seconds = String(Math.floor(parsed % 60)).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }
  return normalized;
}

function normalizeUpc(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "")
    .trim();
}

function unescapeString(value) {
  return String(value)
    .replace(/\\(["'`\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function sanitizeSlug(value) {
  return normalizeTitle(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled-release";
}

function normalizeTitle(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function fail(message) {
  console.error(`Released folder metadata preview failed: ${message}`);
  process.exit(1);
}
