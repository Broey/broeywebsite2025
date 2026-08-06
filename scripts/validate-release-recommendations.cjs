const fs = require("fs");
const path = require("path");
const Module = require("module");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveProjectAlias(request, parent, isMain, options) {
  const resolvedRequest = request.startsWith("@/")
    ? path.join(projectRoot, request.slice(2))
    : request;

  return originalResolveFilename.call(this, resolvedRequest, parent, isMain, options);
};

require.extensions[".ts"] = function transpileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const { curatedGenreFiltersForRelease, normalizedGenres } = require("../content/genres.ts");
const { showReleaseInArchive } = require("../content/release-filters.ts");
const {
  catalogSectionForRelease,
  eligibleRecommendationCandidates,
  isEligibleRecommendationCandidate,
  recommendationParentKey,
  recommendReleases,
  releaseEraForRecommendation,
  releaseFormForRecommendation,
} = require("../content/release-recommendations.ts");
const { releases } = require("../content/releases.ts");

const dates = ["2026-08-05", "2026-08-06", "2026-09-05"];
const matrixDate = dates[0];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const sharedValues = (left, right) => {
  const rightValues = new Set(right.map((value) => value.toLowerCase()));
  return left.filter((value) => rightValues.has(value.toLowerCase()));
};

const recommendationSlugs = (set) =>
  set.recommendations.map((recommendation) => recommendation.release.slug);

const parentKeys = (set) =>
  set.recommendations.map((recommendation) => recommendationParentKey(recommendation.release));

const sameStableSlots = (left, right) =>
  left.recommendations[0]?.release.slug === right.recommendations[0]?.release.slug &&
  left.recommendations[1]?.release.slug === right.recommendations[1]?.release.slug;

const sourceFacts = (release) => ({
  catalogSection: catalogSectionForRelease(release),
  era: releaseEraForRecommendation(release),
  form: releaseFormForRecommendation(release),
  genres: normalizedGenres(release),
  curatedGenres: curatedGenreFiltersForRelease(release),
  parent: release.parentReleaseSlug ?? null,
});

const eligible = eligibleRecommendationCandidates(releases);
assert(eligible.length >= 3, "The catalog must contain at least three eligible candidates.");

const exposureCounts = Object.fromEntries(eligible.map((release) => [release.slug, 0]));
const matrix = [];
const repeatedSets = new Map();
const unmappedGenres = [];

for (const source of releases) {
  const first = recommendReleases(source, releases, { date: matrixDate });
  const repeat = recommendReleases(source, releases, { date: matrixDate });
  const serialized = JSON.stringify(first);
  const slugs = recommendationSlugs(first);
  const uniqueSlugs = new Set(slugs);
  const parents = parentKeys(first);

  assert(serialized === JSON.stringify(repeat), `${source.slug}: same-date output changed.`);
  assert(JSON.stringify(JSON.parse(serialized)) === serialized, `${source.slug}: serialization changed output.`);
  assert(first.recommendations.length === 3, `${source.slug}: expected exactly three recommendations.`);
  assert(uniqueSlugs.size === 3, `${source.slug}: recommendation slugs are not unique.`);
  assert(!uniqueSlugs.has(source.slug), `${source.slug}: self-recommendation detected.`);
  assert(new Set(parents).size === parents.length, `${source.slug}: duplicate parent projects detected.`);

  for (const recommendation of first.recommendations) {
    assert(
      isEligibleRecommendationCandidate(recommendation.release),
      `${source.slug}: ineligible recommendation ${recommendation.release.slug}.`,
    );
    assert(
      showReleaseInArchive(recommendation.release),
      `${source.slug}: non-public-collection recommendation ${recommendation.release.slug}.`,
    );
    exposureCounts[recommendation.release.slug] += 1;
  }

  const closest = first.recommendations[0]?.release;
  const sourceDetailed = normalizedGenres(source);
  const sourceCurated = curatedGenreFiltersForRelease(source);
  const candidatesWithGenreAffinity = eligible.filter(
    (candidate) =>
      candidate.slug !== source.slug &&
      (sharedValues(sourceDetailed, normalizedGenres(candidate)).length > 0 ||
        sharedValues(sourceCurated, curatedGenreFiltersForRelease(candidate)).length > 0),
  );

  if (candidatesWithGenreAffinity.length) {
    const closestHasAffinity =
      sharedValues(sourceDetailed, normalizedGenres(closest)).length > 0 ||
      sharedValues(sourceCurated, curatedGenreFiltersForRelease(closest)).length > 0;
    assert(closestHasAffinity, `${source.slug}: closest slot missed an available genre relationship.`);
  } else if (!sourceDetailed.length) {
    unmappedGenres.push(source.slug);
  }

  const bridge = first.recommendations[1]?.release;
  const bridgeDifferences = [
    catalogSectionForRelease(source) !== catalogSectionForRelease(bridge),
    releaseEraForRecommendation(source) !== releaseEraForRecommendation(bridge),
    releaseFormForRecommendation(source) !== releaseFormForRecommendation(bridge),
    curatedGenreFiltersForRelease(source)[0] !== curatedGenreFiltersForRelease(bridge)[0],
    source.type !== bridge.type,
  ];
  assert(bridgeDifferences.some(Boolean), `${source.slug}: bridge has no catalog-lane difference.`);

  const datedSets = dates.map((date) => recommendReleases(source, releases, { date }));
  assert(
    datedSets.every((set) => sameStableSlots(first, set)),
    `${source.slug}: closest or bridge changed across dates.`,
  );
  assert(
    new Set(datedSets.map((set) => set.recommendations[2]?.release.slug)).size > 1,
    `${source.slug}: discovery did not rotate across the three validation dates.`,
  );
  assert(
    datedSets.every((set) => new Set(recommendationSlugs(set)).size === 3),
    `${source.slug}: a dated set contains duplicates.`,
  );

  const setKey = slugs.join("|");
  repeatedSets.set(setKey, [...(repeatedSets.get(setKey) ?? []), source.slug]);
  matrix.push({
    sourceSlug: source.slug,
    sourceFacts: sourceFacts(source),
    dateKey: first.dateKey,
    recommendations: first.recommendations.map((recommendation) => ({
      slot: recommendation.slot,
      slug: recommendation.release.slug,
      reason: recommendation.reason,
      score: recommendation.score,
      breakdown: recommendation.breakdown,
      seed: recommendation.seed ?? null,
      parent: recommendation.release.parentReleaseSlug ?? null,
      manualOverride: recommendation.manualOverride,
    })),
    candidateScores: first.candidateScores,
    overrideIssues: first.overrideIssues,
    unique: uniqueSlugs.size === first.recommendations.length,
    rotation: datedSets.map((set) => ({
      date: set.dateKey,
      closest: set.recommendations[0]?.release.slug,
      bridge: set.recommendations[1]?.release.slug,
      discovery: set.recommendations[2]?.release.slug,
      seed: set.recommendations[2]?.seed,
    })),
  });
}

const maximumExposure = Math.max(...Object.values(exposureCounts));
assert(
  maximumExposure <= Math.ceil(releases.length * 0.4),
  `A release dominates the matrix with ${maximumExposure}/${releases.length} source pages.`,
);

const validOverrideSlug = eligible[0].slug;
const ineligibleOverride = {
  ...eligible[1],
  slug: "synthetic-draft-release",
  visibility: "draft",
};
const invalidOverrideSource = {
  ...releases.find((release) => release.slug !== validOverrideSlug),
  recommendedSlugs: [
    validOverrideSlug,
    validOverrideSlug,
    "missing-release",
    "synthetic-draft-release",
    validOverrideSlug,
  ],
};
invalidOverrideSource.recommendedSlugs.push(invalidOverrideSource.slug);
const invalidOverrideResult = recommendReleases(
  invalidOverrideSource,
  [...releases, ineligibleOverride],
  { date: matrixDate },
);
assert(
  invalidOverrideResult.overrideIssues.some((issue) => issue.reason === "duplicate") &&
    invalidOverrideResult.overrideIssues.some((issue) => issue.reason === "missing") &&
    invalidOverrideResult.overrideIssues.some((issue) => issue.reason === "ineligible") &&
    invalidOverrideResult.overrideIssues.some((issue) => issue.reason === "self"),
  "Owner override validation did not report duplicate, missing, ineligible, and self references.",
);

const report = {
  matrixDate,
  dates,
  sourcePageCount: releases.length,
  eligibleCandidateCount: eligible.length,
  eligibleCandidateSlugs: eligible.map((release) => release.slug),
  matrix,
  exposureCounts: Object.entries(exposureCounts)
    .map(([slug, count]) => ({ slug, count }))
    .sort((left, right) => right.count - left.count || left.slug.localeCompare(right.slug)),
  repeatedSets: [...repeatedSets.entries()]
    .filter(([, sourceSlugs]) => sourceSlugs.length > 1)
    .map(([set, sourceSlugs]) => ({ set: set.split("|"), sourceSlugs })),
  unmappedGenres,
  invalidOverrideIssues: invalidOverrideResult.overrideIssues,
  checks: {
    exactThree: true,
    uniqueSlugs: true,
    noSelfRecommendations: true,
    noDuplicateParents: true,
    noDraftOrHiddenLeakage: true,
    sameDateStable: true,
    serializedOutputStable: true,
    stableClosestAndBridgeAcrossDates: true,
    discoveryChangesAcrossDates: true,
    ownerOverrideValidation: true,
    exposureLimit: `<= 40% of ${releases.length} source pages`,
  },
};

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log(`Validated ${releases.length} source pages and ${eligible.length} eligible candidates.`);
  console.log(`Dates: ${dates.join(", ")}`);
  console.log(`Maximum exposure: ${maximumExposure}/${releases.length} source pages.`);
  console.log(`Repeated complete sets: ${report.repeatedSets.length}.`);
  console.log(`Unmapped source genres: ${unmappedGenres.join(", ") || "none"}.`);
}
