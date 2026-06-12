#!/usr/bin/env node

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const RELEASES_PATH = path.join(repoRoot, "content", "releases.ts");
const PREVIEW_SCRIPT_PATH = path.join(__dirname, "catalog-merge-preview.mjs");
const PREVIEW_JSON_PATH = path.join(__dirname, "catalog-merge-preview.json");
const RESULT_MD_PATH = path.join(__dirname, "catalog-merge-result.md");

const args = parseArgs(process.argv.slice(2));
const dryRun = Boolean(args.dryRun) || !args.write;
const writeMode = Boolean(args.write);
const allowConflicts = Boolean(args.allowConflicts);

main();

function main() {
  if (dryRun && writeMode) {
    fail("Use either --dry-run or --write, not both.");
  }

  runMergePreview();

  const preview = readJson(PREVIEW_JSON_PATH);
  const blockingIssues = blockingIssuesFor(preview, { allowConflicts });
  const insertionBlocks = preview.wouldAdd.map(renderReleaseBlock);
  const result = {
    generatedAt: new Date().toISOString(),
    mode: writeMode ? "merge" : "dry-run",
    allowConflicts,
    previewPath: relativePath(PREVIEW_JSON_PATH),
    releasePath: relativePath(RELEASES_PATH),
    backupPath: null,
    summary: {
      wouldInsertCount: insertionBlocks.length,
      alreadyMergedCount: preview.summary.alreadyMergedCount ?? 0,
      blockingIssueCount: blockingIssues.length,
      slugConflictCount: preview.summary.slugConflictCount,
      titleConflictCount: preview.summary.titleConflictCount,
      skippedPendingCount: preview.summary.skippedPendingCount,
      skippedIgnoreCount: preview.summary.skippedIgnoreCount,
    },
    blockingIssues,
    entries: preview.wouldAdd.map((entry, index) => ({
      ...entry,
      insertion: {
        location: "Before the closing bracket of export const releases in content/releases.ts",
        block: insertionBlocks[index],
      },
    })),
  };

  if (writeMode) {
    if (blockingIssues.length) {
      writeFileSync(RESULT_MD_PATH, renderResultMarkdown(result), "utf8");
      fail(`Merge blocked by ${blockingIssues.length} issue(s). See ${relativePath(RESULT_MD_PATH)}.`);
    }

    if (!insertionBlocks.length) {
      writeFileSync(RESULT_MD_PATH, renderResultMarkdown(result), "utf8");
      console.log("No reviewed catalog entries to merge.");
      console.log(`Catalog merge result written to ${relativePath(RESULT_MD_PATH)}`);
      return;
    }

    const backupPath = backupReleasesFile();
    result.backupPath = relativePath(backupPath);
    insertReleaseBlocks(insertionBlocks);
  }

  writeFileSync(RESULT_MD_PATH, renderResultMarkdown(result), "utf8");

  console.log(`Catalog merge result written to ${relativePath(RESULT_MD_PATH)}`);
  console.log(`Mode: ${result.mode}`);
  console.log(`Would insert: ${result.summary.wouldInsertCount}`);
  console.log(`Blocking issues: ${result.summary.blockingIssueCount}`);
  if (result.backupPath) {
    console.log(`Backup written to ${result.backupPath}`);
  }
}

function parseArgs(argv) {
  const parsed = {};

  for (const arg of argv) {
    if (arg === "--dry-run") parsed.dryRun = true;
    if (arg === "--write") parsed.write = true;
    if (arg === "--allow-conflicts") parsed.allowConflicts = true;
  }

  return parsed;
}

function runMergePreview() {
  const result = spawnSync(process.execPath, [PREVIEW_SCRIPT_PATH], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    fail("Could not generate catalog merge preview.");
  }
}

function blockingIssuesFor(preview, { allowConflicts }) {
  const issues = [];

  if (!allowConflicts) {
    for (const entry of preview.wouldAdd) {
      if (entry.mergeSafety.slugConflict) {
        issues.push({
          type: "slug-conflict",
          title: entry.title,
          slug: entry.slug,
          message: `Slug conflict for ${entry.slug}. Pass --allow-conflicts only if this is intentional.`,
        });
      }

      if (entry.mergeSafety.titleConflict) {
        issues.push({
          type: "title-conflict",
          title: entry.title,
          slug: entry.slug,
          message: `Title conflict for ${entry.title}. Pass --allow-conflicts only if this is intentional.`,
        });
      }
    }
  }

  for (const entry of preview.wouldAdd) {
    if (!["accept", "manual"].includes(entry.reviewStatus)) {
      issues.push({
        type: "invalid-review-status",
        title: entry.title,
        slug: entry.slug,
        message: `Refusing to merge ${entry.title} with reviewStatus ${entry.reviewStatus}.`,
      });
    }
  }

  return issues;
}

function renderReleaseBlock(entry) {
  const release = entry.suggestedReleaseEntry;
  const catalogSource = entry.catalogSource ?? {};
  const sourceId = catalogSource.sourceId ? String(catalogSource.sourceId) : undefined;
  const parentCollection = entry.collectionTitle
    ? {
        title: entry.collectionTitle,
        slug: entry.parentReleaseCandidate ?? slugify(entry.collectionTitle),
      }
    : undefined;

  const lines = [];
  lines.push("  {");
  pushString(lines, "title", release.title, 4);
  pushString(lines, "slug", release.slug, 4);
  pushString(lines, "type", release.type, 4);
  pushString(lines, "visibility", entry.visibility === "public" ? "public" : "draft", 4);
  pushNumber(lines, "year", release.year, 4);
  pushString(lines, "releaseDate", release.releaseDate, 4);
  pushString(lines, "description", release.description, 4);
  pushString(lines, "mood", release.mood, 4);
  pushString(lines, "coverImage", release.coverImage, 4);
  pushString(lines, "coverAlt", release.coverAlt, 4);
  pushLinks(lines, release.links ?? []);
  pushCatalogSource(lines, {
    source: catalogSource.source,
    sourceUrl: catalogSource.sourceUrl ?? entry.sourceUrl,
    externalIds: sourceId ? { [catalogSource.source ?? "catalog"]: sourceId } : undefined,
    artistName: catalogSource.artistName,
    artworkUrl: catalogSource.artworkUrl,
    trackCount: catalogSource.trackCount,
    rawKind: catalogSource.rawKind,
    parentCollection,
  });
  lines.push("  },");

  return lines.join("\n");
}

function pushString(lines, key, value, indent) {
  if (value === undefined || value === null || value === "") return;
  lines.push(`${" ".repeat(indent)}${key}: ${JSON.stringify(value)},`);
}

function pushNumber(lines, key, value, indent) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return;
  lines.push(`${" ".repeat(indent)}${key}: ${Number(value)},`);
}

function pushLinks(lines, links) {
  lines.push("    links: [");

  for (const linkEntry of links) {
    lines.push(
      `      link(${JSON.stringify(linkEntry.platform ?? linkEntry.label)}, ${JSON.stringify(linkEntry.url)}, ${JSON.stringify(linkEntry.kind ?? "streaming")}, ${linkEntry.primary === true}),`,
    );
  }

  lines.push("    ],");
}

function pushCatalogSource(lines, catalogSource) {
  lines.push("    catalogSource: {");
  pushString(lines, "source", catalogSource.source, 6);
  pushString(lines, "sourceUrl", catalogSource.sourceUrl, 6);

  if (catalogSource.externalIds && Object.keys(catalogSource.externalIds).length) {
    lines.push("      externalIds: {");
    for (const [key, value] of Object.entries(catalogSource.externalIds)) {
      lines.push(`        ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
    }
    lines.push("      },");
  }

  pushString(lines, "artistName", catalogSource.artistName, 6);
  pushString(lines, "artworkUrl", catalogSource.artworkUrl, 6);
  pushNumber(lines, "trackCount", catalogSource.trackCount, 6);
  pushString(lines, "rawKind", catalogSource.rawKind, 6);

  if (catalogSource.parentCollection) {
    lines.push("      parentCollection: {");
    pushString(lines, "title", catalogSource.parentCollection.title, 8);
    pushString(lines, "slug", catalogSource.parentCollection.slug, 8);
    lines.push("      },");
  }

  lines.push("    },");
}

function insertReleaseBlocks(blocks) {
  const sourceText = readFileSync(RELEASES_PATH, "utf8");
  const arrayEnd = findReleasesArrayEnd(sourceText);
  const insertion = `${blocks.join("\n")}\n`;
  const nextText = `${sourceText.slice(0, arrayEnd)}${insertion}${sourceText.slice(arrayEnd)}`;
  writeFileSync(RELEASES_PATH, nextText, "utf8");
}

function findReleasesArrayEnd(sourceText) {
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

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaping = false;

  for (let index = arrayStart; index < sourceText.length; index += 1) {
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

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  fail("Could not find releases array end in content/releases.ts.");
}

function backupReleasesFile() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(repoRoot, "content", `releases.ts.catalog-merge-backup-${stamp}`);
  copyFileSync(RELEASES_PATH, backupPath);
  return backupPath;
}

function renderResultMarkdown(result) {
  const lines = [];

  lines.push("# Catalog Merge Result");
  lines.push("");
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Mode: ${result.mode}`);
  lines.push(`Preview: ${result.previewPath}`);
  lines.push(`Release file: ${result.releasePath}`);
  lines.push(`Backup: ${result.backupPath ?? "not written"}`);
  lines.push(`Allow conflicts: ${result.allowConflicts ? "yes" : "no"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Entries to insert: ${result.summary.wouldInsertCount}`);
  lines.push(`- Already merged: ${result.summary.alreadyMergedCount}`);
  lines.push(`- Blocking issues: ${result.summary.blockingIssueCount}`);
  lines.push(`- Slug conflicts: ${result.summary.slugConflictCount}`);
  lines.push(`- Title conflicts: ${result.summary.titleConflictCount}`);
  lines.push(`- Skipped pending: ${result.summary.skippedPendingCount}`);
  lines.push(`- Skipped ignored: ${result.summary.skippedIgnoreCount}`);
  lines.push("");

  lines.push("## Blocking Issues");
  lines.push("");
  if (!result.blockingIssues.length) {
    lines.push("No blocking issues.");
  } else {
    for (const issue of result.blockingIssues) {
      lines.push(`- ${issue.type}: ${issue.message}`);
    }
  }
  lines.push("");

  lines.push("## Insertions");
  lines.push("");
  if (!result.entries.length) {
    lines.push("No entries would be inserted.");
    lines.push("");
  } else {
    for (const entry of result.entries) {
      lines.push(`### ${entry.title}`);
      lines.push("");
      lines.push(`- Status: \`${entry.reviewStatus}\``);
      lines.push(`- Provider: ${entry.provider ?? entry.catalogSource?.source ?? "unknown"}`);
      lines.push(`- Visibility: \`${entry.visibility}\``);
      lines.push(`- Slug: \`${entry.slug}\``);
      lines.push(`- Source URL: ${entry.sourceUrl ?? "none"}`);
      lines.push(`- Insert location: ${entry.insertion.location}`);
      lines.push("");
      lines.push("```ts");
      lines.push(entry.insertion.block);
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function slugify(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(single|ep)\b/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "-") || "untitled-release";
}

function relativePath(value) {
  return path.relative(repoRoot, value).replace(/\\/g, "/");
}

function fail(message) {
  console.error(`Catalog merge failed: ${message}`);
  process.exit(1);
}
