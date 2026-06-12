import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const ARTIST_ID = "6HmeISbko4bc0zsZQvIAco";
const ARTIST_NAME = "Broey.";
const REPORT_DATE = "2026-06-12";
const REPORT_JSON = `reports/spotify-catalog-reconciliation-${REPORT_DATE}.json`;
const REPORT_MD = `reports/spotify-catalog-reconciliation-${REPORT_DATE}.md`;
const RELEASES_PATH = "content/releases.ts";
const APPLY_FLAG = "--apply-approved-spotify-fields";

const approvedSlugs = new Set([
  "free",
  "blu",
  "stereo-luv",
  "dancing-dumpster-fire",
  "i-cant-wait-for-love",
  "mean-something",
  "4u",
  "fragments-ep",
  "fragments-remixes",
  "warning",
  "hold-on",
  "hysteria",
  "after-you",
  "like-that",
  "paradise",
]);

const knownSlugTitleMap = new Map([
  ["free", ["free"]],
  ["blu", ["blu"]],
  ["stereo-luv", ["stereo luv", "stereo-luv"]],
  ["dancing-dumpster-fire", ["dancing dumpster fire"]],
  ["i-cant-wait-for-love", ["i can't wait for love", "i cant wait for love"]],
  ["mean-something", ["mean something"]],
  ["4u", ["4u"]],
  ["fragments-ep", ["fragments", "fragments ep"]],
  ["fragments-remixes", ["fragments remixes"]],
  ["warning", ["warning"]],
  ["hold-on", ["hold on"]],
  ["hysteria", ["hysteria"]],
  ["after-you", ["after you"]],
  ["like-that", ["like that"]],
  ["paradise", ["paradise"]],
]);

const neverApplySlugs = new Set(["link"]);

const args = new Set(process.argv.slice(2));
const applyMode = args.has(APPLY_FLAG);

const readText = (filePath) => fs.readFileSync(filePath, "utf8");

const writeJson = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
};

const writeText = (filePath, data) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, data);
};

const loadDotEnv = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  for (const line of readText(filePath).split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) {
      continue;
    }

    let value = match[2] ?? "";
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
};

const loadSiteReleases = () => {
  const source = readText(RELEASES_PATH);
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require,
    console,
  };
  vm.runInNewContext(js, sandbox, { filename: RELEASES_PATH });
  return sandbox.module.exports.releases ?? sandbox.exports.releases;
};

const normalizeTitle = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/\b(ep|single)\b/g, "")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const spotifyAlbumUrl = (id) => `https://open.spotify.com/album/${id}`;
const spotifyTrackUrl = (id) => `https://open.spotify.com/track/${id}`;

const releaseSpotifyLink = (release) =>
  [...(release.platformLinks ?? []), ...(release.links ?? [])].find(
    (link) => link.platform?.toLowerCase() === "spotify" && link.url?.includes("open.spotify.com"),
  );

const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return null;
  return Math.round(Math.abs(left - right) / 86_400_000);
};

const dateScore = (siteDate, spotifyDate) => {
  const delta = daysBetween(siteDate, spotifyDate);
  if (delta === null) return { points: 0, deltaDays: null };
  if (delta === 0) return { points: 20, deltaDays: delta };
  if (delta <= 7) return { points: 14, deltaDays: delta };
  if (delta <= 45) return { points: 8, deltaDays: delta };
  if (delta <= 370) return { points: 2, deltaDays: delta };
  return { points: -12, deltaDays: delta };
};

const confidenceFromScore = (score) => {
  if (score >= 72) return "High";
  if (score >= 45) return "Medium";
  if (score > 0) return "Low";
  return "None";
};

const formatMs = (ms) => {
  if (typeof ms !== "number") return undefined;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = `${totalSeconds % 60}`.padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const spotifyFetch = async (url, token, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify request failed ${response.status} ${response.statusText}: ${body}`);
  }
  return response.json();
};

const requestSpotifyToken = async (clientId, clientSecret) => {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Spotify token request failed ${response.status} ${response.statusText}: ${body}`);
  }

  const data = await response.json();
  return data.access_token;
};

const fetchAllArtistAlbums = async (token) => {
  const includeGroups = "album,single,appears_on,compilation";
  const market = "US";
  let url =
    `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums` +
    `?include_groups=${includeGroups}&market=${market}&limit=50`;
  const albums = [];

  while (url) {
    const page = await spotifyFetch(url, token);
    albums.push(...page.items);
    url = page.next;
  }

  return albums;
};

const chunk = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const fetchFullAlbums = async (token, albumIds) => {
  const fullAlbums = [];
  for (const ids of chunk(albumIds, 20)) {
    const data = await spotifyFetch(
      `https://api.spotify.com/v1/albums?ids=${ids.join(",")}&market=US`,
      token,
    );
    fullAlbums.push(...data.albums.filter(Boolean));
  }
  return fullAlbums;
};

const fetchFullTracks = async (token, trackIds) => {
  const tracks = [];
  for (const ids of chunk([...new Set(trackIds)], 50)) {
    const data = await spotifyFetch(
      `https://api.spotify.com/v1/tracks?ids=${ids.join(",")}&market=US`,
      token,
    );
    tracks.push(...data.tracks.filter(Boolean));
  }
  return tracks;
};

const artistNames = (artists = []) => artists.map((artist) => artist.name).filter(Boolean);

const normalizeSpotifyCatalog = async (token, simplifiedAlbums) => {
  const byId = new Map();
  for (const album of simplifiedAlbums) {
    byId.set(album.id, album);
  }

  const fullAlbums = await fetchFullAlbums(token, [...byId.keys()]);
  const tracks = await fetchFullTracks(
    token,
    fullAlbums.flatMap((album) => album.tracks?.items?.map((track) => track.id).filter(Boolean) ?? []),
  );
  const tracksById = new Map(tracks.map((track) => [track.id, track]));

  const normalized = fullAlbums.map((album) => {
    const normalizedTracks = (album.tracks?.items ?? []).map((track) => {
      const fullTrack = tracksById.get(track.id) ?? track;
      return {
        id: track.id,
        name: track.name,
        uri: track.uri,
        url: spotifyTrackUrl(track.id),
        artists: artistNames(track.artists),
        durationMs: fullTrack.duration_ms ?? track.duration_ms,
        duration: formatMs(fullTrack.duration_ms ?? track.duration_ms),
        discNumber: track.disc_number,
        trackNumber: track.track_number,
        explicit: Boolean(fullTrack.explicit ?? track.explicit),
        externalIds: fullTrack.external_ids ?? {},
        isrc: fullTrack.external_ids?.isrc,
      };
    });

    return {
      id: album.id,
      uri: album.uri,
      url: album.external_urls?.spotify ?? spotifyAlbumUrl(album.id),
      title: album.name,
      normalizedTitle: normalizeTitle(album.name),
      artists: artistNames(album.artists),
      albumType: album.album_type,
      releaseGroup: album.album_group,
      releaseDate: album.release_date,
      releaseDatePrecision: album.release_date_precision,
      totalTracks: album.total_tracks,
      availableMarketsCount: album.available_markets?.length ?? 0,
      coverArtwork: album.images ?? [],
      explicit: normalizedTracks.some((track) => track.explicit),
      popularity: album.popularity,
      tracklist: normalizedTracks,
      externalIds: album.external_ids ?? {},
    };
  });

  const byReleaseKey = new Map();
  for (const release of normalized) {
    const key = [
      release.normalizedTitle,
      release.releaseDate,
      release.totalTracks,
      release.artists.map(normalizeTitle).sort().join("|"),
    ].join("::");
    const current = byReleaseKey.get(key);
    if (!current || (release.availableMarketsCount ?? 0) > (current.availableMarketsCount ?? 0)) {
      byReleaseKey.set(key, release);
    }
  }

  return [...byReleaseKey.values()].sort((a, b) =>
    `${b.releaseDate}-${b.title}`.localeCompare(`${a.releaseDate}-${a.title}`),
  );
};

const broeyInContext = (spotifyRelease) => {
  const albumArtistMatch = spotifyRelease.artists.some((artist) => normalizeTitle(artist) === "broey");
  const trackArtistMatch = spotifyRelease.tracklist.some((track) =>
    track.artists.some((artist) => normalizeTitle(artist) === "broey"),
  );
  return albumArtistMatch || trackArtistMatch;
};

const matchRelease = (siteRelease, spotifyReleases) => {
  if (neverApplySlugs.has(siteRelease.slug) || siteRelease.isProjectTrack) {
    return undefined;
  }

  const siteTitle = normalizeTitle(siteRelease.title);
  const mappedTitles = new Set([siteTitle, ...(knownSlugTitleMap.get(siteRelease.slug) ?? [])].map(normalizeTitle));
  const siteDate = siteRelease.dspReleaseDate ?? siteRelease.releaseDate ?? siteRelease.originalReleaseDate;

  const candidates = spotifyReleases
    .map((spotifyRelease) => {
      let score = 0;
      const reasons = [];
      const titleMatches = mappedTitles.has(spotifyRelease.normalizedTitle);
      const normalizedTitleMatches = siteTitle === spotifyRelease.normalizedTitle;

      if (siteRelease.slug === "fragments-ep" && spotifyRelease.normalizedTitle === "fragments") {
        score += 45;
        reasons.push("known slug/title mapping");
      } else if (siteRelease.slug === "fragments-remixes" && spotifyRelease.normalizedTitle === "fragments remixes") {
        score += 45;
        reasons.push("known slug/title mapping");
      } else if (titleMatches) {
        score += normalizedTitleMatches ? 45 : 40;
        reasons.push(normalizedTitleMatches ? "normalized title match" : "known slug/title mapping");
      }

      if (broeyInContext(spotifyRelease)) {
        score += 18;
        reasons.push("Broey artist/collaborator context");
      } else {
        score -= 20;
        reasons.push("Broey not found in album or track artists");
      }

      const { points, deltaDays } = dateScore(siteDate, spotifyRelease.releaseDate);
      score += points;
      if (deltaDays !== null) {
        reasons.push(`release date delta ${deltaDays} day(s)`);
      }

      const siteSpotify = releaseSpotifyLink(siteRelease);
      if (siteSpotify?.url?.includes(spotifyRelease.id)) {
        score += 25;
        reasons.push("current site Spotify URL contains Spotify album ID");
      } else if (siteSpotify && !siteSpotify.url.includes(spotifyRelease.id)) {
        score -= 6;
        reasons.push("current site Spotify URL points at a different album ID");
      }

      if (siteRelease.type === "ep" && spotifyRelease.totalTracks > 1) {
        score += 8;
        reasons.push("multi-track EP/project shape");
      }
      if (siteRelease.type === "single" && spotifyRelease.totalTracks <= 3) {
        score += 5;
        reasons.push("single-like track count");
      }

      return {
        spotifyRelease,
        score,
        confidence: confidenceFromScore(score),
        reasons,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score);

  return candidates[0];
};

const collectDiscrepancies = (siteRelease, match) => {
  const discrepancies = [];
  if (!match) return discrepancies;

  const spotifyRelease = match.spotifyRelease;
  const siteSpotify = releaseSpotifyLink(siteRelease);
  if (!siteSpotify) {
    discrepancies.push({
      type: "missing-spotify-link",
      slug: siteRelease.slug,
      title: siteRelease.title,
      spotifyUrl: spotifyRelease.url,
      severity: match.confidence === "High" ? "safe-apply-candidate" : "manual-review",
    });
  } else if (siteSpotify.url !== spotifyRelease.url) {
    discrepancies.push({
      type: "spotify-link-discrepancy",
      slug: siteRelease.slug,
      title: siteRelease.title,
      currentUrl: siteSpotify.url,
      spotifyUrl: spotifyRelease.url,
      severity: siteSpotify.url.includes(spotifyRelease.id) ? "canonical-format-only" : "manual-review",
    });
  }

  const siteDate = siteRelease.dspReleaseDate ?? siteRelease.releaseDate ?? siteRelease.originalReleaseDate;
  const delta = daysBetween(siteDate, spotifyRelease.releaseDate);
  if (delta !== null && delta > 0) {
    discrepancies.push({
      type: "date-discrepancy",
      slug: siteRelease.slug,
      title: siteRelease.title,
      siteDate,
      spotifyDate: spotifyRelease.releaseDate,
      deltaDays: delta,
      note: "Do not overwrite historical/original dates; use dspReleaseDate for Spotify dates.",
    });
  }

  const siteTrackCount = siteRelease.tracklist?.length ?? siteRelease.audio?.tracks?.length;
  if (siteTrackCount && siteTrackCount !== spotifyRelease.totalTracks) {
    discrepancies.push({
      type: "track-count-discrepancy",
      slug: siteRelease.slug,
      title: siteRelease.title,
      siteTrackCount,
      spotifyTrackCount: spotifyRelease.totalTracks,
    });
  }

  return discrepancies;
};

const applyApprovedFields = (source, report) => {
  const beforeAfter = [];
  let updatedSource = source;

  for (const candidate of report.safeApplyCandidates) {
    const match = report.siteMatches.find((item) => item.slug === candidate.slug);
    if (!match || neverApplySlugs.has(candidate.slug)) continue;
    if (!approvedSlugs.has(candidate.slug) || match.confidence !== "High") continue;

    const objectPattern = new RegExp(
      `(\\{\\s*title:\\s*${JSON.stringify(match.siteTitle)}[\\s\\S]*?slug:\\s*${JSON.stringify(candidate.slug)}[\\s\\S]*?links:\\s*\\[)([\\s\\S]*?)(\\n\\s*\\])`,
      "m",
    );
    const objectMatch = updatedSource.match(objectPattern);
    if (!objectMatch) {
      beforeAfter.push({
        slug: candidate.slug,
        applied: false,
        reason: "Could not locate release object safely.",
      });
      continue;
    }

    let changed = false;
    let replacementPrefix = objectMatch[1];
    let replacementLinks = objectMatch[2];
    const releaseBlock = objectMatch[0];

    if (!releaseBlock.includes("dspReleaseDate:")) {
      replacementPrefix = replacementPrefix.replace(
        /(\n\s*(?:releaseDate|displayDate|originalReleaseDate):\s*"[^"]+",)(?![\s\S]*\n\s*dspReleaseDate:)/,
        `$1\n    dspReleaseDate: ${JSON.stringify(match.spotify.releaseDate)},`,
      );
      changed = replacementPrefix !== objectMatch[1] || changed;
    }

    if (!releaseBlock.includes('platform: "Spotify"')) {
      replacementLinks = `\n      link("Spotify", ${JSON.stringify(match.spotify.url)}),${replacementLinks}`;
      changed = true;
    }

    if (!changed) {
      beforeAfter.push({
        slug: candidate.slug,
        applied: false,
        reason: "No safe missing Spotify fields found.",
      });
      continue;
    }

    const replacement = `${replacementPrefix}${replacementLinks}${objectMatch[3]}`;
    updatedSource = updatedSource.replace(objectPattern, replacement);
    beforeAfter.push({
      slug: candidate.slug,
      applied: true,
      fields: ["spotify-link-if-missing", "dspReleaseDate-if-missing"],
    });
  }

  if (updatedSource !== source) {
    fs.writeFileSync(RELEASES_PATH, updatedSource);
  }

  return beforeAfter;
};

const table = (headers, rows) => {
  const header = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.length
    ? rows.map((row) => `| ${row.map((cell) => String(cell ?? "").replace(/\|/g, "\\|")).join(" | ")} |`)
    : [`| ${headers.map(() => "None").join(" | ")} |`];
  return [header, divider, ...body].join("\n");
};

const renderMarkdown = (report) => {
  const high = report.siteMatches.filter((match) => match.confidence === "High");
  const mediumLow = report.siteMatches.filter((match) => ["Medium", "Low"].includes(match.confidence));
  const linkDiscrepancies = report.discrepancies.filter((item) => item.type.includes("spotify-link") || item.type.includes("missing-spotify-link"));
  const dateDiscrepancies = report.discrepancies.filter((item) => item.type === "date-discrepancy");
  const trackDiscrepancies = report.discrepancies.filter((item) => item.type === "track-count-discrepancy");
  const isrcRows = report.siteMatches
    .flatMap((match) =>
      (match.spotify?.tracklist ?? [])
        .filter((track) => track.isrc)
        .map((track) => [match.slug, track.name, track.isrc, "source-backed; not published unless approved"]),
    );

  const freeMatch = report.siteMatches.find((match) => match.slug === "free");
  const ddfMatch = report.siteMatches.find((match) => match.slug === "dancing-dumpster-fire");

  return `# Spotify Catalog Reconciliation

Date: ${REPORT_DATE}

## Executive Summary

Mode: ${report.applyMode ? "apply-approved-spotify-fields" : "report only"}.

Spotify credentials available: ${report.fetchStatus.credentialsAvailable ? "Yes" : "No"}.
Spotify API fetch ran: ${report.fetchStatus.ran ? "Yes" : "No"}.
Spotify releases fetched after dedupe: ${report.spotifyReleases.length}.
High-confidence site matches: ${high.length}.
LiNK remains pending/manual and was not updated.

FREE Spotify finding: ${
    freeMatch?.spotify
      ? `${freeMatch.confidence} match to ${freeMatch.spotify.url}`
      : "No Spotify match found in this run."
  }

Dancing dumpster fire finding: ${
    ddfMatch?.spotify
      ? `${ddfMatch.confidence} match to ${ddfMatch.spotify.url}. Current site URL: ${ddfMatch.siteSpotifyUrl ?? "none"}.`
      : "No Spotify match found in this run."
  }

## Spotify API Fetch Status

${report.fetchStatus.message}

## Number of Spotify Releases Fetched

${report.spotifyReleases.length}

## Current Site Releases Matched

${table(
    ["Slug", "Site title", "Spotify title", "Confidence", "Score", "Spotify URL"],
    report.siteMatches.map((match) => [
      match.slug,
      match.siteTitle,
      match.spotify?.title,
      match.confidence,
      match.score,
      match.spotify?.url,
    ]),
  )}

## Current Site Releases With No Spotify Match

${table(
    ["Slug", "Title", "Reason"],
    report.unmatchedSiteReleases.map((release) => [release.slug, release.title, release.reason]),
  )}

## Spotify Releases Not In Current Website Catalog

${table(
    ["Spotify title", "Artists", "Release date", "URL"],
    report.unmatchedSpotifyReleases.map((release) => [
      release.title,
      release.artists.join(", "),
      release.releaseDate,
      release.url,
    ]),
  )}

## High-Confidence Matches

${table(
    ["Slug", "Spotify title", "Release date", "Reasons"],
    high.map((match) => [
      match.slug,
      match.spotify.title,
      match.spotify.releaseDate,
      match.reasons.join("; "),
    ]),
  )}

## Medium/Low-Confidence Matches

${table(
    ["Slug", "Spotify title", "Confidence", "Reasons"],
    mediumLow.map((match) => [
      match.slug,
      match.spotify.title,
      match.confidence,
      match.reasons.join("; "),
    ]),
  )}

## Link Discrepancies

${table(
    ["Slug", "Type", "Current URL", "Spotify URL", "Severity"],
    linkDiscrepancies.map((item) => [
      item.slug,
      item.type,
      item.currentUrl ?? "",
      item.spotifyUrl,
      item.severity,
    ]),
  )}

## Date Discrepancies

${table(
    ["Slug", "Site date", "Spotify date", "Delta days", "Note"],
    dateDiscrepancies.map((item) => [
      item.slug,
      item.siteDate,
      item.spotifyDate,
      item.deltaDays,
      item.note,
    ]),
  )}

## Tracklist/Duration Differences

${table(
    ["Slug", "Site track count", "Spotify track count"],
    trackDiscrepancies.map((item) => [item.slug, item.siteTrackCount, item.spotifyTrackCount]),
  )}

## ISRCs Found

${table(["Slug", "Track", "ISRC", "Publication status"], isrcRows)}

## Recommended Safe Apply List

${table(
    ["Slug", "Fields", "Reason"],
    report.safeApplyCandidates.map((candidate) => [
      candidate.slug,
      candidate.fields.join(", "),
      candidate.reason,
    ]),
  )}

## Items Requiring Manual Review

${table(
    ["Slug/Spotify ID", "Issue", "Note"],
    report.manualReviewItems.map((item) => [item.subject, item.issue, item.note]),
  )}

## LiNK Remains Pending/Manual

LiNK was intentionally excluded from Spotify alignment because it is not released on Spotify yet.

## Apply Summary

${report.applyMode ? JSON.stringify(report.applySummary, null, 2) : "Apply mode was not used."}
`;
};

const main = async () => {
  loadDotEnv(".env.local");
  const fetchedAt = new Date().toISOString();
  const siteReleases = loadSiteReleases();
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const report = {
    fetchedAt,
    artistId: ARTIST_ID,
    artistName: ARTIST_NAME,
    applyMode,
    fetchStatus: {
      credentialsAvailable: Boolean(clientId && clientSecret),
      ran: false,
      message: "",
    },
    spotifyReleases: [],
    siteMatches: [],
    unmatchedSiteReleases: [],
    unmatchedSpotifyReleases: [],
    discrepancies: [],
    safeApplyCandidates: [],
    manualReviewItems: [],
    applySummary: [],
  };

  if (!clientId || !clientSecret) {
    report.fetchStatus.message =
      "Skipped live Spotify API fetch because SPOTIFY_CLIENT_ID and/or SPOTIFY_CLIENT_SECRET were not available. The script/report framework was created and Spotify variables were documented in .env.local.example.";
    report.unmatchedSiteReleases = siteReleases
      .filter((release) => !release.isProjectTrack)
      .map((release) => ({
        slug: release.slug,
        title: release.title,
        reason: release.slug === "link" ? "LiNK remains pending/manual." : "Spotify API fetch did not run.",
      }));
    report.manualReviewItems = [
      {
        subject: "Spotify API credentials",
        issue: "live fetch not run",
        note: "Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET locally, then rerun the reconciliation script.",
      },
      {
        subject: "link",
        issue: "pending/manual",
        note: "LiNK is intentionally not aligned to Spotify.",
      },
    ];
    writeJson(REPORT_JSON, report);
    writeText(REPORT_MD, renderMarkdown(report));
    console.log(`Spotify reconciliation skipped: missing credentials.`);
    console.log(`Wrote ${REPORT_JSON}`);
    console.log(`Wrote ${REPORT_MD}`);
    return;
  }

  try {
    const token = await requestSpotifyToken(clientId, clientSecret);
    const simplifiedAlbums = await fetchAllArtistAlbums(token);
    const spotifyReleases = await normalizeSpotifyCatalog(token, simplifiedAlbums);
    report.spotifyReleases = spotifyReleases;
    report.fetchStatus.ran = true;
    report.fetchStatus.message =
      `Fetched ${simplifiedAlbums.length} Spotify album items and normalized ${spotifyReleases.length} deduplicated releases.`;

    const matchedSpotifyIds = new Set();
    const siteCandidates = siteReleases.filter((release) => !release.isProjectTrack);

    for (const release of siteCandidates) {
      const result = matchRelease(release, spotifyReleases);

      if (!result || result.confidence === "None") {
        report.unmatchedSiteReleases.push({
          slug: release.slug,
          title: release.title,
          reason: release.slug === "link" ? "LiNK remains pending/manual." : "No confident Spotify catalog match.",
        });
        continue;
      }

      matchedSpotifyIds.add(result.spotifyRelease.id);
      const siteSpotify = releaseSpotifyLink(release);
      const match = {
        slug: release.slug,
        siteTitle: release.title,
        siteType: release.type,
        siteReleaseDate: release.releaseDate,
        siteDspReleaseDate: release.dspReleaseDate,
        siteSpotifyUrl: siteSpotify?.url,
        spotify: result.spotifyRelease,
        confidence: result.confidence,
        score: result.score,
        reasons: result.reasons,
      };
      report.siteMatches.push(match);
      report.discrepancies.push(...collectDiscrepancies(release, result));

      const safeFields = [];
      if (!siteSpotify) safeFields.push("Spotify link URL");
      if (!release.dspReleaseDate && result.spotifyRelease.releaseDate) safeFields.push("dspReleaseDate");
      if (
        approvedSlugs.has(release.slug) &&
        result.confidence === "High" &&
        safeFields.length > 0 &&
        release.slug !== "link"
      ) {
        report.safeApplyCandidates.push({
          slug: release.slug,
          fields: safeFields,
          reason: "High-confidence approved release with missing source-backed Spotify-safe field(s).",
        });
      }
    }

    report.unmatchedSpotifyReleases = spotifyReleases.filter((release) => !matchedSpotifyIds.has(release.id));
    report.manualReviewItems = [
      ...report.siteMatches
        .filter((match) => match.confidence !== "High")
        .map((match) => ({
          subject: match.slug,
          issue: `${match.confidence} confidence match`,
          note: match.reasons.join("; "),
        })),
      ...report.discrepancies
        .filter((item) => item.severity === "manual-review" || item.type === "date-discrepancy")
        .map((item) => ({
          subject: item.slug,
          issue: item.type,
          note: item.note ?? item.spotifyUrl ?? "",
        })),
      {
        subject: "link",
        issue: "pending/manual",
        note: "LiNK is intentionally not aligned to Spotify.",
      },
    ];

    if (applyMode) {
      report.applySummary = applyApprovedFields(readText(RELEASES_PATH), report);
    }

    writeJson(REPORT_JSON, report);
    writeText(REPORT_MD, renderMarkdown(report));
    console.log(`Spotify releases fetched: ${report.spotifyReleases.length}`);
    console.log(`High-confidence matches: ${report.siteMatches.filter((match) => match.confidence === "High").length}`);
    console.log(`Wrote ${REPORT_JSON}`);
    console.log(`Wrote ${REPORT_MD}`);
  } catch (error) {
    report.fetchStatus.message = error instanceof Error ? error.message : String(error);
    report.manualReviewItems.push({
      subject: "Spotify API",
      issue: "fetch failed",
      note: report.fetchStatus.message,
    });
    writeJson(REPORT_JSON, report);
    writeText(REPORT_MD, renderMarkdown(report));
    console.error(report.fetchStatus.message);
    process.exitCode = 1;
  }
};

main();
