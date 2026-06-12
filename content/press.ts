export type PressItemType = "review" | "feature" | "interview" | "podcast" | "video";

export type PressItemGroup =
  | "current-era"
  | "fragments"
  | "origin-story"
  | "media-appearance";

export type PressItem = {
  id: string;
  type: PressItemType;
  group: PressItemGroup;
  outlet: string;
  title: string;
  author?: string;
  date?: string;
  releaseOrTopic: string;
  href: string;
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
    eyebrow: "Press & Mentions",
    heading: "Press & Mentions",
    description:
      "Broey has been covered by outlets like We Rave You, Insight Music, and LOUDNESS.",
    ctaLabel: "View all press",
    ctaHref: "/press",
  },
  about: {
    id: "press-mentions",
    eyebrow: "Press & Mentions",
    heading: "A few outside notes.",
    description:
      "Selected coverage supporting the artist story, with the full archive kept on its own page.",
    ctaLabel: "View all press",
    ctaHref: "/press",
  },
  archive: {
    id: "press-archive",
    eyebrow: "Press Archive",
    heading: "Coverage archive",
    description:
      "Independent reviews, features, and interviews documenting Broey.'s releases and evolution, from early lofi foundations through Fragments and the current electronic era.",
  },
} as const;

export const pressGroups: Record<
  PressItemGroup,
  {
    label: string;
    description: string;
  }
> = {
  "current-era": {
    label: "Current Era Coverage",
    description:
      "Recent coverage of Broey.'s raw, physical, genre-fluid electronic direction.",
  },
  fragments: {
    label: "Fragments Coverage",
    description:
      "Reviews and features around the project that marked a clear bridge into house, dance, sax, processed vocals, and electronic motion.",
  },
  "origin-story": {
    label: "Origin Interviews",
    description:
      "Early interviews that document the foundation: self-taught production, lofi/chillhop roots, vinyl texture, jazz influence, and feeling-first composition.",
  },
  "media-appearance": {
    label: "Media Appearances",
    description:
      "Podcast and video conversations around Broey.'s production background, collaborations, and creative process.",
  },
};

export const pressGroupOrder: PressItemGroup[] = [
  "current-era",
  "fragments",
  "origin-story",
  "media-appearance",
];

export const pressItems: PressItem[] = [
  {
    id: "we-rave-you-dancing-dumpster-fire",
    type: "feature",
    group: "current-era",
    outlet: "We Rave You",
    title: "Broey. embraces raw creativity with new EP dancing dumpster fire",
    author: "Chris Vuoncino",
    date: "2025-08-20",
    releaseOrTopic: "dancing dumpster fire",
    href: "https://weraveyou.com/2025/08/broey-dancing-dumpster-fire-ep-review/",
    pullQuote: "raw creativity and underground edge",
    summary:
      "We Rave You covered dancing dumpster fire as a raw, emotionally driven release that captures Broey.'s underground electronic edge.",
    ctaLabel: "Read feature",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "insight-music-fragments",
    type: "feature",
    group: "fragments",
    outlet: "Insight Music",
    title: 'Scranton-based Multi-instrumentalist Broey. Releases Electrifying New EP, "Fragments"',
    author: "Stefan Baranowski",
    date: "2024-04-04",
    releaseOrTopic: "Fragments",
    href: "https://insightmusic.co/scranton-based-multi-instrumentalist-broey-releases-electrifying-new-ep-fragments/",
    pullQuote: "electrifying odyssey",
    summary:
      "Insight Music highlighted Fragments as a bright, rhythm-forward electronic project from a Scranton-based multi-instrumentalist.",
    ctaLabel: "Read feature",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "loudness-fragments",
    type: "review",
    group: "fragments",
    outlet: "LOUDNESS",
    title: "EP Review: Broey. - Fragments",
    releaseOrTopic: "Fragments",
    href: "https://www.loudnessblog.com/broey",
    pullQuote: "dreamy, hazy and laid-back",
    summary:
      "LOUDNESS described Fragments as house music that still feels emotional, hazy, and distinctly Broey.",
    ctaLabel: "Read review",
    featuredOnHome: true,
    featuredOnAbout: true,
  },
  {
    id: "edm-reviewer-fragments",
    type: "review",
    group: "fragments",
    outlet: "EDM Reviewer",
    title: 'Fragments of experimental lofi: A review of Broey.\'s EP "Fragments"',
    date: "2024-04-03",
    releaseOrTopic: "Fragments",
    href: "https://edmreviewer.com/2024/04/03/fragments-of-experimental-lofi-a-review-of-broey-s-ep-fragments/",
    pullQuote: "unique approach to the genre",
    summary:
      "EDM Reviewer called attention to Broey.'s risk-taking on Fragments, from vocal chops and deep-house movement to saxophone and genre-blurring structure.",
    ctaLabel: "Read review",
    featuredOnAbout: true,
    needsVerification: true,
  },
  {
    id: "palms-out-fragments",
    type: "review",
    group: "fragments",
    outlet: "Palms Out Sounds",
    title: "Mailbox: Broey. - Fragments",
    date: "2024-05-01",
    releaseOrTopic: "Fragments",
    href: "https://www.palmsout.net/2024/mailbox-broey-fragments/",
    pullQuote: "producer who can shape-shift",
    summary:
      "Palms Out connected Fragments to Broey.'s wider evolution, describing the project as a move closer to the music he actually loves.",
    ctaLabel: "Read review",
    featuredOnAbout: true,
  },
  {
    id: "buzzmusic-reverie-interview",
    type: "interview",
    group: "origin-story",
    outlet: "BuzzMusic",
    title: "Expect The Unexpected With Broey!",
    author: "BUZZMUSIC",
    date: "2019-04-06",
    releaseOrTopic: "Reverie / early Broey. story",
    href: "https://www.buzz-music.com/post/expect-the-unexpected-with-broey",
    pullQuote: "words often get in the way",
    summary:
      "BuzzMusic captured the early Broey. foundation: self-taught musicianship, emotional production, and instrumental music designed to leave space for the listener.",
    ctaLabel: "Read interview",
    featuredOnAbout: true,
  },
  {
    id: "w-wang-joe-montaro-interview",
    type: "interview",
    group: "origin-story",
    outlet: "W. Wang's World Commentary",
    title: "Interview with Joe Montaro (broey.)",
    author: "W. Wang",
    date: "2019-04-02",
    releaseOrTopic: "early influences / lofi foundation",
    href: "https://wworldcommentary.wordpress.com/2019/04/02/interview-with-joe-montaro-broey/",
    pullQuote: "talk less and feel more",
    summary:
      "W. Wang's interview preserves the foundation: vinyl warmth, jazz and soul influence, bluesy guitar, and the instinct to let feeling lead.",
    ctaLabel: "Read interview",
    featuredOnAbout: true,
  },
  {
    id: "chilled-samples-episode-051",
    type: "podcast",
    group: "media-appearance",
    outlet: "The Chilled Samples Podcast",
    title: "Episode 051 - Broey.",
    date: "2022-01-31",
    releaseOrTopic: "producer interview",
    href: "https://open.spotify.com/episode/4ScuZUr9vAmwjfTZKh3kuf?si=fH-sdiNYSlaxQsSTL8G21Q",
    summary:
      "A long-form podcast conversation with Broey. during the lofi/chillhop community era.",
    ctaLabel: "Listen",
    featuredOnAbout: false,
    featuredOnWatch: true,
  },
  {
    id: "chilled-samples-episode-080",
    type: "podcast",
    group: "media-appearance",
    outlet: "The Chilled Samples Podcast",
    title: "Episode 080 - Broey.",
    date: "2022-09-29",
    releaseOrTopic: "producer interview",
    href: "https://www.deezer.com/en/episode/437965727",
    summary:
      "A follow-up Chilled Samples appearance documenting Broey.'s producer identity before the current electronic era fully took shape.",
    ctaLabel: "Listen",
    featuredOnAbout: false,
    featuredOnWatch: true,
  },
  {
    id: "beats-buffet-table-for-two",
    type: "video",
    group: "media-appearance",
    outlet: "Beats Buffet",
    title: "Broey. reveals his favourite collabs | Table For Two | Beats Buffet",
    releaseOrTopic: "collabs / artist interview",
    href: "https://www.youtube.com/watch?v=BxUS_QnU9J8",
    summary:
      "A video interview with Broey. discussing collaborations, past work, and creative background.",
    ctaLabel: "Watch",
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
export const pressArchiveItems = pressItems.filter((item) => item.group !== "media-appearance");

export type PressEntryType = PressItemType;
export type PressEntry = PressItem;
export const press = pressItems;
