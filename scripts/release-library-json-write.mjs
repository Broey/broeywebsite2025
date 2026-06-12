#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_PREVIEW_PATH = path.join(__dirname, "release-library-json-preview.json");
const RELEASE_LIBRARY_ROOT = "D:\\Broey\\Release Library\\released";
const BLOCKED_ROOT = "D:\\Broey\\Releases\\Already Released";

main();

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const previewPath = args.preview || DEFAULT_PREVIEW_PATH;
  if (!existsSync(previewPath)) {
    fail(`Missing preview file. Run npm run sync:release-library:json-preview first or pass --preview <path>.`);
  }

  const preview = readJson(previewPath);
  if (!preview || !Array.isArray(preview.releases)) {
    fail("Invalid preview payload: expected { releases: [] }.");
  }

  const results = {
    total: preview.releases.length,
    ready: 0,
    skippedBlocked: 0,
    skippedUnsafe: 0,
    written: 0,
    backups: 0,
  };

  for (const entry of preview.releases) {
    if (!entry || typeof entry !== "object") {
      results.skippedBlocked += 1;
      continue;
    }

    if (!entry.websiteReady || (Array.isArray(entry.blockers) && entry.blockers.length > 0)) {
      results.skippedBlocked += 1;
      continue;
    }

    results.ready += 1;

    const targetPath = resolveTargetPath(entry);
    if (!targetPath) {
      results.skippedUnsafe += 1;
      continue;
    }

    const targetDir = path.dirname(targetPath);
    mkdirSync(targetDir, { recursive: true });

    if (existsSync(targetPath)) {
      const backupPath = createBackupPath(targetPath);
      if (args.dryRun) {
        console.log(`Would back up ${path.relative(repoRoot, targetPath)} -> ${path.relative(repoRoot, backupPath)}`);
      } else {
        copyFileSync(targetPath, backupPath);
        results.backups += 1;
        console.log(`Backed up ${path.relative(repoRoot, targetPath)} -> ${path.relative(repoRoot, backupPath)}`);
      }
    }

    const payload = entry.proposedReleaseJson;
    if (!payload || typeof payload !== "object") {
      results.skippedBlocked += 1;
      console.warn(`Skipped ${entry.releaseFolderName || targetPath}: missing proposedReleaseJson payload.`);
      continue;
    }

    if (args.dryRun) {
      console.log(`Would write ${path.relative(repoRoot, targetPath)}`);
    } else {
      writeFileSync(targetPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      results.written += 1;
      console.log(`Wrote ${path.relative(repoRoot, targetPath)}`);
    }
  }

  console.log("");
  console.log("Release library JSON write complete.");
  console.log(`- Preview entries: ${results.total}`);
  console.log(`- Ready entries: ${results.ready}`);
  console.log(`- Written release.json files: ${results.written}`);
  console.log(`- Backups created: ${results.backups}`);
  console.log(`- Skipped blocked entries: ${results.skippedBlocked}`);
  console.log(`- Skipped unsafe targets: ${results.skippedUnsafe}`);
}

function printHelp() {
  console.log("Usage:");
  console.log("  node scripts/release-library-json-write.mjs [--preview <path>] [--dry-run] [--help]");
  console.log("");
  console.log("Defaults:");
  console.log(`  preview: ${path.relative(repoRoot, DEFAULT_PREVIEW_PATH)}`);
  console.log("");
  console.log("This script writes release.json files into D:\\Broey\\Release Library\\released only.");
  console.log("It does not modify content/releases.ts and it never touches D:\\Broey\\Releases\\Already Released.");
}

function parseArgs(args) {
  const parsed = {
    help: false,
    preview: null,
    dryRun: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--dry-run") {
      parsed.dryRun = true;
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

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    fail(`Unable to read JSON from ${filePath}: ${error?.message || String(error)}`);
  }
}

function resolveTargetPath(entry) {
  const rawPath = typeof entry.releaseJsonPath === "string" ? entry.releaseJsonPath.trim() : "";
  const folderPath = typeof entry.releaseFolderPath === "string" ? entry.releaseFolderPath.trim() : "";

  const candidate = rawPath || (folderPath ? path.join(folderPath, "release.json") : "");
  if (!candidate) {
    console.warn(`Skipping ${entry.releaseFolderName || "unknown release"}: missing target path.`);
    return null;
  }

  const absolutePath = path.resolve(candidate);
  const normalized = normalizePath(absolutePath);
  const allowedRoot = normalizePath(path.resolve(RELEASE_LIBRARY_ROOT));
  const blockedRoot = normalizePath(path.resolve(BLOCKED_ROOT));

  if (!normalized.startsWith(`${allowedRoot}${path.sep}`) && normalized !== allowedRoot) {
    console.warn(`Skipping unsafe target outside release library root: ${absolutePath}`);
    return null;
  }

  if (normalized.startsWith(`${blockedRoot}${path.sep}`) || normalized === blockedRoot) {
    console.warn(`Skipping blocked legacy target: ${absolutePath}`);
    return null;
  }

  return absolutePath;
}

function createBackupPath(targetPath) {
  const dir = path.dirname(targetPath);
  const baseName = path.basename(targetPath);
  const stamp = timestampForFileName(new Date());
  let candidate = path.join(dir, `${baseName}.backup-${stamp}`);
  let counter = 1;

  while (existsSync(candidate)) {
    candidate = path.join(dir, `${baseName}.backup-${stamp}-${counter}`);
    counter += 1;
  }

  return candidate;
}

function timestampForFileName(date) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function normalizePath(value) {
  return path.normalize(value).toLowerCase();
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
