export type PressItemType =
  | "review"
  | "feature"
  | "interview"
  | "podcast"
  | "video"
  | "roundup";

export type PressItemMedium =
  | "article"
  | "review"
  | "interview"
  | "podcast"
  | "video"
  | "roundup";

export type PressItemGroup =
  | "featured-coverage"
  | "written-coverage"
  | "interviews-podcasts"
  | "video-features";

export type PressItem = {
  id: string;
  type: PressItemType;
  group: PressItemGroup;
  outlet: string;
  title: string;
  medium: PressItemMedium;
  author?: string;
  date?: string;
  releaseOrTopic: string;
  href: string;
  videoId?: string;
  embedUrl?: string;
  pullQuote?: string;
  summary: string;
  ctaLabel: string;
  featuredOnHome?: boolean;
  featuredOnAbout?: boolean;
  featuredOnWatch?: boolean;
  needsVerification?: boolean;
};

export const pressMentionsCopy = {
  preview: {
    eyebrow: "Selected Press",
    heading: "Selected Press",
    description:
      "Coverage, reviews, and writeups tracing Broey's move from lo-fi roots into club-facing electronic releases.",
    ctaLabel: "View Press & Coverage",
    ctaHref: "/press",
  },
  about: {
    id: "press-mentions",
    eyebrow: "Press & Coverage",
    heading: "Coverage and context",
    description:
      "Writeups, interviews, podcasts, and outside features around dancing dumpster fire, Fragments, early lo-fi roots, and the production work behind the catalog.",
    ctaLabel: "View all press & coverage",
    ctaHref: "/press",
  },
  archive: {
    id: "press-archive",
    eyebrow: "Coverage Archive",
    heading: "Featured Coverage",
    description:
      "Written coverage, interviews, podcasts, and outside features from across the Broey catalog.",
  },
} as const;

export const pressGroups: Record<
  PressItemGroup,
  {
    label: string;
    description: string;
  }
> = {
  "featured-coverage": {
    label: "Featured Coverage",
    description:
      "High-signal coverage around current Broey releases and the move into club-facing electronic work.",
  },
  "written-coverage": {
    label: "Written Coverage",
    description:
      "Reviews, features, and roundups around Fragments, dancing dumpster fire, and the wider catalog.",
  },
  "interviews-podcasts": {
    label: "Interviews & Podcasts",
    description:
      "Conversations documenting Broey's production background, lo-fi roots, collaborations, and creative process.",
  },
  "video-features": {
    label: "Video Features",
    description:
      "YouTube interviews and video appearances gathered under Press & Coverage.",
  },
};

export const pressGroupOrder: PressItemGroup[] = [
  "featured-coverage",
  "written-coverage",
  "interviews-podcasts",
  "video-features",
];

export const pressItems: PressItem[] = [
  {
    id: "we-rave-you-dancing-dumpster-fire",
    type: "feature",
    group: "featured-coverage",
    outlet: "We Rave You",
    title: "Broey. embraces raw creativity with new EP dancing dumpster fire",
    medium: "article",
    author: "Chris Vuoncino",
    date: "2025-08-20",
    releaseOrTopic: "dancing dumpster fire",
    href: "https://weraveyou.com/2025/08/broey-dancing-dumpster-fire-ep-review/",
    pullQuote: "raw creativity and underground edge",
    summary:
      "We Rave You covered dancing dumpster fire as an EP with underground electronic instincts.",
    ctaLabel: "Read Coverage",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "insight-music-fragments",
    type: "feature",
    group: "written-coverage",
    outlet: "Insight Music",
    title: 'Scranton-based Multi-instrumentalist Broey. Releases Electrifying New EP, "Fragments"',
    medium: "article",
    author: "Stefan Baranowski",
    date: "2024-04-04",
    releaseOrTopic: "Fragments",
    href: "https://insightmusic.co/scranton-based-multi-instrumentalist-broey-releases-electrifying-new-ep-fragments/",
    pullQuote: "electrifying odyssey",
    summary:
      "Insight Music highlighted Fragments as a bright, rhythm-forward electronic project from a Scranton-based multi-instrumentalist.",
    ctaLabel: "Read Coverage",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "loudness-fragments",
    type: "review",
    group: "written-coverage",
    outlet: "LOUDNESS",
    title: "EP Review: Broey. - Fragments",
    medium: "review",
    releaseOrTopic: "Fragments",
    href: "https://www.loudnessblog.com/broey",
    pullQuote: "dreamy, hazy and laid-back",
    summary:
      "LOUDNESS described Fragments as hazy, laid-back house music that still sounds distinctly Broey.",
    ctaLabel: "Read Review",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "submithub-fragments-roundup",
    type: "roundup",
    group: "written-coverage",
    outlet: "SubmitHub",
    title: "Fragments EP Press Coverage",
    medium: "roundup",
    releaseOrTopic: "Fragments",
    href: "https://www.submithub.com/link/fragments-reviews",
    summary:
      "A press roundup collecting outside coverage and reviews around the Fragments EP.",
    ctaLabel: "View Roundup",
  },
  {
    id: "edm-reviewer-fragments",
    type: "review",
    group: "written-coverage",
    outlet: "EDM Reviewer",
    title: 'Fragments of experimental lofi: A review of Broey.\'s EP "Fragments"',
    medium: "review",
    date: "2024-04-03",
    releaseOrTopic: "Fragments",
    href: "https://edmreviewer.com/2024/04/03/fragments-of-experimental-lofi-a-review-of-broey-s-ep-fragments/",
    pullQuote: "unique approach to the genre",
    summary:
      "EDM Reviewer called attention to Broey's risk-taking on Fragments, from vocal chops and deep-house grooves to saxophone and genre-blurring structure.",
    ctaLabel: "Read Review",
    featuredOnAbout: true,
    needsVerification: true,
  },
  {
    id: "palms-out-fragments",
    type: "review",
    group: "written-coverage",
    outlet: "Palms Out Sounds",
    title: "Mailbox: Broey. - Fragments",
    medium: "review",
    date: "2024-05-01",
    releaseOrTopic: "Fragments",
    href: "https://www.palmsout.net/2024/mailbox-broey-fragments/",
    pullQuote: "producer who can shape-shift",
    summary:
      "Palms Out connected Fragments to Broey's shift toward the music he actually loves.",
    ctaLabel: "Read Review",
    featuredOnAbout: true,
  },
  {
    id: "buzzmusic-reverie-interview",
    type: "interview",
    group: "interviews-podcasts",
    outlet: "BuzzMusic",
    title: "Expect The Unexpected With Broey!",
    medium: "interview",
    author: "BUZZMUSIC",
    date: "2019-04-06",
    releaseOrTopic: "Reverie / early Broey. story",
    href: "https://www.buzz-music.com/post/expect-the-unexpected-with-broey",
    pullQuote: "words often get in the way",
    summary:
      "BuzzMusic captured the early Broey foundation: self-taught musicianship, instrumental writing, and music designed to leave space for the listener.",
    ctaLabel: "Read Interview",
    featuredOnAbout: true,
  },
  {
    id: "w-wang-joe-montaro-interview",
    type: "interview",
    group: "interviews-podcasts",
    outlet: "W. Wang's World Commentary",
    title: "Interview with Joe Montaro (broey.)",
    medium: "interview",
    author: "W. Wang",
    date: "2019-04-02",
    releaseOrTopic: "early influences / lo-fi foundation",
    href: "https://wworldcommentary.wordpress.com/2019/04/02/interview-with-joe-montaro-broey/",
    pullQuote: "talk less and feel more",
    summary:
      "W. Wang's interview preserves the foundation: vinyl warmth, jazz and soul influence, bluesy guitar, and instinct-led writing.",
    ctaLabel: "Read Interview",
    featuredOnAbout: true,
  },
  {
    id: "mmp-episode-68-real-sound-guy",
    type: "video",
    group: "video-features",
    outlet: "MMP",
    title: 'MMP Ep. 68 "A Real Sound Guy" Featuring @broeybeats',
    medium: "video",
    releaseOrTopic: "video interview / podcast appearance",
    href: "https://youtu.be/-YGwa2EObRs?si=J1hps-RsN7T1VijO",
    videoId: "-YGwa2EObRs",
    embedUrl: "https://www.youtube-nocookie.com/embed/-YGwa2EObRs",
    summary:
      "A video podcast appearance centered on Broey's sound work, artist background, and production perspective.",
    ctaLabel: "Watch on YouTube",
    featuredOnWatch: true,
  },
  {
    id: "chilled-samples-episode-051",
    type: "podcast",
    group: "interviews-podcasts",
    outlet: "The Chilled Samples Podcast",
    title: "Part 1 / Episode 051 - Broey.",
    medium: "podcast",
    date: "2022-01-31",
    releaseOrTopic: "producer interview",
    href: "https://open.spotify.com/episode/4ScuZUr9vAmwjfTZKh3kuf",
    summary:
      "A long-form podcast conversation with Broey during the lo-fi/chillhop community years.",
    ctaLabel: "Listen",
    featuredOnAbout: false,
    featuredOnWatch: true,
  },
  {
    id: "chilled-samples-episode-080",
    type: "podcast",
    group: "interviews-podcasts",
    outlet: "The Chilled Samples Podcast",
    title: "Part 2 / Episode 080 - Broey.",
    medium: "podcast",
    date: "2022-09-29",
    releaseOrTopic: "producer interview",
    href: "https://open.spotify.com/episode/6eoaOwTlc0XXKbk7WoUruY",
    summary:
      "A follow-up Chilled Samples appearance documenting Broey's producer identity before the club-facing catalog took shape.",
    ctaLabel: "Listen",
    featuredOnAbout: false,
    featuredOnWatch: true,
  },
  {
    id: "beats-buffet-table-for-two",
    type: "video",
    group: "video-features",
    outlet: "Beats Buffet",
    title: "Broey. reveals his favourite collabs | Table For Two | Beats Buffet",
    medium: "video",
    releaseOrTopic: "collabs / artist interview",
    href: "https://www.youtube.com/watch?v=BxUS_QnU9J8",
    videoId: "BxUS_QnU9J8",
    embedUrl: "https://www.youtube-nocookie.com/embed/BxUS_QnU9J8",
    summary:
      "A video interview with Broey discussing collaborations, past work, and creative background.",
    ctaLabel: "Watch on YouTube",
    featuredOnAbout: false,
    featuredOnWatch: true,
    needsVerification: true,
  },
];

export const homePressItems = pressItems
  .filter((item) => item.featuredOnHome)
  .slice(0, 3);

export const aboutPressItems = pressItems.filter((item) => item.featuredOnAbout);
export const watchPressItems = pressItems.filter((item) => item.featuredOnWatch);
export const pressArchiveItems = pressItems;

export type PressEntryType = PressItemType;
export type PressEntry = PressItem;
export const press = pressItems;
