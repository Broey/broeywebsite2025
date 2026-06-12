#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PREVIEW_PATH = path.join(__dirname, "release-library-website-sync-preview.json");
const CONTENT_PATH = path.join(repoRoot, "content", "releases.ts");
const COVER_ART_ROOT = path.join(repoRoot, "public", "assets", "cover-art");

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const previewPath = args.preview || DEFAULT_PREVIEW_PATH;
  if (!existsSync(previewPath)) {
    fail(`Missing preview file. Run npm run sync:release-library:website-sync-preview first or pass --preview <path>.`);
  }

  const preview = readJson(previewPath);
  validatePreview(preview);

  const timestamp = timestampForFileName(new Date());
  const contentBackupPath = `${CONTENT_PATH}.backup-${timestamp}`;
  if (!existsSync(contentBackupPath)) {
    copyFileSync(CONTENT_PATH, contentBackupPath);
  }

  const artworkBackups = [];
  const copiedArtwork = [];
  const previewUpdates = [];

  for (const entry of preview.releases) {
    if (!entry || typeof entry !== "object") {
      fail("Invalid preview entry encountered.");
    }

    if (entry.websiteAction !== "update") {
      fail(`Preview still contains a non-update entry for ${entry.slug || entry.releaseFolderName || "unknown release"}.`);
    }

    if (!entry.readyForWebsiteSync) {
      fail(`Preview entry is not ready for website sync: ${entry.slug || entry.releaseFolderName || "unknown release"}.`);
    }

    if (!entry.contentAlreadyHasRelease || entry.contentState !== "public") {
      fail(`Writer only handles existing public releases right now. ${entry.slug || entry.releaseFolderName || "unknown release"} is ${entry.contentState || "unknown"}.`);
    }

    if (!entry.sourceArtworkAbsolutePath || !existsSync(entry.sourceArtworkAbsolutePath)) {
      fail(`Missing source artwork: ${entry.sourceArtworkAbsolutePath || "(none)"}`);
    }

    if (!entry.targetArtworkPath) {
      fail(`Missing target artwork path for ${entry.slug || entry.releaseFolderName || "unknown release"}.`);
    }

    const targetArtworkAbsolutePath = path.join(repoRoot, entry.targetArtworkPath);
    mkdirSync(path.dirname(targetArtworkAbsolutePath), { recursive: true });

    if (existsSync(targetArtworkAbsolutePath)) {
      const backupPath = createBackupPath(targetArtworkAbsolutePath, timestamp);
      copyFileSync(targetArtworkAbsolutePath, backupPath);
      artworkBackups.push({
        targetPath: path.relative(repoRoot, targetArtworkAbsolutePath),
        backupPath: path.relative(repoRoot, backupPath),
      });
    }

    copyFileSync(entry.sourceArtworkAbsolutePath, targetArtworkAbsolutePath);
    copiedArtwork.push({
      sourcePath: path.relative(repoRoot, entry.sourceArtworkAbsolutePath),
      targetPath: path.relative(repoRoot, targetArtworkAbsolutePath),
    });

    previewUpdates.push({
      slug: entry.slug,
      title: entry.title,
      releaseDate: entry.proposedWebsiteRelease?.releaseDate ?? null,
      year: Number.isFinite(entry.proposedWebsiteRelease?.year) ? entry.proposedWebsiteRelease.year : null,
      coverImage: entry.proposedWebsiteRelease?.coverImage ?? null,
    });
  }

  const contentBefore = readFileSync(CONTENT_PATH, "utf8");
  const contentAfter = updateContentReleases(contentBefore, previewUpdates);
  if (contentAfter !== contentBefore) {
    writeFileSync(CONTENT_PATH, contentAfter, "utf8");
  }

  console.log(`Backed up content/releases.ts -> ${path.relative(repoRoot, contentBackupPath)}`);
  console.log(`Copied artwork files: ${copiedArtwork.length}`);
  for (const record of copiedArtwork) {
    console.log(`- ${record.sourcePath} -> ${record.targetPath}`);
  }
  if (artworkBackups.length) {
    console.log(`Backed up overwritten cover art files: ${artworkBackups.length}`);
    for (const record of artworkBackups) {
      console.log(`- ${record.targetPath} -> ${record.backupPath}`);
    }
  } else {
    console.log("No existing cover art files were overwritten.");
  }
  console.log(`Updated content/releases.ts entries: ${previewUpdates.length}`);
  console.log("Release library website sync complete.");
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-website-sync.mjs [--preview <path>] [--help]");
  console.log("");
  console.log("Defaults:");
  console.log(`  preview: ${path.relative(repoRoot, DEFAULT_PREVIEW_PATH)}`);
  console.log("");
  console.log("This script copies cover art into public/assets/cover-art and updates content/releases.ts.");
  console.log("It only runs when the preview has no blockers and contains no add actions.");
}

function parseArgs(args) {
  const parsed = {
    help: false,
    preview: null,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--preview") {
      if (index + 1 >= args.length) fail("Missing value for --preview. Use --preview <path>.");
      parsed.preview = args[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--preview=")) {
      parsed.preview = arg.replace(/^--preview=/, "");
      continue;
    }

    fail(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function validatePreview(preview) {
  if (!preview || typeof preview !== "object" || Array.isArray(preview)) {
    fail("Invalid preview payload: expected an object.");
  }

  if (!Array.isArray(preview.releases)) {
    fail("Invalid preview payload: expected { releases: [] }.");
  }

  const summary = preview.summary || {};
  if (Number(summary.addCount || 0) !== 0) {
    fail(`Preview contains ${summary.addCount} add(s); writer only handles updates for now.`);
  }

  const blocked = preview.releases.filter((entry) => Array.isArray(entry.blockers) && entry.blockers.length > 0);
  if (blocked.length > 0) {
    const labels = blocked.map((entry) => entry.slug || entry.releaseFolderName || "unknown release");
    fail(`Preview still has blockers: ${labels.join(", ")}`);
  }

  const nonUpdate = preview.releases.filter((entry) => entry.websiteAction !== "update");
  if (nonUpdate.length > 0) {
    const labels = nonUpdate.map((entry) => entry.slug || entry.releaseFolderName || "unknown release");
    fail(`Preview contains non-update actions: ${labels.join(", ")}`);
  }
}

function updateContentReleases(sourceText, updates) {
  const blocks = extractReleaseObjectBlocks(sourceText);
  if (!blocks.length) {
    fail("Unable to locate release objects in content/releases.ts.");
  }

  const patches = [];
  const updateBySlug = new Map(updates.map((entry) => [sanitizeSlug(entry.slug), entry]));

  for (const block of blocks) {
    const slug = sanitizeSlug(readStringProperty(block.text, "slug"));
    const update = updateBySlug.get(slug);
    if (!update) continue;

    const replacement = updateReleaseBlock(block.text, update);
    if (replacement !== block.text) {
      patches.push({
        start: block.start,
        end: block.end,
        replacement,
      });
    }
  }

  if (!patches.length) {
    return sourceText;
  }

  let output = sourceText;
  for (const patch of patches.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, patch.start)}${patch.replacement}${output.slice(patch.end)}`;
  }

  return output;
}

function updateReleaseBlock(blockText, update) {
  const lines = blockText.split(/\r?\n/);
  const normalizedYear = Number.isFinite(update.year) ? String(update.year) : null;
  const normalizedReleaseDate = readText(update.releaseDate);
  const normalizedCoverImage = readText(update.coverImage);

  replaceTopLevelProperty(lines, "coverImage", normalizedCoverImage ? JSON.stringify(normalizedCoverImage) : null);

  if (normalizedYear) {
    if (!replaceTopLevelProperty(lines, "year", normalizedYear)) {
      insertTopLevelProperty(lines, "year", normalizedYear, ["type"]);
    }
  }

  if (normalizedReleaseDate) {
    if (!replaceTopLevelProperty(lines, "releaseDate", JSON.stringify(normalizedReleaseDate))) {
      if (replaceTopLevelProperty(lines, "year", normalizedYear || "")) {
        insertAfterTopLevelProperty(lines, "year", "releaseDate", JSON.stringify(normalizedReleaseDate));
      } else {
        insertAfterTopLevelProperty(lines, "type", "releaseDate", JSON.stringify(normalizedReleaseDate));
      }
    }
  }

  return lines.join("\n");
}

function replaceTopLevelProperty(lines, key, valueText) {
  if (!valueText && valueText !== "0") return false;
  const index = findTopLevelPropertyIndex(lines, key);
  if (index === -1) return false;
  lines[index] = `${getTopLevelIndent(lines[index])}${key}: ${valueText},`;
  return true;
}

function insertTopLevelProperty(lines, key, valueText, afterKeys) {
  const afterIndex = findFirstMatchingTopLevelIndex(lines, afterKeys);
  if (afterIndex === -1) return false;
  lines.splice(afterIndex + 1, 0, `${getTopLevelIndent(lines[afterIndex])}${key}: ${valueText},`);
  return true;
}

function insertAfterTopLevelProperty(lines, anchorKey, key, valueText) {
  const anchorIndex = findTopLevelPropertyIndex(lines, anchorKey);
  if (anchorIndex === -1) return false;
  lines.splice(anchorIndex + 1, 0, `${getTopLevelIndent(lines[anchorIndex])}${key}: ${valueText},`);
  return true;
}

function findTopLevelPropertyIndex(lines, key) {
  const pattern = new RegExp(`^\\s{4}${escapeRegExp(key)}\\s*:`);
  return lines.findIndex((line) => pattern.test(line));
}

function findFirstMatchingTopLevelIndex(lines, keys) {
  for (const key of keys) {
    const index = findTopLevelPropertyIndex(lines, key);
    if (index !== -1) return index;
  }
  return -1;
}

function getTopLevelIndent(line) {
  const match = String(line).match(/^(\s*)/);
  return match ? match[1] : "    ";
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
        blocks.push({
          start: objectStart,
          end: index + 1,
          text: sourceText.slice(objectStart, index + 1),
        });
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

function readStringProperty(source, key) {
  const pattern = new RegExp(`(?:^|[^A-Za-z0-9_])${escapeRegExp(key)}\\s*:\\s*(["'])([\\s\\S]*?)\\1`);
  const match = source.match(pattern);
  return match ? unescapeString(match[2]).trim() : "";
}

function readText(value) {
  if (typeof value === "string") return value.trim();
  return "";
}

function sanitizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
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

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON from ${filePath}: ${error?.message || String(error)}`);
  }
}

function createBackupPath(targetPath, timestamp) {
  const dir = path.dirname(targetPath);
  const baseName = path.basename(targetPath);
  let candidate = path.join(dir, `${baseName}.backup-${timestamp}`);
  let counter = 1;

  while (existsSync(candidate)) {
    candidate = path.join(dir, `${baseName}.backup-${timestamp}-${counter}`);
    counter += 1;
  }

  return candidate;
}

function timestampForFileName(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
