export type SocialImageDefinition = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type PageMetadataDefinition = {
  title: string;
  description: string;
  path: string;
  image?: SocialImageDefinition;
  absoluteTitle?: boolean;
  indexable?: boolean;
  followWhenNoIndex?: boolean;
};

const latestReleaseImage: SocialImageDefinition = {
  url: "/assets/cover-art/latest-release.png",
  width: 1200,
  height: 1200,
  alt: "FREE by Broey. cover artwork",
};

const artistPortraitImage: SocialImageDefinition = {
  url: "/assets/brand/broey-headshot-2025.jpg",
  width: 1440,
  height: 1800,
  alt: "Broey artist portrait lit in blue and purple",
};

export const staticPageMetadata = {
  home: {
    title: "Home",
    description:
      "Official site of Broey, an electronic artist, producer, audio engineer, and multi-instrumentalist from Scranton, Pennsylvania. Explore music, press, merch, and updates.",
    path: "/",
    image: latestReleaseImage,
  },
  music: {
    title: "Music & Releases",
    description:
      "Explore music and releases by Broey, with selected singles, EPs, remixes, genre filters, playback, credits, and links to streaming platforms.",
    path: "/music",
    image: latestReleaseImage,
  },
  about: {
    title: "About Broey. | Artist, Producer & Audio Engineer",
    description:
      "Meet Broey, the electronic project of Joe Montaro, a producer, audio engineer, and self-taught multi-instrumentalist from Scranton, Pennsylvania.",
    path: "/about",
    image: artistPortraitImage,
    absoluteTitle: true,
  },
  contact: {
    title: "Contact Broey. | Music & Audio Inquiries",
    description:
      "Contact Broey about music, collaborations, mixing and audio work, press, or other direct inquiries, or join the Broey community on Discord.",
    path: "/contact",
    image: artistPortraitImage,
    absoluteTitle: true,
  },
  merch: {
    title: "Broey. Merch | Official Store",
    description:
      "Browse official Broey merch, including hoodies, crewnecks, hats, and other wearable pieces available through the Broey store.",
    path: "/merch",
    image: {
      url: "/images/merch/beats-hoodie.jpg",
      width: 1200,
      height: 1200,
      alt: "Black Broey Beats Hoodie with red chest and sleeve graphics",
    },
    absoluteTitle: true,
  },
  press: {
    title: "Broey. Press & Media Coverage",
    description:
      "Explore press coverage of Broey, including independent reviews, features, interviews, podcasts, and video appearances from across the catalog.",
    path: "/press",
    image: artistPortraitImage,
    absoluteTitle: true,
  },
  privacy: {
    title: "Privacy Notice",
    description:
      "Learn how the Broey website handles analytics, contact messages, newsletter subscriptions, abuse prevention, retention, and privacy requests.",
    path: "/privacy",
  },
} as const satisfies Record<string, PageMetadataDefinition>;

export const joinPageMetadata = {
  title: "Join the List",
  description:
    "Join the Broey. mailing list for new music, release updates, and occasional stories behind the records.",
  path: "/join",
  indexable: false,
  followWhenNoIndex: true,
} as const satisfies PageMetadataDefinition;

export const staticSitemapRoutes = Object.values(staticPageMetadata).map(({ path }) => path);
