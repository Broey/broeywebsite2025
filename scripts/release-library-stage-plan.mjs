#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const DEFAULT_METADATA_PATH = path.join(__dirname, "released-folder-metadata-preview.json");
const OUTPUT_JSON_PATH = path.join(__dirname, "release-library-stage-plan.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "release-library-stage-plan.md");
const RELEASE_LIBRARY_ROOT = "D:\\Broey\\Release Library";
const RELEASES_TS_PATH = path.join(repoRoot, "content", "releases.ts");
const RELEASE_FOLDER_MAP_PATH = path.join(repoRoot, "content", "release-folder-map.json");

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const metadataPath = args.metadata || DEFAULT_METADATA_PATH;
  if (!existsSync(metadataPath)) {
    fail(`Missing input report. Run npm run sync:released-folders:metadata-preview first or pass --metadata <path>.`);
  }

  const releaseLibraryRoot = args.root || RELEASE_LIBRARY_ROOT;
  const metadata = readMetadataPreview(metadataPath);
  const contentReleases = readContentReleases();
  const releaseFolderMap = readReleaseFolderMap();
  const releaseFolderMapReport = metadata.releaseFolderMap || {};

  const plans = metadata.entries.map((entry) => buildPlanEntry({
    entry,
    contentReleases,
    releaseFolderMap,
    releaseLibraryRoot,
  }));

  const mappedExternalSection = buildMappedSections({
    entries: plans,
    releaseFolderMapReport,
    releaseFolderMap,
    contentReleases,
  });

  const output = {
    generatedAt: new Date().toISOString(),
    sourceMetadataPath: path.relative(repoRoot, path.resolve(metadataPath)),
    sourceReleaseLibraryRoot: releaseLibraryRoot,
    summary: buildSummary(plans),
    releaseFolderMap: releaseFolderMapReport,
    mappedSections: mappedExternalSection,
    entries: plans,
  };

  writeJson(OUTPUT_JSON_PATH, output);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, output);

  console.log(`Release library stage plan written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Release library stage plan markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Candidates: ${output.summary.totalCandidates}`);
  console.log(`Planned released: ${output.summary.plannedReleasedCount}`);
  console.log(`Planned pending: ${output.summary.plannedPendingCount}`);
  console.log(`Planned review: ${output.summary.plannedNeedsReviewCount}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-stage-plan.mjs [--metadata <path>] [--root <path>] [--help]");
  console.log("");
  console.log("Default metadata source:");
  console.log(`  ${path.relative(repoRoot, DEFAULT_METADATA_PATH)}`);
  console.log("Default target root:");
  console.log(`  ${RELEASE_LIBRARY_ROOT}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/release-library-stage-plan.json");
  console.log("  scripts/release-library-stage-plan.md");
  console.log("");
  console.log("This script is report-only and does not copy or mutate files.");
}

function parseArgs(args) {
  const parsed = { metadata: null, root: null, help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--metadata") {
      if (index + 1 >= args.length) fail("Missing value for --metadata. Use --metadata <path>.");
      parsed.metadata = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--metadata=")) {
      parsed.metadata = arg.replace(/^--metadata=/, "");
      continue;
    }

    if (arg === "--root") {
      if (index + 1 >= args.length) fail("Missing value for --root. Use --root <path>.");
      parsed.root = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--root=")) {
      parsed.root = arg.replace(/^--root=/, "");
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function buildPlanEntry({ entry, contentReleases, releaseFolderMap, releaseLibraryRoot }) {
  const websiteMatch = Boolean(entry.websiteMatch);
  const tidalMatch = Boolean(entry.tidalMatch);
  const confidence = entry.confidence || "low";
  const warnings = Array.isArray(entry.warnings) ? entry.warnings.slice() : [];
  const sourceFolder = typeof entry.sourceFolder === "string" ? entry.sourceFolder : "";
  const slug = sanitizeSlug(entry.slug || entry.title || "");
  const normalizedType = normalizeTypeValue(entry.type);
  const mapped = releaseFolderMap.get(slug);
  const mappedStatus = mapped ? normalizeMappedStatus(mapped.status) : null;
  const normalizedSourceFolder = sourceFolder.trim();
  const hasSourceFolder = Boolean(normalizedSourceFolder && existsSync(normalizedSourceFolder));
  const hasArtworkCandidate = Boolean(entry.coverCandidate);
  const hasAudioCandidate = Boolean(entry.audioCandidate);
  const typeHasClearSignal = !warnings.includes("unclear type") && !isTypeUnknown(normalizedType);
  const missingRequiredMedia = !hasArtworkCandidate || !hasAudioCandidate;
  const mappedAllowsCopy = mapped ? mapped.shouldStageToReleaseLibrary === true : true;
  const shouldDeferMappedCopy = mapped && !mappedAllowsCopy;

  const targetStatusFolder = determineTargetStatus({
    mappedStatus,
    confidence,
    typeHasClearSignal,
    missingRequiredMedia,
    hasSourceFolder,
    warnings,
  });

  const targetFolder = path.join(releaseLibraryRoot, targetStatusFolder, slug);

  const proposedRelease = buildProposedReleaseJson({
    entry,
    normalizedType,
    contentReleases,
    slug,
    targetFolder,
    targetStatusFolder,
  });

  const coverCopy = buildCoverCopy({
    sourcePath: entry.coverCandidate || null,
    targetFolder,
    slug,
    shouldCopy: mappedAllowsCopy,
  });

  const shouldCopyAudio = shouldStageAudioCandidate({
    type: normalizedType,
    confidence,
    typeHasClearSignal,
    hasAudioCandidate,
    warnings,
  });
  const audioCopy = buildAudioCopy({
    sourcePath: entry.audioCandidate || null,
    targetFolder,
    type: normalizedType,
    slug,
    title: entry.title || entry.folderName || slug,
    shouldCopy: shouldCopyAudio && targetStatusFolder !== "needs-review" && mappedAllowsCopy,
  });

  if (!shouldCopyAudio && hasAudioCandidate) {
    if (!warnings.includes("audio candidate deferred for review")) {
      warnings.push("audio candidate deferred for review");
    }
  }

  if (shouldDeferMappedCopy && hasSourceFolder) {
    if (!warnings.includes("copy deferred by mapped folder policy")) {
      warnings.push("copy deferred by mapped folder policy");
    }
  }

  const shouldStageToReleaseLibrary = mapped?.shouldStageToReleaseLibrary ?? true;
  const safeToStage = targetStatusFolder !== "needs-review" && hasSourceFolder && shouldStageToReleaseLibrary;

  return {
    folderName: entry.folderName,
    sourceFolder: normalizedSourceFolder,
    targetFolder,
    targetStatusFolder,
    sourceResolved: hasSourceFolder,
    proposedReleaseJson: proposedRelease,
    coverCopy,
    audioCopy,
    confidence,
    status: entry.status || "released",
    reviewStatus: "pending",
    warnings,
    carouselCandidate: Boolean(entry.carouselCandidate),
    websiteMatch,
    tidalMatch,
    hasWebsiteMetadata: websiteMatch,
    hasTidalMetadata: tidalMatch,
    safeToStage,
    mappedStatus,
    mappedSourceFolder: mapped?.sourceFolder || null,
    shouldStageToReleaseLibrary: mapped?.shouldStageToReleaseLibrary === true,
  };
}

function determineTargetStatus({
  mappedStatus,
  confidence,
  typeHasClearSignal,
  missingRequiredMedia,
  hasSourceFolder,
  warnings,
}) {
  if (mappedStatus === "pending") return "pending";
  if (mappedStatus === "external-collab" || mappedStatus === "unreleased") return "needs-review";
  if (!hasSourceFolder) return "needs-review";
  if (confidence === "high" || confidence === "medium") {
    if (!warnings.includes("missing audio") && !warnings.includes("missing artwork") && typeHasClearSignal) {
      return "released";
    }
    if (mappedStatus === "released") {
      return "needs-review";
    }
  }
  return "needs-review";
}

function shouldStageAudioCandidate({
  type,
  confidence,
  typeHasClearSignal,
  hasAudioCandidate,
  warnings,
}) {
  if (!hasAudioCandidate) return false;
  if (type === "Single") return confidence === "high" || confidence === "medium";
  if (type === "EP" || type === "Album" || type === "Remix") {
    return (confidence === "high" || confidence === "medium") && typeHasClearSignal && !warnings.includes("unclear type");
  }
  return false;
}

function buildProposedReleaseJson({ entry, normalizedType, contentReleases, targetStatusFolder }) {
  const contentEntry = findContentEntry(contentReleases, entry.slug, entry.title);
  const releaseDate = entry.releaseDate ?? (contentEntry?.releaseDate || null);
  const year = typeof entry.year === "number" ? entry.year : contentEntry?.year || null;
  const catalogStatus = entry.catalogStatus || contentEntry?.catalogStatus || null;
  const upc = entry.upc || contentEntry?.upc || null;
  const catalogNumber = entry.catalogNumber || contentEntry?.catalogNumber || null;
  const trackList = Array.isArray(entry.trackList) ? entry.trackList : [];
  const isrcs = Array.isArray(entry.isrcs) ? entry.isrcs : [];
  const coverExt = path.extname(entry.coverCandidate || "").toLowerCase() || ".png";
  const librarySlug = sanitizeSlug(entry.slug || entry.title || "untitled-release");
  const description = entry.websiteMatch
    ? "Review and finalize metadata for existing website release."
    : entry.tidalMatch
      ? "Review and finalize metadata using TIDAL enrichment."
      : "Review and finalize metadata for this inferred release candidate.";
  const sourceReleaseType = entry.websiteMatch
    ? "website"
    : entry.tidalMatch
      ? "tidal"
      : "folder-inferred";
  const releaseJsonPath = path.join("release-library", librarySlug, "release.json");

  return {
    title: entry.title || entry.folderName || sanitizeSlug(entry.slug || ""),
    slug: sanitizeSlug(entry.slug || entry.title || ""),
    type: normalizedType,
    status: targetStatusFolder === "pending"
      ? "pending"
      : targetStatusFolder === "needs-review"
        ? "needs-review"
        : "released",
    releaseDate,
    year,
    upc,
    catalogNumber,
    trackList,
    isrcs,
    description,
    visibility: "draft",
    catalogStatus,
    coverImage: contentEntry?.coverImage || `/${releaseJsonPath.replace(/\\/g, "/").replace("/release.json", "/artwork/cover")}${coverExt}`,
    coverAlt: contentEntry?.coverAlt || `${entry.title || "Release"} cover art`,
    releasePath: `/${releaseJsonPath.replace(/\\/g, "/")}`,
    listenAction: entry.listenAction || null,
    sourceReleaseType,
  };
}

function buildCoverCopy({ sourcePath, targetFolder, slug, shouldCopy }) {
  if (!sourcePath) return { sourcePath: null, targetPath: null, selected: false };
  const ext = path.extname(sourcePath) || ".png";
  const selected = shouldCopy !== false;
  return {
    sourcePath,
    targetPath: selected ? path.join(targetFolder, "artwork", `cover${ext.toLowerCase()}`) : null,
    ext,
    selected,
  };
}

function buildAudioCopy({ sourcePath, targetFolder, type, slug, title, shouldCopy }) {
  if (!sourcePath) return { sourcePath: null, targetPath: null, selected: false };
  const ext = path.extname(sourcePath) || ".wav";
  const baseName = type === "Single"
    ? `master${ext.toLowerCase()}`
    : `01 - ${sanitizeTitleForFile(targetsTitleCase(title || slug))}${ext.toLowerCase()}`;

  return {
    sourcePath,
    targetPath: shouldCopy ? path.join(targetFolder, "audio", baseName) : null,
    selected: shouldCopy,
  };
}

function buildSummary(entries) {
  const total = entries.length;
  return {
    totalCandidates: total,
    plannedReleasedCount: entries.filter((entry) => entry.targetStatusFolder === "released").length,
    plannedPendingCount: entries.filter((entry) => entry.targetStatusFolder === "pending").length,
    plannedNeedsReviewCount: entries.filter((entry) => entry.targetStatusFolder === "needs-review").length,
    safeToStageCount: entries.filter((entry) => entry.safeToStage).length,
    highConfidenceCount: entries.filter((entry) => entry.confidence === "high").length,
    mediumConfidenceCount: entries.filter((entry) => entry.confidence === "medium").length,
    lowConfidenceCount: entries.filter((entry) => entry.confidence === "low").length,
    sourceHasCoverCount: entries.filter((entry) => Boolean(entry.coverCopy?.sourcePath)).length,
    sourceHasAudioCount: entries.filter((entry) => Boolean(entry.audioCopy?.sourcePath)).length,
    readyCopyAudioCount: entries.filter((entry) => Boolean(entry.audioCopy?.targetPath)).length,
    readyCopyCoverCount: entries.filter((entry) => Boolean(entry.coverCopy?.targetPath)).length,
    websiteMatchCount: entries.filter((entry) => entry.hasWebsiteMetadata).length,
    tidalMatchCount: entries.filter((entry) => entry.hasTidalMetadata).length,
    carouselCandidateCount: entries.filter((entry) => entry.carouselCandidate).length,
  };
}

function buildMappedSections({ entries, releaseFolderMapReport, releaseFolderMap, contentReleases }) {
  const curatedCarouselMissingFromScan = releaseFolderMapReport.curatedCarouselMissingFromScan ?? [];
  const knownMappedExternalFolders = releaseFolderMapReport.knownMappedExternalFolders ?? [];
  const unmappedMissingReleases = releaseFolderMapReport.unmappedMissingReleases ?? [];

  const plannedBySlug = new Map(entries.map((entry) => [sanitizeSlug(entry.slug || ""), entry]));
  const mappedNotScanned = [];

  for (const [slug, mapped] of releaseFolderMap.entries ? releaseFolderMap.entries() : []) {
    const normalized = sanitizeSlug(slug);
    if (plannedBySlug.has(normalized)) continue;
    const releaseEntry = contentReleases.bySlug.get(normalized);
    const record = {
      slug: normalized,
      title: releaseEntry?.title || normalized,
      status: mapped.status || "pending",
      sourceFolder: mapped.sourceFolder || null,
      reason: mapped.notes || `Mapped as ${mapped.status || "pending"} in release folder map.`,
      shouldStageToReleaseLibrary: Boolean(mapped.shouldStageToReleaseLibrary),
      mappedStatus: normalizeMappedStatus(mapped.status),
    };
    mappedNotScanned.push(record);
  }

  return {
    curatedCarouselMissingFromScan,
    knownMappedExternalFolders,
    unmappedMissingReleases,
    mappedNotScanned,
  };
}

function readMetadataPreview(filePath) {
  const parsed = JSON.parse(readFileSync(filePath, "utf8"));
  if (!parsed || !Array.isArray(parsed.entries)) fail("Invalid metadata preview payload: expected { entries: [] }.");
  return parsed;
}

function readContentReleases() {
  if (!existsSync(RELEASES_TS_PATH)) {
    return {
      bySlug: new Map(),
      byTitle: new Map(),
    };
  }

  const source = readFileSync(RELEASES_TS_PATH, "utf8");
  const blocks = extractReleaseObjectBlocks(source);
  const entries = blocks
    .map(parseReleaseEntryFromBlock)
    .filter((entry) => entry && entry.title && entry.slug);

  const bySlug = new Map();
  const byTitle = new Map();

  for (const entry of entries) {
    const slug = sanitizeSlug(entry.slug);
    bySlug.set(slug, entry);
    byTitle.set(normalizeTitle(entry.title), entry);
  }

  return { bySlug, byTitle };
}

function parseReleaseEntryFromBlock(block) {
  const title = readStringProperty(block, "title");
  if (!title) return null;
  const slug = readStringProperty(block, "slug") || sanitizeSlug(title);
  const releaseDate = readStringProperty(block, "releaseDate");
  const description = readStringProperty(block, "description");
  const year = readNumberProperty(block, "year");
  const catalogStatus = readStringProperty(block, "catalogStatus");
  const coverImage = readStringProperty(block, "coverImage");
  const coverAlt = readStringProperty(block, "coverAlt");
  const type = normalizeTypeValue(readStringProperty(block, "type"));

  return {
    source: RELEASES_TS_PATH,
    title,
    slug,
    type,
    releaseDate,
    year,
    description,
    catalogStatus,
    coverImage,
    coverAlt,
  };
}

function findContentEntry(contentReleases, slug, title) {
  const fromSlug = contentReleases.bySlug.get(sanitizeSlug(slug));
  if (fromSlug) return fromSlug;

  const normalizedTitle = normalizeTitle(title || "");
  return contentReleases.byTitle.get(normalizedTitle) || null;
}

function readReleaseFolderMap() {
  if (!existsSync(RELEASE_FOLDER_MAP_PATH)) return new Map();
  try {
    const raw = JSON.parse(readFileSync(RELEASE_FOLDER_MAP_PATH, "utf8"));
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return new Map();

    const normalized = new Map();
    for (const [slug, value] of Object.entries(raw)) {
      if (typeof slug !== "string" || !slug.trim()) continue;
      normalized.set(sanitizeSlug(slug), normalizeReleaseFolderMapEntry(value));
    }
    return normalized;
  } catch (error) {
    console.error(`Warning: unable to read release-folder-map (${RELEASE_FOLDER_MAP_PATH}): ${error?.message || String(error)}`);
    return new Map();
  }
}

function normalizeReleaseFolderMapEntry(value) {
  if (!value || typeof value !== "object") return {
    status: "pending",
    notes: "missing map payload",
    sourceFolder: "",
    shouldStageToReleaseLibrary: false,
  };

  return {
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

function writeMarkdown(filePath, output) {
  const lines = [];
  const { summary } = output;
  const sections = output.mappedSections;
  const entriesByStatus = {
    released: output.entries.filter((entry) => entry.targetStatusFolder === "released"),
    pending: output.entries.filter((entry) => entry.targetStatusFolder === "pending"),
    "needs-review": output.entries.filter((entry) => entry.targetStatusFolder === "needs-review"),
  };

  lines.push("# Release Library Stage Plan");
  lines.push("");
  lines.push(`Generated: ${output.generatedAt}`);
  lines.push(`Source metadata: ${output.sourceMetadataPath}`);
  lines.push(`Target root: ${output.sourceReleaseLibraryRoot}`);
  lines.push("Status: planning-only. No files are copied or written.");
  lines.push("");

  lines.push("## Summary");
  lines.push(`- Total candidates: ${summary.totalCandidates}`);
  lines.push(`- High-confidence: ${summary.highConfidenceCount}`);
  lines.push(`- Medium-confidence: ${summary.mediumConfidenceCount}`);
  lines.push(`- Low-confidence: ${summary.lowConfidenceCount}`);
  lines.push(`- Planned released: ${summary.plannedReleasedCount}`);
  lines.push(`- Planned pending: ${summary.plannedPendingCount}`);
  lines.push(`- Planned needs-review: ${summary.plannedNeedsReviewCount}`);
  lines.push(`- Safe to stage: ${summary.safeToStageCount}`);
  lines.push(`- Release candidates with cover: ${summary.sourceHasCoverCount}`);
  lines.push(`- Release candidates with audio: ${summary.sourceHasAudioCount}`);
  lines.push(`- Planned cover copy operations: ${summary.readyCopyCoverCount}`);
  lines.push(`- Planned audio copy operations: ${summary.readyCopyAudioCount}`);
  lines.push(`- Website matches: ${summary.websiteMatchCount}`);
  lines.push(`- TIDAL matches: ${summary.tidalMatchCount}`);
  lines.push(`- Carousel candidates: ${summary.carouselCandidateCount}`);
  lines.push("");

  renderMappedSections(lines, sections);
  renderPlanSection(lines, "Planned Released Folder Targets", entriesByStatus.released);
  renderPlanSection(lines, "Planned Pending Folder Targets", entriesByStatus.pending);
  renderPlanSection(lines, "Planned Needs-Review Folder Targets", entriesByStatus["needs-review"]);

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function renderMappedSections(lines, sections) {
  const curated = sections.curatedCarouselMissingFromScan || [];
  const mappedExternal = sections.knownMappedExternalFolders || [];
  const unmapped = sections.unmappedMissingReleases || [];
  const mappedNotScanned = sections.mappedNotScanned || [];

  lines.push(`## Curated carousel releases missing from scan (${curated.length})`);
  lines.push("");
  if (!curated.length) {
    lines.push("No curated carousel releases are missing from the scan.");
  } else {
    for (const entry of curated) {
      lines.push(`- ${entry.title} (${entry.slug})`);
    }
  }
  lines.push("");

  lines.push(`## Known mapped external folders (${mappedExternal.length})`);
  lines.push("");
  if (!mappedExternal.length) {
    lines.push("No mapped external folders currently reported.");
  } else {
    for (const entry of mappedExternal) {
      const source = entry.sourceFolder ? `source: ${entry.sourceFolder}` : "source: unknown";
      lines.push(`- ${entry.slug} (${source}, status: ${entry.status || "unknown"}, stageToReleaseLibrary: ${Boolean(entry.shouldStageToReleaseLibrary) ? "yes" : "no"})`);
      if (entry.notes) lines.push(`  - ${entry.notes}`);
    }
  }
  lines.push("");

  lines.push(`## Unmapped missing releases (${unmapped.length})`);
  lines.push("");
  if (!unmapped.length) {
    lines.push("No unmapped missing releases.");
  } else {
    for (const entry of unmapped) {
      lines.push(`- ${entry.title} (${entry.slug})`);
      lines.push(`  - status: ${entry.type || "unknown"}`);
    }
  }

  lines.push("");

  lines.push(`## Mapped releases not in current scan (${mappedNotScanned.length})`);
  if (!mappedNotScanned.length) {
    lines.push("No mapped releases are currently missing from the current scan.");
  } else {
    for (const entry of mappedNotScanned) {
      lines.push(`- ${entry.title} (${entry.slug})`);
      lines.push(`  - status: ${entry.mappedStatus}`);
      lines.push(`  - stageToReleaseLibrary: ${entry.shouldStageToReleaseLibrary ? "yes" : "no"}`);
      if (entry.sourceFolder) lines.push(`  - source: ${entry.sourceFolder}`);
      if (entry.reason) lines.push(`  - reason: ${entry.reason}`);
    }
  }

  const pendingOnlyMapped = mappedNotScanned.filter((entry) => entry.mappedStatus === "pending");
  if (pendingOnlyMapped.length) {
    lines.push("");
    lines.push(`## Mapped pending releases not in scan (${pendingOnlyMapped.length})`);
    for (const entry of pendingOnlyMapped) {
      lines.push(`- ${entry.title} (${entry.slug})`);
      lines.push("  - status: pending");
      if (entry.sourceFolder) lines.push(`  - source: ${entry.sourceFolder}`);
      if (entry.reason) lines.push(`  - reason: ${entry.reason}`);
    }
  }
}

function renderPlanSection(lines, title, entries) {
  lines.push(`## ${title} (${entries.length})`);
  lines.push("");
  if (!entries.length) {
    lines.push("No entries.");
    lines.push("");
    return;
  }

  for (const entry of entries) {
    lines.push(`### ${entry.proposedReleaseJson.title || entry.folderName}`);
    lines.push(`- Source folder: \`${entry.sourceFolder || "unknown"}\``);
    lines.push(`- Target folder: \`${entry.targetFolder}\``);
    lines.push(`- Target status folder: ${entry.targetStatusFolder}`);
    lines.push(`- Confidence: ${entry.confidence}`);
    lines.push(`- Safe to stage: ${entry.safeToStage ? "yes" : "no"}`);
    lines.push(`- Website metadata: ${entry.hasWebsiteMetadata ? "yes" : "no"}`);
    lines.push(`- TIDAL metadata: ${entry.hasTidalMetadata ? "yes" : "no"}`);
    lines.push(`- Carousel candidate: ${entry.carouselCandidate ? "yes" : "no"}`);
    lines.push("- Proposed release.json:");
    lines.push(`  - path: \`/${entry.proposedReleaseJson.releasePath.replace(/^\//, "")}\``);
    lines.push(`  - title: ${entry.proposedReleaseJson.title}`);
    lines.push(`  - slug: ${entry.proposedReleaseJson.slug}`);
    lines.push(`  - type: ${entry.proposedReleaseJson.type}`);
    lines.push(`  - status: ${entry.proposedReleaseJson.status || "released"}`);
    lines.push(`  - catalogStatus: ${entry.proposedReleaseJson.catalogStatus || "unknown"}`);
    lines.push(`  - release path: \`/${path.relative(process.cwd(), path.join(entry.targetFolder, "release.json")).replace(/\\\\/g, "/")}\``);
    lines.push(`  - releaseDate: ${entry.proposedReleaseJson.releaseDate || "unknown"}`);
    lines.push(`  - year: ${entry.proposedReleaseJson.year || "unknown"}`);
    if (entry.proposedReleaseJson.listenAction) {
      lines.push(`  - listenAction: ${renderListenAction(entry.proposedReleaseJson.listenAction)}`);
    }
    lines.push(`- Artwork copy: ${formatCopyLine(entry.coverCopy)}`);
    lines.push(`- Audio copy: ${formatCopyLine(entry.audioCopy)}`);
    if (entry.warnings.length) {
      lines.push(`- Warnings: ${entry.warnings.join("; ")}`);
    }
    if (entry.mappedStatus || entry.shouldStageToReleaseLibrary || entry.mappedSourceFolder) {
      lines.push("- Mapping:");
      lines.push(`  - map status: ${entry.mappedStatus || "none"}`);
      if (entry.shouldStageToReleaseLibrary) lines.push("  - map says stageToReleaseLibrary: yes");
      if (entry.mappedSourceFolder) lines.push(`  - map source folder: ${entry.mappedSourceFolder}`);
    }
    lines.push("");
  }
}

function formatCopyLine(copy) {
  if (!copy || !copy.sourcePath) return "`missing`";
  if (!copy.targetPath) return `\`${copy.sourcePath}\` -> *(needs review)*`;
  return `\`${copy.sourcePath}\` -> \`${copy.targetPath}\``;
}

function renderListenAction(listenAction) {
  if (!listenAction || typeof listenAction !== "object") return "unknown";
  const kind = String(listenAction.kind || "unknown");
  if (kind === "disco-embed" && listenAction.embedUrl) return `disco-embed (${listenAction.embedUrl})`;
  if (kind === "external" && listenAction.url) return `external (${listenAction.url})`;
  if (kind === "local-audio" && listenAction.audioSrc) return `local-audio (${listenAction.audioSrc})`;
  return kind;
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

function normalizeTypeValue(value) {
  const source = String(value ?? "").toLowerCase().trim();
  if (source === "single") return "Single";
  if (source === "ep") return "EP";
  if (source === "remix") return "Remix";
  if (source === "mix") return "Album";
  if (source === "album") return "Album";
  if (source === "set") return "Album";
  return "Unknown";
}

function isTypeUnknown(type) {
  return String(type ?? "").toLowerCase() === "unknown";
}

function targetsTitleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0] ? `${part[0].toUpperCase()}${part.slice(1)}` : part)
    .join(" ");
}

function sanitizeTitleForFile(value) {
  return String(value ?? "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.|\.$/g, "")
    .trim();
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

function readStringProperty(source, key) {
  const keyPattern = new RegExp(`${escapeRegExp(key)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`, "i");
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

function unescapeString(value) {
  return String(value)
    .replace(/\\(["'`\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function writeJson(filePath, payload) {
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fail(message) {
  console.error(`Release library stage plan failed: ${message}`);
  process.exit(1);
}
