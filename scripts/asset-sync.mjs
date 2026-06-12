#!/usr/bin/env node

import fs from "node:fs/promises";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const hasFlag = (name) => argv.includes(`--${name}`);
const argValue = (name) => {
  const index = argv.indexOf(`--${name}`);
  if (index === -1) return null;
  const next = argv[index + 1];
  if (!next || next.startsWith("--")) return null;
  return next;
};
const firstPositionalArg = argv.find((arg) => !arg.startsWith("--") && arg.trim());
const hasLatestMode = hasFlag("latest");
const hasLatestMediaMode = hasFlag("latest-media") || hasFlag("latest-only");

const repoRoot = process.cwd();
const requestedSource = argValue("source") || argValue("src") || firstPositionalArg || "";
const defaultReleaseRoot = process.env.BROEY_RELEASE_ROOT || "D:\\Broey\\Releases\\Already Released";
const sourceRoot = String(
  requestedSource ||
    process.env.BROEY_ASSET_SOURCE ||
    ((hasLatestMode || hasLatestMediaMode)
      ? defaultReleaseRoot
      : ""),
);
const isDryRun = hasFlag("dry-run");
const writeContent = hasFlag("write-content");
const overwrite = hasFlag("overwrite");
const shouldSyncLatest = hasFlag("latest") || hasLatestMediaMode;
const mode = shouldSyncLatest ? "latest-media" : "full-catalog";
const reportPath =
  argValue("report") || path.join(repoRoot, "scripts", "asset-sync-report.json");

const allowedImageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".avif"];
const allowedAudioExtensions = [".wav"];
const finalTokens = new Set(["final", "master", "approved", "hires", "highres", "deliverable"]);
const discouragedTokens = new Set(["draft", "wip", "temp", "old", "rough", "preview", "test", "mock", "sample"]);

function validateSource() {
  if (!sourceRoot) {
    throw new Error(
    'Missing source path. Use --source "<path>" or set BROEY_ASSET_SOURCE. In latest mode, default is D:\\Broey\\Releases\\Already Released.',
  );
  }
  if (!existsSync(sourceRoot)) {
    throw new Error(`Source path not found: ${sourceRoot}`);
  }
}

function normalizeText(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0027\u2018\u2019\u0060"]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input) {
  return new Set(
    normalizeText(input)
      .split(" ")
      .filter(Boolean)
      .filter((token) => token.length > 1),
  );
}

function extractArrayBlocks(fileText, arrayName) {
  const marker = `${arrayName}:`;
  const arrayIndex = fileText.indexOf(marker);
  if (arrayIndex === -1) return [];

  const start = fileText.indexOf("[", arrayIndex);
  if (start === -1) return [];

  const blocks = [];
  let inString = false;
  let inQuote = "";
  let escaped = false;
  let braceDepth = 0;
  let objectStart = -1;

  for (let i = start; i < fileText.length; i += 1) {
    const char = fileText[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === inQuote) {
        inString = false;
        inQuote = "";
      }
      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      inString = true;
      inQuote = char;
      continue;
    }

    if (char === "{") {
      if (braceDepth === 0) objectStart = i;
      braceDepth += 1;
    } else if (char === "}") {
      if (braceDepth > 0) braceDepth -= 1;
      if (braceDepth === 0 && objectStart !== -1) {
        blocks.push({
          start: objectStart,
          end: i + 1,
          text: fileText.slice(objectStart, i + 1),
        });
        objectStart = -1;
      }
    } else if (char === "]" && braceDepth === 0 && blocks.length) {
      break;
    }
  }

  return blocks;
}

function propFromBlock(blockText, key) {
  const match = blockText.match(new RegExp(`${key}:\\s*["'\`](.*?)["'\`]`, "s"));
  return match ? match[1] : "";
}

function parseCatalog(filePath, arrayName, idKey, nameKey, pathKey) {
  const raw = readFileSync(filePath, "utf8");
  const blocks = extractArrayBlocks(raw, arrayName);
  return blocks
    .map((block) => {
      const id = propFromBlock(block.text, idKey);
      if (!id) return null;
      return {
        id,
        name: propFromBlock(block.text, nameKey),
        existingPath: propFromBlock(block.text, pathKey),
        pathKey,
        block,
        filePath,
      };
    })
    .filter(Boolean);
}

function collectFiles(dir, extensions) {
  const fileInfo = [];
  const unsupportedExts = new Map();
  const allowed = new Set(extensions.map((ext) => ext.toLowerCase()));
  const queue = [dir];

  while (queue.length) {
    const current = queue.pop();
    const entries = readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(filePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const ext = path.extname(entry.name).toLowerCase();
      const stats = statSync(filePath);
      const base = path.basename(entry.name, ext);

      if (!allowed.has(ext)) {
        if (ext) {
          unsupportedExts.set(ext, (unsupportedExts.get(ext) || 0) + 1);
        }
        continue;
      }

      const createdAt = Math.max(
        stats.birthtimeMs || 0,
        stats.mtimeMs || 0,
      );
      fileInfo.push({
        filePath,
        ext,
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        createdAt,
        base,
        norm: normalizeText(base),
        tokenSet: tokenize(base),
      });
    }
  }

  return { files: fileInfo, unsupportedExts };
}

function unsupportedSummary(unsupportedExts) {
  return {
    total: Array.from(unsupportedExts.values()).reduce((sum, count) => sum + count, 0),
    topTypes: Array.from(unsupportedExts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ext, count]) => `${ext || "<no-ext>"}:${count}`),
  };
}

function containsToken(text, token) {
  return (
    text === token ||
    text.includes(` ${token} `) ||
    text.startsWith(`${token} `) ||
    text.endsWith(` ${token}`)
  );
}

function pickLatestFile(dir, extensions) {
  const { files } = collectFiles(dir, extensions);
  if (!files.length) return null;
  return files.sort((a, b) => b.createdAt - a.createdAt)[0];
}

function scoreCandidate(fileInfo, targetTokens, targetNorm) {
  let score = 0;
  const fileNorm = ` ${fileInfo.norm} `;

  for (const token of targetTokens) {
    if (fileInfo.tokenSet.has(token)) score += 5;
  }

  if (containsToken(fileNorm, targetNorm)) {
    score += 28;
  } else if (fileNorm.includes(targetNorm)) {
    score += 14;
  }

  for (const token of finalTokens) {
    if (containsToken(fileNorm, token)) score += 7;
  }
  for (const token of discouragedTokens) {
    if (containsToken(fileNorm, token)) score -= 5;
  }

  // Favor stronger source exports and fresher file dates.
  score += Math.min(fileInfo.size / 8_000_000, 7);
  const ageYears = (Date.now() - fileInfo.mtimeMs) / (1000 * 60 * 60 * 24 * 365);
  score -= Math.min(ageYears, 4);

  return score;
}

function bestCandidateFor(entry, sourceFiles) {
  const targetText = `${entry.name} ${entry.id}`;
  const targetTokens = Array.from(tokenize(targetText));
  const targetNorm = normalizeText(targetText);
  let best = null;
  let bestScore = -Infinity;

  const ranked = sourceFiles.map((candidate) => ({
    ...candidate,
    score: scoreCandidate(candidate, targetTokens, targetNorm),
  }));

  const sorted = ranked.sort((a, b) => b.score - a.score);
  for (const candidate of sorted) {
    if (candidate.score > bestScore) {
      bestScore = candidate.score;
      best = candidate;
    }
  }

  const alternatives = sorted.slice(0, 3).map((entry) => ({
    path: entry.filePath,
    score: Number(entry.score.toFixed(2)),
    normalized: entry.norm,
  }));

  const isAmbiguous =
    sorted.length > 1 && Math.abs(sorted[0].score - sorted[1].score) <= 0.01;

  return {
    best: best ? { ...best, score: Number(best.score.toFixed(2)) } : null,
    alternatives,
    isAmbiguous,
  };
}

function publicPathExists(publicImagePath) {
  if (!publicImagePath || !publicImagePath.startsWith("/")) return false;
  return existsSync(path.join(repoRoot, "public", publicImagePath.replace(/^\//, "")));
}

async function applyContentPathUpdates(filePath, map, pathKey, arrayName) {
  const raw = readFileSync(filePath, "utf8");
  const blocks = extractArrayBlocks(raw, arrayName);
  const patches = [];

  for (const block of blocks) {
    const id = propFromBlock(block.text, "slug");
    const newPath = map.get(id);
    if (!id || !newPath) continue;

    const currentPath = propFromBlock(block.text, pathKey);
    const needsUpdate =
      !currentPath || !publicPathExists(currentPath) || currentPath !== newPath;
    if (!needsUpdate) continue;

    const replacement = block.text.replace(
      new RegExp(`(${pathKey}\\s*:\\s*)["'\\\`](.*?)["'\\\`]`),
      `$1"${newPath}"`,
    );
    if (replacement !== block.text) {
      patches.push({ start: block.start, end: block.end, replacement });
    }
  }

  if (!patches.length) return;

  const ordered = patches.sort((a, b) => b.start - a.start);
  let text = raw;
  for (const patch of ordered) {
    text = `${text.slice(0, patch.start)}${patch.replacement}${text.slice(patch.end)}`;
  }
  await fs.writeFile(filePath, text, "utf8");
}

function statusLine(status, row) {
  const icon = {
    copied: "✓",
    skipped: "-",
    missing: "x",
    ambiguous: "?",
    review: "?",
    "up-to-date": "•",
  }[status] || "?";
  const destination = row.destination || "(no destination)";
  const candidate = row.candidate || "(no candidate)";
  return `${icon} ${row.type} ${row.id} → ${destination} (${candidate})`;
}

function printSummary(rows) {
  const grouped = { release: rows.filter((r) => r.type === "release"), merch: rows.filter((r) => r.type === "merch"), latest: rows.filter((r) => r.type === "latest") };
  for (const [groupName, groupRows] of Object.entries(grouped)) {
    if (!groupRows.length) continue;

    console.log(`\n${groupName.toUpperCase()} RESULTS`);
    const copied = groupRows.filter((r) => r.status === "copied");
    const ambiguous = groupRows.filter((r) => r.status === "ambiguous");
    const skipped = groupRows.filter((r) => r.status === "skipped");
    const review = groupRows.filter((r) => r.status === "review" || r.status === "missing");
    const upToDate = groupRows.filter((r) => r.status === "up-to-date");

    for (const row of copied) console.log(statusLine("copied", row));
    for (const row of ambiguous) console.log(statusLine("ambiguous", row));
    for (const row of upToDate) console.log(statusLine("up-to-date", row));
    for (const row of review) console.log(statusLine(row.status, row));
    for (const row of skipped) console.log(statusLine("skipped", row));

    const warnings = groupRows.filter((r) => r.warnings && r.warnings.length);
    for (const warning of warnings) {
      console.log(`⚠ ${warning.warnings.join("; ")}`);
    }
  }
}

async function writeReport(report) {
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function syncLatestMedia() {
  validateSource();
  const { files: pngCandidates, unsupportedExts: pngUnsupported } =
    collectFiles(sourceRoot, [".png"]);
  const { files: wavCandidates, unsupportedExts: wavUnsupported } =
    collectFiles(sourceRoot, allowedAudioExtensions);

  const latestPng = pngCandidates.sort((a, b) => b.createdAt - a.createdAt)[0] || null;
  const latestWav = wavCandidates.sort((a, b) => b.createdAt - a.createdAt)[0] || null;

  const latestAssets = [
    {
      id: "cover-art",
      type: "latest",
      name: "latest-cover-art",
      source: latestPng,
      destination: latestPng
        ? path.join(repoRoot, "public", "assets", "cover-art", `latest-release${latestPng.ext}`)
        : null,
      notes: ["type=png", `source=${latestPng ? latestPng.filePath : "not-found"}`],
    },
    {
      id: "audio",
      type: "latest",
      name: "latest-audio",
      source: latestWav,
      destination: latestWav
        ? path.join(repoRoot, "public", "assets", "audio", `latest-release${latestWav.ext}`)
        : null,
      notes: ["type=wav", `source=${latestWav ? latestWav.filePath : "not-found"}`],
    },
  ];

  const rows = [];

  for (const item of latestAssets) {
    const relativePublicPath = item.destination
      ? `/${path.relative(path.join(repoRoot, "public"), item.destination).split(path.sep).join("/")}`
      : "";
    const row = {
      type: item.type,
      id: item.id,
      name: item.name,
      existingPath: relativePublicPath,
      existingValid: item.destination ? existsSync(item.destination) : false,
      candidate: item.source ? item.source.filePath : "",
      score: 0,
      destination: relativePublicPath,
      copied: false,
      status: "missing",
      alternatives: [],
      warnings: [],
      notes: [...item.notes],
    };

    if (!item.source || !item.destination) {
      row.notes.push("No matching file found");
      rows.push(row);
      continue;
    }

    if (!overwrite && existsSync(item.destination)) {
      row.notes.push("Skipped (exists)");
      row.status = "skipped";
      rows.push(row);
      continue;
    }

    if (isDryRun) {
      row.status = "review";
      row.notes.push("Dry run: no file copied");
      rows.push(row);
      continue;
    }

    await fs.mkdir(path.dirname(item.destination), { recursive: true });
    await fs.copyFile(item.source.filePath, item.destination);
    row.copied = true;
    row.status = "copied";
    row.notes.push("Copied");
    rows.push(row);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    mode,
    dryRun: isDryRun,
    overwrite,
    totalEntries: latestAssets.length,
    copied: rows.filter((row) => row.copied).length,
    unsupportedFiles: {
      image: unsupportedSummary(pngUnsupported),
      audio: unsupportedSummary(wavUnsupported),
    },
    rows,
  };

  await writeReport(report);
  printSummary(rows);

  console.log(`\nLatest media sync complete: ${rows.length} item(s).`);
  console.log(`- Dry run: ${isDryRun}`);
  console.log(`- Copied: ${rows.filter((row) => row.copied).length}`);
  console.log(`- Report: ${reportPath}`);
  if (isDryRun) {
    console.log("Run again without --dry-run to actually copy files.");
  }
}

async function syncFullCatalog() {
  validateSource();
  const { files: sourceFiles, unsupportedExts } = collectFiles(sourceRoot, allowedImageExtensions);
  const unsupported = unsupportedSummary(unsupportedExts);
  if (!sourceFiles.length) {
    throw new Error(`No supported image files found in source: ${sourceRoot}`);
  }

  const releaseEntries = parseCatalog(
    path.join(repoRoot, "content/releases.ts"),
    "releases",
    "slug",
    "title",
    "coverImage",
  );
  const merchEntries = parseCatalog(
    path.join(repoRoot, "content/merch.ts"),
    "merch",
    "slug",
    "name",
    "image",
  );

  const allEntries = [
    ...releaseEntries.map((entry) => ({ ...entry, type: "release" })),
    ...merchEntries.map((entry) => ({ ...entry, type: "merch" })),
  ];

  const destinationByType = {
    release: "/assets/cover-art",
    merch: "/assets/merch",
  };

  const rows = [];
  const updates = {
    release: new Map(),
    merch: new Map(),
  };

  for (const entry of allEntries) {
    const { best, alternatives, isAmbiguous } = bestCandidateFor(entry, sourceFiles);
    const row = {
      id: entry.id,
      type: entry.type,
      name: entry.name,
      existingPath: entry.existingPath,
      existingValid: publicPathExists(entry.existingPath),
      candidate: "",
      score: 0,
      destination: "",
      copied: false,
      alternatives,
      status: "review",
      warnings: [],
      notes: [],
    };

    if (!best) {
      row.status = "missing";
      row.notes.push("No candidate found");
      rows.push(row);
      continue;
    }

    const fileName = `${entry.id}${best.ext}`;
    const relativeDest = `${destinationByType[entry.type]}/${fileName}`;
    const absoluteDest = path.join(repoRoot, "public", relativeDest);
    const shouldWritePath = !entry.existingPath || !publicPathExists(entry.existingPath);

    row.candidate = best.filePath;
    row.score = best.score;
    row.destination = relativeDest.startsWith("/") ? relativeDest : `/${relativeDest}`;
    row.status = shouldWritePath ? "review" : "up-to-date";

    if (isAmbiguous) {
      row.status = "ambiguous";
      row.warnings.push("Multiple equally strong matches; verify before writing content");
    }

    if (!overwrite && existsSync(absoluteDest)) {
      row.status = row.status === "ambiguous" ? "ambiguous" : "skipped";
      row.notes.push("Skipped (exists)");
      if (shouldWritePath && !isAmbiguous && existsSync(absoluteDest)) {
        updates[entry.type].set(entry.id, row.destination);
      }
      rows.push(row);
      continue;
    }

    if (isDryRun) {
      row.notes.push("Dry run: no file copied");
      rows.push(row);
      continue;
    }

    await fs.mkdir(path.dirname(absoluteDest), { recursive: true });
    await fs.copyFile(best.filePath, absoluteDest);
    row.copied = true;
    row.status = isAmbiguous ? "ambiguous" : "copied";
    row.notes.push("Copied");
    rows.push(row);

    if (shouldWritePath && !isAmbiguous && existsSync(absoluteDest)) {
      updates[entry.type].set(entry.id, row.destination);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    sourceRoot,
    mode,
    dryRun: isDryRun,
    overwrite,
    totalEntries: allEntries.length,
    copied: rows.filter((row) => row.copied).length,
    unsupportedFiles: { image: unsupported },
    rows,
  };

  await writeReport(report);
  printSummary(rows);

  if (writeContent && !isDryRun) {
    await applyContentPathUpdates(
      path.join(repoRoot, "content/releases.ts"),
      updates.release,
      "coverImage",
      "releases",
    );
    await applyContentPathUpdates(
      path.join(repoRoot, "content/merch.ts"),
      updates.merch,
      "image",
      "merch",
    );
  }

  if (writeContent && isDryRun) {
    console.log("Write-content is skipped during dry-run.");
  }

  console.log(`\nSynced ${rows.length} entries.`);
  console.log(`- Dry run: ${isDryRun}`);
  console.log(`- Write content: ${writeContent}`);
  console.log(`- Copied: ${rows.filter((row) => row.copied).length}`);
  console.log(`- Unsupported files in source: ${unsupported.total} (top extensions: ${unsupported.topTypes.join(", ") || "none"})`);
  console.log(`- Report: ${reportPath}`);
  if (isDryRun) {
    console.log("Run again without --dry-run to actually copy files.");
  }

  if (writeContent && !isDryRun) {
    console.log("Updated content file paths for successfully synced assets.");
  }
}

async function reportFailure(errorMessage) {
  await writeReport({
    generatedAt: new Date().toISOString(),
    sourceRoot,
    mode,
    dryRun: isDryRun,
    overwrite,
    writeContent,
    totalEntries: 0,
    copied: 0,
    rows: [],
    error: errorMessage,
  });
}

async function main() {
  if (mode === "latest-media") {
    await syncLatestMedia();
    return;
  }
  await syncFullCatalog();
}

main().catch(async (error) => {
  try {
    await reportFailure(error.message);
  } catch (reportError) {
    console.error("Failed to write report:", reportError.message);
  }
  console.error("Asset sync failed:", error.message);
  process.exit(1);
});
