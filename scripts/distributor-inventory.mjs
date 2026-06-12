#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_CSV_PATH = path.join(repoRoot, "content", "Broey._InventoryExport_2026-06-08_15_10_45.csv");
const RELEASES_TS_PATH = path.join(repoRoot, "content", "releases.ts");
const RELEASES_IMPORTED_PATH = path.join(repoRoot, "content", "releases.imported.json");
const RELEASE_FOLDER_INVENTORY_PATH = path.join(__dirname, "released-folder-inventory.json");
const OUTPUT_JSON_PATH = path.join(__dirname, "distributor-inventory.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "distributor-inventory.md");
const TIDAL_PROVIDER = "tidal";

const REQUIRED_HEADERS = [
  "label name",
  "catalog",
  "upc",
  "release name",
  "release date",
  "release artist",
  "track",
  "isrc",
  "song name",
];

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inputPath = args.file ? path.resolve(args.file) : DEFAULT_CSV_PATH;
  if (!existsSync(inputPath)) {
    fail(`Missing distributor CSV file: ${inputPath}`);
  }

  const outputPathCsv = inputPath;
  const rawCsv = readText(outputPathCsv);
  const rows = parseCsv(rawCsv);
  if (!rows.length || rows.length < 2) {
    fail("CSV must include a header row and at least one data row.");
  }

  const { releaseMap, warnings } = parseDistributorRows(rows);
  if (warnings.length) {
    console.warn(warnings.map((warning) => `Distributor inventory warning: ${warning}`).join("\n"));
  }

  const contentReleases = readContentReleases();
  const importedCatalog = readImportedCatalog();
  const releasedFolderInventory = readReleasedFolderInventory();
  const enriched = enrichMatches({
    records: Array.from(releaseMap.values()),
    contentReleases,
    importedCatalog,
    releasedFolderInventory,
  });

  const summary = buildSummary(enriched);
  const output = {
    generatedAt: new Date().toISOString(),
    sourceCsvPath: path.relative(repoRoot, outputPathCsv),
    summary,
    entries: enriched,
    matchBreakdown: summary.matchesBySource,
  };

  writeJson(OUTPUT_JSON_PATH, output);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, output);

  console.log(`Distributor inventory written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Distributor inventory markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Releases found: ${summary.totalReleases}`);
  console.log(`Matched releases: ${summary.matchedReleases}`);
}

function parseArgs(args) {
  const parsed = { help: false, file: null };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--file") {
      if (index + 1 >= args.length) fail("Missing value for --file. Use --file <path-to-csv>.");
      parsed.file = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--file=")) {
      parsed.file = arg.replace(/^--file=/, "");
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/distributor-inventory.mjs --file <path-to-csv> [--help]");
  console.log("");
  console.log("Default CSV:");
  console.log(`  ${path.relative(repoRoot, DEFAULT_CSV_PATH)}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/distributor-inventory.json");
  console.log("  scripts/distributor-inventory.md");
  console.log("");
  console.log("This is a report-only script. It does not move, rename, delete, or modify release files.");
}

function parseDistributorRows(rows) {
  const headerRow = rows[0];
  if (!headerRow || !headerRow.length) {
    fail("CSV header row is missing.");
  }

  const index = buildHeaderIndex(headerRow);
  for (const header of REQUIRED_HEADERS) {
    if (typeof index[header] !== "number") {
      fail(`CSV missing required column: ${header}`);
    }
  }

  const releaseMap = new Map();
  const warnings = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    if (!row.some((value) => String(value ?? "").trim())) continue;

    const releaseName = sanitizeText(cell(row, index["release name"]));
    const trackNumberRaw = sanitizeText(cell(row, index.track));
    if (!releaseName || !trackNumberRaw) {
      warnings.push(`Skipping row ${rowIndex + 1}: missing release name or track number.`);
      continue;
    }

    const releaseVersion = sanitizeText(cell(row, index["release version"]));
    const upc = normalizeUpc(sanitizeText(cell(row, index.upc)));
    const catalogIndex = typeof index["catalog #"] === "number" ? index["catalog #"] : index.catalog;
    const catalogNumber = sanitizeText(cell(row, catalogIndex));
    const releaseDate = normalizeDate(sanitizeText(cell(row, index["release date"])));
    const titleKey = normalizeTitle(releaseName);
    const upcKey = upc || "unknown-upc";
    const dateKey = releaseDate || "unknown-date";
    const groupKey = `${upcKey}::${titleKey}::${dateKey}`;

    let releaseRecord = releaseMap.get(groupKey);
    if (!releaseRecord) {
      releaseRecord = {
        title: releaseName,
        slug: sanitizeSlug(releaseName),
        releaseDate,
        year: parseYearFromDate(releaseDate),
        UPC: upc,
        catalogNumber: catalogNumber,
        releaseArtist: sanitizeText(cell(row, index["release artist"])),
        releaseVersion,
        genre: sanitizeText(cell(row, index["release genre"])),
        subgenre: sanitizeText(cell(row, index["release subgenre"])),
        tracks: [],
        inferredType: "Unknown",
      };
      releaseMap.set(groupKey, releaseRecord);
    }

    const trackTitle = sanitizeText(cell(row, index["song name"]));
    if (!trackTitle) {
      warnings.push(`Skipping track on row ${rowIndex + 1}: missing song name.`);
      continue;
    }

    const track = {
      trackNumber: parseTrackNumber(trackNumberRaw),
      title: trackTitle,
      mixVersion: sanitizeText(cell(row, index["mix version"])),
      ISRC: sanitizeText(cell(row, index.isrc)),
      primaryArtists: parseArtistList(sanitizeText(cell(row, index["primary artists"]))),
      featuringArtists: parseArtistList(sanitizeText(cell(row, index["featuring artists"]))),
      remixers: parseArtistList(sanitizeText(cell(row, index.remixers))),
      duration: sanitizeDuration(sanitizeText(cell(row, index["track length"]))),
      genre: sanitizeText(cell(row, index["song genre"])),
      subgenre: sanitizeText(cell(row, index["song subgenre"])),
    };
    releaseRecord.tracks.push(track);
  }

  for (const release of releaseMap.values()) {
    release.tracks.sort((left, right) => {
      if (left.trackNumber !== right.trackNumber) return (left.trackNumber || 0) - (right.trackNumber || 0);
      return left.title.localeCompare(right.title);
    });
    release.trackCount = release.tracks.length;
    release.inferredType = inferType({
      title: release.title,
      releaseVersion: release.releaseVersion,
      trackCount: release.trackCount,
      tracks: release.tracks,
      genre: release.genre,
      subgenre: release.subgenre,
    });
  }

  return { releaseMap, warnings };
}

function enrichMatches({ records, contentReleases, importedCatalog, releasedFolderInventory }) {
  const contentIndex = buildContentIndex(contentReleases);
  const importedIndex = buildImportedIndex(importedCatalog);
  const inventoryIndex = buildFolderInventoryIndex(releasedFolderInventory);

  return records.map((record) => {
    const inferredSlug = sanitizeSlug(record.title);
    const dateKey = normalizeDate(record.releaseDate);

    const contentMatch = findMatch({
      release: record,
      bySlug: contentIndex.bySlug,
      byTitle: contentIndex.byTitle,
      bySlugDate: contentIndex.bySlugDate,
      byTitleDate: contentIndex.byTitleDate,
      source: "content/releases.ts",
      dateKey,
      slug: inferredSlug,
    });

    const folderInventoryMatch = findMatch({
      release: record,
      bySlug: inventoryIndex.bySlug,
      byTitle: inventoryIndex.byTitle,
      bySlugDate: inventoryIndex.bySlugDate,
      byTitleDate: inventoryIndex.byTitleDate,
      source: "scripts/released-folder-inventory.json",
      dateKey,
      slug: inferredSlug,
    });

    const importedMatch = findMatch({
      release: record,
      bySlug: importedIndex.bySlug,
      byTitle: importedIndex.byTitle,
      bySlugDate: importedIndex.bySlugDate,
      byTitleDate: importedIndex.byTitleDate,
      source: "content/releases.imported.json",
      sourceProvider: TIDAL_PROVIDER,
      dateKey,
      slug: inferredSlug,
    });

    const allMatches = [contentMatch, importedMatch, folderInventoryMatch].filter((match) => match.match);
    const sources = allMatches.map((match) => match.source);

    return {
      ...record,
      trackList: record.tracks,
      tracks: record.tracks,
      upc: record.UPC,
      upcNumeric: record.UPC || null,
      matchSummary: {
        matchCount: allMatches.length,
        sources,
      },
      matches: {
        contentRelease: contentMatch,
        importedMatch,
        folderInventoryMatch,
      },
      isMatched: allMatches.length > 0,
    };
  });
}

function buildSummary(records) {
  const summary = {
    totalReleases: records.length,
    matchedReleases: 0,
    unmatchedReleases: 0,
    matchedContentReleases: 0,
    matchedImportedReleases: 0,
    matchedFolderInventoryReleases: 0,
    matchesBySource: {
      content: 0,
      imported: 0,
      folderInventory: 0,
    },
  };

  for (const record of records) {
    const { contentRelease, importedMatch, folderInventoryMatch } = record.matches || {};
    if (record.isMatched) {
      summary.matchedReleases += 1;
    } else {
      summary.unmatchedReleases += 1;
    }
    if (contentRelease?.match) summary.matchedContentReleases += 1;
    if (importedMatch?.match) summary.matchedImportedReleases += 1;
    if (folderInventoryMatch?.match) summary.matchedFolderInventoryReleases += 1;
  }

  summary.matchesBySource.content = summary.matchedContentReleases;
  summary.matchesBySource.imported = summary.matchedImportedReleases;
  summary.matchesBySource.folderInventory = summary.matchedFolderInventoryReleases;

  return summary;
}

function findMatch({ release, bySlug, byTitle, bySlugDate, byTitleDate, source, sourceProvider = null, dateKey, slug }) {
  const normalizedTitle = normalizeTitle(release.title);
  const normalizedSlug = sanitizeSlug(slug || release.title);
  const releaseDate = normalizeDate(release.releaseDate);

  const addCandidate = (candidate, method, sourceTag) => {
    if (!candidate) return null;
    return {
      match: true,
      method,
      source,
      slug: candidate.slug || normalizedSlug,
      title: candidate.title || release.title,
      type: normalizeType(candidate.type || null),
      provider: sourceProvider || null,
      sourceTag,
      year: candidate.year ?? parseYearFromDate(releaseDate),
    };
  };

  if (dateKey) {
    const exactSlugDate = bySlugDate?.get(`${normalizedSlug}||${dateKey}`);
    if (exactSlugDate) {
      return addCandidate(exactSlugDate, "slug+date");
    }

    const exactTitleDate = byTitleDate?.get(`${normalizedTitle}||${dateKey}`);
    if (exactTitleDate) {
      return addCandidate(exactTitleDate, "title+date");
    }
  }

  const bySlugMatch = bySlug?.get(normalizedSlug);
    if (bySlugMatch) return addCandidate(bySlugMatch, "slug");

  const byTitleMatch = byTitle?.get(normalizedTitle);
    if (byTitleMatch) return addCandidate(byTitleMatch, "title");

  return {
    match: false,
    method: "none",
    source,
    sourceTag: null,
    slug: null,
    title: null,
    type: null,
    provider: sourceProvider,
  };
}

function buildHeaderIndex(headerRow) {
  const index = {};
  headerRow.forEach((header, position) => {
    if (typeof header !== "string") return;
    const normalized = normalizeHeader(header);
    if (normalized) index[normalized] = position;
    if (normalized === "release version") index.releaseversion = position;
  });
  return index;
}

function cell(row, index) {
  return row[index];
}

function parseCsv(text) {
  const rows = [];
  const current = [];
  let field = "";
  let inQuotes = false;

  const flushField = () => {
    current.push(field);
    field = "";
  };

  const flushRow = () => {
    if (!current.length) return;
    if (current.length === 1 && current[0] === "") return;
    rows.push(current.slice());
    current.length = 0;
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === "\"") {
      if (text[index + 1] === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ",") {
      if (inQuotes) {
        field += char;
        continue;
      }
      flushField();
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      if (inQuotes) {
        field += char;
        continue;
      }
      flushField();
      flushRow();
      continue;
    }

    field += char;
  }

  flushField();
  flushRow();
  return rows;
}

function buildContentReleases() {
  if (!existsSync(RELEASES_TS_PATH)) {
    return [];
  }

  const source = readText(RELEASES_TS_PATH);
  const blocks = extractReleaseObjectBlocks(source);
  return blocks
    .map(parseReleaseEntryFromBlock)
    .filter((entry) => entry && entry.title && entry.slug);
}

function buildContentIndex(entries) {
  const bySlug = new Map();
  const byTitle = new Map();
  const bySlugDate = new Map();
  const byTitleDate = new Map();

  for (const entry of entries) {
    const slug = sanitizeSlug(entry.slug);
    const titleKey = normalizeTitle(entry.title);
    const dateKey = normalizeDate(entry.releaseDate);

    if (!bySlug.has(slug)) bySlug.set(slug, entry);
    if (!byTitle.has(titleKey)) byTitle.set(titleKey, entry);

    if (dateKey) {
      const slugDate = `${slug}||${dateKey}`;
      if (!bySlugDate.has(slugDate)) bySlugDate.set(slugDate, entry);
      const titleDate = `${titleKey}||${dateKey}`;
      if (!byTitleDate.has(titleDate)) byTitleDate.set(titleDate, entry);
    }
  }

  return { bySlug, byTitle, bySlugDate, byTitleDate };
}

function parseReleaseEntryFromBlock(block) {
  const title = readStringProperty(block, "title");
  if (!title) return null;
  return {
    source: RELEASES_TS_PATH,
    title,
    slug: readStringProperty(block, "slug") || sanitizeSlug(title),
    type: normalizeType(readStringProperty(block, "type")),
    releaseDate: normalizeDate(readStringProperty(block, "releaseDate")),
    year: readYearValue(readStringProperty(block, "year")),
    catalogStatus: readStringProperty(block, "catalogStatus"),
  };
}

function readContentReleases() {
  return buildContentReleases();
}

function readImportedCatalog() {
  if (!existsSync(RELEASES_IMPORTED_PATH)) {
    return {
      available: false,
      entries: [],
      bySlug: new Map(),
      byTitle: new Map(),
      bySlugDate: new Map(),
      byTitleDate: new Map(),
    };
  }

  const raw = parseJsonFile(RELEASES_IMPORTED_PATH);
  const draftEntries = Array.isArray(raw?.draftEntries) ? raw.draftEntries : [];
  const normalized = [];

  for (const entry of draftEntries) {
    const title = sanitizeText(entry?.title);
    const slug = sanitizeText(entry?.slug) || sanitizeSlug(title);
    if (!title && !slug) continue;
    const releaseDate = normalizeDate(sanitizeText(entry?.releaseDate));
    normalized.push({
      title,
      slug,
      type: normalizeType(entry?.type || "single"),
      year: readYearValue(entry?.year),
      releaseDate,
      provider: String(entry?.catalogSource?.provider ?? raw.provider ?? raw.source ?? raw?.catalogSource?.source ?? "unknown"),
      isCollection: entry?.catalogSource?.isCollection !== false && entry?.catalogSource?.trackCount !== 1,
      trackCount: readNumber(entry?.trackCount),
    });
  }

  const bySlug = new Map();
  const byTitle = new Map();
  const bySlugDate = new Map();
  const byTitleDate = new Map();

  for (const entry of normalized) {
    const slug = sanitizeSlug(entry.slug);
    const titleKey = normalizeTitle(entry.title);
    const dateKey = normalizeDate(entry.releaseDate);

    const existingBySlug = bySlug.get(slug);
    if (!existingBySlug || (existingBySlug.isCollection && !entry.isCollection)) {
      bySlug.set(slug, entry);
    }
    const existingByTitle = byTitle.get(titleKey);
    if (!existingByTitle || (existingByTitle.isCollection && !entry.isCollection)) {
      byTitle.set(titleKey, entry);
    }

    if (dateKey) {
      const slugDate = `${slug}||${dateKey}`;
      const titleDate = `${titleKey}||${dateKey}`;
      if (!bySlugDate.has(slugDate)) bySlugDate.set(slugDate, entry);
      if (!byTitleDate.has(titleDate)) byTitleDate.set(titleDate, entry);
    }
  }

  return {
    available: true,
    entries: normalized,
    bySlug,
    byTitle,
    bySlugDate,
    byTitleDate,
  };
}

function buildImportedIndex(imported) {
  return {
    bySlug: imported.bySlug ?? new Map(),
    byTitle: imported.byTitle ?? new Map(),
    bySlugDate: imported.bySlugDate ?? new Map(),
    byTitleDate: imported.byTitleDate ?? new Map(),
  };
}

function readReleasedFolderInventory() {
  if (!existsSync(RELEASE_FOLDER_INVENTORY_PATH)) {
    return { entries: [], bySlug: new Map(), byTitle: new Map(), bySlugDate: new Map(), byTitleDate: new Map() };
  }

  const inventory = parseJsonFile(RELEASE_FOLDER_INVENTORY_PATH);
  const entries = Array.isArray(inventory?.entries) ? inventory.entries : [];
  const bySlug = new Map();
  const byTitle = new Map();
  const bySlugDate = new Map();
  const byTitleDate = new Map();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const title = sanitizeText(entry.possibleTitle || entry.possibleSlug || entry.inferredTitle || entry.folderName);
    const slug = sanitizeSlug(entry.possibleSlug || entry.inferredSlug || entry.folderName || title);
    const dateKey = normalizeDate(sanitizeText(entry?.matches?.contentRelease?.releaseDate) || sanitizeText(entry?.releaseDate));
    if (!slug || !title) continue;

    if (!bySlug.has(slug)) bySlug.set(slug, entry);
    if (!byTitle.has(normalizeTitle(title))) byTitle.set(normalizeTitle(title), entry);
    if (dateKey) {
      const slugDate = `${slug}||${dateKey}`;
      if (!bySlugDate.has(slugDate)) bySlugDate.set(slugDate, entry);
      const titleDate = `${normalizeTitle(title)}||${dateKey}`;
      if (!byTitleDate.has(titleDate)) byTitleDate.set(titleDate, entry);
    }
  }

  return {
    entries,
    bySlug,
    byTitle,
    bySlugDate,
    byTitleDate,
  };
}

function buildFolderInventoryIndex(inventory) {
  return inventory;
}

function parseArtistList(value) {
  if (!value) return [];
  return value
    .split(/[,/;]| & /)
    .map((entry) => sanitizeText(entry))
    .filter(Boolean)
    .filter((artist, index, list) => index === list.findIndex((other) => normalizeTitle(other) === normalizeTitle(artist)));
}

function parseTrackNumber(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

function sanitizeDuration(value) {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(normalized)) {
    const parts = normalized.split(":").map(Number);
    if (parts.length === 3) {
      const totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = String(totalSeconds % 60).padStart(2, "0");
      return `${minutes}:${seconds}`;
    }
    return normalized;
  }
  return normalized;
}

function inferType({ title, releaseVersion, trackCount, tracks, genre, subgenre }) {
  const combined = `${title} ${releaseVersion || ""} ${tracks.map((track) => `${track.mixVersion || ""} ${track.title || ""}`).join(" ")} ${genre || ""} ${subgenre || ""}`.toLowerCase();
  const lowerTitle = String(title || "").toLowerCase();

  if (/(^|\s)(remix|remixes|mix|vip|edit)\b/.test(lowerTitle) || /remix|vip|edit/i.test(String(releaseVersion || ""))) {
    return "Remix";
  }

  if (combined.includes("album")) return "Album";
  if (combined.includes("ep")) return "EP";
  if (trackCount === 1 || trackCount === 0) return "Single";
  if (trackCount <= 4) return "EP";
  return "Album";
}

function normalizeUpc(value) {
  return String(value || "")
    .replace(/[^0-9]/g, "")
    .trim();
}

function normalizeDate(value) {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  const date = new Date(trimmed);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString().slice(0, 10);
  }
  return trimmed;
}

function parseYearFromDate(value) {
  if (!value) return null;
  const normalized = normalizeDate(value);
  if (!normalized) return null;
  const yearText = normalized.slice(0, 4);
  const year = Number(yearText);
  return Number.isFinite(year) ? year : null;
}

function sanitizeText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

function sanitizeSlug(value) {
  return normalizeTitle(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "untitled-release";
}

function normalizeType(value) {
  const source = String(value ?? "").toLowerCase().trim();
  if (source === "single") return "Single";
  if (source === "ep") return "EP";
  if (source === "remix") return "Remix";
  if (source === "mix" || source === "album" || source === "set") return "Album";
  return "Unknown";
}

function writeMarkdown(filePath, output) {
  const lines = [];
  const summary = output.summary;

  lines.push("# Distributor Inventory");
  lines.push("");
  lines.push(`Generated: ${output.generatedAt}`);
  lines.push(`Source CSV: ${output.sourceCsvPath}`);
  lines.push(`Total grouped releases: ${summary.totalReleases}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total releases: ${summary.totalReleases}`);
  lines.push(`- Matched: ${summary.matchedReleases}`);
  lines.push(`- Unmatched: ${summary.unmatchedReleases}`);
  lines.push(`- Matched in content/releases.ts: ${summary.matchedContentReleases}`);
  lines.push(`- Matched in content/releases.imported.json: ${summary.matchedImportedReleases}`);
  lines.push(`- Matched in scripts/released-folder-inventory.json: ${summary.matchedFolderInventoryReleases}`);
  lines.push("");

  const matchedEntries = output.entries.filter((entry) => entry.isMatched);
  const unmatchedEntries = output.entries.filter((entry) => !entry.isMatched);

  lines.push(`## Matched releases (${matchedEntries.length})`);
  lines.push("");
  if (!matchedEntries.length) {
    lines.push("No releases matched existing release sources yet.");
    lines.push("");
  } else {
    for (const entry of matchedEntries) {
      const matches = entry.matchSummary?.sources?.join(", ") || "unknown";
      lines.push(`- ${entry.title} (${entry.releaseDate || "no date"})`);
      lines.push(`  - UPC: ${entry.UPC || "n/a"} | Catalog: ${entry.catalogNumber || "n/a"} | Type: ${entry.inferredType}`);
      lines.push(`  - Matched with: ${matches}`);
      lines.push(`  - Tracks: ${entry.trackCount || 0}`);
    }
    lines.push("");
  }

  lines.push(`## Unmatched releases (${unmatchedEntries.length})`);
  lines.push("");
  if (!unmatchedEntries.length) {
    lines.push("All parsed releases are matched.");
    lines.push("");
  } else {
    for (const entry of unmatchedEntries) {
      lines.push(`- ${entry.title} (${entry.releaseDate || "no date"})`);
      lines.push(`  - UPC: ${entry.UPC || "n/a"} | Catalog: ${entry.catalogNumber || "n/a"} | Type: ${entry.inferredType}`);
    }
    lines.push("");
  }

  lines.push("## First 5 tracks from each release");
  lines.push("");
  for (const entry of output.entries.slice(0, 20)) {
    lines.push(`### ${entry.title}`);
    lines.push(`- Release date: ${entry.releaseDate || "unknown"}`);
    lines.push(`- Release artist: ${entry.releaseArtist || "unknown"}`);
    lines.push(`- Genre: ${entry.genre || "unknown"} / ${entry.subgenre || "unknown"}`);
    if (!entry.tracks.length) {
      lines.push("- No parsed tracks.");
      lines.push("");
      continue;
    }

    const trackLines = entry.tracks
      .slice(0, 5)
      .map((track) => `  - ${track.trackNumber || "n/a"}. ${track.title} (${track.ISRC || "no isrc"})`);
    lines.push("- Tracks:");
    lines.push(...trackLines);
    lines.push("");
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
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
  const keyPattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`);
  const match = block.match(keyPattern);
  return match ? unescapeString(match[2]).trim() : undefined;
}

function readNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readYearValue(value) {
  const normalized = normalizeDate(value);
  if (!normalized) return null;
  const parsed = Number(normalized.slice(0, 4));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseJsonFile(filePath) {
  return JSON.parse(readText(filePath));
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function unescapeString(value) {
  return String(value)
    .replace(/\\(["'`\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(`Distributor inventory failed: ${message}`);
  process.exit(1);
}
