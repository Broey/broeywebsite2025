import type { ReleaseEntry } from "./releases";

export const releaseAboutParagraphs = (release: ReleaseEntry) => {
  const authored = (Array.isArray(release.about) ? release.about : [release.about])
    .filter((paragraph): paragraph is string => Boolean(paragraph?.trim()));

  return authored.length ? authored : [release.description];
};
