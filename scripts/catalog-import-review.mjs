#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const REPORT_PATH = path.join(__dirname, "catalog-sync-report.json");
const IMPORT_PATH = path.join(repoRoot, "content", "releases.imported.json");
const REVIEW_PATH = path.join(__dirname, "catalog-sync-review.md");
const REVIEW_STATUSES = new Set(["pending", "accept", "ignore", "manual"]);
const SUPPORTED_PROVIDERS = new Set(["tidal", "itunes"]);
const args = parseArgs(process.argv.slice(2));
const providerFilter = args.provider ? String(args.provider).toLowerCase() : null;

if (providerFilter && !SUPPORTED_PROVIDERS.has(providerFilter)) {
  fail(`Unsupported provider "${providerFilter}". Use one of: ${[...SUPPORTED_PROVIDERS].join(", ")}.`);
}

main();

function main() {
  if (!existsSync(REPORT_PATH)) {
    fail("Missing scripts/catalog-sync-report.json. Run npm run sync:catalog:dry first.");
  }

  const report = readJson(REPORT_PATH);
  const imported = existsSync(IMPORT_PATH) ? readJson(IMPORT_PATH) : null;
  const scopedReport = scopedReportForProvider(report, imported, providerFilter);
  const possibleNew = mergePossibleNewWithImported(scopedReport, imported);
  const groupedNew = groupByNormalizedTitle(possibleNew);
  const duplicateGroups = groupedNew.filter((group) => group.flags.length > 0);
  const markdown = renderReviewMarkdown({
    report: scopedReport,
    imported,
    providerFilter,
    possibleNew,
    groupedNew,
    duplicateGroups,
  });

  writeFileSync(REVIEW_PATH, markdown, "utf8");
  console.log(`Catalog import review written to ${relativePath(REVIEW_PATH)}`);
  console.log(`Grouped possible new releases: ${groupedNew.length}`);
  console.log(`Possible duplicate/grouped candidates: ${duplicateGroups.length}`);
  console.log(`Review statuses: ${[...REVIEW_STATUSES].join(", ")}`);
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

function scopedReportForProvider(report, imported, provider) {
  if (!provider) return report;

  return {
    ...report,
    providerFilter: provider,
    possibleNewReleases: (report.possibleNewReleases ?? []).filter((entry) => entry.catalogRelease?.source === provider),
    matchedExistingReleases: (report.matchedExistingReleases ?? []).filter((entry) => entry.catalogRelease?.source === provider),
    ambiguousMatches: (report.ambiguousMatches ?? []).filter((entry) => entry.catalogRelease?.source === provider),
    tidalCatalogOverview: provider === "tidal" ? report.tidalCatalogOverview ?? [] : [],
    summary: {
      ...report.summary,
      matchedExistingReleaseCount: (report.matchedExistingReleases ?? []).filter((entry) => entry.catalogRelease?.source === provider).length,
      possibleNewReleaseCount: (report.possibleNewReleases ?? []).filter((entry) => entry.catalogRelease?.source === provider).length,
      ambiguousMatchCount: (report.ambiguousMatches ?? []).filter((entry) => entry.catalogRelease?.source === provider).length,
      importedDraftCount: (imported?.draftEntries ?? []).filter((entry) => entry.catalogSource?.source === provider).length,
    },
  };
}

function mergePossibleNewWithImported(report, imported) {
  const importedBySourceId = new Map(
    (imported?.draftEntries ?? [])
      .map((entry) => [catalogSourceKey(entry.catalogSource), entry])
      .filter(([sourceId]) => Boolean(sourceId)),
  );

  return report.possibleNewReleases.map((entry) => {
    const catalogRelease = entry.catalogRelease;
    const importedDraft = importedBySourceId.get(catalogReleaseKey(catalogRelease));
    const reviewStatus = normalizeReviewStatus(importedDraft?.reviewStatus);

    return {
      ...entry,
      reviewStatus,
      suggestedDraft: {
        ...entry.suggestedDraft,
        ...importedDraft,
        reviewStatus,
      },
      flags: candidateFlags({
        artist: report.artist,
        catalogRelease,
        suggestedDraft: importedDraft ?? entry.suggestedDraft,
      }),
    };
  });
}

function normalizeReviewStatus(status) {
  return REVIEW_STATUSES.has(status) ? status : "pending";
}

function groupByNormalizedTitle(entries) {
  const groups = new Map();

  for (const entry of entries) {
    const key = normalizeTitle(entry.catalogRelease.title);
    const existing = groups.get(key) ?? {
      normalizedTitle: key,
      displayTitle: entry.catalogRelease.title,
      entries: [],
      flags: [],
    };

    existing.entries.push(entry);
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      flags: groupFlags(group),
    }))
    .sort((left, right) => compareGroupDateDesc(left, right));
}

function candidateFlags({ artist, catalogRelease, suggestedDraft }) {
  const flags = [];
  const collectionName = catalogRelease.collectionName ?? suggestedDraft?.catalogSource?.collectionName;
  const rawKind = catalogRelease.rawKind ?? suggestedDraft?.catalogSource?.rawKind;
  const trackCount = catalogRelease.trackCount ?? suggestedDraft?.catalogSource?.trackCount;
  const suggestedTileType = catalogRelease.suggestedTileType ?? suggestedDraft?.suggestedTileType;

  if (artistMatchStrength(catalogRelease.artistName, artist) === "weak") {
    flags.push("artist match is weak");
  }

  if (suggestedTileType) {
    flags.push(`suggested ${suggestedTileType}`);
  }

  if (catalogRelease.isCollection === false) {
    flags.push("track inside a larger collection");
  }

  if (collectionName && normalizeTitle(collectionName) !== normalizeTitle(catalogRelease.title)) {
    flags.push("appears to be a track inside a larger collection");
  }

  if (trackCount && trackCount > 1) {
    flags.push(`collection-level result with ${trackCount} tracks`);
  }

  if (rawKind === "song" && collectionName) {
    flags.push("track-level catalog result");
  }

  if (rawKind === "tracks" && collectionName) {
    flags.push("track-level TIDAL result");
  }

  return flags;
}

function groupFlags(group) {
  const flags = new Set();
  const titleYearKeys = new Set();
  const collectionKeys = new Set();

  if (group.entries.length > 1) {
    flags.add("multiple catalog results share this normalized title");
  }

  for (const entry of group.entries) {
    const release = entry.catalogRelease;
    const collectionName = release.collectionName ?? entry.suggestedDraft?.catalogSource?.collectionName;
    const titleYearKey = `${normalizeTitle(release.title)}:${release.year ?? ""}`;

    if (titleYearKeys.has(titleYearKey)) {
      flags.add("likely duplicate by title and release year");
    }
    titleYearKeys.add(titleYearKey);

    if (collectionName) {
      const collectionKey = normalizeTitle(collectionName);
      if (collectionKeys.has(collectionKey)) {
        flags.add("multiple results point to the same collection");
      }
      collectionKeys.add(collectionKey);

      if (collectionKey !== normalizeTitle(release.title)) {
        flags.add("one or more entries appear to belong to a parent EP/album");
      }
    }

    for (const flag of entry.flags) {
      if (flag.includes("artist match")) flags.add(flag);
      if (flag.includes("collection-level")) flags.add(flag);
      if (flag.includes("track inside")) flags.add(flag);
    }
  }

  return [...flags];
}

function renderReviewMarkdown({ report, imported, providerFilter, groupedNew, duplicateGroups }) {
  const lines = [];

  lines.push("# Catalog Import Review");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Artist: ${report.artist}`);
  lines.push(`Provider: ${report.provider ?? report.source}`);
  lines.push(`Active provider filter: ${providerFilter ?? "all"}`);
  lines.push(`Report: ${relativePath(REPORT_PATH)}`);
  lines.push(`Imported draft: ${existsSync(IMPORT_PATH) ? relativePath(IMPORT_PATH) : "not generated yet"}`);
  lines.push("");
  lines.push("This is a review aid only. Keep `content/releases.ts` hand-curated until entries are explicitly accepted and copied over.");
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Matched existing: ${report.summary.matchedExistingReleaseCount}`);
  lines.push(`- Possible new: ${report.summary.possibleNewReleaseCount}`);
  lines.push(`- Ambiguous matches: ${report.summary.ambiguousMatchCount}`);
  lines.push(`- Local missing from DSP: ${report.summary.localMissingFromDspCount}`);
  lines.push(`- Imported statuses available: ${imported ? "yes" : "no, run npm run sync:catalog:write"}`);
  if (providerFilter) {
    lines.push(`- Imported drafts for ${providerFilter}: ${report.summary.importedDraftCount ?? 0}`);
  }
  lines.push("");

  lines.push("## Status Guide");
  lines.push("");
  lines.push("- `pending`: needs review");
  lines.push("- `accept`: candidate is ready to manually add to `content/releases.ts`");
  lines.push("- `ignore`: do not import, usually duplicate or irrelevant");
  lines.push("- `manual`: keep or create by hand because DSP metadata is incomplete");
  lines.push("- `visibility`: imported entries default to `draft`; set to `public` only when ready for the visible site");
  lines.push("- `collectionTile`: album, EP, or remix-pack placeholder");
  lines.push("- `singleTile`: one-track single placeholder");
  lines.push("- `trackTile`: individual song inside a larger collection");
  lines.push("");

  renderTidalCatalogOverview(lines, report.tidalCatalogOverview);
  renderMatchedExisting(lines, report.matchedExistingReleases);
  renderPossibleNew(lines, groupedNew, report.artist);
  renderDuplicateGroups(lines, duplicateGroups);
  renderAmbiguous(lines, report.ambiguousMatches);
  renderLocalOnly(lines, report.localReleasesMissingFromDSP);

  return `${lines.join("\n")}\n`;
}

function renderMatchedExisting(lines, matches) {
  lines.push("## Matched Existing");
  lines.push("");

  if (!matches.length) {
    lines.push("No matched existing releases.");
    lines.push("");
    return;
  }

  for (const match of matches) {
    const release = match.catalogRelease;
    lines.push(`- OK ${release.title} [${release.collectionType ?? release.type}, ${release.suggestedTileType ?? "no tile"}] -> local \`${match.localRelease.slug}\` (${match.reasons.join(", ")}, score ${match.score})`);
    lines.push(`  TIDAL/source: ${release.sourceId ?? release.tidalId ?? "unknown"} / ${release.sourceUrl ?? "none"}`);
  }

  lines.push("");
}

function renderTidalCatalogOverview(lines, overview) {
  if (!Array.isArray(overview) || !overview.length) {
    return;
  }

  lines.push("## TIDAL Catalog Overview");
  lines.push("");

  for (const collection of overview) {
    lines.push(`### ${collection.title}`);
    lines.push("");
    lines.push(`- Collection type: ${collection.collectionType ?? "Unknown"}`);
    lines.push(`- Suggested tile: ${collection.suggestedTileType ?? "none"}`);
    lines.push(`- Release date/year: ${collection.releaseDate ?? "unknown"} / ${collection.year ?? "unknown"}`);
    lines.push(`- Track count: ${collection.trackCount ?? "unknown"}`);
    lines.push(`- TIDAL source: ${collection.tidalId ?? "unknown"} / ${collection.sourceUrl ?? "none"}`);
    lines.push(`- Matched existing local release: ${collection.matchedLocalRelease ? `${collection.matchedLocalRelease.title} (\`${collection.matchedLocalRelease.slug}\`)` : "no"}`);
    lines.push(`- Possible new site tile: ${collection.possibleNewSiteTile ? "yes" : "no"} (${collection.matchStatus ?? "unknown"})`);
    lines.push("- Tracks:");

    if (!collection.tracks?.length) {
      lines.push("  - No track list returned by TIDAL.");
    } else {
      for (const track of collection.tracks) {
        const localMatch = track.matchedLocalRelease
          ? `${track.matchedLocalRelease.title} (\`${track.matchedLocalRelease.slug}\`)`
          : "no";
        lines.push(
          `  - ${track.trackNumber ?? "?"}. ${track.title} [${track.suggestedTileType ?? "track"}] - TIDAL ${track.tidalId ?? "unknown"} / ${track.sourceUrl ?? "none"}; matched local: ${localMatch}; possible new tile: ${track.possibleNewSiteTile ? "yes" : "no"} (${track.matchStatus ?? "unknown"})`,
        );
      }
    }

    lines.push("");
  }
}

function renderPossibleNew(lines, groups, artist) {
  lines.push("## Possible New");
  lines.push("");

  if (!groups.length) {
    lines.push("No possible new releases.");
    lines.push("");
    return;
  }

  for (const group of groups) {
    lines.push(`### ${group.displayTitle}`);
    lines.push("");

    if (group.flags.length) {
      lines.push(`Group flags: ${group.flags.join("; ")}`);
      lines.push("");
    }

    for (const entry of group.entries) {
      const release = entry.catalogRelease;
      lines.push(`- Status: \`${entry.reviewStatus}\``);
      lines.push(`  Visibility: \`${entry.suggestedDraft.visibility ?? "draft"}\``);
      lines.push(`  Provider: ${release.source}`);
      lines.push(`  Artist: ${release.artistName ?? "unknown"} (${artistMatchStrength(release.artistName, artist)})`);
      lines.push(`  Release date: ${release.releaseDate ?? "unknown"}`);
      lines.push(`  Type: ${release.type}`);
      lines.push(`  Collection type: ${release.collectionType ?? "unknown"}`);
      lines.push(`  Suggested tile: ${release.suggestedTileType ?? "none"}`);
      lines.push(`  Is collection: ${release.isCollection === false ? "no" : "yes"}`);
      lines.push(`  Collection: ${release.collectionName ?? "none"}`);
      lines.push(`  Parent collection: ${release.parentCollectionTitle ?? "none"}`);
      lines.push(`  Track number: ${release.trackNumber ?? "n/a"}`);
      lines.push(`  Track count: ${release.trackCount ?? "unknown"}`);
      lines.push(`  Source ID: ${release.sourceId ?? release.tidalId ?? "unknown"}`);
      lines.push(`  URL: ${release.sourceUrl ?? "none"}`);
      lines.push(`  Flags: ${entry.flags.length ? entry.flags.join("; ") : "none"}`);
      lines.push("");
    }
  }
}

function renderDuplicateGroups(lines, groups) {
  lines.push("## Possible Duplicates / Grouped");
  lines.push("");

  if (!groups.length) {
    lines.push("No duplicate or grouped candidates flagged.");
    lines.push("");
    return;
  }

  for (const group of groups) {
    lines.push(`### ${group.displayTitle}`);
    lines.push("");
    lines.push(`Suggested action: review as one release group before accepting any entries.`);
    lines.push(`Flags: ${group.flags.join("; ")}`);
    lines.push("");

    for (const entry of group.entries) {
      const release = entry.catalogRelease;
      lines.push(`- ${release.title} (${release.releaseDate ?? "unknown date"})`);
      lines.push(`  Status: \`${entry.reviewStatus}\``);
      lines.push(`  Collection: ${release.collectionName ?? "none"}`);
      lines.push(`  URL: ${release.sourceUrl ?? "none"}`);
    }

    lines.push("");
  }
}

function renderAmbiguous(lines, ambiguousMatches) {
  lines.push("## Ambiguous Matches");
  lines.push("");

  if (!ambiguousMatches.length) {
    lines.push("No ambiguous matches.");
    lines.push("");
    return;
  }

  for (const match of ambiguousMatches) {
    lines.push(`### ${match.catalogRelease.title}`);
    lines.push("");
    for (const candidate of match.candidates) {
      lines.push(`- Local \`${candidate.localRelease.slug}\` (${candidate.reasons.join(", ")}, score ${candidate.score})`);
    }
    lines.push("");
  }
}

function renderLocalOnly(lines, localOnly) {
  lines.push("## Local Only");
  lines.push("");

  if (!localOnly.length) {
    lines.push("No local-only releases.");
    lines.push("");
    return;
  }

  for (const entry of localOnly) {
    lines.push(`- ${entry.localRelease.title} (\`${entry.localRelease.slug}\`)`);
    lines.push(`  Suggested action: keep manual unless this should be matched to a catalog result.`);
  }

  lines.push("");
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function catalogReleaseKey(release) {
  return `${release.source ?? release.provider ?? "unknown"}:${release.rawKind ?? "catalog"}:${release.sourceId ?? release.tidalId ?? release.slug}`;
}

function catalogSourceKey(catalogSource) {
  if (!catalogSource) return undefined;
  const sourceId = catalogSource.sourceId ?? catalogSource.tidalId;
  if (!sourceId) return undefined;
  return `${catalogSource.source ?? catalogSource.provider ?? "unknown"}:${catalogSource.rawKind ?? "catalog"}:${sourceId}`;
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

function normalizeArtist(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function artistMatchStrength(actual, expected) {
  const rawActual = String(actual ?? "").trim();
  const rawExpected = String(expected ?? "").trim();

  if (!rawActual) return "weak";
  if (rawActual.toLowerCase() === rawExpected.toLowerCase()) return "exact";
  if (normalizeArtist(rawActual) === normalizeArtist(rawExpected)) return "strong";
  if (normalizeArtist(rawActual).includes(normalizeArtist(rawExpected))) return "weak";
  return "weak";
}

function compareGroupDateDesc(left, right) {
  const leftDate = left.entries[0]?.catalogRelease.releaseDate ?? "1900-01-01";
  const rightDate = right.entries[0]?.catalogRelease.releaseDate ?? "1900-01-01";
  return new Date(rightDate).getTime() - new Date(leftDate).getTime();
}

function relativePath(value) {
  return path.relative(repoRoot, value).replace(/\\/g, "/");
}

function fail(message) {
  console.error(`Catalog import review failed: ${message}`);
  process.exit(1);
}
