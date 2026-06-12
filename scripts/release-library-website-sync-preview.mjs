#!/usr/bin/env node

import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_RELEASE_ROOT = "D:\\Broey\\Release Library\\released";
const DEFAULT_CONTENT_PATH = path.join(repoRoot, "content", "releases.ts");
const OUTPUT_JSON_PATH = path.join(__dirname, "release-library-website-sync-preview.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "release-library-website-sync-preview.md");
const PUBLIC_COVER_ART_DIR = "public/assets/cover-art";
const PUBLIC_COVER_ART_WEB_ROOT = "/assets/cover-art";

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);
const COVER_HINTS = ["cover", "artwork", "front", "album", "package"];

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const releaseRoot = args.root || DEFAULT_RELEASE_ROOT;
  if (!existsSync(releaseRoot)) {
    fail(`Source root not found: ${releaseRoot}`);
  }

  const contentPath = args.content || DEFAULT_CONTENT_PATH;
  if (!existsSync(contentPath)) {
    fail(`Missing content source: ${contentPath}`);
  }

  const contentReleases = readContentReleases(contentPath);
  const releaseFolders = readReleaseFolders(releaseRoot);
  const previewEntries = releaseFolders.map((folder) =>
    buildPreviewEntry(folder, contentReleases),
  );

  const output = {
    generatedAt: new Date().toISOString(),
    sourceRoot: releaseRoot,
    sourceContentPath: path.relative(repoRoot, path.resolve(contentPath)),
    publicCoverArtDir: PUBLIC_COVER_ART_DIR,
    summary: buildSummary(previewEntries),
    releases: previewEntries,
  };

  writeJson(OUTPUT_JSON_PATH, output);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, output);

  console.log(`Release library website sync preview written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Release library website sync markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Releases: ${output.summary.totalReleases}`);
  console.log(`Website updates: ${output.summary.updateCount}`);
  console.log(`Website adds: ${output.summary.addCount}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-website-sync-preview.mjs [--root <path>] [--content <path>] [--help]");
  console.log("");
  console.log("Defaults:");
  console.log(`  root: ${DEFAULT_RELEASE_ROOT}`);
  console.log(`  content: ${path.relative(repoRoot, DEFAULT_CONTENT_PATH)}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/release-library-website-sync-preview.json");
  console.log("  scripts/release-library-website-sync-preview.md");
  console.log("");
  console.log("This is a preview-only script. It does not copy assets or modify content/releases.ts.");
}

function parseArgs(args) {
  const parsed = {
    help: false,
    root: null,
    content: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
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

    if (arg === "--content") {
      if (index + 1 >= args.length) fail("Missing value for --content. Use --content <path>.");
      parsed.content = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--content=")) {
      parsed.content = arg.replace(/^--content=/, "");
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function readReleaseFolders(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const releaseFolderPath = path.join(root, entry.name);
      return {
        releaseFolderName: entry.name,
        releaseFolderPath,
        releaseJsonPath: path.join(releaseFolderPath, "release.json"),
      };
    })
    .sort((left, right) => left.releaseFolderName.localeCompare(right.releaseFolderName));
}

function buildPreviewEntry(folder, contentReleases) {
  const releaseJsonRead = readJsonFile(folder.releaseJsonPath);
  const releaseJson = releaseJsonRead.value && typeof releaseJsonRead.value === "object" && !Array.isArray(releaseJsonRead.value)
    ? releaseJsonRead.value
    : null;

  const folderTitle = inferFolderTitle(folder.releaseFolderName);
  const folderSlug = sanitizeSlug(folderTitle);
  const releaseDatePrefix = extractDatePrefix(folder.releaseFolderName);

  const title = readText(releaseJson?.title) || folderTitle;
  const slug = sanitizeSlug(readText(releaseJson?.slug) || folderSlug || title);
  const type = normalizeReleaseType(readText(releaseJson?.type) || "");
  const releaseDate = readText(releaseJson?.releaseDate)
    || contentReleases.bySlug.get(slug)?.releaseDate
    || releaseDatePrefix
    || null;
  const year = resolveYear(releaseJson?.year, contentReleases.bySlug.get(slug)?.year, releaseDate);
  const releaseDateExact = isExactDate(releaseDate);

  const contentMatch = findContentEntry(contentReleases, slug, title);
  const releaseJsonArtworkPath = readText(releaseJson?.artworkPath) || null;

  const artworkFolderPath = path.join(folder.releaseFolderPath, "artwork");
  const artworkFiles = existsSync(artworkFolderPath)
    ? collectArtworkFiles(artworkFolderPath)
    : [];
  const sourceArtwork = chooseLikelyCover({
    artworkFiles,
    folderName: folder.releaseFolderName,
    title,
    slug,
  });

  const sourceArtworkPath = sourceArtwork
    ? toPosixPath(path.relative(folder.releaseFolderPath, sourceArtwork.path))
    : null;
  const sourceArtworkAbsolutePath = sourceArtwork?.path || null;
  const sourceArtworkExt = sourceArtwork?.ext
    || path.extname(releaseJsonArtworkPath || "").toLowerCase()
    || null;

  const websiteCoverImage = sourceArtworkExt
    ? `${PUBLIC_COVER_ART_WEB_ROOT}/${slug}${sourceArtworkExt}`
    : null;
  const targetArtworkPath = sourceArtworkExt
    ? path.posix.join(PUBLIC_COVER_ART_DIR, `${slug}${sourceArtworkExt}`)
    : null;

  const listenAction = resolveListenAction({
    releaseJsonListenAction: releaseJson?.listenAction,
    contentMatch,
  });
  const carouselEnabled = resolveMaybeBoolean(
    releaseJson?.carouselEnabled,
    contentMatch?.carouselEnabled,
  );
  const carouselPriority = resolveMaybeNumber(
    releaseJson?.carouselPriority,
    contentMatch?.carouselPriority,
  );
  const catalogStatus = resolveMaybeText(
    releaseJson?.catalogStatus,
    contentMatch?.catalogStatus,
  );

  const proposedWebsiteRelease = {
    title,
    slug,
    type,
    releaseDate,
    year,
    coverImage: websiteCoverImage,
    listenAction,
    carouselEnabled,
    carouselPriority,
    catalogStatus,
  };

  const currentWebsiteListenAction = resolveListenAction({
    releaseJsonListenAction: contentMatch?.listenAction,
    contentMatch,
  });

  const currentWebsiteRelease = contentMatch
    ? {
        title: contentMatch.title,
        slug: contentMatch.slug,
        type: contentMatch.type,
        releaseDate: contentMatch.releaseDate || null,
        year: typeof contentMatch.year === "number" ? contentMatch.year : null,
        coverImage: contentMatch.coverImage || null,
        listenAction: currentWebsiteListenAction,
        carouselEnabled: typeof contentMatch.carouselEnabled === "boolean"
          ? contentMatch.carouselEnabled
          : null,
        carouselPriority: Number.isFinite(contentMatch.carouselPriority)
          ? contentMatch.carouselPriority
          : null,
        catalogStatus: contentMatch.catalogStatus || null,
      }
    : null;

  const changes = buildChangeList(currentWebsiteRelease, proposedWebsiteRelease);
  const contentState = contentMatch
    ? (contentMatch.visibility === "draft" ? "draft" : "public")
    : "missing";
  const websiteAction = contentState === "public" ? "update" : "add";

  const blockers = buildBlockers({
    releaseJsonRead,
    title,
    slug,
    type,
    releaseDate,
    year,
    sourceArtworkPath,
    targetArtworkPath,
  });

  const proposedWebsiteReleaseSummary = {
    ...proposedWebsiteRelease,
    status: "released",
  };

  const notes = [];
  if (releaseDateExact) {
    notes.push(`Exact release date used (${releaseDate}).`);
  } else if (releaseDate) {
    notes.push(`Folder placeholder date kept (${releaseDate}).`);
  }

  if (sourceArtworkPath) {
    notes.push(`Source artwork selected: ${sourceArtworkPath}.`);
  }

  if (contentState === "public") {
    notes.push("content/releases.ts already has a public entry for this release.");
  } else if (contentState === "draft") {
    notes.push("content/releases.ts has this release as a draft entry.");
  } else {
    notes.push("No matching release found in content/releases.ts.");
  }

  if (websiteAction === "update") {
    notes.push("Website release would be updated.");
  } else {
    notes.push("Website release would be added.");
  }

  if (changes.length) {
    notes.push(`Changed fields: ${changes.map((change) => change.field).join(", ")}.`);
  } else {
    notes.push("No content field differences detected.");
  }

  return {
    releaseFolderName: folder.releaseFolderName,
    releaseFolderPath: folder.releaseFolderPath,
    releaseJsonPath: folder.releaseJsonPath,
    releaseJsonExists: releaseJsonRead.exists,
    releaseJsonParseError: releaseJsonRead.error,
    title,
    slug,
    type,
    releaseDate,
    releaseDateExact,
    year,
    releaseJsonArtworkPath,
    sourceArtworkPath,
    sourceArtworkAbsolutePath,
    targetArtworkPath,
    websiteCoverImage,
    listenAction,
    carouselEnabled,
    carouselPriority,
    catalogStatus,
    contentMatch: contentMatch
      ? {
          matched: true,
          method: contentMatch.method,
          visibility: contentMatch.visibility,
          title: contentMatch.title,
          slug: contentMatch.slug,
          type: contentMatch.type,
          releaseDate: contentMatch.releaseDate || null,
          year: typeof contentMatch.year === "number" ? contentMatch.year : null,
          coverImage: contentMatch.coverImage || null,
          listenAction: contentMatch.listenAction || null,
          carouselEnabled: typeof contentMatch.carouselEnabled === "boolean"
            ? contentMatch.carouselEnabled
            : null,
          carouselPriority: Number.isFinite(contentMatch.carouselPriority)
            ? contentMatch.carouselPriority
            : null,
          catalogStatus: contentMatch.catalogStatus || null,
        }
      : {
          matched: false,
          method: "none",
          visibility: null,
          title: null,
          slug: null,
          type: null,
          releaseDate: null,
          year: null,
          coverImage: null,
          listenAction: null,
          carouselEnabled: null,
          carouselPriority: null,
          catalogStatus: null,
        },
    contentAlreadyHasRelease: contentState !== "missing",
    contentState,
    websiteAction,
    proposedWebsiteRelease: proposedWebsiteReleaseSummary,
    changes,
    blockers,
    readyForWebsiteSync: blockers.length === 0,
    sourceArtworkCandidates: artworkFiles.slice(0, 3).map((file) => toPosixPath(path.relative(folder.releaseFolderPath, file.path))),
    notes,
  };
}

function buildBlockers({
  releaseJsonRead,
  title,
  slug,
  type,
  releaseDate,
  year,
  sourceArtworkPath,
  targetArtworkPath,
}) {
  const blockers = [];

  if (!releaseJsonRead.exists) {
    blockers.push("missing release.json");
  } else if (releaseJsonRead.error) {
    blockers.push(`invalid release.json: ${releaseJsonRead.error}`);
  }

  const missingMetadata = [];
  if (!readText(title)) missingMetadata.push("title");
  if (!readText(slug)) missingMetadata.push("slug");
  if (!readText(type)) missingMetadata.push("type");
  if (!readText(releaseDate)) missingMetadata.push("releaseDate");
  if (!Number.isFinite(year)) missingMetadata.push("year");

  if (missingMetadata.length) {
    blockers.push(`missing required metadata: ${missingMetadata.join(", ")}`);
  }

  if (!readText(sourceArtworkPath) || !readText(targetArtworkPath)) {
    blockers.push("missing artwork");
  }

  return blockers;
}

function buildChangeList(current, proposed) {
  const fields = [
    "title",
    "slug",
    "type",
    "releaseDate",
    "year",
    "coverImage",
    "listenAction",
    "carouselEnabled",
    "carouselPriority",
    "catalogStatus",
  ];

  const changes = [];
  for (const field of fields) {
    const currentValue = current ? current[field] ?? null : null;
    const proposedValue = proposed[field] ?? null;
    if (!areComparableValuesEqual(currentValue, proposedValue)) {
      changes.push({
        field,
        current: currentValue,
        proposed: proposedValue,
      });
    }
  }

  return changes;
}

function areComparableValuesEqual(left, right) {
  return normalizeComparableValue(left) === normalizeComparableValue(right);
}

function normalizeComparableValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return JSON.stringify(normalizeListenAction(value));
  }
  return String(value);
}

function buildSummary(entries) {
  return {
    totalReleases: entries.length,
    publicMatchCount: entries.filter((entry) => entry.contentState === "public").length,
    draftMatchCount: entries.filter((entry) => entry.contentState === "draft").length,
    missingMatchCount: entries.filter((entry) => entry.contentState === "missing").length,
    updateCount: entries.filter((entry) => entry.websiteAction === "update").length,
    addCount: entries.filter((entry) => entry.websiteAction === "add").length,
    exactDateCount: entries.filter((entry) => entry.releaseDateExact).length,
    placeholderDateCount: entries.filter((entry) => !entry.releaseDateExact).length,
    releaseDateChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "releaseDate"),
    ).length,
    coverImageChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "coverImage"),
    ).length,
    listenActionChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "listenAction"),
    ).length,
    carouselEnabledChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "carouselEnabled"),
    ).length,
    carouselPriorityChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "carouselPriority"),
    ).length,
    catalogStatusChangeCount: entries.filter((entry) =>
      entry.changes.some((change) => change.field === "catalogStatus"),
    ).length,
    changedReleaseCount: entries.filter((entry) => entry.changes.length > 0).length,
    sourceArtworkFoundCount: entries.filter((entry) => Boolean(entry.sourceArtworkPath)).length,
    missingArtworkCount: entries.filter((entry) => entry.blockers.includes("missing artwork")).length,
    missingRequiredMetadataCount: entries.filter((entry) =>
      entry.blockers.some((blocker) => blocker.startsWith("missing required metadata:")),
    ).length,
    releaseJsonMissingCount: entries.filter((entry) => entry.blockers.includes("missing release.json")).length,
    releaseJsonInvalidCount: entries.filter((entry) =>
      entry.blockers.some((blocker) => blocker.startsWith("invalid release.json:")),
    ).length,
    listenActionCount: entries.filter((entry) => Boolean(entry.listenAction)).length,
    carouselMetadataCount: entries.filter((entry) =>
      typeof entry.carouselEnabled === "boolean",
    ).length,
    catalogStatusCount: entries.filter((entry) => Boolean(entry.catalogStatus)).length,
  };
}

function readContentReleases(contentPath) {
  const source = readFileSync(contentPath, "utf8");
  const blocks = extractReleaseObjectBlocks(source);
  const entries = blocks
    .map(parseReleaseEntryFromBlock)
    .filter((entry) => entry && entry.title && entry.slug);

  const bySlug = new Map();
  const byTitle = new Map();

  for (const entry of entries) {
    bySlug.set(sanitizeSlug(entry.slug), entry);
    byTitle.set(normalizeTitle(entry.title), entry);
  }

  return {
    entries,
    bySlug,
    byTitle,
  };
}

function parseReleaseEntryFromBlock(block) {
  const title = readStringProperty(block, "title");
  if (!title) return null;

  const slug = readStringProperty(block, "slug") || sanitizeSlug(title);
  const visibility = readStringProperty(block, "visibility") || "public";
  const releaseDate = readStringProperty(block, "releaseDate") || null;
  const year = readNumberProperty(block, "year");
  const type = normalizeReleaseType(readStringProperty(block, "type"));
  const coverImage = readStringProperty(block, "coverImage") || null;
  const catalogStatus = readStringProperty(block, "catalogStatus") || null;
  const carouselEnabled = readBooleanProperty(block, "carouselEnabled");
  const carouselPriority = readNumberProperty(block, "carouselPriority");
  const listenActionText = extractObjectValue(block, "listenAction");
  const embedText = extractObjectValue(block, "embed");

  return {
    title,
    slug,
    visibility,
    releaseDate,
    year,
    type,
    coverImage,
    catalogStatus,
    carouselEnabled,
    carouselPriority,
    listenAction: listenActionText ? parseSimpleObject(listenActionText) : null,
    embed: embedText ? parseSimpleObject(embedText) : null,
  };
}

function findContentEntry(contentReleases, slug, title) {
  const bySlug = contentReleases.bySlug.get(sanitizeSlug(slug));
  if (bySlug) {
    return {
      ...bySlug,
      method: "slug",
    };
  }

  const byTitle = contentReleases.byTitle.get(normalizeTitle(title));
  if (byTitle) {
    return {
      ...byTitle,
      method: "title",
    };
  }

  return null;
}

function resolveListenAction({ releaseJsonListenAction, contentMatch }) {
  if (isValidListenAction(releaseJsonListenAction)) {
    return normalizeListenAction(releaseJsonListenAction);
  }

  if (contentMatch?.listenAction && isValidListenAction(contentMatch.listenAction)) {
    return normalizeListenAction(contentMatch.listenAction);
  }

  if (contentMatch?.embed && typeof contentMatch.embed === "object") {
    const embedUrl = readText(contentMatch.embed.embedUrl || contentMatch.embed.externalUrl);
    if (embedUrl) {
      return normalizeListenAction({
        kind: "disco-embed",
        provider: readText(contentMatch.embed.provider) || "disco",
        embedUrl,
        label: "Listen in player",
      });
    }
  }

  return null;
}

function isValidListenAction(action) {
  if (!action || typeof action !== "object" || Array.isArray(action)) return false;
  const kind = readText(action.kind);
  if (!kind) return false;

  if (kind === "disco-embed") {
    return Boolean(readText(action.embedUrl) || readText(action.url));
  }

  if (kind === "local-audio") {
    return Boolean(readText(action.audioSrc));
  }

  if (kind === "external") {
    return Boolean(readText(action.url));
  }

  return false;
}

function normalizeListenAction(action) {
  if (!action || typeof action !== "object") return null;
  const kind = readText(action.kind);
  if (!kind) return null;

  const normalized = {
    kind,
    label: readText(action.label) || null,
    provider: readText(action.provider) || null,
    url: readText(action.url) || null,
    embedUrl: readText(action.embedUrl) || null,
    audioSrc: readText(action.audioSrc) || null,
  };

  if (kind === "disco-embed" && !normalized.embedUrl && normalized.url) {
    normalized.embedUrl = normalized.url;
    normalized.url = null;
  }

  if (kind === "external" && !normalized.url && normalized.embedUrl) {
    normalized.url = normalized.embedUrl;
    normalized.embedUrl = null;
  }

  return normalized;
}

function collectArtworkFiles(artworkFolderPath) {
  const stack = [artworkFolderPath];
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

      const ext = path.extname(entry.name).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) continue;

      const stats = statSync(fullPath);
      out.push({
        path: fullPath,
        name: entry.name,
        ext,
        depth: path.relative(artworkFolderPath, fullPath).split(path.sep).length - 1,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      });
    }
  }

  return out;
}

function chooseLikelyCover({ artworkFiles, folderName }) {
  if (!artworkFiles.length) return null;

  const folderTokens = tokenize(folderName);
  const ranked = artworkFiles
    .map((file) => ({
      ...file,
      score: scoreArtworkCandidate(file, folderTokens),
    }))
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      if (left.depth !== right.depth) return left.depth - right.depth;
      if (left.mtimeMs !== right.mtimeMs) return right.mtimeMs - left.mtimeMs;
      return right.size - left.size;
    });

  return ranked[0] || null;
}

function scoreArtworkCandidate(file, folderTokens) {
  const name = file.name.toLowerCase();
  let score = 0;

  for (const token of folderTokens) {
    if (token && name.includes(token)) score += 3;
  }

  for (const hint of COVER_HINTS) {
    if (name.includes(hint)) score += 20;
  }

  if (file.depth === 0) score += 12;

  return score;
}

function readJsonFile(filePath) {
  if (!existsSync(filePath)) {
    return {
      exists: false,
      value: null,
      error: null,
    };
  }

  try {
    return {
      exists: true,
      value: JSON.parse(readFileSync(filePath, "utf8")),
      error: null,
    };
  } catch (error) {
    return {
      exists: true,
      value: null,
      error: error?.message || String(error),
    };
  }
}

function readText(value) {
  if (typeof value === "string") return value.trim();
  return "";
}

function resolveMaybeText(primary, fallback) {
  const primaryText = readText(primary);
  if (primaryText) return primaryText;
  const fallbackText = readText(fallback);
  if (fallbackText) return fallbackText;
  return null;
}

function resolveMaybeBoolean(primary, fallback) {
  if (typeof primary === "boolean") return primary;
  if (typeof fallback === "boolean") return fallback;
  return null;
}

function resolveMaybeNumber(primary, fallback) {
  if (Number.isFinite(primary)) return primary;
  if (Number.isFinite(fallback)) return fallback;
  return null;
}

function resolveYear(primary, fallback, releaseDate) {
  if (Number.isFinite(primary)) return primary;
  if (Number.isFinite(fallback)) return fallback;
  const derived = yearFromDate(releaseDate);
  return Number.isFinite(derived) ? derived : null;
}

function formatReleaseDate(value) {
  const text = readText(value);
  if (!text) return "none";
  return `${text}${isExactDate(text) ? " (exact)" : " (placeholder)"}`;
}

function formatListenAction(action) {
  const normalized = normalizeListenAction(action);
  if (!normalized) return "none";

  if (normalized.kind === "disco-embed") return "disco-embed";
  if (normalized.kind === "local-audio") return "local-audio";
  if (normalized.kind === "external") return "external";
  return normalized.kind;
}

function formatCarousel(value, priority) {
  if (typeof value !== "boolean") return "unknown";
  if (!value) return "no";
  return typeof priority === "number" ? `yes (${priority})` : "yes";
}

function formatContentState(state) {
  if (state === "public") return "public";
  if (state === "draft") return "draft";
  return "missing";
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeMarkdown(filePath, output) {
  const lines = [];
  const { summary } = output;

  lines.push("# Release Library Website Sync Preview");
  lines.push("");
  lines.push(`Generated: ${output.generatedAt}`);
  lines.push(`Source root: ${output.sourceRoot}`);
  lines.push(`Source content: ${output.sourceContentPath}`);
  lines.push(`Public cover art dir: ${output.publicCoverArtDir}`);
  lines.push("Status: preview only. No files were copied or updated.");
  lines.push("Release dates come from release.json; placeholder dates are kept when no exact distributor date exists.");
  lines.push("");

  lines.push("## Summary");
  lines.push(`- Total releases: ${summary.totalReleases}`);
  lines.push(`- Website updates: ${summary.updateCount}`);
  lines.push(`- Website adds: ${summary.addCount}`);
  lines.push(`- Public content matches: ${summary.publicMatchCount}`);
  lines.push(`- Draft content matches: ${summary.draftMatchCount}`);
  lines.push(`- Missing content matches: ${summary.missingMatchCount}`);
  lines.push(`- Exact release dates: ${summary.exactDateCount}`);
  lines.push(`- Placeholder release dates: ${summary.placeholderDateCount}`);
  lines.push(`- Releases with any field changes: ${summary.changedReleaseCount}`);
  lines.push(`- Release date changes: ${summary.releaseDateChangeCount}`);
  lines.push(`- Cover image changes: ${summary.coverImageChangeCount}`);
  lines.push(`- Listen action changes: ${summary.listenActionChangeCount}`);
  lines.push(`- Carousel enabled changes: ${summary.carouselEnabledChangeCount}`);
  lines.push(`- Carousel priority changes: ${summary.carouselPriorityChangeCount}`);
  lines.push(`- Catalog status changes: ${summary.catalogStatusChangeCount}`);
  lines.push(`- Source artwork files found: ${summary.sourceArtworkFoundCount}`);
  lines.push(`- Missing artwork blockers: ${summary.missingArtworkCount}`);
  lines.push(`- Missing required metadata blockers: ${summary.missingRequiredMetadataCount}`);
  lines.push(`- Missing release.json files: ${summary.releaseJsonMissingCount}`);
  lines.push(`- Invalid release.json files: ${summary.releaseJsonInvalidCount}`);
  lines.push("");

  lines.push("## Release Preview");
  lines.push("");
  lines.push("| Title | Slug | Type | Release date | Year | Listen | Carousel | Catalog | Source artwork | Target artwork | Content | Action | Changes |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");

  for (const entry of output.releases) {
    const row = [
      escapeTableCell(entry.title),
      escapeTableCell(entry.slug),
      escapeTableCell(entry.type || "unknown"),
      escapeTableCell(formatReleaseDate(entry.releaseDate)),
      escapeTableCell(Number.isFinite(entry.year) ? String(entry.year) : "unknown"),
      escapeTableCell(formatListenAction(entry.listenAction)),
      escapeTableCell(formatCarousel(entry.carouselEnabled, entry.carouselPriority)),
      escapeTableCell(entry.catalogStatus || "none"),
      escapeTableCell(entry.sourceArtworkPath || "missing"),
      escapeTableCell(entry.targetArtworkPath || "missing"),
      escapeTableCell(formatContentState(entry.contentState)),
      escapeTableCell(entry.websiteAction),
      escapeTableCell(formatChangeList(entry.changes)),
    ];
    lines.push(`| ${row.join(" | ")} |`);
  }

  lines.push("");
  lines.push("## Blockers");
  const blocked = output.releases.filter((entry) => entry.blockers.length > 0);
  if (!blocked.length) {
    lines.push("No blockers.");
  } else {
    for (const entry of blocked) {
      lines.push(`- ${entry.title}: ${entry.blockers.join("; ")}`);
    }
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function formatChangeList(changes) {
  if (!changes.length) return "none";
  return changes.map((change) => change.field).join(", ");
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
      if (depth === 0) objectStart = index;
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
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

function extractObjectValue(text, key) {
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegExp(key)}\\s*:\\s*\\{`, "m");
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
  const pattern = new RegExp(
    `(?:^|[^A-Za-z0-9_])${escapeRegExp(key)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`,
  );
  const match = source.match(pattern);
  return match ? unescapeString(match[2]).trim() : "";
}

function readNumberProperty(source, key) {
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegExp(key)}\\s*:\\s*([0-9]+)`, "i");
  const match = source.match(pattern);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function readBooleanProperty(source, key) {
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegExp(key)}\\s*:\\s*(true|false)`, "i");
  const match = source.match(pattern);
  if (!match) return null;
  return match[1].toLowerCase() === "true";
}

function parseSimpleObject(text) {
  return {
    kind: readStringProperty(text, "kind") || null,
    label: readStringProperty(text, "label") || null,
    provider: readStringProperty(text, "provider") || null,
    url: readStringProperty(text, "url") || null,
    embedUrl: readStringProperty(text, "embedUrl") || null,
    externalUrl: readStringProperty(text, "externalUrl") || null,
    audioSrc: readStringProperty(text, "audioSrc") || null,
  };
}

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
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
    .replace(/^-+|-+$/g, "");
}

function normalizeReleaseType(value) {
  const normalized = readText(value).toLowerCase();
  if (normalized === "single") return "single";
  if (normalized === "ep") return "ep";
  if (normalized === "remix") return "remix";
  if (normalized === "mix") return "mix";
  if (normalized === "set") return "set";
  if (normalized === "album") return "mix";
  return null;
}

function extractDatePrefix(folderName) {
  const match = String(folderName || "").match(/^(\d{4}-\d{2}-\d{2})\s*-\s*/);
  return match ? match[1] : null;
}

function inferFolderTitle(folderName) {
  const text = String(folderName || "").replace(/^\d{4}-\d{2}-\d{2}\s*-\s*/, "").trim();
  return text || String(folderName || "").trim();
}

function isExactDate(value) {
  const text = readText(value);
  if (!text) return false;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  return match[2] !== "00" && match[3] !== "00";
}

function yearFromDate(value) {
  const text = readText(value);
  if (!text || text.length < 4) return null;
  const year = Number(text.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function toPosixPath(value) {
  return String(value || "").split(path.sep).join("/");
}

function escapeTableCell(value) {
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/\n/g, "<br>");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unescapeString(value) {
  return String(value)
    .replace(/\\(['"`\\])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
