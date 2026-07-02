import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const workbookPath = path.join(
  repoRoot,
  "data",
  "source",
  "broey_website_release_metadata_registry_updated.xlsx",
);
const outputPath = path.join(repoRoot, "content", "musicRegistry.generated.ts");

const requiredSheets = [
  "Release Registry",
  "Track Registry",
  "Website Copy",
  "Platform Notes",
  "CMG Source Fields",
  "Data Dictionary",
  "Ignored Fields",
];

const siteSlugAliases = {
  fragments: "fragments-ep",
};

const siteRouteAliases = {
  fragments: "/music/fragments-ep",
};

const generatedAt = new Date().toISOString();
const warnings = [];

const text = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

const optionalText = (value) => {
  const normalized = text(value);

  return normalized ? normalized : undefined;
};

const splitList = (value, separator = ";") =>
  text(value)
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

const splitPeople = (value) =>
  text(value)
    .split(/,(?!\s*(?:Inc\.|LLC|Ltd\.|Co\.))/)
    .map((item) => item.trim())
    .filter(Boolean);

const slugify = (value) =>
  text(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeReleaseType = (value) => {
  const normalized = text(value).toLowerCase();

  if (normalized === "ep") {
    return "ep";
  }

  if (["single", "remix", "mix", "set"].includes(normalized)) {
    return normalized;
  }

  return normalized || "single";
};

const excelDateToIso = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed?.y && parsed?.m && parsed?.d) {
      return [
        String(parsed.y).padStart(4, "0"),
        String(parsed.m).padStart(2, "0"),
        String(parsed.d).padStart(2, "0"),
      ].join("-");
    }
  }

  const raw = text(value);

  if (!raw) {
    return undefined;
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return raw;
  }

  const parsedDate = Date.parse(raw);

  if (!Number.isNaN(parsedDate)) {
    return new Date(parsedDate).toISOString().slice(0, 10);
  }

  return raw;
};

const yearFrom = (yearValue, releaseDate) => {
  const releaseYear = releaseDate ? Number(releaseDate.slice(0, 4)) : undefined;
  const rawYear = typeof yearValue === "number" ? yearValue : Number(text(yearValue));

  if (Number.isInteger(rawYear) && rawYear >= 1900 && rawYear <= 2200) {
    return rawYear;
  }

  if (Number.isInteger(releaseYear)) {
    return releaseYear;
  }

  return undefined;
};

const isYes = (value) => /^yes|true$/i.test(text(value));

const toSiteSlug = (sourceSlug) => siteSlugAliases[sourceSlug] ?? sourceSlug;

const toSiteRoute = (sourceSlug, sourceRoute) =>
  siteRouteAliases[sourceSlug] ?? sourceRoute ?? `/music/${toSiteSlug(sourceSlug)}`;

const publicSmartLinks = (releaseRow, platformNote) => {
  const links = [];
  const smartLink = optionalText(releaseRow["Pre-save / Smart Link"] || platformNote?.["Smart Link / Pre-save"]);

  if (smartLink) {
    links.push({
      label: smartLink.includes("createmusic.fm") ? "Create Music" : "Smart Link",
      platform: smartLink.includes("createmusic.fm") ? "Create Music" : "Smart Link",
      url: smartLink,
      kind: "promo",
    });
  }

  return links;
};

const readRows = (workbook, sheetName) =>
  XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: true,
  });

const readDashboardMetric = (workbook, metricName) => {
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Dashboard, {
    header: 1,
    defval: "",
    raw: true,
  });

  for (const row of rows) {
    if (text(row[0]) === metricName) {
      const value = Number(row[1]);

      return Number.isFinite(value) ? value : undefined;
    }
  }

  return undefined;
};

const byReleaseSlugAndPlacement = (rows) => {
  const map = new Map();

  for (const row of rows) {
    const slug = text(row["Release Slug"]);
    const placement = text(row.Placement).toLowerCase();

    if (slug && placement) {
      map.set(`${slug}:${placement}`, row);
    }
  }

  return map;
};

const copyFor = (copyMap, slug, placementNeedle) => {
  const prefix = `${slug}:`;
  const needle = placementNeedle.toLowerCase();

  for (const [key, row] of copyMap.entries()) {
    if (key.startsWith(prefix) && text(row.Placement).toLowerCase().includes(needle)) {
      return optionalText(row["Suggested Copy"]);
    }
  }

  return undefined;
};

const buildRelease = ({ row, copyMap, platformNotesBySlug, tracksBySourceSlug }) => {
  const sourceSlug = text(row["Website Slug"]);
  const siteSlug = toSiteSlug(sourceSlug);
  const releaseDate = excelDateToIso(row["Release Date"]);
  const year = yearFrom(row.Year, releaseDate);
  const trackRows = tracksBySourceSlug.get(sourceSlug) ?? [];
  const cardCopy = copyFor(copyMap, sourceSlug, "card") ?? optionalText(row["Website Summary"]);
  const pageCopy = copyFor(copyMap, sourceSlug, "page body") ?? optionalText(row["Long Description / Source Story"]);
  const seoDescription = copyFor(copyMap, sourceSlug, "seo meta") ?? cardCopy;
  const platformNote = platformNotesBySlug.get(sourceSlug);
  const genres = splitList(row["Primary Genre(s)"]);
  const moods = splitList(row["Mood / Energy"]);
  const route = toSiteRoute(sourceSlug, optionalText(row["Website Route"]));

  return {
    sourceSlug,
    siteSlug,
    route,
    title: text(row["Release Title"]),
    displayArtist: text(row["Display Artist(s)"]),
    releaseType: normalizeReleaseType(row["Release Type"]),
    releaseTypeDisplay: text(row["Release Type"]),
    releaseDate,
    year,
    preorderDate: excelDateToIso(row["Pre-order Date"]),
    catalogNumber: optionalText(row["Catalog Number"]),
    upc: optionalText(row.UPC),
    label: optionalText(row.Label),
    pLine: optionalText(row["P Line"]),
    cLine: optionalText(row["C Line"]),
    genres,
    moods,
    focusTrack: optionalText(row["Focus Track"]),
    verificationStatus: optionalText(row["Data Confidence"]),
    publishStatus: optionalText(row["Publish Status"]),
    shortDescription: cardCopy,
    pageDescription: pageCopy,
    seoTitle: `${text(row["Release Title"])} by ${text(row["Display Artist(s)"]) || "Broey."}`,
    seoDescription,
    smartLinks: publicSmartLinks(row, platformNote),
    platformLinks: [],
    relatedTrackIds: trackRows.map((track) => track.trackSlug),
    trackCount: trackRows.length,
    explicit: isYes(row.Explicit),
    language: optionalText(row.Language),
  };
};

const buildTrack = (row) => {
  const sourceReleaseSlug = text(row["Release Slug"]);
  const releaseSlug = toSiteSlug(sourceReleaseSlug);
  const title = text(row["Track Display Title"]);
  const trackNumber = Number(row["Track #"]);
  const releaseDate = excelDateToIso(row["Release Date"]);
  const trackSlug = slugify(title);

  return {
    trackSlug,
    releaseSlug,
    sourceReleaseSlug,
    route: toSiteRoute(sourceReleaseSlug, optionalText(row["Website Route"])),
    trackNumber: Number.isFinite(trackNumber) ? trackNumber : undefined,
    title,
    baseTitle: optionalText(row["Base Track Title"]),
    mixVersion: optionalText(row["Track Mix / Version"]),
    displayArtist: text(row["Display Artist(s)"]),
    artistList: splitPeople(row["Artist List"]),
    remixers: splitPeople(row["Remixer(s)"]),
    featuredArtists: splitPeople(row["Featured Artist(s)"]),
    duration: optionalText(row.Duration),
    isrc: optionalText(row.ISRC),
    mainGenre: optionalText(row["Main Genre"]),
    edmGenre: optionalText(row["EDM Genre"]),
    customGenre: optionalText(row["Custom Genre / Style"]),
    explicit: isYes(row.Explicit),
    copyrightHolder: optionalText(row["Copyright Holder"]),
    publisher: optionalText(row.Publisher),
    pLine: optionalText(row["P Line"]),
    cLine: optionalText(row["C Line"]),
    credits: optionalText(row["Producer / Credits"]),
    lyricistCredits: optionalText(row["Lyricist Credits"]),
    songwriters: optionalText(row.Songwriters),
    masterSplits: optionalText(row["Master Splits"]),
    tiktokTimestamp: optionalText(row["TikTok Timestamp"]),
    websiteBlurb: optionalText(row["Track Short Copy"]),
    releaseDate,
    verificationStatus: optionalText(row["Data Confidence"]),
  };
};

const validate = ({ releases, tracks, expectedReleaseCount, expectedTrackCount }) => {
  if (expectedReleaseCount && releases.length !== expectedReleaseCount) {
    warnings.push(`Expected ${expectedReleaseCount} releases from Dashboard but parsed ${releases.length}.`);
  }

  if (expectedTrackCount && tracks.length !== expectedTrackCount) {
    warnings.push(`Expected ${expectedTrackCount} tracks from Dashboard but parsed ${tracks.length}.`);
  }

  if (releases.length !== 8) {
    warnings.push(`Workbook parsed ${releases.length} releases; current baseline expectation is 8.`);
  }

  if (tracks.length !== 26) {
    warnings.push(`Workbook parsed ${tracks.length} tracks; current baseline expectation is 26.`);
  }

  for (const release of releases) {
    if (!release.title) {
      warnings.push(`Release ${release.sourceSlug || "(missing slug)"} is missing title.`);
    }

    if (!release.sourceSlug) {
      warnings.push(`Release "${release.title || "(missing title)"}" is missing source slug.`);
    }

    if (!release.releaseDate) {
      warnings.push(`Release ${release.sourceSlug || release.title} is missing release date.`);
    }

    if (!release.relatedTrackIds.length) {
      warnings.push(`Release ${release.sourceSlug || release.title} has no track association.`);
    }

    if (!release.upc) {
      warnings.push(`Release ${release.sourceSlug || release.title} is missing UPC.`);
    }

    if (!release.platformLinks.length) {
      warnings.push(`Release ${release.sourceSlug || release.title} has no direct platform URLs in the workbook.`);
    }
  }

  for (const track of tracks) {
    if (!track.title) {
      warnings.push(`Track ${track.trackSlug || "(missing slug)"} is missing title.`);
    }

    if (!track.releaseSlug) {
      warnings.push(`Track ${track.title || "(missing title)"} is missing release slug.`);
    }

    if (!track.trackNumber) {
      warnings.push(`Track ${track.title || "(missing title)"} is missing track number.`);
    }

    if (!track.duration) {
      warnings.push(`Track ${track.title || "(missing title)"} is missing duration.`);
    }

    if (!track.isrc) {
      warnings.push(`Track ${track.releaseSlug}/${track.title || "(missing title)"} is missing ISRC.`);
    }
  }
};

const asConstExport = (name, value) =>
  `export const ${name} = ${JSON.stringify(value, null, 2)} as const;\n`;

const main = () => {
  if (!fs.existsSync(workbookPath)) {
    throw new Error(`Workbook not found: ${path.relative(repoRoot, workbookPath)}`);
  }

  const workbook = XLSX.readFile(workbookPath, {
    cellDates: false,
    raw: true,
  });
  const missingSheets = requiredSheets.filter((sheetName) => !workbook.Sheets[sheetName]);

  if (missingSheets.length) {
    throw new Error(`Workbook is missing required sheet(s): ${missingSheets.join(", ")}`);
  }

  const releaseRows = readRows(workbook, "Release Registry");
  const trackRows = readRows(workbook, "Track Registry");
  const websiteCopyRows = readRows(workbook, "Website Copy");
  const platformNoteRows = readRows(workbook, "Platform Notes");
  const dataDictionaryRows = readRows(workbook, "Data Dictionary");
  const ignoredFieldRows = readRows(workbook, "Ignored Fields");
  const cmgSourceRows = readRows(workbook, "CMG Source Fields");

  const tracks = trackRows.map(buildTrack);
  const tracksBySourceSlug = new Map();

  for (const track of tracks) {
    const list = tracksBySourceSlug.get(track.sourceReleaseSlug) ?? [];
    list.push(track);
    tracksBySourceSlug.set(track.sourceReleaseSlug, list);
  }

  const copyMap = byReleaseSlugAndPlacement(websiteCopyRows);
  const platformNotesBySlug = new Map(
    platformNoteRows.map((row) => [text(row["Release Slug"]), row]),
  );
  const releases = releaseRows.map((row) =>
    buildRelease({
      row,
      copyMap,
      platformNotesBySlug,
      tracksBySourceSlug,
    }),
  );
  const tracksByReleaseSlug = Object.fromEntries(
    releases.map((release) => [
      release.siteSlug,
      tracks
        .filter((track) => track.releaseSlug === release.siteSlug)
        .sort((left, right) => (left.trackNumber ?? 0) - (right.trackNumber ?? 0)),
    ]),
  );
  const releaseRegistryBySourceSlug = Object.fromEntries(
    releases.map((release) => [release.sourceSlug, release]),
  );
  const releaseRegistryBySiteSlug = Object.fromEntries(
    releases.map((release) => [release.siteSlug, release]),
  );
  const expectedReleaseCount = readDashboardMetric(workbook, "Releases");
  const expectedTrackCount = readDashboardMetric(workbook, "Tracks");

  validate({
    releases,
    tracks,
    expectedReleaseCount,
    expectedTrackCount,
  });

  const generated = [
    "/* eslint-disable */",
    "// This file is generated by scripts/import-release-registry.mjs.",
    "// Edit data/source/broey_website_release_metadata_registry_updated.xlsx, then run npm run import:releases.",
    "",
    asConstExport("musicRegistryGeneratedAt", generatedAt).trim(),
    asConstExport("musicRegistryWorkbook", "data/source/broey_website_release_metadata_registry_updated.xlsx").trim(),
    asConstExport("musicRegistrySourceSheets", requiredSheets).trim(),
    asConstExport("musicRegistryReleases", releases).trim(),
    asConstExport("musicRegistryTracks", tracks).trim(),
    asConstExport("musicRegistryBySourceSlug", releaseRegistryBySourceSlug).trim(),
    asConstExport("musicRegistryBySiteSlug", releaseRegistryBySiteSlug).trim(),
    asConstExport("trackRegistryByReleaseSlug", tracksByReleaseSlug).trim(),
    "",
    "export type GeneratedReleaseRegistry = (typeof musicRegistryReleases)[number];",
    "export type GeneratedTrackRegistry = (typeof musicRegistryTracks)[number];",
    "export type GeneratedMusicRegistryBySiteSlug = typeof musicRegistryBySiteSlug;",
    "",
  ].join("\n");

  fs.writeFileSync(outputPath, generated, "utf8");

  console.log(`Release count: ${releases.length}`);
  console.log(`Track count: ${tracks.length}`);

  if (warnings.length) {
    console.log("");
    console.log("Warnings:");

    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  console.log("");
  console.log("Generated files:");
  console.log(`- ${path.relative(repoRoot, outputPath)}`);
  console.log("");
  console.log("Parsed sheets:");

  for (const sheetName of requiredSheets) {
    console.log(`- ${sheetName}`);
  }

  console.log("");
  console.log(`CMG source rows parsed for validation context: ${cmgSourceRows.length}`);
  console.log(`Data dictionary rows parsed for validation context: ${dataDictionaryRows.length}`);
  console.log(`Ignored field rows parsed for validation context: ${ignoredFieldRows.length}`);
};

try {
  main();
} catch (error) {
  console.error(`Release registry import failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
