#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const RELEASES_TS_PATH = path.join(repoRoot, "content", "releases.ts");
const RELEASES_IMPORTED_PATH = path.join(repoRoot, "content", "releases.imported.json");
const RELEASE_FOLDER_MAP_PATH = path.join(repoRoot, "content", "release-folder-map.json");
const OUTPUT_JSON_PATH = path.join(__dirname, "released-folder-inventory.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "released-folder-inventory.md");
const DEFAULT_RELEASE_ROOT = "D:\\Broey\\Releases\\Already Released";

const AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".aiff", ".flac"]);
const ARTWORK_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const METADATA_EXTENSIONS = new Set([".txt", ".md", ".json"]);
const RELEASE_JSON_NAME = "release.json";
const TIDAL = "tidal";

const REMIX_MARKERS = ["remix", "remixes"];

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const releaseRoot = args.source || DEFAULT_RELEASE_ROOT;
  if (!existsSync(releaseRoot)) {
    fail(`Source root not found: ${releaseRoot}`);
  }

  const localReleaseIndex = readLocalReleases();
  const importedCatalog = readImportedCatalog();
  const releases = scanAlreadyReleasedFolders({
    releasesFolder: releaseRoot,
    localIndex: localReleaseIndex,
    importedCatalog,
  });
  const releaseFolderMap = readReleaseFolderMap();
  const folderMapReport = buildReleaseFolderMapReport({
    scannedEntries: releases,
    localIndex: localReleaseIndex,
    releaseFolderMap,
    scanRoot: releaseRoot,
  });

  const duplicateFolderTitles = buildDuplicateTitleMap(releases);
  for (const release of releases) {
    const normalizedTitle = normalizeTitle(release.possibleTitle);
    if (duplicateFolderTitles.get(normalizedTitle) > 1 && !release.warnings.includes("duplicate title")) {
      release.warnings.push("duplicate title");
    }

    if (!release.matches.contentRelease.match && release.warnings.indexOf("unmatched content release") === -1) {
      release.warnings.push("unmatched content release");
    }
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    scanRoot: releaseRoot,
    releaseFolderCount: releases.length,
    audioFileCount: releases.reduce((total, entry) => total + entry.audioFileCount, 0),
    artworkFileCount: releases.reduce((total, entry) => total + entry.artworkFileCount, 0),
    matchedContentReleaseCount: releases.filter((entry) => entry.matches.contentRelease.match).length,
    matchedTidalImportedCount: releases.filter((entry) => entry.matches.tidalImportedMatch.match).length,
    unmatchedCount: releases.filter((entry) => !entry.matches.contentRelease.match).length,
    ambiguousTypeCount: releases.filter((entry) => entry.isTypeUnclear).length,
    missingAudioCount: releases.filter((entry) => entry.audioFileCount === 0).length,
    missingArtworkCount: releases.filter((entry) => entry.artworkFileCount === 0).length,
    curatedCarouselMissingFromScanCount: folderMapReport.curatedCarouselMissingFromScan.length,
    knownMappedExternalFoldersCount: folderMapReport.knownMappedExternalFolders.length,
    unmappedMissingReleasesCount: folderMapReport.unmappedMissingReleases.length,
  };

  const inventory = {
    summary,
    entries: releases,
    releaseFolderMap: folderMapReport,
  };

  writeJson(OUTPUT_JSON_PATH, inventory);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, inventory);

  console.log(`Release folder inventory written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Release folder markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Folders scanned: ${summary.releaseFolderCount}`);
  console.log(`Matched content releases: ${summary.matchedContentReleaseCount}`);
  console.log(`Matched tidal imported entries: ${summary.matchedTidalImportedCount}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/released-folder-inventory.mjs [--source <path>] [--help]");
  console.log("");
  console.log("Default source:");
  console.log(`  ${DEFAULT_RELEASE_ROOT}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/released-folder-inventory.json");
  console.log("  scripts/released-folder-inventory.md");
  console.log("");
  console.log("This script is report-only. It does not move, rename, delete, copy, or modify release files.");
}

function parseArgs(args) {
  const result = {
    source: null,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }

    if (arg === "--source") {
      if (index + 1 >= args.length) fail("Missing value for --source. Use --source <path>.");
      result.source = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--source=")) {
      result.source = arg.replace(/^--source=/, "");
      continue;
    }

    if (!arg.startsWith("-")) {
      if (!result.source) {
        result.source = arg;
        continue;
      }
    }

    fail(`Unknown argument: ${arg}`);
  }

  return result;
}

function scanAlreadyReleasedFolders({ releasesFolder, localIndex, importedCatalog }) {
  const folderEntries = readdirSync(releasesFolder, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return folderEntries.map((folderName) => scanReleaseFolder({
    folderName,
    folderPath: path.join(releasesFolder, folderName),
    localIndex,
    importedCatalog,
  }));
}

function scanReleaseFolder({ folderName, folderPath, localIndex, importedCatalog }) {
  const detection = collectFolderAssets({ folderPath });
  const inferredTitle = inferTitleFromSource({
    folderName,
    releaseJson: detection.releaseJson?.data,
  });
  const inferredSlug = inferSlugFromSource({
    folderName,
    releaseJson: detection.releaseJson?.data,
    possibleTitle: inferredTitle,
  });
  const inferredType = inferPossibleType({
    folderName,
    title: inferredTitle,
    trackCountHint: dedupeTrackSignatures(detection.audioFiles),
    audioCount: detection.audioFiles.length,
    hasRemixToken: containsAnyToken(folderName, REMIX_MARKERS) || containsAnyToken(inferredTitle, REMIX_MARKERS),
    hasAlbumSignal: containsAnyToken(folderName, ["album", "lp", "longplay"]) || containsAnyToken(inferredTitle, ["album", "lp", "longplay"]),
    hasEPSignal: containsAnyToken(folderName, ["ep"]) || containsAnyToken(inferredTitle, ["ep"]),
    hasMasterSignal: detectMasterAudioSignal(detection.audioFiles),
  });
  const standardizedFolderName = sanitizeSlug(folderName);

  const folderTokens = tokenizeText(folderName);
  const masterCandidates = detection.audioFiles
    .map((file) => ({
      ...file,
      score: scoreMasterAudioCandidate(file, folderTokens),
    }))
    .filter((candidate) => candidate.score > 0);
  const likelyMasterAudioFile = pickBestMasterAudio(masterCandidates, detection.audioFiles);
  const trackSignatureCount = dedupeTrackSignatures(masterCandidates.length ? masterCandidates : detection.audioFiles);

  const likelyMasterAudio = maybePath(likelyMasterAudioFile?.path);
  const coverCandidates = detection.artworkFiles.map((file) => ({
    ...file,
    score: scoreCoverImageCandidate(file, folderTokens),
  }));
  const likelyCoverImage = pickBestCoverImage(coverCandidates);

  const isTypeUnclear =
    inferredType === "Unknown" ||
    (!trackSignatureCount && detection.audioFiles.length > 1) ||
    (trackSignatureCount > 1 && detection.audioFiles.length > 30);

  const contentMatch = findContentMatch({
    localIndex,
    possibleSlug: inferredSlug,
    possibleTitle: inferredTitle,
  });
  const importedMatch = findImportedMatch({
    importedCatalog,
    possibleSlug: inferredSlug,
    possibleTitle: inferredTitle,
  });

  const canonicalTitle = contentMatch.match ? contentMatch.title : inferredTitle;
  const canonicalSlug = contentMatch.match ? contentMatch.slug : inferredSlug;
  const canonicalType = contentMatch.match ? contentMatch.type : inferredType;
  const slugMismatch = contentMatch.match && canonicalSlug !== inferredSlug;
  const possibleType = canonicalType;

  const coverImageForWebsite = likelyCoverImage ? convertToSiteAssetPath(canonicalSlug, likelyCoverImage.ext) : null;
  const websiteType = mapForWebsiteType(possibleType);
  const notesCount = detection.metadataFiles.length;

  const titleConfidence = computeConfidence({
    source: contentMatch.match ? "content" : detection.releaseJson?.data?.title ? "releaseJson" : "folder",
    method: contentMatch.match ? contentMatch.method : "inferred",
  });
  const slugConfidence = computeConfidence({
    source: contentMatch.match ? "content" : detection.releaseJson?.data?.slug ? "releaseJson" : "folder",
    method: contentMatch.match ? contentMatch.method : "inferred",
  });
  const typeConfidence = contentMatch.match
    ? 0.97
    : computeTypeConfidence({
      inferredType,
      trackCount: detection.audioFiles.length,
      hasMasterSignal: detectMasterAudioSignal(detection.audioFiles),
    });
  const matchConfidence = contentMatch.match
    ? 0.98
    : importedMatch.match
      ? 0.56
      : 0.18;

  const inferenceNotes = buildInferenceNotes({
    inferredTitle,
    inferredSlug,
    canonicalTitle,
    canonicalSlug,
    inferredType,
    canonicalType,
    contentMatch,
    importedMatch,
    releaseJsonExists: Boolean(detection.releaseJson?.path),
    trackCount: detection.audioFiles.length,
    trackSignatureCount,
    masterSignal: detectMasterAudioSignal(detection.audioFiles),
    slugMismatch,
  });

  const warnings = [];
  if (detection.audioFiles.length === 0) warnings.push("missing audio");
  if (detection.artworkFiles.length === 0) warnings.push("missing artwork");
  if (isTypeUnclear) warnings.push("unclear type");
  if (!contentMatch.match) warnings.push("unmatched content release");
  if (slugMismatch) warnings.push("slugMismatch");
  if (containsAnyToken(folderName, ["wip", "temp", "rough", "test", "sample", "demo"])) warnings.push("unreviewed folder naming");

  return {
    folderName,
    folderPath: folderPath,
    suggestedStandardizedFolderName: standardizedFolderName,
    possibleTitle: canonicalTitle,
    possibleSlug: canonicalSlug,
    inferredTitle,
    inferredSlug,
    possibleType,
    inferredType,
    isTypeUnclear,
    slugMismatch,
    audioFileCount: detection.audioFiles.length,
    likelyMasterAudioFile: likelyMasterAudio,
    artworkFileCount: detection.artworkFiles.length,
    likelyCoverImage: maybePath(likelyCoverImage?.path),
    notesMetadataFileCount: notesCount,
    releaseJsonExists: Boolean(detection.releaseJson?.path),
    releaseJsonPath: maybePath(detection.releaseJson?.path),
    titleConfidence,
    slugConfidence,
    typeConfidence,
    matchConfidence,
    inferenceNotes,
    matches: {
      contentRelease: contentMatch,
      tidalImportedMatch: importedMatch,
    },
    suggestedWebsiteReleaseFields: {
      title: canonicalTitle,
      slug: canonicalSlug,
      type: websiteType,
      coverImage: coverImageForWebsite,
      coverAlt: `${canonicalTitle} cover art`,
      description: `Review and finalize release metadata for ${canonicalTitle}.`,
      releaseDate: null,
      year: null,
    },
    warnings,
  };
}

function collectFolderAssets({ folderPath }) {
  const audioFiles = [];
  const artworkFiles = [];
  const metadataFiles = [];
  const queue = [folderPath];
  let releaseJson = null;
  let releaseJsonPath = null;

  while (queue.length) {
    const current = queue.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      if (AUDIO_EXTENSIONS.has(ext)) {
        audioFiles.push(buildFileRecord(folderPath, fullPath, ext));
      }

      if (ARTWORK_EXTENSIONS.has(ext)) {
        artworkFiles.push(buildFileRecord(folderPath, fullPath, ext));
      }

      if (METADATA_EXTENSIONS.has(ext)) {
        metadataFiles.push(buildFileRecord(folderPath, fullPath, ext));
      }

      if (ext === ".json" && entry.name.toLowerCase() === RELEASE_JSON_NAME) {
        releaseJsonPath = fullPath;
        releaseJson = readReleaseJson(fullPath);
      }
    }
  }

  return {
    audioFiles,
    artworkFiles,
    metadataFiles,
    releaseJson: releaseJson
      ? { path: releaseJsonPath, data: releaseJson }
      : null,
  };
}

function buildFileRecord(root, filePath, ext) {
  const stats = statSync(filePath);
  return {
    path: filePath,
    ext,
    fileName: path.basename(filePath),
    relativePath: path.relative(root, filePath),
    baseName: path.basename(filePath, path.extname(filePath)),
    folderName: path.basename(path.dirname(filePath)),
    depth: path.relative(root, path.dirname(filePath)).split(path.sep).filter(Boolean).length,
    mtimeMs: stats.mtimeMs,
  };
}

function inferTitleFromSource({ folderName, releaseJson }) {
  if (releaseJson) {
    if (typeof releaseJson.title === "string" && releaseJson.title.trim()) return releaseJson.title.trim();
    if (typeof releaseJson.name === "string" && releaseJson.name.trim()) return releaseJson.name.trim();
    if (typeof releaseJson.slug === "string" && releaseJson.slug.trim()) {
      const parsed = parseSlugTokenAsTitle(releaseJson.slug);
      if (parsed) return parsed;
    }
  }
  return prettifyFolderName(folderName);
}

function pickBestMasterAudio(candidates, fallbackAudioFiles) {
  if (candidates.length) {
    const sorted = candidates.sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return right.mtimeMs - left.mtimeMs;
    });
    return sorted[0];
  }

  if (!fallbackAudioFiles.length) return null;

  const sortedFallback = fallbackAudioFiles
    .slice()
    .sort((left, right) => {
      if (left.depth !== right.depth) return left.depth - right.depth;
      return right.mtimeMs - left.mtimeMs;
    });

  return sortedFallback[0];
}

function pickBestCoverImage(candidates) {
  if (!candidates.length) return null;

  const sorted = candidates
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.depth !== right.depth) return left.depth - right.depth;
      return left.fileName.localeCompare(right.fileName);
    });

  return sorted[0];
}

function scoreMasterAudioCandidate(file, folderTokens) {
  let score = 0;
  const fileName = file.baseName.toLowerCase();
  const depthPenalty = file.depth > 2 ? -4 : 0;
  const stemPenalty = /(?:^|[\\/])stems?(?:[\\/]|$)/i.test(file.path) ? -999 : 0;
  const folderMatchCount = folderTokens.filter((token) => fileName.includes(token)).length;

  score += folderMatchCount * 14;
  score += depthPenalty;
  score += stemPenalty;

  if (/(\bmaster\b|\bfinal\b|\bapproved\b|\bhi-?res\b|\bhires\b|\brender\b)/i.test(fileName)) score += 16;
  if (/(^|[^a-z])(v\d+|vol\.?\s*\d+)([^a-z]|$)/i.test(fileName)) score -= 5;
  if (/(distro|distribution|preview|teaser|inst|instrumental|remix|stem|vocal|fx|loop|edit|alt|alternate|wip|temp|rough|draft)/i.test(fileName))
    score -= 12;

  if (file.depth <= 1) score += 18;

  return score;
}

function scoreCoverImageCandidate(file, folderTokens) {
  let score = 0;
  const fileName = file.baseName.toLowerCase();
  const folderMatchCount = folderTokens.filter((token) => fileName.includes(token)).length;

  score += folderMatchCount * 8;
  if (/cover|artwork|art|album|front/.test(fileName)) score += 36;
  if (file.depth <= 1) score += 10;
  if (/logo|icon|banner|promo|promo|social|button|avatar/.test(fileName)) score -= 4;

  return score;
}

function dedupeTrackSignatures(masterCandidates) {
  if (!masterCandidates.length) return 0;

  const signatures = new Set();
  for (const file of masterCandidates) {
    const signature = normalizeTrackSignature(file.baseName);
    if (signature) signatures.add(signature);
  }

  return signatures.size;
}

function normalizeTrackSignature(name) {
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\s*broey\.?\s*-\s*/i, "")
    .replace(/\b(v\d+|v\d+\.\d+)\b/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\b(32-bit|24-bit|16-bit|48|44\.1|44\.8|22050|44100|96000|16bit|24bit|32bit|flac|mp3|wav|aiff|distro|version|instrumental|final|master|edit|mix|remix|preview|stereo)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  return normalized;
}

function inferPossibleType({
  folderName,
  title,
  trackCountHint,
  audioCount,
  hasRemixToken,
  hasAlbumSignal,
  hasEPSignal,
  hasMasterSignal,
}) {
  if (hasRemixToken) return "Remix";
  if (hasAlbumSignal) return "Album";
  if (hasEPSignal) return "EP";
  if (hasMasterSignal && (audioCount <= 2 || trackCountHint <= 1)) return "Single";
  if (audioCount === 1 || trackCountHint <= 1) return "Single";
  if (audioCount <= 2 || trackCountHint <= 4) return "EP";

  return "Unknown";
}

function mapForWebsiteType(type) {
  if (type === "Unknown") return "unknown";
  if (type === "Album") return "mix";
  return type.toLowerCase();
}

function computeConfidence({ source, method }) {
  if (source === "content") {
    if (method === "slug") return 0.98;
    if (method === "title") return 0.94;
    return 0.9;
  }

  if (source === "releaseJson") return 0.86;
  return 0.61;
}

function computeTypeConfidence({ inferredType, trackCount, hasMasterSignal }) {
  if (inferredType === "Single") {
    return hasMasterSignal ? 0.73 : 0.69;
  }
  if (inferredType === "EP") {
    return trackCount <= 2 ? 0.72 : 0.67;
  }
  if (inferredType === "Album") return 0.64;
  if (inferredType === "Remix") return 0.8;
  return 0.4;
}

function detectMasterAudioSignal(audioFiles) {
  if (!audioFiles.length) return false;

  return audioFiles.some((file) => /(\bmaster\b|\bfinal\b|\bapproved\b|\bhi-?res\b|\bhires\b|\brender\b)/i.test(file.baseName));
}

function buildInferenceNotes({
  inferredTitle,
  inferredSlug,
  canonicalTitle,
  canonicalSlug,
  inferredType,
  canonicalType,
  contentMatch,
  importedMatch,
  releaseJsonExists,
  trackCount,
  trackSignatureCount,
  masterSignal,
  slugMismatch,
}) {
  const notes = [];

  if (releaseJsonExists) {
    notes.push("Used release.json as title source when available.");
  } else {
    notes.push(`Defaulted title to folder name: ${inferredTitle}.`);
  }

  if (contentMatch.match) {
    notes.push(`Matched content/releases.ts by ${contentMatch.method}; using canonical title (${canonicalTitle}), slug (${canonicalSlug}), type (${canonicalType}).`);
  } else {
    notes.push(`Heuristic title inferred as ${inferredTitle}; slug inferred as ${inferredSlug};`);
    if (inferredType) {
      notes.push(`Type inferred as ${inferredType}.`);
    }
  }

  if (trackCount > 0) {
    notes.push(`Scanned ${trackCount} audio file(s); signature count ${trackSignatureCount}.`);
  }
  if (masterSignal) notes.push("Master/final audio signal detected.");
  if (slugMismatch) notes.push("Canonical content slug differs from inferred slug.");
  if (!contentMatch.match && importedMatch.match) {
    notes.push(`Matched TIDAL import by ${importedMatch.method}; using as enrichment only.`);
  }

  return notes;
}

function inferSlugFromSource({ folderName, releaseJson, possibleTitle }) {
  if (releaseJson?.slug && String(releaseJson.slug).trim()) {
    return possibleSlugify(releaseJson.slug);
  }

  if (possibleTitle) return possibleSlugify(possibleTitle);
  return sanitizeSlug(folderName);
}

function parseSlugTokenAsTitle(value) {
  if (!value) return null;
  return normalizeTextForTitle(value);
}

function normalizeTextForTitle(value) {
  return value
    .trim()
    .replace(/_/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\b(\.com|\.io|\.net)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeSlug(value) {
  return possibleSlugify(value);
}

function possibleSlugify(value) {
  return normalizeTitle(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled-release";
}

function prettifyFolderName(value) {
  return normalizeTextForTitle(value);
}

function convertToSiteAssetPath(slug, ext) {
  const sanitizedExt = ext.toLowerCase().replace(/^\./, "");
  const assetExt = sanitizedExt === "jpeg" ? "jpg" : sanitizedExt;
  return `/assets/cover-art/${slug}.${assetExt}`;
}

function readLocalReleases() {
  if (!existsSync(RELEASES_TS_PATH)) return [];

  const source = readFileSync(RELEASES_TS_PATH, "utf8");
  const blocks = extractReleaseObjectBlocks(source);

  return blocks.map((block, index) => ({
    title: readStringProperty(block, "title") ?? `Untitled release ${index + 1}`,
    slug: readStringProperty(block, "slug") ?? sanitizeSlug(readStringProperty(block, "title") ?? `release-${index + 1}`),
    type: normalizeCanonicalType(readStringProperty(block, "type")),
    carouselEnabled: readBooleanProperty(block, "carouselEnabled") === true,
    year: readNumberProperty(block, "year"),
    releaseDate: readStringProperty(block, "releaseDate"),
    catalogStatus: readStringProperty(block, "catalogStatus"),
  }));
}

function normalizeCanonicalType(value) {
  const source = typeof value === "string" ? value.toLowerCase() : "";
  if (source === "single") return "Single";
  if (source === "ep") return "EP";
  if (source === "remix") return "Remix";
  if (source === "mix" || source === "album" || source === "set") return "Album";
  return "Unknown";
}

function readImportedCatalog() {
  if (!existsSync(RELEASES_IMPORTED_PATH)) {
    return {
      available: false,
      entries: [],
      tidalEntries: [],
      bySlug: new Map(),
      byNormalizedTitle: new Map(),
    };
  }

  const imported = readJson(RELEASES_IMPORTED_PATH);
  const rawEntries = Array.isArray(imported?.draftEntries) ? imported.draftEntries : [];
  const normalized = rawEntries
    .filter((entry) => entry && (typeof entry.title === "string" || typeof entry.slug === "string"))
    .map((entry) => {
      const provider = detectImportedProvider(entry, imported);
      return {
        title: entry.title ?? "",
        slug: entry.slug ?? sanitizeSlug(entry.title ?? ""),
        type: normalizeType(entry.type),
        provider,
      };
    });

  const defaultSource = String(imported?.provider ?? imported?.source ?? "").toLowerCase();
  const withProvider = normalized.map((entry) => ({
    ...entry,
    provider: entry.provider ?? defaultSource,
  }));

  const tidalEntries = withProvider.filter((entry) => entry.provider === TIDAL);
  const lookupSource = tidalEntries.length ? tidalEntries : withProvider;

  const bySlug = new Map();
  const byNormalizedTitle = new Map();

  for (const entry of lookupSource) {
    const slug = sanitizeSlug(entry.slug);
    const normalizedTitle = normalizeTitle(entry.title);
    const existingBySlug = bySlug.get(slug);
    const existingByTitle = byNormalizedTitle.get(normalizedTitle);

    if (!existingBySlug) bySlug.set(slug, entry);
    if (!existingByTitle) byNormalizedTitle.set(normalizedTitle, entry);

    if (existingBySlug || existingByTitle) {
      const existing = existingBySlug || existingByTitle;
      existing.title = existing.title || entry.title;
      existing.slug = existing.slug || entry.slug;
      existing.type = existing.type || entry.type;
    }
  }

  return {
    available: true,
    entries: withProvider,
    tidalEntries,
    bySlug,
    byNormalizedTitle,
  };
}

function detectImportedProvider(entry, importedFile) {
  const explicit = entry?.catalogSource?.source ??
    entry?.catalogSource?.provider ??
    entry?.source ??
    entry?.provider;

  if (explicit) return String(explicit).toLowerCase();

  return String((importedFile && (importedFile.provider ?? importedFile.source)) ?? "").toLowerCase();
}

function normalizeType(value) {
  if (value === "single" || value === "ep" || value === "mix" || value === "remix") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "album") return "album";
    if (normalized === "track") return "single";
    return normalized;
  }

  return "single";
}

function findContentMatch({ localIndex, possibleSlug, possibleTitle }) {
  if (!localIndex.length) {
    return {
      match: false,
      method: "none",
      source: "content/releases.ts",
      slug: null,
      title: null,
      type: null,
    };
  }

  const slug = sanitizeSlug(possibleSlug);
  const normalizedTitle = normalizeTitle(possibleTitle);
  const bySlug = localIndexBySlug(localIndex);
  const byTitle = localIndexByNormalizedTitle(localIndex);
  let match = bySlug.get(slug);
  let method = "slug";

  if (!match) {
    match = byTitle.get(normalizedTitle);
    method = "title";
  }

  if (!match) {
    return {
      match: false,
      method: "none",
      source: "content/releases.ts",
      slug: null,
      title: null,
      type: null,
    };
  }

  return {
    match: true,
    method,
    source: "content/releases.ts",
    slug: match.slug,
    title: match.title,
    type: match.type ?? "Unknown",
  };
}

function findImportedMatch({ importedCatalog, possibleSlug, possibleTitle }) {
  if (!importedCatalog?.available || !importedCatalog.entries.length) {
    return {
      match: false,
      method: "none",
      source: "content/releases.imported.json",
      provider: null,
      slug: null,
      title: null,
      available: false,
    };
  }

  const search = {
    entriesToSearch: importedCatalog.tidalEntries.length ? importedCatalog.tidalEntries : importedCatalog.entries,
    bySlug: importedCatalog.bySlug,
    byTitle: importedCatalog.byNormalizedTitle,
  };

  const slug = sanitizeSlug(possibleSlug);
  const normalizedTitle = normalizeTitle(possibleTitle);
  let match = search.bySlug.get(slug);
  let method = "slug";
  if (!match) {
    match = search.byTitle.get(normalizedTitle);
    method = "title";
  }

  if (!match) {
    return {
      match: false,
      method: "none",
      source: "content/releases.imported.json",
      provider: importedCatalog.tidalEntries.length ? TIDAL : "unknown",
      slug: null,
      title: null,
      available: true,
    };
  }

  return {
    match: true,
    method,
    source: "content/releases.imported.json",
    provider: importedCatalog.tidalEntries.length ? TIDAL : match.provider,
    slug: match.slug,
    title: match.title,
    available: true,
  };
}

function localIndexBySlug(localIndex) {
  const map = new Map();
  for (const entry of localIndex) {
    map.set(sanitizeSlug(entry.slug), entry);
  }
  return map;
}

function localIndexByNormalizedTitle(localIndex) {
  const map = new Map();
  for (const entry of localIndex) {
    const normalized = normalizeTitle(entry.title);
    if (!map.has(normalized)) map.set(normalized, entry);
  }
  return map;
}

function buildReleaseFolderMapReport({
  scannedEntries,
  localIndex,
  releaseFolderMap,
  scanRoot,
}) {
  const scannedSlugs = new Set(
    scannedEntries.map((entry) => sanitizeSlug(entry.possibleSlug || entry.inferredSlug || entry.folderName)),
  );
  const mapEntries = Object.entries(releaseFolderMap || {});
  const bySlug = localIndexBySlug(localIndex);
  const mappedLookup = new Map(
    mapEntries.map(([slug, entry]) => [sanitizeSlug(slug), normalizeReleaseFolderMapEntry(slug, entry)]),
  );

  const curatedCarouselMissingFromScan = [];
  const unmappedMissingReleases = [];
  const knownMappedExternalFolders = [];

  for (const [slug, entry] of bySlug.entries()) {
    const scanned = scannedSlugs.has(slug);
    const mapped = mappedLookup.get(slug);
    if (!scanned && entry?.carouselEnabled) {
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

  curatedCarouselMissingFromScan.sort((a, b) => a.title.localeCompare(b.title));
  unmappedMissingReleases.sort((a, b) => a.title.localeCompare(b.title));
  knownMappedExternalFolders.sort((a, b) => a.slug.localeCompare(b.slug));

  return {
    curatedCarouselMissingFromScan,
    knownMappedExternalFolders,
    unmappedMissingReleases,
  };
}

function buildDuplicateTitleMap(releases) {
  const titleCount = new Map();
  for (const release of releases) {
    const key = normalizeTitle(release.possibleTitle);
    titleCount.set(key, (titleCount.get(key) ?? 0) + 1);
  }
  return titleCount;
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeMarkdown(filePath, inventory) {
  const lines = [];
  const generatedAt = inventory.summary.generatedAt;

  lines.push("# Released Folder Inventory");
  lines.push("");
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Source root: ${inventory.summary.scanRoot}`);
  lines.push(`Total folders scanned: ${inventory.summary.releaseFolderCount}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Missing audio: ${inventory.summary.missingAudioCount}`);
  lines.push(`- Missing artwork: ${inventory.summary.missingArtworkCount}`);
  lines.push(`- Unmatched content releases: ${inventory.summary.unmatchedCount}`);
  lines.push(`- Matched tidal imported entries: ${inventory.summary.matchedTidalImportedCount}`);
  lines.push(`- Ambiguous release type calls: ${inventory.summary.ambiguousTypeCount}`);
  lines.push(`- Curated carousel releases missing from scan: ${inventory.summary.curatedCarouselMissingFromScanCount}`);
  lines.push(`- Known mapped external folders: ${inventory.summary.knownMappedExternalFoldersCount}`);
  lines.push(`- Unmapped missing releases: ${inventory.summary.unmappedMissingReleasesCount}`);
  lines.push("");
  lines.push("## Release Folder Mapping");
  lines.push("");
  lines.push("### Curated carousel releases missing from scan");
  lines.push("");
  if (!inventory.releaseFolderMap?.curatedCarouselMissingFromScan?.length) {
    lines.push("No curated carousel releases are missing from this scan.");
  } else {
    for (const release of inventory.releaseFolderMap.curatedCarouselMissingFromScan) {
      lines.push(`- ${release.title} (${release.slug})`);
    }
  }
  lines.push("");

  lines.push("### Known mapped external folders");
  lines.push("");
  if (!inventory.releaseFolderMap?.knownMappedExternalFolders?.length) {
    lines.push("No mapped external folders currently reported.");
  } else {
    for (const entry of inventory.releaseFolderMap.knownMappedExternalFolders) {
      const source = entry.sourceFolder ? `source: ${entry.sourceFolder}` : "source: unknown";
      const status = `status: ${entry.status || "unknown"}`;
      const stage = `stageToReleaseLibrary: ${Boolean(entry.shouldStageToReleaseLibrary) ? "yes" : "no"}`;
      lines.push(`- ${entry.slug} (${source}, ${status}, ${stage})`);
      if (entry.notes) {
        lines.push(`  - ${entry.notes}`);
      }
    }
  }
  lines.push("");

  lines.push("### Unmapped missing releases");
  lines.push("");
  if (!inventory.releaseFolderMap?.unmappedMissingReleases?.length) {
    lines.push("No unmapped missing releases.");
  } else {
    for (const entry of inventory.releaseFolderMap.unmappedMissingReleases) {
      const flags = [];
      if (entry.carouselEnabled) flags.push("carousel");
      flags.push(entry.type || "Unknown");
      lines.push(`- ${entry.title} (${entry.slug})`);
      lines.push(`  - type: ${flags.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("## Folder Inventory");
  lines.push("");
  lines.push("| Folder | Folder Inferred | Canonical Title | Canonical Slug | Type | Type/Slug Warnings | Title Conf | Slug Conf | Type Conf | Match Conf | Audio | Artwork | Master Audio | Cover | release.json | Content Match | Tidal Imported Match | Warnings |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const release of inventory.entries) {
    const masterAudio = release.likelyMasterAudioFile ? escapeTableCell(path.relative(repoRoot, release.likelyMasterAudioFile)) : "n/a";
    const cover = release.likelyCoverImage ? escapeTableCell(path.relative(repoRoot, release.likelyCoverImage)) : "n/a";
    const contentMatch = release.matches.contentRelease.match
      ? `yes (${escapeTableCell(release.matches.contentRelease.title)} / ${escapeTableCell(release.matches.contentRelease.slug)} by ${release.matches.contentRelease.method})`
      : "no";
    const importedMatch = release.matches.tidalImportedMatch.match
      ? `yes (${escapeTableCell(release.matches.tidalImportedMatch.title)} / ${escapeTableCell(release.matches.tidalImportedMatch.slug)} by ${release.matches.tidalImportedMatch.method})`
      : "no";
    const warnings = release.warnings.length ? escapeTableCell(release.warnings.join("; ")) : "none";
    const typeSignals = [];
    if (release.slugMismatch) typeSignals.push("slugMismatch");

    const row = [
      escapeTableCell(release.folderName),
      escapeTableCell(release.inferredTitle ?? release.possibleTitle),
      escapeTableCell(release.possibleTitle),
      escapeTableCell(release.possibleSlug),
      escapeTableCell(release.possibleType),
      escapeTableCell(typeSignals.join("; ") || "n/a"),
      release.titleConfidence.toFixed(2),
      release.slugConfidence.toFixed(2),
      release.typeConfidence.toFixed(2),
      release.matchConfidence.toFixed(2),
      release.audioFileCount,
      release.artworkFileCount,
      masterAudio,
      cover,
      release.releaseJsonExists ? "yes" : "no",
      contentMatch,
      importedMatch,
      warnings,
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }

  lines.push("");
  lines.push("## Suggested Website Fields");
  lines.push("");
  for (const release of inventory.entries) {
    lines.push(`### ${escapeText(release.folderName)}`);
    lines.push("");
    lines.push(`- Suggested title: ${escapeText(release.suggestedWebsiteReleaseFields.title)}`);
    lines.push(`- Suggested slug: ${escapeText(release.suggestedWebsiteReleaseFields.slug)}`);
    lines.push(`- Suggested type: ${escapeText(release.suggestedWebsiteReleaseFields.type)}`);
    lines.push(`- Inferred type: ${escapeText(release.inferredType)}`);
    lines.push(`- Suggested cover: ${release.suggestedWebsiteReleaseFields.coverImage || "n/a"}`);
    lines.push(`- Inference notes:`);
    if (release.inferenceNotes.length) {
      for (const note of release.inferenceNotes) {
        lines.push(`  - ${escapeText(note)}`);
      }
    } else {
      lines.push("  - (none)");
    }
    lines.push("");
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function escapeTableCell(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

function escapeText(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ");
}

function tokenizeText(value) {
  return normalizeTitle(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
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

function normalizeForPattern(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsAnyToken(value, tokens) {
  const normalized = ` ${normalizeForPattern(value)} `;
  return tokens.some((tokenRaw) => {
    const token = normalizeForPattern(tokenRaw).trim();
    if (!token) return false;
    if (token.includes(" ")) {
      return normalized.includes(` ${token} `);
    }
    const tokenPattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(token)}(?=[^a-z0-9]|$)`);
    return tokenPattern.test(normalized);
  });
}

function readReleaseJson(filePath) {
  try {
    const parsed = readJson(filePath);
    return (parsed && typeof parsed === "object") ? parsed : null;
  } catch {
    return null;
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
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

  const status = normalizeMappedStatus(value.status);
  return {
    slug,
    status,
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

function isPathInside(candidate, root) {
  if (!candidate || !root) return false;
  const normalizedRoot = path.resolve(root).toLowerCase();
  const normalizedCandidate = path.resolve(candidate).toLowerCase();
  const rootWithSeparator = normalizedRoot.endsWith(path.sep)
    ? normalizedRoot
    : `${normalizedRoot}${path.sep}`;
  return (
    normalizedCandidate === normalizedRoot ||
    normalizedCandidate.startsWith(rootWithSeparator)
  );
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

function readStringProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(['\\"])([\\s\\S]*?)\\1`));
  return match ? unescapeString(match[2]).trim() : undefined;
}

function readBooleanProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*(true|false)`, "i"));
  if (!match) return null;
  return match[1].toLowerCase() === "true";
}

function readNumberProperty(block, key) {
  const match = block.match(new RegExp(`${escapeRegExp(key)}\\s*:\\s*([0-9]+)`, "i"));
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function unescapeString(value) {
  return String(value).replace(/\\(["'`\\])/g, "$1");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maybePath(value) {
  return value ? path.resolve(value) : null;
}

function fail(message) {
  console.error(`Released folder inventory failed: ${message}`);
  process.exit(1);
}
