import {
  curatedGenreFiltersForRelease,
  normalizedGenres,
} from "@/content/genres";
import { showReleaseInArchive } from "@/content/release-filters";
import type { ReleaseEntry } from "@/content/releases";
import { hasApprovedPublicArtwork } from "@/lib/release-artwork";

export const recommendationWeights = {
  sharedDetailedGenre: 18,
  sharedCuratedGenre: 7,
  exactReleaseType: 5,
  compatibleReleaseForm: 3,
  sameReleaseEra: 3,
  sameParentProject: 6,
  differentCatalogSection: 18,
  differentReleaseEra: 12,
  differentPrimaryGenre: 12,
  differentReleaseType: 5,
  differentReleaseForm: 8,
  noSharedDetailedGenre: 4,
  differentFromClosestPrimaryGenre: 6,
  differentFromClosestType: 3,
  differentFromClosestSection: 3,
  localAudio: 2,
  ownerPriorityMultiplier: 2,
} as const;

// Bridge candidates within this distance of the best factual score are all
// considered strong enough; a stable source/candidate hash distributes those
// equally purposeful bridges across the catalog.
export const bridgeScoreTolerance = 12;

export type RecommendationSlot = "closest" | "bridge" | "discovery";
export type CatalogSection = "selected-catalog" | "faster-forms" | "foundations" | "undated";
export type ReleaseEra = "current" | "fragments" | "transition" | "foundations" | "undated";
export type ReleaseForm = "project" | "track" | "single";

export type RecommendationScore = {
  slug: string;
  score: number;
  breakdown: Record<string, number>;
};

export type ReleaseRecommendation = {
  slot: RecommendationSlot;
  release: ReleaseEntry;
  reason: string;
  score: number;
  breakdown: Record<string, number>;
  manualOverride: boolean;
  seed?: string;
};

export type RecommendationOverrideIssue = {
  sourceSlug: string;
  requestedSlug: string;
  reason: "duplicate" | "missing" | "self" | "ineligible";
};

export type RecommendationSet = {
  dateKey: string;
  recommendations: ReleaseRecommendation[];
  candidateScores: Record<RecommendationSlot, RecommendationScore[]>;
  overrideIssues: RecommendationOverrideIssue[];
  eligibleCandidateSlugs: string[];
};

type RecommendationOptions = {
  date?: Date | string;
};

const explicitlyExcludedSlugs = new Set(["watch", "link", "paradise"]);

const stableHash = (value: string) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const stableReleaseId = (release: ReleaseEntry) =>
  `${release.slug}@${release.releaseDate ?? release.year ?? "undated"}`;

const releaseYear = (release: ReleaseEntry) =>
  release.year ?? (Number(release.releaseDate?.slice(0, 4)) || undefined);

export const catalogSectionForRelease = (release: ReleaseEntry): CatalogSection => {
  const year = releaseYear(release);

  if (!year) return "undated";
  if (year >= 2024) return "selected-catalog";
  if (year >= 2022) return "faster-forms";
  return "foundations";
};

export const releaseEraForRecommendation = (release: ReleaseEntry): ReleaseEra => {
  const year = releaseYear(release);

  if (!year) return "undated";
  if (year >= 2025) return "current";
  if (year === 2024) return "fragments";
  if (year >= 2022) return "transition";
  return "foundations";
};

export const releaseFormForRecommendation = (release: ReleaseEntry): ReleaseForm => {
  if (release.isProjectTrack) return "track";

  const registryType = release.registry?.releaseTypeDisplay?.toLowerCase();
  const isProject =
    ["ep", "album", "mix", "set"].includes(registryType ?? "") ||
    ["ep", "mix", "set"].includes(release.type) ||
    release.catalogSource?.collectionType === "EP" ||
    (release.audio?.type === "project" && release.audio.tracks.length > 1);

  return isProject ? "project" : "single";
};

export const recommendationParentKey = (release: ReleaseEntry) =>
  release.parentReleaseSlug ?? release.slug;

const sameProjectFamily = (left: ReleaseEntry, right: ReleaseEntry) =>
  recommendationParentKey(left) === recommendationParentKey(right);

const ownerPriorityScore = (release: ReleaseEntry) =>
  Math.max(-5, Math.min(5, release.recommendationPriority ?? 0)) *
  recommendationWeights.ownerPriorityMultiplier;

const hasLocalAudio = (release: ReleaseEntry) => Boolean(release.audio?.tracks.length);

export const isEligibleRecommendationCandidate = (release: ReleaseEntry) =>
  Boolean(
    release.slug &&
      release.visibility !== "draft" &&
      release.catalogStatus !== "draft" &&
      !explicitlyExcludedSlugs.has(release.slug) &&
      showReleaseInArchive(release) &&
      !release.excludeFromRecommendations &&
      hasApprovedPublicArtwork(release.coverImage),
  );

export const eligibleRecommendationCandidates = (releaseList: readonly ReleaseEntry[]) =>
  releaseList
    .filter(isEligibleRecommendationCandidate)
    .sort((left, right) => stableReleaseId(left).localeCompare(stableReleaseId(right)));

const sharedValues = (left: readonly string[], right: readonly string[]) => {
  const rightValues = new Set(right.map((value) => value.toLowerCase()));
  return left.filter((value) => rightValues.has(value.toLowerCase()));
};

const primaryGenre = (release: ReleaseEntry) =>
  curatedGenreFiltersForRelease(release)[0] ?? normalizedGenres(release)[0] ?? "Unmapped";

const addScore = (
  breakdown: Record<string, number>,
  key: string,
  score: number,
) => {
  if (score) breakdown[key] = score;
};

const totalScore = (breakdown: Record<string, number>) =>
  Object.values(breakdown).reduce((total, value) => total + value, 0);

const commonBreakdown = (candidate: ReleaseEntry) => {
  const breakdown: Record<string, number> = {};
  addScore(
    breakdown,
    "localAudio",
    hasLocalAudio(candidate) ? recommendationWeights.localAudio : 0,
  );
  addScore(breakdown, "ownerPriority", ownerPriorityScore(candidate));
  return breakdown;
};

const closestScore = (source: ReleaseEntry, candidate: ReleaseEntry): RecommendationScore => {
  const sharedDetailed = sharedValues(normalizedGenres(source), normalizedGenres(candidate));
  const sharedCurated = sharedValues(
    curatedGenreFiltersForRelease(source),
    curatedGenreFiltersForRelease(candidate),
  );
  const sourceForm = releaseFormForRecommendation(source);
  const candidateForm = releaseFormForRecommendation(candidate);
  const breakdown = commonBreakdown(candidate);

  addScore(
    breakdown,
    "sharedDetailedGenre",
    Math.min(sharedDetailed.length, 3) * recommendationWeights.sharedDetailedGenre,
  );
  addScore(
    breakdown,
    "sharedCuratedGenre",
    Math.min(sharedCurated.length, 3) * recommendationWeights.sharedCuratedGenre,
  );
  addScore(
    breakdown,
    "releaseType",
    source.type === candidate.type
      ? recommendationWeights.exactReleaseType
      : sourceForm === candidateForm
        ? recommendationWeights.compatibleReleaseForm
        : 0,
  );
  addScore(
    breakdown,
    "sameReleaseEra",
    releaseEraForRecommendation(source) === releaseEraForRecommendation(candidate)
      ? recommendationWeights.sameReleaseEra
      : 0,
  );
  addScore(
    breakdown,
    "sameParentProject",
    sameProjectFamily(source, candidate) ? recommendationWeights.sameParentProject : 0,
  );

  return { slug: candidate.slug, score: totalScore(breakdown), breakdown };
};

const bridgeScore = (
  source: ReleaseEntry,
  candidate: ReleaseEntry,
  closest?: ReleaseEntry,
): RecommendationScore => {
  const sourceGenres = normalizedGenres(source);
  const candidateGenres = normalizedGenres(candidate);
  const sourceForm = releaseFormForRecommendation(source);
  const candidateForm = releaseFormForRecommendation(candidate);
  const sourceSection = catalogSectionForRelease(source);
  const candidateSection = catalogSectionForRelease(candidate);
  const sourceEra = releaseEraForRecommendation(source);
  const candidateEra = releaseEraForRecommendation(candidate);
  const breakdown = commonBreakdown(candidate);

  addScore(
    breakdown,
    "differentCatalogSection",
    sourceSection !== candidateSection ? recommendationWeights.differentCatalogSection : 0,
  );
  addScore(
    breakdown,
    "differentReleaseEra",
    sourceEra !== candidateEra ? recommendationWeights.differentReleaseEra : 0,
  );
  addScore(
    breakdown,
    "differentPrimaryGenre",
    primaryGenre(source) !== primaryGenre(candidate)
      ? recommendationWeights.differentPrimaryGenre
      : 0,
  );
  addScore(
    breakdown,
    "differentReleaseType",
    source.type !== candidate.type ? recommendationWeights.differentReleaseType : 0,
  );
  addScore(
    breakdown,
    "differentReleaseForm",
    sourceForm !== candidateForm ? recommendationWeights.differentReleaseForm : 0,
  );
  addScore(
    breakdown,
    "noSharedDetailedGenre",
    sharedValues(sourceGenres, candidateGenres).length === 0
      ? recommendationWeights.noSharedDetailedGenre
      : 0,
  );

  if (closest) {
    addScore(
      breakdown,
      "differentFromClosestPrimaryGenre",
      primaryGenre(closest) !== primaryGenre(candidate)
        ? recommendationWeights.differentFromClosestPrimaryGenre
        : 0,
    );
    addScore(
      breakdown,
      "differentFromClosestType",
      closest.type !== candidate.type ? recommendationWeights.differentFromClosestType : 0,
    );
    addScore(
      breakdown,
      "differentFromClosestSection",
      catalogSectionForRelease(closest) !== candidateSection
        ? recommendationWeights.differentFromClosestSection
        : 0,
    );
  }

  return { slug: candidate.slug, score: totalScore(breakdown), breakdown };
};

export const recommendationDateKey = (date: Date | string = new Date()) => {
  if (typeof date === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Recommendation date must use YYYY-MM-DD: ${date}`);
    }

    return date;
  }

  if (Number.isNaN(date.getTime())) {
    throw new Error("Recommendation date is invalid.");
  }

  return date.toISOString().slice(0, 10);
};

const discoveryScores = (
  source: ReleaseEntry,
  candidates: readonly ReleaseEntry[],
  dateKey: string,
) => {
  const candidateIds = candidates.map(stableReleaseId).sort();
  const baseSeed = `${source.slug}|${dateKey}|${candidateIds.join(",")}`;

  return {
    seed: `${dateKey}:${stableHash(baseSeed).toString(16).padStart(8, "0")}`,
    scores: candidates.map((candidate) => {
      const breakdown = commonBreakdown(candidate);
      addScore(
        breakdown,
        "seededRotation",
        Number(((stableHash(`${baseSeed}|${stableReleaseId(candidate)}`) / 0xffffffff) * 100).toFixed(6)),
      );
      return {
        slug: candidate.slug,
        score: totalScore(breakdown),
        breakdown,
      };
    }),
  };
};

const stableScoreSort = (sourceSlug: string) =>
  (left: RecommendationScore, right: RecommendationScore) =>
    right.score - left.score ||
    stableHash(`${sourceSlug}|${left.slug}`) - stableHash(`${sourceSlug}|${right.slug}`) ||
    left.slug.localeCompare(right.slug);

const automaticCandidateForSlot = (
  slot: RecommendationSlot,
  source: ReleaseEntry,
  pool: readonly ReleaseEntry[],
  sortedScores: readonly RecommendationScore[],
) => {
  if (slot !== "bridge") {
    return pool.find((candidate) => candidate.slug === sortedScores[0]?.slug);
  }

  const topScore = sortedScores[0]?.score;
  const strongBridgeSlugs = new Set(
    sortedScores
      .filter((score) => topScore !== undefined && score.score >= topScore - bridgeScoreTolerance)
      .map((score) => score.slug),
  );

  return [...pool]
    .filter((candidate) => strongBridgeSlugs.has(candidate.slug))
    .sort(
      (left, right) =>
        stableHash(`${source.slug}|bridge|${left.slug}`) -
          stableHash(`${source.slug}|bridge|${right.slug}`) ||
        left.slug.localeCompare(right.slug),
    )[0];
};

const resolvedManualOverrides = (
  source: ReleaseEntry,
  allReleases: readonly ReleaseEntry[],
  eligibleCandidates: readonly ReleaseEntry[],
) => {
  const allBySlug = new Map(allReleases.map((release) => [release.slug, release]));
  const eligibleBySlug = new Map(eligibleCandidates.map((release) => [release.slug, release]));
  const issues: RecommendationOverrideIssue[] = [];
  const seen = new Set<string>();
  const overrides: ReleaseEntry[] = [];

  for (const requestedSlug of source.recommendedSlugs ?? []) {
    let reason: RecommendationOverrideIssue["reason"] | undefined;

    if (seen.has(requestedSlug)) reason = "duplicate";
    else if (requestedSlug === source.slug) reason = "self";
    else if (!allBySlug.has(requestedSlug)) reason = "missing";
    else if (!eligibleBySlug.has(requestedSlug)) reason = "ineligible";

    seen.add(requestedSlug);

    if (reason) {
      issues.push({ sourceSlug: source.slug, requestedSlug, reason });
      continue;
    }

    const release = eligibleBySlug.get(requestedSlug);
    if (release) overrides.push(release);
  }

  return { overrides: overrides.slice(0, 3), issues };
};

const candidatePoolForSlot = (
  candidates: readonly ReleaseEntry[],
  selected: readonly ReleaseEntry[],
) => {
  const selectedSlugs = new Set(selected.map((release) => release.slug));
  const selectedParents = new Set(selected.map(recommendationParentKey));
  const remaining = candidates.filter((candidate) => !selectedSlugs.has(candidate.slug));
  const diverseParents = remaining.filter(
    (candidate) => !selectedParents.has(recommendationParentKey(candidate)),
  );

  return diverseParents.length ? diverseParents : remaining;
};

const automaticReason = (
  slot: RecommendationSlot,
  source: ReleaseEntry,
  candidate: ReleaseEntry,
  dateKey: string,
  seed?: string,
) => {
  if (slot === "closest") {
    const detailed = sharedValues(normalizedGenres(source), normalizedGenres(candidate));
    const curated = sharedValues(
      curatedGenreFiltersForRelease(source),
      curatedGenreFiltersForRelease(candidate),
    );

    if (detailed.length) return `Shared detailed genre: ${detailed.join(", ")}.`;
    if (curated.length) return `Shared curated genre family: ${curated.join(", ")}.`;
    return `Closest factual match by release form, type, and era.`;
  }

  if (slot === "bridge") {
    const differences = [
      catalogSectionForRelease(source) !== catalogSectionForRelease(candidate)
        ? `catalog section (${catalogSectionForRelease(candidate)})`
        : undefined,
      releaseEraForRecommendation(source) !== releaseEraForRecommendation(candidate)
        ? `era (${releaseEraForRecommendation(candidate)})`
        : undefined,
      primaryGenre(source) !== primaryGenre(candidate)
        ? `primary genre (${primaryGenre(candidate)})`
        : undefined,
      releaseFormForRecommendation(source) !== releaseFormForRecommendation(candidate)
        ? `form (${releaseFormForRecommendation(candidate)})`
        : undefined,
    ].filter((value): value is string => Boolean(value));

    return `Catalog bridge via ${differences.join(", ") || "the strongest available catalog contrast"}.`;
  }

  return `Deterministic discovery for ${dateKey}; seed ${seed}.`;
};

export function recommendReleases(
  source: ReleaseEntry,
  allReleases: readonly ReleaseEntry[],
  options: RecommendationOptions = {},
): RecommendationSet {
  const dateKey = recommendationDateKey(options.date);
  const eligible = eligibleRecommendationCandidates(allReleases).filter(
    (candidate) => candidate.slug !== source.slug,
  );
  const { overrides, issues } = resolvedManualOverrides(source, allReleases, eligible);
  const selected: ReleaseEntry[] = [];
  const recommendations: ReleaseRecommendation[] = [];
  const candidateScores: RecommendationSet["candidateScores"] = {
    closest: [],
    bridge: [],
    discovery: [],
  };
  const slots: RecommendationSlot[] = ["closest", "bridge", "discovery"];

  for (const slot of slots) {
    const manual = overrides.find((candidate) => !selected.some((item) => item.slug === candidate.slug));
    const pool = candidatePoolForSlot(eligible, selected);
    const closest = recommendations.find((item) => item.slot === "closest")?.release;
    const discovery = discoveryScores(source, pool, dateKey);
    const scores =
      slot === "closest"
        ? pool.map((candidate) => closestScore(source, candidate))
        : slot === "bridge"
          ? pool.map((candidate) => bridgeScore(source, candidate, closest))
          : discovery.scores;
    const sortedScores = scores.sort(stableScoreSort(source.slug));
    candidateScores[slot] = sortedScores;
    const automatic = automaticCandidateForSlot(slot, source, pool, sortedScores);
    const candidate = manual ?? automatic;

    if (!candidate) continue;

    const selectedScore = sortedScores.find((score) => score.slug === candidate.slug) ?? {
      slug: candidate.slug,
      score: 0,
      breakdown: {},
    };
    const seed = slot === "discovery" ? discovery.seed : undefined;

    selected.push(candidate);
    recommendations.push({
      slot,
      release: candidate,
      reason: manual
        ? `Owner-approved manual recommendation for ${source.slug}.`
        : automaticReason(slot, source, candidate, dateKey, seed),
      score: selectedScore.score,
      breakdown: selectedScore.breakdown,
      manualOverride: Boolean(manual),
      seed,
    });
  }

  return {
    dateKey,
    recommendations,
    candidateScores,
    overrideIssues: issues,
    eligibleCandidateSlugs: eligible.map((candidate) => candidate.slug),
  };
}
