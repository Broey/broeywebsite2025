import { socialByPlatform } from "@/content/socials";

export type FeaturedVideo = {
  title: string;
  description: string;
  youtubeId?: string;
  watchUrl?: string;
};

export type VideoLink = {
  label: string;
  href: string;
  description?: string;
};

export type ClipPlaceholder = {
  title: string;
  description: string;
  status: string;
};

const youtube = socialByPlatform("YouTube");
const tiktok = socialByPlatform("TikTok");
const instagram = socialByPlatform("Instagram");

export const featuredVideo: FeaturedVideo = {
  title: "Visuals are warming up",
  description:
    "The watch page is live as the home for Broey. videos, visualizers, clips, reels, and behind-the-scenes motion work. A featured embed will appear here once a verified YouTube video ID is selected.",
  watchUrl: youtube?.url,
};

const videoLinkCandidates: Array<VideoLink | null> = [
  youtube
    ? {
        label: "YouTube",
        href: youtube.url,
        description: "Official channel for videos, interviews, visualizers, and longer-form uploads.",
      }
    : null,
  tiktok
    ? {
        label: "TikTok",
        href: tiktok.url,
        description: "Short clips, experiments, edits, and day-to-day motion posts.",
      }
    : null,
  instagram
    ? {
        label: "Instagram / Reels",
        href: instagram.url,
        description: "Reels, visual snippets, release clips, and social video updates.",
      }
    : null,
];

export const videoLinks: VideoLink[] = videoLinkCandidates.filter(
  (link): link is VideoLink => Boolean(link),
);

export const clipPlaceholders: ClipPlaceholder[] = [
  {
    title: "Release Visualizers",
    description: "Loopable visual pieces for singles, EPs, and remix drops.",
    status: "Coming soon",
  },
  {
    title: "Studio Clips",
    description: "Small process notes, track sketches, and production moments.",
    status: "Queued",
  },
  {
    title: "Live / Social Cuts",
    description: "Vertical clips built for TikTok, Reels, Shorts, and quick sharing.",
    status: "In progress",
  },
];
