export type SiteLinkKind = "internal" | "social" | "shop" | "community" | "mailing-list" | "booking";

export type SiteLinkEntry = {
  label: string;
  url: string;
  kind: SiteLinkKind;
  description?: string;
};

export const siteConfig = {
  name: "Broey.",
  handle: "@broeybeats",
  location: "Scranton, PA",
  tagline: "Electronic artist, producer, and audio engineer from Scranton, PA",
  positioning:
    "Broey is the electronic project of Joe Montaro, a producer, audio engineer, and self-taught multi-instrumentalist from Scranton, PA.",
  shortBio:
    "Broey is an electronic artist, producer, audio engineer, and self-taught multi-instrumentalist from Scranton, PA.",
  businessLinks: [
    {
      label: "About Me",
      url: "/about",
      kind: "internal",
      description: "Broey artist and audio engineering background.",
    },
    {
      label: "Contact",
      url: "/contact",
      kind: "internal",
      description: "Music inquiries, collaborations, audio work, press, and project notes.",
    },
    {
      label: "Merch Shop",
      url: "https://broey-beats.myshopify.com/",
      kind: "shop",
      description: "Official Broey. merch shop.",
    },
    {
      label: "Join the Community",
      url: "https://discord.gg/J5BCTsUuAN",
      kind: "community",
      description: "Music drops, collabs, feedback, and Discord.",
    },
    {
      label: "Mailing list signup",
      url: "/#homepage-mailing-list",
      kind: "mailing-list",
      description: "Newsletter signup on the homepage.",
    },
    {
      label: "Send an Inquiry",
      url: "/contact#contact-form",
      kind: "booking",
      description: "Contact Broey about music, collaborations, audio work, press, or direct notes.",
    },
  ] satisfies SiteLinkEntry[],
  contact: {
    email: "broey@broey.net",
    note: "For music inquiries, collaborations, audio work, press, and direct notes.",
  },
  contactPlaceholder: {
    email: "broey@broey.net",
    note: "For music inquiries, collaborations, audio work, press, and direct notes.",
  },
  newsletter: {
    senderEmail: "updates@broey.net",
    replyToEmail: "updates@broey.net",
  },
  seo: {
    defaultTitle: "Broey. | Electronic Artist & Producer",
    description:
      "Broey is an electronic artist, producer, audio engineer, and self-taught multi-instrumentalist from Scranton, PA, with releases across lo-fi, house, UK garage, jungle, drum and bass, sax, and guitar.",
    twitterHandle: "@broeybeats",
  },
};
