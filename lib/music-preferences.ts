// Browser-local, deliberately coarse music preferences. No analytics dependency.
export const MUSIC_PREFERENCES_KEY = "broey-music-preferences";
export const RETENTION_DAYS = 90;
export const MAX_INTEREST = 12;
export const MAX_RECENT = 12;
export const genreIds = ["house", "drum-and-bass", "jungle", "dubstep", "garage", "breakbeat", "electronic"] as const;
export type GenreId = (typeof genreIds)[number];
export const genreId = (label: string): GenreId | undefined => {
  const id = label.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
  return genreIds.find((genre) => genre === id);
};
export const preferenceDay = (now = Date.now()) => Math.floor(now / 86400000);
type Interest = { score: number; day: number };
export type MusicPreferences = {
  version: 1;
  enabled: boolean;
  updatedDay: number;
  interests: Partial<Record<GenreId, Interest>>;
  recent: { slug: string; day: number }[];
};
export type PreferenceRelease = { slug: string; family: string; genres: readonly GenreId[] };
export const emptyPreferences = (day = preferenceDay(), enabled = false): MusicPreferences => ({
  version: 1, enabled, updatedDay: day, interests: {}, recent: [],
});
const validDay = (value: unknown, day: number): value is number =>
  Number.isInteger(value) && (value as number) <= day && (value as number) > day - RETENTION_DAYS;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const decayedInterest = (interest: Interest | undefined, day: number) =>
  interest && validDay(interest.day, day)
    ? Math.min(MAX_INTEREST, Math.max(0, interest.score)) * 2 ** (-(day - interest.day) / 30) : 0;

// Unknown versions and malformed consent reset closed. Whitelist fields on read.
export function parsePreferences(raw: string | null, day = preferenceDay()): MusicPreferences {
  const empty = emptyPreferences(day);
  if (!raw || raw.length > 8192) return empty;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || value.enabled !== true || !validDay(value.updatedDay, day)
      || !value.interests || typeof value.interests !== "object" || !Array.isArray(value.recent)) return empty;
    const interests: MusicPreferences["interests"] = {};
    for (const genre of genreIds) {
      const entry = value.interests[genre];
      if (entry && Number.isFinite(entry.score) && entry.score > 0 && validDay(entry.day, day)) {
        interests[genre] = { score: Math.min(MAX_INTEREST, entry.score), day: entry.day };
      }
    }
    const seen = new Set<string>();
    const recent: MusicPreferences["recent"] = [];
    for (const entry of value.recent.slice(0, 100)) {
      if (typeof entry?.slug !== "string" || entry.slug.length > 120 || !slugPattern.test(entry.slug)
        || !validDay(entry.day, day) || seen.has(entry.slug)) continue;
      seen.add(entry.slug);
      recent.push({ slug: entry.slug, day: entry.day });
      if (recent.length === MAX_RECENT) break;
    }
    return { version: 1, enabled: true, updatedDay: value.updatedDay, interests, recent };
  } catch { return empty; }
}

export function recentReleases(profile: MusicPreferences, catalog: readonly PreferenceRelease[], day = preferenceDay(), limit = 6) {
  if (!profile.enabled || !validDay(profile.updatedDay, day)) return [];
  const seen = new Set<string>();
  return profile.recent.flatMap((entry) => {
    const release = catalog.find((item) => item.slug === entry.slug);
    if (!release || !validDay(entry.day, day) || seen.has(release.family)) return [];
    seen.add(release.family);
    return [release];
  }).slice(0, limit);
}

// One returning-listener choice, distinct from the editorial focus and its family.
export function lastPlayedRelease(profile: MusicPreferences, catalog: readonly PreferenceRelease[], featuredSlug: string, day = preferenceDay()) {
  const featuredFamily = catalog.find((release) => release.slug === featuredSlug)?.family ?? featuredSlug;
  return recentReleases(profile, catalog, day, MAX_RECENT)
    .find((release) => release.slug !== featuredSlug && release.family !== featuredFamily);
}

type StorageAccess = () => Pick<Storage, "getItem" | "setItem" | "removeItem">;
export class MusicPreferenceStore {
  private profile = emptyPreferences(0);
  private listeners = new Set<() => void>();
  private genreCooldown = new Map<GenreId, number>();
  private storage: StorageAccess;
  private clock: () => number;
  private catalog: readonly PreferenceRelease[];
  private resetPending = false;
  available = true;

  constructor(storage: StorageAccess, catalog: readonly PreferenceRelease[], clock = Date.now) {
    this.storage = storage;
    this.catalog = catalog;
    this.clock = clock;
  }
  getSnapshot = () => this.profile;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private publish(profile: MusicPreferences) {
    if (JSON.stringify(profile) === JSON.stringify(this.profile)) return;
    this.profile = profile;
    this.listeners.forEach((listener) => listener());
  }
  refresh = () => {
    const day = preferenceDay(this.clock());
    try {
      const storage = this.storage();
      if (this.resetPending) {
        storage.removeItem(MUSIC_PREFERENCES_KEY);
        this.resetPending = false;
      }
      const raw = storage.getItem(MUSIC_PREFERENCES_KEY);
      const profile = parsePreferences(raw, day);
      // Remove deleted/ineligible catalog entries and duplicate project families.
      const recent = recentReleases(profile, this.catalog, day, MAX_RECENT);
      profile.recent = profile.recent.filter((entry) => recent.some((item) => item.slug === entry.slug));
      if (raw && !profile.enabled) storage.removeItem(MUSIC_PREFERENCES_KEY);
      else if (raw && JSON.stringify(profile) !== raw) storage.setItem(MUSIC_PREFERENCES_KEY, JSON.stringify(profile));
      this.available = true;
      this.publish(profile);
    } catch { this.available = false; this.publish(emptyPreferences(day)); }
  };
  private persist(profile: MusicPreferences) {
    try {
      const storage = this.storage();
      if (profile.enabled) storage.setItem(MUSIC_PREFERENCES_KEY, JSON.stringify(profile));
      else storage.removeItem(MUSIC_PREFERENCES_KEY);
      this.available = true;
      this.publish(profile);
      return true;
    } catch {
      // Never revive a stale profile after a failed disable/clear/write.
      this.resetPending = true;
      this.available = false;
      this.publish(emptyPreferences(preferenceDay(this.clock())));
      return false;
    }
  }
  enable = () => { this.resetPending = false; return this.persist(emptyPreferences(preferenceDay(this.clock()), true)); };
  disable = () => { this.genreCooldown.clear(); return this.persist(emptyPreferences(preferenceDay(this.clock()))); };
  clear = () => {
    this.refresh();
    this.genreCooldown.clear();
    return this.persist(emptyPreferences(preferenceDay(this.clock()), this.profile.enabled));
  };
  private addGenres(genres: readonly GenreId[], weight: number, day: number) {
    const interests = { ...this.profile.interests };
    for (const genre of new Set(genres)) {
      interests[genre] = { score: Math.min(MAX_INTEREST, decayedInterest(interests[genre], day) + weight / genres.length), day };
    }
    return interests;
  }
  selectGenre = (label: string) => {
    this.refresh();
    const genre = genreId(label);
    const now = this.clock();
    if (!this.profile.enabled || !genre || now - (this.genreCooldown.get(genre) ?? -Infinity) < 1800000) return;
    this.genreCooldown.set(genre, now);
    const day = preferenceDay(now);
    this.persist({ ...this.profile, updatedDay: day, interests: this.addGenres([genre], 3, day) });
  };
  played = (slug: string | undefined, trigger: string | undefined) => {
    this.refresh();
    if (!this.profile.enabled || !["direct", "recommendation", "queue_selection"].includes(trigger ?? "")) return;
    const release = this.catalog.find((item) => item.slug === slug);
    if (!release) return;
    const day = preferenceDay(this.clock());
    // One interest increment per recording family per UTC day, even after reload.
    const alreadyPlayed = this.profile.recent.some((entry) => entry.day === day
      && this.catalog.find((item) => item.slug === entry.slug)?.family === release.family);
    this.persist({ ...this.profile, updatedDay: day,
      interests: alreadyPlayed ? this.profile.interests : this.addGenres(release.genres, 2, day),
      recent: [{ slug: release.slug, day }, ...this.profile.recent.filter((entry) =>
        this.catalog.find((item) => item.slug === entry.slug)?.family !== release.family)].slice(0, MAX_RECENT),
    });
  };
}

export type PreferenceCandidate = PreferenceRelease & { score: number };
// The server supplies only near-ties preserving eligibility, families and variety.
// Bridge/Discovery and curated slots never enter this adjustment.
export function preferredClosest(candidates: readonly PreferenceCandidate[], profile: MusicPreferences, day: number) {
  const baseline = candidates[0];
  if (!baseline || !profile.enabled || !validDay(profile.updatedDay, day)) return baseline?.slug;
  const affinity = (candidate: PreferenceCandidate) => Math.max(0,
    ...candidate.genres.map((genre) => decayedInterest(profile.interests[genre], day)));
  if (Math.max(...candidates.map(affinity)) - Math.min(...candidates.map(affinity)) < 2) return baseline.slug;
  const adjusted = (candidate: PreferenceCandidate) => candidate.score + affinity(candidate) / MAX_INTEREST * 3
    - (profile.recent.some((entry) => entry.slug === candidate.slug && validDay(entry.day, day)) ? 0.5 : 0);
  return candidates.reduce((best, candidate) => adjusted(candidate) > adjusted(best) + 0.5 ? candidate : best, baseline).slug;
}
