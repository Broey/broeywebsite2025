#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_INVENTORY_PATH = path.join(__dirname, "release-library-inventory.json");
const DEFAULT_CONTENT_PATH = path.join(repoRoot, "content", "releases.ts");
const OUTPUT_JSON_PATH = path.join(__dirname, "release-library-json-preview.json");
const OUTPUT_MARKDOWN_PATH = path.join(__dirname, "release-library-json-preview.md");

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const inventoryPath = args.inventory || DEFAULT_INVENTORY_PATH;
  if (!existsSync(inventoryPath)) {
    fail(`Missing input inventory. Run npm run sync:release-library:inventory first or pass --inventory <path>.`);
  }

  const contentPath = args.content || DEFAULT_CONTENT_PATH;
  if (!existsSync(contentPath)) {
    fail(`Missing content source: ${contentPath}`);
  }

  const inventory = readJson(inventoryPath);
  if (!inventory || !Array.isArray(inventory.releases)) {
    fail("Invalid inventory payload: expected { releases: [] }.");
  }

  const contentReleases = readContentReleases(contentPath);
  const previewEntries = inventory.releases.map((entry) =>
    buildPreviewEntry(entry, contentReleases),
  );

  const output = {
    generatedAt: new Date().toISOString(),
    sourceInventoryPath: path.relative(repoRoot, path.resolve(inventoryPath)),
    sourceContentPath: path.relative(repoRoot, path.resolve(contentPath)),
    summary: buildSummary(previewEntries),
    releases: previewEntries,
  };

  writeJson(OUTPUT_JSON_PATH, output);
  writeMarkdown(OUTPUT_MARKDOWN_PATH, output);

  console.log(`Release library JSON preview written to ${path.relative(repoRoot, OUTPUT_JSON_PATH)}`);
  console.log(`Release library JSON preview markdown written to ${path.relative(repoRoot, OUTPUT_MARKDOWN_PATH)}`);
  console.log(`Releases: ${output.summary.totalReleases}`);
  console.log(`Website-ready previews: ${output.summary.websiteReadyCount}`);
  console.log(`Blocked previews: ${output.summary.blockedCount}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-json-preview.mjs [--inventory <path>] [--content <path>] [--help]");
  console.log("");
  console.log("Defaults:");
  console.log(`  inventory: ${path.relative(repoRoot, DEFAULT_INVENTORY_PATH)}`);
  console.log(`  content: ${path.relative(repoRoot, DEFAULT_CONTENT_PATH)}`);
  console.log("");
  console.log("Outputs:");
  console.log("  scripts/release-library-json-preview.json");
  console.log("  scripts/release-library-json-preview.md");
  console.log("");
  console.log("This is a preview-only script. It does not write release.json files or copy assets.");
}

function parseArgs(args) {
  const parsed = {
    help: false,
    inventory: null,
    content: null,
  };

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

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON from ${filePath}: ${error?.message || String(error)}`);
  }
}

function buildPreviewEntry(inventoryEntry, contentReleases) {
  const contentMatch = findContentEntry(
    contentReleases,
    inventoryEntry.inferredSlug,
    inventoryEntry.inferredTitle,
  );

  const inferredTitle = readText(inventoryEntry.inferredTitle) || "";
  const inferredSlug = sanitizeSlug(inventoryEntry.inferredSlug || inferredTitle);
  const inferredType = normalizeReleaseType(inventoryEntry.inferredReleaseType);

  const title = contentMatch?.title || inferredTitle || inferredSlug;
  const slug = contentMatch?.slug || inferredSlug || sanitizeSlug(title);
  const type = contentMatch?.type || inferredType || null;

  const releaseDateIsExact = Boolean(
    inventoryEntry.distributorDateIsExact && inventoryEntry.distributorReleaseDate,
  );
  const releaseDate = releaseDateIsExact
    ? inventoryEntry.distributorReleaseDate
    : inventoryEntry.releaseDatePrefix || null;
  const year = yearFromDate(releaseDate);

  const artworkSourceFile = inventoryEntry.likelyCoverFile || null;
  const artworkPath = artworkSourceFile ? buildArtworkPath(artworkSourceFile) : null;

  const listenAction = resolveListenAction(contentMatch);
  const carouselEnabled = typeof contentMatch?.carouselEnabled === "boolean"
    ? contentMatch.carouselEnabled
    : undefined;
  const carouselPriority = Number.isFinite(contentMatch?.carouselPriority)
    ? contentMatch.carouselPriority
    : undefined;
  const catalogStatus = readText(contentMatch?.catalogStatus);

  const blockers = buildBlockers({
    title,
    slug,
    type,
    releaseDate,
    year,
    artworkPath,
  });

  const notes = buildPreviewNotes({
    inferredTitle,
    inferredSlug,
    inferredType,
    title,
    slug,
    type,
    releaseDate,
    releaseDateIsExact,
    inventoryEntry,
    contentMatch,
    listenAction,
    carouselEnabled,
    carouselPriority,
    catalogStatus,
  });

  const proposedReleaseJson = {
    title,
    slug,
    type,
    status: "released",
    releaseDate,
    year,
    artworkPath,
  };

  if (listenAction) proposedReleaseJson.listenAction = listenAction;
  if (typeof carouselEnabled === "boolean") proposedReleaseJson.carouselEnabled = carouselEnabled;
  if (typeof carouselPriority === "number") proposedReleaseJson.carouselPriority = carouselPriority;
  if (catalogStatus) proposedReleaseJson.catalogStatus = catalogStatus;

  return {
    releaseFolderName: inventoryEntry.releaseFolderName,
    releaseFolderPath: inventoryEntry.releaseFolderPath,
    releaseJsonPath: path.join(inventoryEntry.releaseFolderPath, "release.json"),
    releaseDatePrefix: inventoryEntry.releaseDatePrefix,
    inferredTitle,
    inferredSlug,
    inferredReleaseType: inferredType,
    distributorReleaseDate: inventoryEntry.distributorReleaseDate,
    distributorDateIsExact: Boolean(inventoryEntry.distributorDateIsExact),
    releaseDateSource: releaseDateIsExact ? "distributor" : "folder",
    releaseDateIsExact,
    artworkSourceFile,
    artworkPath,
    contentMatch: contentMatch
      ? {
          matched: true,
          method: contentMatch.method,
          source: contentMatch.source,
          title: contentMatch.title,
          slug: contentMatch.slug,
          type: contentMatch.type,
        }
      : {
          matched: false,
          method: "none",
          source: "content/releases.ts",
          title: null,
          slug: null,
          type: null,
        },
    proposedReleaseJson,
    blockers,
    websiteReady: blockers.length === 0,
    notes,
  };
}

function buildPreviewNotes({
  inferredTitle,
  inferredSlug,
  inferredType,
  title,
  slug,
  type,
  releaseDate,
  releaseDateIsExact,
  inventoryEntry,
  contentMatch,
  listenAction,
  carouselEnabled,
  carouselPriority,
  catalogStatus,
}) {
  const notes = [];

  if (contentMatch?.matched) {
    const diffs = [];
    if (title !== inferredTitle) diffs.push(`title ${inferredTitle || inferredSlug} -> ${title}`);
    if (slug !== inferredSlug) diffs.push(`slug ${inferredSlug} -> ${slug}`);
    if (type !== inferredType) diffs.push(`type ${inferredType || "unknown"} -> ${type}`);

    if (diffs.length) {
      notes.push(`Canonical metadata from content/releases.ts overrides folder inference (${diffs.join("; ")}).`);
    } else {
      notes.push("Canonical metadata matched from content/releases.ts.");
    }
  } else {
    notes.push("No content/releases.ts match found; folder inference is being used.");
  }

  notes.push(
    releaseDateIsExact
      ? `Exact distributor release date used (${releaseDate}).`
      : `Folder placeholder date kept (${inventoryEntry.releaseDatePrefix}).`,
  );

  if (listenAction) {
    notes.push(`Listen action resolved from content/releases.ts: ${formatListenAction(listenAction)}.`);
  }

  if (typeof carouselEnabled === "boolean") {
    const priorityText = typeof carouselPriority === "number" ? `, priority ${carouselPriority}` : "";
    notes.push(`Carousel metadata resolved from content/releases.ts: ${carouselEnabled ? "enabled" : "disabled"}${priorityText}.`);
  }

  if (catalogStatus) {
    notes.push(`Catalog status resolved from content/releases.ts: ${catalogStatus}.`);
  }

  return notes;
}

function buildBlockers({ title, slug, type, releaseDate, year, artworkPath }) {
  const missing = [];
  if (!readText(title)) missing.push("title");
  if (!readText(slug)) missing.push("slug");
  if (!readText(type)) missing.push("type");
  if (!readText(releaseDate)) missing.push("releaseDate");
  if (!Number.isFinite(year)) missing.push("year");
  if (!readText(artworkPath)) missing.push("artwork");

  if (!missing.length) return [];

  const blockers = [];
  if (missing.includes("artwork")) blockers.push("missing artwork");

  const metadataFields = missing.filter((field) => field !== "artwork");
  if (metadataFields.length) {
    blockers.push(`missing required metadata: ${metadataFields.join(", ")}`);
  }

  return blockers;
}

function buildArtworkPath(artworkSourceFile) {
  const ext = path.extname(String(artworkSourceFile || "")).toLowerCase() || ".png";
  return `artwork/cover${ext}`;
}

function buildSummary(entries) {
  return {
    totalReleases: entries.length,
    websiteReadyCount: entries.filter((entry) => entry.websiteReady).length,
    blockedCount: entries.filter((entry) => !entry.websiteReady).length,
    exactDateCount: entries.filter((entry) => entry.releaseDateIsExact).length,
    placeholderDateCount: entries.filter((entry) => !entry.releaseDateIsExact).length,
    contentMatchCount: entries.filter((entry) => entry.contentMatch?.matched).length,
    listenActionCount: entries.filter((entry) => Boolean(entry.proposedReleaseJson.listenAction)).length,
    carouselEnabledCount: entries.filter((entry) => typeof entry.proposedReleaseJson.carouselEnabled === "boolean").length,
    catalogStatusCount: entries.filter((entry) => Boolean(entry.proposedReleaseJson.catalogStatus)).length,
    missingArtworkCount: entries.filter((entry) => entry.blockers.includes("missing artwork")).length,
    missingRequiredMetadataCount: entries.filter((entry) =>
      entry.blockers.some((blocker) => blocker.startsWith("missing required metadata:")),
    ).length,
  };
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function writeMarkdown(filePath, output) {
  const lines = [];
  const { summary } = output;

  lines.push("# Release Library JSON Preview");
  lines.push("");
  lines.push(`Generated: ${output.generatedAt}`);
  lines.push(`Source inventory: ${output.sourceInventoryPath}`);
  lines.push(`Source content: ${output.sourceContentPath}`);
  lines.push("Status: preview only. No release.json files were written.");
  lines.push("Audio warnings from the source scan are ignored for website readiness.");
  lines.push("Folder placeholder dates are kept unless distributor metadata has an exact date.");
  lines.push("");

  lines.push("## Summary");
  lines.push(`- Total releases: ${summary.totalReleases}`);
  lines.push(`- Website-ready previews: ${summary.websiteReadyCount}`);
  lines.push(`- Blocked previews: ${summary.blockedCount}`);
  lines.push(`- Exact distributor dates used: ${summary.exactDateCount}`);
  lines.push(`- Folder placeholder dates kept: ${summary.placeholderDateCount}`);
  lines.push(`- Content matches: ${summary.contentMatchCount}`);
  lines.push(`- Listen actions resolved: ${summary.listenActionCount}`);
  lines.push(`- Carousel metadata resolved: ${summary.carouselEnabledCount}`);
  lines.push(`- Catalog status resolved: ${summary.catalogStatusCount}`);
  lines.push(`- Missing artwork blockers: ${summary.missingArtworkCount}`);
  lines.push(`- Missing required metadata blockers: ${summary.missingRequiredMetadataCount}`);
  lines.push("");

  const blockedEntries = output.releases.filter((entry) => !entry.websiteReady);
  lines.push(`## Blocked Releases (${blockedEntries.length})`);
  if (!blockedEntries.length) {
    lines.push("No blocked releases.");
  } else {
    for (const entry of blockedEntries) {
      lines.push(`- ${entry.releaseFolderName}`);
      lines.push(`  - blockers: ${entry.blockers.join("; ")}`);
    }
  }
  lines.push("");

  lines.push("## Release Previews");
  lines.push("");

  for (const entry of output.releases) {
    lines.push(`### ${entry.proposedReleaseJson.title}`);
    lines.push(`- Release folder: \`${entry.releaseFolderPath}\``);
    lines.push(`- release.json path: \`${entry.releaseJsonPath}\``);
    lines.push(`- Website ready: ${entry.websiteReady ? "yes" : "no"}`);
    lines.push(`- Release date source: ${entry.releaseDateSource}${entry.releaseDateIsExact ? " (exact)" : " (placeholder)"}`);
    lines.push(`- Proposed release.json:`);
    lines.push(`  - title: ${entry.proposedReleaseJson.title}`);
    lines.push(`  - slug: ${entry.proposedReleaseJson.slug}`);
    lines.push(`  - type: ${entry.proposedReleaseJson.type}`);
    lines.push(`  - status: ${entry.proposedReleaseJson.status}`);
    lines.push(`  - releaseDate: ${entry.proposedReleaseJson.releaseDate}`);
    lines.push(`  - year: ${entry.proposedReleaseJson.year}`);
    lines.push(`  - artworkPath: \`${entry.proposedReleaseJson.artworkPath}\``);
    lines.push(`  - listenAction: ${entry.proposedReleaseJson.listenAction ? formatListenAction(entry.proposedReleaseJson.listenAction) : "none"}`);
    lines.push(`  - carouselEnabled: ${formatMaybeBoolean(entry.proposedReleaseJson.carouselEnabled)}`);
    lines.push(`  - carouselPriority: ${formatMaybeNumber(entry.proposedReleaseJson.carouselPriority)}`);
    lines.push(`  - catalogStatus: ${entry.proposedReleaseJson.catalogStatus || "none"}`);
    lines.push(`- Content match: ${entry.contentMatch.matched ? `${entry.contentMatch.title} / ${entry.contentMatch.slug} (${entry.contentMatch.type})` : "none"}`);
    lines.push(`- Artwork source: ${entry.artworkSourceFile ? `\`${entry.artworkSourceFile}\`` : "missing"}`);
    lines.push(`- Blockers: ${entry.blockers.length ? entry.blockers.join("; ") : "none"}`);

    if (entry.notes.length) {
      lines.push("- Notes:");
      for (const note of entry.notes) {
        lines.push(`  - ${note}`);
      }
    }

    lines.push("");
  }

  writeFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

function formatMaybeBoolean(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  return "unknown";
}

function formatMaybeNumber(value) {
  return typeof value === "number" ? String(value) : "unknown";
}

function formatListenAction(action) {
  if (!action || typeof action !== "object") return "unknown";
  const kind = readText(action.kind) || "unknown";
  if (kind === "disco-embed") {
    return action.embedUrl ? `disco-embed (${action.embedUrl})` : "disco-embed";
  }
  if (kind === "local-audio") {
    return action.audioSrc ? `local-audio (${action.audioSrc})` : "local-audio";
  }
  if (kind === "external") {
    return action.url ? `external (${action.url})` : "external";
  }
  return kind;
}

function resolveListenAction(contentMatch) {
  if (!contentMatch) return null;

  if (contentMatch.listenAction && isValidListenAction(contentMatch.listenAction)) {
    return contentMatch.listenAction;
  }

  if (contentMatch.embed && typeof contentMatch.embed === "object") {
    const embedUrl = readText(contentMatch.embed.embedUrl || contentMatch.embed.externalUrl);
    if (embedUrl) {
      return {
        kind: "disco-embed",
        provider: readText(contentMatch.embed.provider) || "disco",
        embedUrl,
        label: "Listen in player",
      };
    }
  }

  if (readText(contentMatch.audioPreview)) {
    return {
      kind: "local-audio",
      audioSrc: readText(contentMatch.audioPreview),
      label: "Listen",
    };
  }

  return null;
}

function isValidListenAction(action) {
  if (!action || typeof action !== "object" || Array.isArray(action)) return false;
  const kind = readText(action.kind);
  if (!kind) return false;
  if (kind === "disco-embed") return Boolean(readText(action.embedUrl) || readText(action.url));
  if (kind === "local-audio") return Boolean(readText(action.audioSrc));
  if (kind === "external") return Boolean(readText(action.url));
  return false;
}

function readContentReleases(contentPath) {
  const source = readFileSync(contentPath, "utf8");
  const blocks = extractReleaseObjectBlocks(source);
  const entries = blocks.map(parseReleaseEntryFromBlock).filter(Boolean);

  const bySlug = new Map();
  const byTitle = new Map();

  for (const entry of entries) {
    bySlug.set(sanitizeSlug(entry.slug), entry);
    byTitle.set(normalizeTitle(entry.title), entry);
  }

  return { bySlug, byTitle };
}

function parseReleaseEntryFromBlock(block) {
  const title = readStringProperty(block, "title");
  if (!title) return null;

  const slug = readStringProperty(block, "slug") || sanitizeSlug(title);
  const type = normalizeReleaseType(readStringProperty(block, "type"));
  const releaseDate = readStringProperty(block, "releaseDate");
  const year = readNumberProperty(block, "year");
  const catalogStatus = readStringProperty(block, "catalogStatus");
  const carouselEnabled = readBooleanProperty(block, "carouselEnabled");
  const carouselPriority = readNumberProperty(block, "carouselPriority");
  const audioPreview = readStringProperty(block, "audioPreview");
  const embedText = extractObjectValue(block, "embed");
  const listenActionText = extractObjectValue(block, "listenAction");

  return {
    source: "content/releases.ts",
    title,
    slug,
    type,
    releaseDate,
    year,
    catalogStatus,
    carouselEnabled,
    carouselPriority,
    audioPreview,
    embed: embedText ? parseSimpleObject(embedText) : null,
    listenAction: listenActionText ? parseSimpleObject(listenActionText) : null,
  };
}

function findContentEntry(contentReleases, slug, title) {
  const normalizedSlug = sanitizeSlug(slug);
  const bySlug = contentReleases.bySlug.get(normalizedSlug);
  if (bySlug) {
    return {
      ...bySlug,
      matched: true,
      method: "slug",
    };
  }

  const byTitle = contentReleases.byTitle.get(normalizeTitle(title));
  if (byTitle) {
    return {
      ...byTitle,
      matched: true,
      method: "title",
    };
  }

  return null;
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

function parseSimpleObject(text) {
  return {
    kind: readStringProperty(text, "kind"),
    label: readStringProperty(text, "label"),
    provider: readStringProperty(text, "provider"),
    url: readStringProperty(text, "url"),
    embedUrl: readStringProperty(text, "embedUrl"),
    externalUrl: readStringProperty(text, "externalUrl"),
    audioSrc: readStringProperty(text, "audioSrc"),
  };
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

function readText(value) {
  if (typeof value === "string") return value.trim();
  return "";
}

function normalizeReleaseType(value) {
  const source = readText(value).toLowerCase();
  if (source === "single") return "single";
  if (source === "ep") return "ep";
  if (source === "remix") return "remix";
  if (source === "mix") return "mix";
  if (source === "set") return "set";
  if (source === "album") return "mix";
  if (source === "unknown") return null;
  return null;
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

function sanitizeSlug(value) {
  return normalizeTitle(value)
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function yearFromDate(value) {
  const text = readText(value);
  if (!text || text.length < 4) return null;
  const year = Number(text.slice(0, 4));
  return Number.isFinite(year) ? year : null;
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
