#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_RELEASE_LIBRARY_ROOT = "D:\\Broey\\Release Library\\released";
const RELEASE_LIBRARY_METADATA_PATH = path.join(__dirname, "distributor-inventory.json");
const OUTPUT_JSON_PATH = path.join(__dirname, "release-library-inventory.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "release-library-inventory.md");

const SUPPORTED_ARTWORK_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const SUPPORTED_AUDIO_EXTENSIONS = new Set([".wav", ".mp3", ".flac", ".aiff", ".m4a"]);
const RELEASE_JSON_FILE = "release.json";
const COVER_FILE_HINTS = ["cover", "artwork", "front", "album", "package"];
const MASTER_FILE_HINTS = ["master", "final", "approved", "hi-res", "hires", "render", "vocal", "hires"];
const MASTER_FILE_HINTS_CLEAR = ["master", "final", "approved", "hi-res", "hires", "render", "vocal"];
const UNKNOWN_RELEASE_TYPE = "Unknown";

main();

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const releaseRoot = options.source;
  if (!existsSync(releaseRoot)) {
    console.error(`Release root not found: ${releaseRoot}`);
    process.exit(1);
  }

  const metadata = loadDistributorMetadata();
  const entries = buildInventory(releaseRoot, metadata);
  const inventory = {
    generatedAt: new Date().toISOString(),
    sourceRoot: releaseRoot,
    metadataSource: metadata.available ? path.relative(repoRoot, RELEASE_LIBRARY_METADATA_PATH) : null,
    summary: buildSummary(entries),
    duplicateSlugs: findDuplicateSlugs(entries),
    releases: entries,
  };

  writeJson(OUTPUT_JSON_PATH, inventory);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, inventory);
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_JSON_PATH)}`);
  console.log(`Wrote ${path.relative(process.cwd(), OUTPUT_MARKDOWN_PATH)}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-inventory.mjs [--source <path>]");
  console.log("");
  console.log("Defaults:");
  console.log(`  source: ${DEFAULT_RELEASE_LIBRARY_ROOT}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/release-library-inventory.json");
  console.log("  scripts/release-library-inventory.md");
}

function parseArgs(args) {
  const options = { source: DEFAULT_RELEASE_LIBRARY_ROOT, help: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--source") {
      if (index + 1 >= args.length) {
        console.error("Missing value for --source");
        process.exit(1);
      }
      options.source = args[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith("--source=")) {
      options.source = arg.replace(/^--source=/, "");
      continue;
    }
    if (!arg.startsWith("-") && options.source === DEFAULT_RELEASE_LIBRARY_ROOT) {
      options.source = arg;
      continue;
    }
    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  }
  return options;
}

function buildInventory(releaseRoot, metadata) {
  const releaseFolders = readdirSync(releaseRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  return releaseFolders.map((folderName) => scanReleaseFolder({
    folderName,
    folderPath: path.join(releaseRoot, folderName),
    metadata,
  }));
}

function scanReleaseFolder({ folderName, folderPath, metadata }) {
  const { datePrefix, suffixName } = parseReleaseFolderDatePrefix(folderName);
  const releaseJson = readReleaseJson(folderPath);
  const inferredTitle = inferTitle({ folderName: suffixName, releaseJson });
  const inferredSlug = inferSlug({ folderName: suffixName, releaseJson });
  const inferredReleaseType = inferReleaseType({
    folderName: suffixName,
    title: inferredTitle,
  });
  const metadataMatch = findDistributorMetadataMatch({ title: inferredTitle, slug: inferredSlug, metadata });
  const matchedDate = metadataMatch?.releaseDate || "";
  const metadataDateExact = Boolean(metadataMatch?.releaseDateIsExact);
  const suggestedDate = metadataDateExact ? matchedDate : datePrefix;
  const isDateExact = metadataDateExact ? true : isExactDateValue(datePrefix)?.isExact || false;
  const suggestedFolderName = `${suggestedDate || "0000-00-00"} - ${inferredTitle}`;

  const folderEntries = readdirSync(folderPath, { withFileTypes: true });
  const artworkFolder = findChildDir(folderPath, folderEntries, "artwork");
  const audioFolder = findChildDir(folderPath, folderEntries, "audio");
  const notesFolder = findChildDir(folderPath, folderEntries, "notes");

  const artworkFiles = artworkFolder ? collectFilesByType(artworkFolder, SUPPORTED_ARTWORK_EXTENSIONS) : [];
  const audioFiles = audioFolder ? collectFilesByType(audioFolder, SUPPORTED_AUDIO_EXTENSIONS) : [];

  const likelyCoverFile = chooseLikelyCover({ artworkFiles, folderName });
  const likelyMasterAudioResult = chooseLikelyMasterAudio({
    audioFiles,
    folderName,
    releaseType: inferredReleaseType,
    audioFileCountHint: audioFiles.length,
  });
  const likelyMasterFile = likelyMasterAudioResult.file;
  const audioArchiveWarnings = likelyMasterAudioResult.warnings;

  const missingFolders = [];
  if (!artworkFolder) missingFolders.push("artwork");
  if (!audioFolder) missingFolders.push("audio");
  if (!notesFolder) missingFolders.push("notes");

  const missingFiles = [];
  if (!artworkFiles.length) missingFiles.push("artwork file");
  if (!audioFiles.length) missingFiles.push("audio file");

  const websiteBlockers = [];
  const archiveWarnings = [];
  if (missingFolders.includes("artwork")) websiteBlockers.push("missing artwork folder");
  if (missingFiles.includes("artwork file")) websiteBlockers.push("missing artwork file");

  if (!releaseJson) {
    websiteBlockers.push("missing release.json");
  } else if (releaseJson.data === null) {
    websiteBlockers.push("invalid release.json");
  }

  if (missingFolders.includes("audio")) archiveWarnings.push("missing audio folder");
  if (missingFiles.includes("audio file")) archiveWarnings.push("missing audio file");
  if (missingFolders.includes("notes")) archiveWarnings.push("missing notes folder");
  archiveWarnings.push(...audioArchiveWarnings);

  const isWebsiteReady = websiteBlockers.length === 0;

  return {
    releaseFolderName: folderName,
    releaseFolderPath: folderPath,
    releaseDatePrefix: datePrefix,
    inferredTitle,
    inferredSlug,
    inferredReleaseType,
    distributorReleaseDate: matchedDate || null,
    distributorDateIsExact: metadataDateExact,
    suggestedFolderName,
    isDateExact,
    isWebsiteReady,
    artworkFiles: artworkFiles.map((file) => relativeToReleaseFolder(folderPath, file.path)),
    audioFiles: audioFiles.map((file) => relativeToReleaseFolder(folderPath, file.path)),
    likelyCoverFile: likelyCoverFile ? relativeToReleaseFolder(folderPath, likelyCoverFile.path) : null,
    likelyMasterAudioFile: likelyMasterFile ? relativeToReleaseFolder(folderPath, likelyMasterFile.path) : null,
    websiteBlockers,
    archiveWarnings,
    missingFolders,
    missingFiles,
    hasReleaseJson: Boolean(releaseJson?.path),
    releaseJsonValid: Boolean(releaseJson && releaseJson.data && typeof releaseJson.data === "object"),
    releaseJsonParseError: releaseJson?.parseError || null,
    releaseJsonPath: releaseJson?.path ? relativeToReleaseFolder(folderPath, releaseJson.path) : null,
    warnings: [
      ...websiteBlockers.map((item) => `website blocker: ${item}`),
      ...archiveWarnings.map((item) => `archive warning: ${item}`),
    ],
  };
}

function readReleaseJson(folderPath) {
  const maybePath = path.join(folderPath, RELEASE_JSON_FILE);
  if (!existsSync(maybePath)) return null;
  try {
    const parsed = JSON.parse(readFileSync(maybePath, "utf8"));
    return { path: maybePath, data: parsed, parseError: null };
  } catch {
    return { path: maybePath, data: null, parseError: "invalid_json" };
  }
}

function parseReleaseFolderDatePrefix(folderName) {
  const match = String(folderName || "").match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(.+)$/);
  if (!match) {
    return { datePrefix: "", suffixName: folderName };
  }

  return {
    datePrefix: match[1],
    suffixName: match[2],
  };
}

function inferTitle({ folderName, releaseJson }) {
  if (releaseJson?.data && typeof releaseJson.data.title === "string" && releaseJson.data.title.trim()) {
    return releaseJson.data.title.trim();
  }
  return cleanDisplayTitle(folderName);
}

function inferSlug({ folderName, releaseJson }) {
  if (releaseJson?.data && typeof releaseJson.data.slug === "string" && releaseJson.data.slug.trim()) {
    return sanitizeSlug(releaseJson.data.slug);
  }
  return sanitizeSlug(folderName);
}

function inferReleaseType({ folderName, title }) {
  const tokens = tokenize(`${folderName} ${title}`);
  if (hasAnyToken(tokens, ["ep"])) return "EP";
  if (hasAnyToken(tokens, ["remix", "remixes"])) return "Remix";
  if (hasAnyToken(tokens, ["album", "lp", "longplay"])) return "Album";
  if (hasAnyToken(tokens, ["single"])) return "Single";
  return UNKNOWN_RELEASE_TYPE;
}

function cleanDisplayTitle(value) {
  const normalized = String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "";
  const words = normalized.split(" ");
  return words
    .filter(Boolean)
    .map((word) => {
      if (!word) return word;
      if (/^[A-Z]{2,}$/i.test(word) && word.toUpperCase() === word) return word;
      if (/^[0-9]/.test(word)) return word;
      return `${word[0]?.toUpperCase() || ""}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function sanitizeSlug(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function findChildDir(parentPath, dirEntries, target) {
  const match = dirEntries.find((entry) => entry.isDirectory() && entry.name.toLowerCase() === target.toLowerCase());
  return match ? path.join(parentPath, match.name) : null;
}

function collectFilesByType(folderPath, extensions) {
  const stack = [folderPath];
  const out = [];

  while (stack.length) {
    const current = stack.pop();
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (extensions.has(path.extname(entry.name).toLowerCase())) {
        const fileStat = statSync(fullPath);
        out.push({
          path: fullPath,
          name: entry.name,
          ext: path.extname(entry.name).toLowerCase(),
          depth: path.relative(folderPath, fullPath).split(path.sep).length - 1,
          mtimeMs: fileStat.mtimeMs,
        });
      }
    }
  }
  return out;
}

function chooseLikelyCover({ artworkFiles, folderName }) {
  if (!artworkFiles.length) return null;
  const folderTokens = tokenize(folderName);
  const sorted = artworkFiles
    .map((file) => ({ ...file, score: scoreCover(file, folderTokens) }))
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      if (left.depth !== right.depth) return left.depth - right.depth;
      return right.mtimeMs - left.mtimeMs;
    });
  return sorted[0];
}

function chooseLikelyMasterAudio({
  audioFiles,
  folderName,
  releaseType,
  audioFileCountHint,
}) {
  if (!audioFiles.length) return { file: null, warnings: [] };
  const folderTokens = tokenize(folderName);
  const scored = audioFiles
    .map((file) => ({ ...file, score: scoreAudio(file, folderTokens) }))
    .map((file) => ({ ...file, hasClearMasterSignal: isLikelyMasterSignal(file.name) }));

  const clearMasterCandidates = scored.filter((file) => file.hasClearMasterSignal);
  const shouldAvoidForEp = releaseType === "EP" && audioFileCountHint > 1 && clearMasterCandidates.length === 0;
  if (shouldAvoidForEp) {
    return {
      file: null,
      warnings: ["ambiguous audio set for EP; no clearly named master file"],
    };
  }

  const candidatePool = clearMasterCandidates.length ? clearMasterCandidates : scored;
  const sorted = candidatePool
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      if (left.depth !== right.depth) return left.depth - right.depth;
      return right.mtimeMs - left.mtimeMs;
    });

  const warnings = [];
  const isAmbiguous = sorted.length > 1 && sorted[0].score === sorted[1].score;
  if (releaseType === "EP" && clearMasterCandidates.length && isAmbiguous) {
    warnings.push("ambiguous EP master audio candidate");
  }

  if (releaseType === "EP" && sorted.length && clearMasterCandidates.length === 0 && audioFileCountHint > 1) {
    warnings.push("ambiguous audio set for EP; no clearly named master file");
  }

  return {
    file: sorted[0],
    warnings,
  };
}

function scoreCover(file, folderTokens) {
  const name = file.name.toLowerCase();
  let score = 0;
  for (const token of folderTokens) {
    if (name.includes(token)) score += 3;
  }
  for (const hint of COVER_FILE_HINTS) {
    if (name.includes(hint)) score += 20;
  }
  if (file.depth === 0) score += 16;
  return score;
}

function scoreAudio(file, folderTokens) {
  const name = file.name.toLowerCase();
  let score = 0;
  for (const token of folderTokens) {
    if (name.includes(token)) score += 3;
  }
  for (const hint of MASTER_FILE_HINTS) {
    if (name.includes(hint)) score += 18;
  }
  if (file.depth === 0) score += 12;
  return score;
}

function isLikelyMasterSignal(name) {
  const normalized = name.toLowerCase();
  return MASTER_FILE_HINTS_CLEAR.some((hint) => normalized.includes(hint));
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function hasAnyToken(tokens, checks) {
  const normalizedChecks = checks.map((value) => value.toLowerCase());
  return tokens.some((token) => normalizedChecks.includes(token));
}

function findDuplicateSlugs(entries) {
  const slugCounts = new Map();
  for (const entry of entries) {
    const key = sanitizeSlug(entry.inferredSlug);
    slugCounts.set(key, (slugCounts.get(key) || 0) + 1);
  }

  const duplicates = [];
  for (const entry of entries) {
    const key = sanitizeSlug(entry.inferredSlug);
    const count = slugCounts.get(key) || 0;
    if (count > 1) {
      const grouped = entries.filter((item) => sanitizeSlug(item.inferredSlug) === key);
      duplicates.push({
        slug: key,
        folders: grouped.map((item) => item.releaseFolderName),
        title: entry.inferredTitle,
      });
    }
  }

  const seen = new Set();
  return duplicates.filter((entry) => {
    if (seen.has(entry.slug)) return false;
    seen.add(entry.slug);
    return true;
  });
}

function buildSummary(entries) {
  return {
    totalReleases: entries.length,
    exactDatePrefixCount: entries.filter((entry) => entry.isDateExact).length,
    placeholderDatePrefixCount: entries.filter((entry) => !entry.isDateExact).length,
    distributorDateMatchCount: entries.filter((entry) => Boolean(entry.distributorReleaseDate)).length,
    websiteReadyCount: entries.filter((entry) => Boolean(entry.isWebsiteReady)).length,
    websiteBlockingIssueCount: entries.filter((entry) => !entry.isWebsiteReady).length,
    missingArtworkFolderCount: entries.filter((entry) => entry.missingFolders.includes("artwork")).length,
    missingArtworkFileCount: entries.filter((entry) => entry.missingFiles.includes("artwork file")).length,
    missingReleaseJsonCount: entries.filter((entry) => !entry.hasReleaseJson).length,
    invalidReleaseJsonCount: entries.filter((entry) => entry.hasReleaseJson && !entry.releaseJsonValid).length,
    missingNotesFolderCount: entries.filter((entry) => entry.missingFolders.includes("notes")).length,
    archiveWarningCount: entries.filter((entry) => entry.archiveWarnings.length > 0).length,
    missingAudioFolderCount: entries.filter((entry) => entry.archiveWarnings.includes("missing audio folder")).length,
    missingAudioFileCount: entries.filter((entry) => entry.archiveWarnings.includes("missing audio file")).length,
    ambiguousAudioCount: entries.filter((entry) => entry.archiveWarnings.includes("ambiguous audio set for EP; no clearly named master file"))
      .length,
    duplicateSlugCount: findDuplicateSlugs(entries).length,
  };
}

function relativeToReleaseFolder(folderPath, targetPath) {
  return path.relative(folderPath, targetPath);
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeMarkdown(filePath, inventory) {
  const lines = [];
  lines.push("# Release Library Inventory");
  lines.push("");
  lines.push(`Generated: ${inventory.generatedAt}`);
  lines.push(`Source root: ${inventory.sourceRoot}`);
  lines.push(`Metadata source: ${inventory.metadataSource || "unavailable"}`);
  lines.push(`Total release folders: ${inventory.summary.totalReleases}`);
  lines.push("");

  lines.push("## Summary");
  lines.push(`- Website-ready releases: ${inventory.summary.websiteReadyCount}`);
  lines.push(`- Blocked for website sync: ${inventory.summary.websiteBlockingIssueCount}`);
  lines.push(`- Exact date prefixes: ${inventory.summary.exactDatePrefixCount}`);
  lines.push(`- Placeholder date prefixes: ${inventory.summary.placeholderDatePrefixCount}`);
  lines.push(`- Releases matched by distributor metadata: ${inventory.summary.distributorDateMatchCount}`);
  lines.push(`- Missing release.json: ${inventory.summary.missingReleaseJsonCount}`);
  if (inventory.summary.invalidReleaseJsonCount) {
    lines.push(`- Invalid release.json files: ${inventory.summary.invalidReleaseJsonCount}`);
  }
  lines.push(`- Missing artwork folders: ${inventory.summary.missingArtworkFolderCount}`);
  lines.push(`- Missing artwork files: ${inventory.summary.missingArtworkFileCount}`);
  lines.push(`- Missing notes folders: ${inventory.summary.missingNotesFolderCount}`);
  lines.push(`- Archive warnings: ${inventory.summary.archiveWarningCount}`);
  lines.push(`- Missing audio folders (archive warning): ${inventory.summary.missingAudioFolderCount}`);
  lines.push(`- Missing audio files (archive warning): ${inventory.summary.missingAudioFileCount}`);
  if (inventory.summary.ambiguousAudioCount) {
    lines.push(`- Ambiguous EP master/audio (archive warning): ${inventory.summary.ambiguousAudioCount}`);
  }
  lines.push(`- Duplicate slugs: ${inventory.summary.duplicateSlugCount}`);
  lines.push("");

  lines.push("## Duplicate Slugs");
  if (!inventory.duplicateSlugs.length) {
    lines.push("No duplicate slugs found.");
  } else {
    for (const entry of inventory.duplicateSlugs) {
      lines.push(`- ${entry.slug}: ${entry.folders.join(", ")}`);
    }
  }
  lines.push("");

  lines.push("## Release Folders");
  lines.push("| Current folder | Current date prefix | Clean inferred title | Clean slug | Distributor release date | Suggested folder name | Date exact? | Artwork files | Audio files | Likely cover | Likely master/audio | Website blockers | Archive warnings |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const release of inventory.releases) {
    const row = [
      escapeTableCell(release.releaseFolderName),
      escapeTableCell(release.releaseDatePrefix || "none"),
      escapeTableCell(release.inferredTitle),
      escapeTableCell(release.inferredSlug),
      escapeTableCell(release.distributorReleaseDate || "none"),
      escapeTableCell(release.suggestedFolderName),
      escapeTableCell(release.isDateExact ? "exact" : "placeholder"),
      escapeTableCell(renderFileList(release.artworkFiles)),
      escapeTableCell(renderFileList(release.audioFiles)),
      escapeTableCell(release.likelyCoverFile || "n/a"),
      escapeTableCell(release.likelyMasterAudioFile || "n/a"),
      escapeTableCell(release.websiteBlockers.join("; ") || "none"),
      escapeTableCell(release.archiveWarnings.join("; ") || "none"),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function renderFileList(files) {
  if (!files.length) return "none";
  if (files.length <= 3) return files.join("<br>");
  return `${files.length} files (first 3: ${files.slice(0, 3).join(", ")})`;
}

function escapeTableCell(value) {
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

function loadDistributorMetadata() {
  if (!existsSync(RELEASE_LIBRARY_METADATA_PATH)) {
    return {
      available: false,
      bySlug: new Map(),
      byTitle: new Map(),
    };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(readFileSync(RELEASE_LIBRARY_METADATA_PATH, "utf8"));
  } catch {
    return {
      available: false,
      bySlug: new Map(),
      byTitle: new Map(),
    };
  }

  const rawEntries = Array.isArray(parsed?.entries) ? parsed.entries : [];
  const bySlug = new Map();
  const byTitle = new Map();

  for (const entry of rawEntries) {
    const rawTitle = String(entry?.title || "").trim();
    const normalizedTitle = normalizeTitle(rawTitle || entry?.slug || "");
    const normalizedSlug = sanitizeSlug(String(entry?.slug || rawTitle || ""));
    const { date, isExact } = normalizeDateValue(entry?.releaseDate);

    const candidate = {
      title: rawTitle || String(entry?.slug || ""),
      slug: normalizedSlug,
      releaseDate: date,
      releaseDateIsExact: Boolean(isExact),
    };

    if (normalizedSlug && shouldReplaceMetadataRecord(bySlug.get(normalizedSlug), candidate)) {
      bySlug.set(normalizedSlug, candidate);
    }
    if (normalizedTitle && shouldReplaceMetadataRecord(byTitle.get(normalizedTitle), candidate)) {
      byTitle.set(normalizedTitle, candidate);
    }
  }

  return { available: true, bySlug, byTitle };
}

function shouldReplaceMetadataRecord(existing, candidate) {
  if (!existing) return true;
  if (candidate.releaseDateIsExact && !existing.releaseDateIsExact) return true;
  if (!existing.releaseDate && candidate.releaseDate) return true;
  if (candidate.releaseDateIsExact && existing.releaseDateIsExact && !existing.releaseDate) return true;
  return false;
}

function findDistributorMetadataMatch({ title, slug, metadata }) {
  if (!metadata?.available) return null;
  const normalizedTitle = normalizeTitle(title);
  const normalizedSlug = sanitizeSlug(slug);
  return byMap(metadata.bySlug, normalizedSlug) || byMap(metadata.byTitle, normalizedTitle);
}

function byMap(map, key) {
  if (!map || !key) return null;
  return map.get(key) || null;
}

function normalizeDateValue(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return { date: "", isExact: false };
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return { date: "", isExact: false };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return { date: "", isExact: false };
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { date: "", isExact: false };
  }
  if (match[2] === "00" || match[3] === "00") {
    return { date: `${match[1]}-${match[2]}-${match[3]}`, isExact: false };
  }

  const parsed = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return { date: "", isExact: false };
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return { date: "", isExact: false };
  }

  return { date: `${match[1]}-${match[2]}-${match[3]}`, isExact: true };
}

function isExactDateValue(value) {
  return normalizeDateValue(value);
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
