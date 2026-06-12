#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const IMPORT_PATH = path.join(repoRoot, "content", "releases.imported.json");
const RELEASES_PATH = path.join(repoRoot, "content", "releases.ts");
const PREVIEW_JSON_PATH = path.join(__dirname, "catalog-merge-preview.json");
const PREVIEW_MD_PATH = path.join(__dirname, "catalog-merge-preview.md");
const MERGEABLE_STATUSES = new Set(["accept", "manual"]);
const PUBLIC_VISIBILITY = "public";
const SUPPORTED_PROVIDERS = new Set(["tidal", "itunes"]);
const args = parseArgs(process.argv.slice(2));
const providerFilter = args.provider ? String(args.provider).toLowerCase() : null;

if (providerFilter && !SUPPORTED_PROVIDERS.has(providerFilter)) {
  fail(`Unsupported provider "${providerFilter}". Use one of: ${[...SUPPORTED_PROVIDERS].join(", ")}.`);
}

main();

function main() {
  if (!existsSync(IMPORT_PATH)) {
    fail("Missing content/releases.imported.json. Run npm run sync:catalog:write first.");
  }

  const imported = readJson(IMPORT_PATH);
  const localReleases = readLocalReleases();
  const preview = buildMergePreview({ imported, localReleases, providerFilter });

  writeJson(PREVIEW_JSON_PATH, preview);
  writeFileSync(PREVIEW_MD_PATH, renderMarkdown(preview), "utf8");

  console.log(`Catalog merge preview JSON written to ${relativePath(PREVIEW_JSON_PATH)}`);
  console.log(`Catalog merge preview markdown written to ${relativePath(PREVIEW_MD_PATH)}`);
  console.log(`Would add: ${preview.summary.wouldAddCount}`);
  console.log(`Skipped pending: ${preview.summary.skippedPendingCount}`);
  console.log(`Skipped ignored: ${preview.summary.skippedIgnoreCount}`);
  console.log(`Slug conflicts: ${preview.summary.slugConflictCount}`);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;

    const [rawKey, rawValue] = arg.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

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

  return parsed;
}

function buildMergePreview({ imported, localReleases, providerFilter }) {
  const allDraftEntries = imported.draftEntries ?? [];
  const draftEntries = providerFilter
    ? allDraftEntries.filter((entry) => entry.catalogSource?.source === providerFilter)
    : allDraftEntries;
  const mergeableEntries = draftEntries.filter((entry) => MERGEABLE_STATUSES.has(entry.reviewStatus));
  const skippedEntries = draftEntries.filter((entry) => !MERGEABLE_STATUSES.has(entry.reviewStatus));
  const alreadyMerged = [];
  const wouldAdd = [];

  for (const entry of mergeableEntries) {
    const matchingLocalImport = localReleases.find((localRelease) =>
      isAlreadyMergedCatalogImport(entry, localRelease),
    );

    if (matchingLocalImport) {
      alreadyMerged.push(buildAlreadyMergedEntry({ entry, localRelease: matchingLocalImport }));
      continue;
    }

    wouldAdd.push(buildPreviewEntry({ entry, localReleases }));
  }

  return {
    generatedAt: new Date().toISOString(),
    providerFilter: providerFilter ?? null,
    importedDraftPath: relativePath(IMPORT_PATH),
    localReleasePath: relativePath(RELEASES_PATH),
    outputJsonPath: relativePath(PREVIEW_JSON_PATH),
    outputMarkdownPath: relativePath(PREVIEW_MD_PATH),
    note:
      "Preview only. This does not edit content/releases.ts. Imported entries default to draft visibility unless their imported JSON entry explicitly says visibility: public.",
    summary: {
      importedDraftCount: draftEntries.length,
      allImportedDraftCount: allDraftEntries.length,
      reviewedImportCount: mergeableEntries.length,
      alreadyMergedCount: alreadyMerged.length,
      wouldAddCount: wouldAdd.length,
      publicCount: wouldAdd.filter((entry) => entry.visibility === "public").length,
      draftCount: wouldAdd.filter((entry) => entry.visibility === "draft").length,
      manualCount: wouldAdd.filter((entry) => entry.reviewStatus === "manual").length,
      skippedPendingCount: skippedEntries.filter((entry) => entry.reviewStatus === "pending").length,
      skippedIgnoreCount: skippedEntries.filter((entry) => entry.reviewStatus === "ignore").length,
      skippedOtherCount: skippedEntries.filter((entry) => !["pending", "ignore"].includes(entry.reviewStatus)).length,
      slugConflictCount: wouldAdd.filter((entry) => entry.mergeSafety.slugConflict).length,
      titleConflictCount: wouldAdd.filter((entry) => entry.mergeSafety.titleConflict).length,
    },
    alreadyMerged,
    wouldAdd,
    skippedEntries: skippedEntries.map((entry) => ({
      reviewStatus: entry.reviewStatus ?? "pending",
      title: entry.title,
      slug: entry.slug,
      sourceId: entry.catalogSource?.sourceId ?? entry.catalogSource?.tidalId,
      provider: entry.catalogSource?.source ?? entry.catalogSource?.provider,
      suggestedTileType: entry.suggestedTileType ?? entry.catalogSource?.suggestedTileType,
      isCollection: entry.isCollection ?? entry.catalogSource?.isCollection,
      parentCollectionTitle: entry.parentCollectionTitle ?? entry.catalogSource?.parentCollectionTitle,
      trackNumber: entry.trackNumber ?? entry.catalogSource?.trackNumber,
    })),
  };
}

function buildPreviewEntry({ entry, localReleases }) {
  const slug = entry.slug ?? slugify(entry.title);
  const normalizedTitle = normalizeTitle(entry.title);
  const sourceUrl = entry.catalogSource?.sourceUrl ?? firstLinkUrl(entry);
  const visibility = entry.visibility === PUBLIC_VISIBILITY ? "public" : "draft";
  const localAssetCandidate = `/assets/cover-art/${slug}.png`;
  const slugConflict = localReleases.some((release) => release.slug === slug);
  const titleConflict = localReleases.some((release) => normalizeTitle(release.title) === normalizedTitle);
  const isCollection = entry.isCollection ?? entry.catalogSource?.isCollection;
  const suggestedTileType = entry.suggestedTileType ?? entry.catalogSource?.suggestedTileType;
  const parentCollectionTitle = entry.parentCollectionTitle ?? entry.catalogSource?.parentCollectionTitle;
  const parentCollectionSlug = entry.parentCollectionSlug ?? entry.catalogSource?.parentCollectionSlug;
  const parentCollectionId = entry.parentCollectionId ?? entry.catalogSource?.parentCollectionId;
  const trackNumber = entry.trackNumber ?? entry.catalogSource?.trackNumber;
  const trackCount = entry.trackCount ?? entry.catalogSource?.trackCount;

  return {
    reviewStatus: entry.reviewStatus,
    provider: entry.catalogSource?.source ?? entry.catalogSource?.provider,
    visibility,
    published: visibility === "public",
    slug,
    title: entry.title,
    type: entry.type,
    isCollection,
    suggestedTileType,
    parentCollectionTitle,
    parentCollectionSlug,
    parentCollectionId,
    trackNumber,
    trackCount,
    year: entry.year,
    releaseDate: entry.releaseDate,
    collectionTitle: entry.catalogSource?.collectionName,
    parentReleaseCandidate: parentReleaseCandidate(entry),
    coverImageCandidate: {
      localAssetCandidate,
      sourceArtworkUrl: entry.catalogSource?.artworkUrl,
      recommendation:
        "Prefer a synced local cover asset before publishing. Treat sourceArtworkUrl as review metadata, not a runtime dependency.",
    },
    sourceUrl,
    dspLink: firstLink(entry),
    catalogSource: entry.catalogSource,
    mergeSafety: {
      slugConflict,
      titleConflict,
      needsManualCopy: entry.reviewStatus === "manual",
      note:
        entry.reviewStatus === "manual"
          ? "Manual entry: review copy, art, relationship, and links before adding."
          : "Accepted entry: still review local art, copy, and visibility before adding.",
    },
    suggestedReleaseEntry: {
      title: entry.title,
      slug,
      type: entry.type,
      year: entry.year,
      releaseDate: entry.releaseDate,
      description: entry.description,
      mood: entry.mood,
      coverImage: localAssetCandidate,
      coverAlt: `${entry.title} cover art`,
      links: entry.links ?? [],
    },
  };
}

function buildAlreadyMergedEntry({ entry, localRelease }) {
  const slug = entry.slug ?? slugify(entry.title);

  return {
    reviewStatus: entry.reviewStatus,
    provider: entry.catalogSource?.source ?? entry.catalogSource?.provider,
    visibility: localRelease.visibility ?? "public",
    slug,
    title: entry.title,
    localRelease: {
      title: localRelease.title,
      slug: localRelease.slug,
      visibility: localRelease.visibility,
      sourceUrl: localRelease.catalogSource?.sourceUrl,
      externalIds: localRelease.catalogSource?.externalIds,
    },
    catalogSource: entry.catalogSource,
  };
}

function renderMarkdown(preview) {
  const lines = [];

  lines.push("# Catalog Merge Preview");
  lines.push("");
  lines.push(`Generated: ${preview.generatedAt}`);
  lines.push(`Imported draft: ${preview.importedDraftPath}`);
  lines.push(`Local releases: ${preview.localReleasePath}`);
  lines.push(`Active provider filter: ${preview.providerFilter ?? "all"}`);
  lines.push(`Providers: ${providersFor(preview).join(", ") || "none"}`);
  lines.push("");
  lines.push("Preview only. `content/releases.ts` was not changed.");
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Imported draft entries: ${preview.summary.importedDraftCount}`);
  lines.push(`- Imported reviewed entries: ${preview.summary.reviewedImportCount}`);
  lines.push(`- Already merged: ${preview.summary.alreadyMergedCount}`);
  lines.push(`- Would add: ${preview.summary.wouldAddCount}`);
  lines.push(`- Draft/private: ${preview.summary.draftCount}`);
  lines.push(`- Public: ${preview.summary.publicCount}`);
  lines.push(`- Manual: ${preview.summary.manualCount}`);
  lines.push(`- Skipped pending: ${preview.summary.skippedPendingCount}`);
  lines.push(`- Skipped ignored: ${preview.summary.skippedIgnoreCount}`);
  lines.push(`- Slug conflicts: ${preview.summary.slugConflictCount}`);
  lines.push(`- Title conflicts: ${preview.summary.titleConflictCount}`);
  lines.push("");

  lines.push("## Already Merged");
  lines.push("");

  if (!preview.alreadyMerged.length) {
    lines.push("No reviewed imported entries are already merged.");
    lines.push("");
  } else {
    for (const entry of preview.alreadyMerged) {
      lines.push(`- ${entry.title} (\`${entry.slug}\`) - provider \`${entry.provider ?? "unknown"}\`, local \`${entry.localRelease.slug}\`, visibility \`${entry.visibility}\``);
    }
    lines.push("");
  }

  lines.push("## Would Add");
  lines.push("");

  if (!preview.wouldAdd.length) {
    lines.push("No unmerged imported entries have `reviewStatus: accept` or `reviewStatus: manual`.");
    lines.push("");
  } else {
    for (const entry of preview.wouldAdd) {
      lines.push(`### ${entry.title}`);
      lines.push("");
      lines.push(`- Status: \`${entry.reviewStatus}\``);
      lines.push(`- Provider: ${entry.provider ?? "unknown"}`);
      lines.push(`- Visibility: \`${entry.visibility}\``);
      lines.push(`- Slug: \`${entry.slug}\``);
      lines.push(`- Type: ${entry.type}`);
      lines.push(`- Suggested tile: ${entry.suggestedTileType ?? "none"}`);
      lines.push(`- Is collection: ${entry.isCollection === false ? "no" : "yes"}`);
      lines.push(`- Year/date: ${entry.year ?? "unknown"} / ${entry.releaseDate ?? "unknown"}`);
      lines.push(`- Collection: ${entry.collectionTitle ?? "none"}`);
      lines.push(`- Parent collection: ${entry.parentCollectionTitle ?? "none"}`);
      lines.push(`- Parent collection ID: ${entry.parentCollectionId ?? "none"}`);
      lines.push(`- Track number/count: ${entry.trackNumber ?? "n/a"} / ${entry.trackCount ?? "unknown"}`);
      lines.push(`- Parent release candidate: ${entry.parentReleaseCandidate ?? "none"}`);
      lines.push(`- Cover image candidate: ${entry.coverImageCandidate.localAssetCandidate}`);
      lines.push(`- Source artwork: ${entry.coverImageCandidate.sourceArtworkUrl ?? "none"}`);
      lines.push(`- Source URL: ${entry.sourceUrl ?? "none"}`);
      lines.push(`- DSP link: ${entry.dspLink?.platform ?? "none"}${entry.dspLink?.url ? ` (${entry.dspLink.url})` : ""}`);
      lines.push(`- Slug conflict: ${entry.mergeSafety.slugConflict ? "yes" : "no"}`);
      lines.push(`- Title conflict: ${entry.mergeSafety.titleConflict ? "yes" : "no"}`);
      lines.push(`- Merge note: ${entry.mergeSafety.note}`);
      lines.push("");
    }
  }

  lines.push("## Skipped");
  lines.push("");

  if (!preview.skippedEntries.length) {
    lines.push("No skipped imported entries.");
    lines.push("");
  } else {
    for (const entry of preview.skippedEntries) {
      const trackMeta = entry.trackNumber ? `, track ${entry.trackNumber}` : "";
      const parentMeta = entry.parentCollectionTitle ? `, parent ${entry.parentCollectionTitle}` : "";
      lines.push(`- ${entry.title} (\`${entry.slug}\`) - provider \`${entry.provider ?? "unknown"}\`, \`${entry.reviewStatus}\`, ${entry.suggestedTileType ?? "no tile"}${trackMeta}${parentMeta}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

function providersFor(preview) {
  return [
    ...new Set(
      [...preview.alreadyMerged, ...preview.wouldAdd, ...preview.skippedEntries]
        .map((entry) => entry.provider)
        .filter(Boolean),
    ),
  ].sort();
}

function readLocalReleases() {
  const sourceText = readFileSync(RELEASES_PATH, "utf8");
  const blocks = extractReleaseObjectBlocks(sourceText);

  return blocks.map((block, index) => {
    const title = readStringProperty(block, "title") ?? `Untitled release ${index + 1}`;
    return {
      title,
      slug: readStringProperty(block, "slug") ?? slugify(title),
      visibility: readStringProperty(block, "visibility"),
      catalogSource: readCatalogSource(block),
    };
  });
}

function readCatalogSource(block) {
  const catalogIndex = block.indexOf("catalogSource:");
  if (catalogIndex === -1) {
    return undefined;
  }

  const catalogBlock = extractObjectBlock(block, catalogIndex);
  if (!catalogBlock) {
    return undefined;
  }

  return {
    source: readStringProperty(catalogBlock, "source"),
    sourceUrl: readStringProperty(catalogBlock, "sourceUrl"),
    externalIds: readExternalIds(catalogBlock),
  };
}

function extractObjectBlock(sourceText, markerIndex) {
  const objectStart = sourceText.indexOf("{", markerIndex);
  if (objectStart === -1) return undefined;

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaping = false;

  for (let index = objectStart; index < sourceText.length; index += 1) {
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

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return sourceText.slice(objectStart, index + 1);
      }
    }
  }

  return undefined;
}

function readExternalIds(catalogBlock) {
  const externalIdsIndex = catalogBlock.indexOf("externalIds:");
  if (externalIdsIndex === -1) {
    return undefined;
  }

  const externalIdsBlock = extractObjectBlock(catalogBlock, externalIdsIndex);
  if (!externalIdsBlock) {
    return undefined;
  }

  const externalIds = {};
  const pairPattern = /(?:"([^"]+)"|([A-Za-z_$][\w$-]*))\s*:\s*"([^"]+)"/g;
  let match;

  while ((match = pairPattern.exec(externalIdsBlock))) {
    externalIds[match[1] ?? match[2]] = match[3];
  }

  return Object.keys(externalIds).length ? externalIds : undefined;
}

function isAlreadyMergedCatalogImport(entry, localRelease) {
  const entrySlug = entry.slug ?? slugify(entry.title);
  const sameIdentity =
    localRelease.slug === entrySlug ||
    normalizeTitle(localRelease.title) === normalizeTitle(entry.title);

  if (!sameIdentity || localRelease.visibility !== "draft" || !localRelease.catalogSource) {
    return false;
  }

  const source = entry.catalogSource?.source;
  const sourceId = entry.catalogSource?.sourceId ? String(entry.catalogSource.sourceId) : undefined;
  const sourceUrl = entry.catalogSource?.sourceUrl ?? firstLinkUrl(entry);
  const externalIds = localRelease.catalogSource.externalIds ?? {};

  if (source && sourceId && externalIds[source] === sourceId) {
    return true;
  }

  if (sourceId && Object.values(externalIds).includes(sourceId)) {
    return true;
  }

  return Boolean(sourceUrl && localRelease.catalogSource.sourceUrl === sourceUrl);
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

function firstLink(entry) {
  return Array.isArray(entry.links) ? entry.links.find((link) => link.url) : undefined;
}

function firstLinkUrl(entry) {
  return firstLink(entry)?.url;
}

function parentReleaseCandidate(entry) {
  const collectionName =
    entry.parentCollectionTitle ??
    entry.catalogSource?.parentCollectionTitle ??
    entry.catalogSource?.collectionName;
  if (!collectionName || normalizeTitle(collectionName) === normalizeTitle(entry.title)) {
    return undefined;
  }

  return slugify(collectionName);
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unescapeString(value) {
  return value.replace(/\\(["'`\\])/g, "$1");
}

function relativePath(value) {
  return path.relative(repoRoot, value).replace(/\\/g, "/");
}

function fail(message) {
  console.error(`Catalog merge preview failed: ${message}`);
  process.exit(1);
}
