import type { ReleaseEntry, ReleaseListenAction } from "@/content/releases";

export type ReleaseActionLink = {
  href: string;
  external: boolean;
  mode: ReleaseListenAction["kind"] | "archive";
  label?: string;
};

export const isRealUrl = (url?: string): url is string => Boolean(url && url !== "#");

export const releaseDetailHref = (release: Pick<ReleaseEntry, "slug">) =>
  `/music/${release.slug}`;

export const releasePlayerHref = (release: Pick<ReleaseEntry, "slug">) =>
  `${releaseDetailHref(release)}#player`;

const platformOrder = [
  "Spotify",
  "Apple Music",
  "SoundCloud",
  "YouTube",
  "TIDAL",
  "Deezer",
  "Audius",
  "Bandcamp",
  "Amazon Music",
];

const platformRanks = new Map(
  platformOrder.map((platform, index) => [platform.toLowerCase(), index]),
);

const findPlatformRank = (platform: string) =>
  platformRanks.get(platform.toLowerCase()) ?? Number.MAX_SAFE_INTEGER;

const isVisiblePlatformLink = (link: ReleaseEntry["links"][number]) =>
  isRealUrl(link.url) &&
  platformRanks.has(link.platform.toLowerCase()) &&
  link.platform.toLowerCase() !== "disco";

const tidalCatalogLink = (release: ReleaseEntry): ReleaseEntry["links"][number] | undefined => {
  const source = release.catalogSource?.provider ?? release.catalogSource?.source;

  if (source?.toLowerCase() !== "tidal" || !isRealUrl(release.catalogSource?.sourceUrl)) {
    return undefined;
  }

  return {
    label: "TIDAL",
    platform: "TIDAL",
    url: release.catalogSource.sourceUrl,
    kind: "streaming",
    primary: false,
  };
};

export const releasePlatformLinks = (release: ReleaseEntry) => {
  const sourceLinks = release.platformLinks?.length ? release.platformLinks : release.links;
  const links = sourceLinks.filter(isVisiblePlatformLink);
  const catalogLink = tidalCatalogLink(release);

  if (catalogLink && !links.some((link) => link.platform.toLowerCase() === "tidal")) {
    links.push(catalogLink);
  }

  return links
    .filter((link, index, list) => {
      const key = `${link.platform.toLowerCase()}-${link.url}`;
      return list.findIndex((entry) => `${entry.platform.toLowerCase()}-${entry.url}` === key) === index;
    })
    .sort((a, b) => findPlatformRank(a.platform) - findPlatformRank(b.platform));
};

const releaseListenAction = (
  action?: ReleaseListenAction,
): ReleaseActionLink | undefined => {
  if (!action) {
    return undefined;
  }

  if (action.kind === "external" && isRealUrl(action.url)) {
    return {
      href: action.url,
      external: true,
      mode: "external",
      label: action.label,
    };
  }

  if (action.kind === "disco-embed") {
    const href = [action.url, action.embedUrl].find(isRealUrl);

    if (href) {
      return {
        href,
        external: true,
        mode: "disco-embed",
        label: action.label,
      };
    }
  }

  if (action.kind === "local-audio" && isRealUrl(action.audioSrc)) {
    return {
      href: action.audioSrc,
      external: false,
      mode: "local-audio",
      label: action.label,
    };
  }

  return undefined;
};

export const primaryListenAction = (release: ReleaseEntry): ReleaseActionLink => {
  const modeledAction = releaseListenAction(release.listenAction);

  if (modeledAction) {
    return modeledAction;
  }

  const discoUrl = [
    release.disco?.publicUrl,
    release.disco?.promoUrl,
    release.disco?.privateShareUrl,
    release.embed?.externalUrl,
    release.embed?.embedUrl,
  ].find(isRealUrl);

  if (discoUrl) {
    return {
      href: discoUrl,
      external: true,
      mode: "disco-embed",
    };
  }

  const directLink =
    release.links.find((link) => link.primary && isRealUrl(link.url)) ??
    release.links.find((link) => isRealUrl(link.url));

  if (directLink) {
    return {
      href: directLink.url,
      external: true,
      mode: "external",
    };
  }

  if (isRealUrl(release.catalogSource?.sourceUrl)) {
    return {
      href: release.catalogSource.sourceUrl,
      external: true,
      mode: "external",
    };
  }

  return {
    href: releaseDetailHref(release),
    external: false,
    mode: "archive",
  };
};
