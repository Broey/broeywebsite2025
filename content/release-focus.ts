import type { ReleaseEntry } from "./releases.ts";
import { isPublishedRelease, releaseSortValue, sortReleasesNewestFirst } from "./release-filters.ts";

// Resolve per request, so scheduled launches replace the previous focus without
// retaining stale featured flags or requiring a deployment at release time.
export function currentFocusRelease(releaseList: readonly ReleaseEntry[]) {
  return sortReleasesNewestFirst(releaseList.filter(release =>
    release.carouselEnabled && !release.isProjectTrack && isPublishedRelease(release) &&
    releaseSortValue(release) <= Date.now(),
  ))[0];
}
