import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PressMentionsSection } from "@/components/sections/PressMentionsSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteConfig } from "@/content/site";
import { absoluteUrl } from "@/lib/site-origin";

const aboutDescription =
  "Broey is the project of Joe Montaro, a Scranton-area producer and audio engineer making electronic music from lo-fi roots, house, UKG, drum and bass, and club records.";
const aboutPortraitImage = "/assets/brand/broey-headshot-2025.jpg";
const aboutSocialImage = {
  url: aboutPortraitImage,
  width: 1440,
  height: 1800,
  alt: "Broey artist portrait lit in blue and purple.",
};

export const metadata: Metadata = {
  title: {
    absolute: "About Broey. | Electronic Music from Scranton, PA",
  },
  description: aboutDescription,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Broey. | Electronic Music from Scranton, PA",
    description: aboutDescription,
    url: "/about",
    siteName: siteConfig.name,
    images: [aboutSocialImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Broey. | Electronic Music from Scranton, PA",
    description: aboutDescription,
    images: [aboutPortraitImage],
    site: siteConfig.seo.twitterHandle,
    creator: siteConfig.seo.twitterHandle,
  },
};

const bioParagraphs: ReactNode[] = [
  "Broey started with dusty chords, clipped drums, warped samples, warm noise, and self-produced records.",
  "The early records centered on lo-fi, chillhop, and beat-driven production.",
  <>
    Based in the Scranton area, Joe has spent more than 15 years producing, engineering, and shaping his own sound. The catalog has moved through streaming releases, select label partnerships, vinyl runs, physical moments, and editorial support while staying self-directed at the center.
  </>,
  "Releases like Fragments, 4u, Mean Something, dancing dumpster fire, STEREO LUV, blu., and FREE show the current Broey catalog in plain terms: singles, EPs, remixes, and club-focused tracks.",
];

const artistHighlights = [
  {
    title: "15+ years behind the sound",
    copy: "Producing, engineering, mixing, and building a catalog across lo-fi, house, bass, and left-field electronic spaces.",
  },
  {
    title: "Hands-on production",
    copy: "Broey builds releases through production, engineering, guitar, sax, sampling, and detailed sound work.",
  },
  {
    title: "Streaming, vinyl, and physical moments",
    copy: "Broey's catalog has lived across digital platforms and physical runs, including vinyl releases from earlier lo-fi-era work.",
  },
  {
    title: "Label history without a fixed lane",
    copy: "Releases have moved through independent paths and select label partnerships without one fixed lane defining the project.",
  },
  {
    title: "Editorial and outside support",
    copy: "Broey's music has received DSP/editorial support and outside coverage from outlets including We Rave You, Insight Music, and LOUDNESS.",
  },
  {
    title: "Self-directed production",
    copy: "Joe produces, engineers, and mixes Broey releases, keeping the project self-directed.",
  },
];

const timelineItems = [
  {
    year: "Early roots",
    title: "Learning the language",
    copy: "Years of production, engineering, sampling, and learning how to turn small sounds into full records.",
  },
  {
    year: "Lo-fi era",
    title: "Warmth and intimacy",
    copy: "Warm beats, intimate melodies, vinyl moments, playlist support, and the foundation of the Broey sound.",
  },
  {
    year: "Expansion",
    title: "House and breakbeats",
    copy: "Projects like Fragments opened the catalog into house, processed vocals, sax lines, and breakbeats.",
  },
  {
    year: "Now",
    title: "Loose club records",
    copy: "dancing dumpster fire, STEREO LUV, blu., and FREE sit at the front of the current catalog.",
  },
];

const absoluteAboutUrl = absoluteUrl("/about");

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Joe Montaro",
            alternateName: "Broey.",
            url: absoluteAboutUrl,
            description: aboutDescription,
            jobTitle: "Producer and audio engineer",
            image: absoluteUrl(aboutPortraitImage),
            homeLocation: {
              "@type": "Place",
              name: "Scranton, Pennsylvania",
            },
          }),
        }}
      />
      <section className="about-page release-detail-shell inner-page" aria-labelledby="about-page-title">
        <section className="hero-panel about-hero" aria-labelledby="about-page-title">
          <div className="about-hero-copy">
            <p className="release-detail-eyebrow">About Broey.</p>
            <h1 id="about-page-title" className="about-hero-title">
              A Real Sound Guy.
            </h1>
            <p className="about-hero-positioning">
              Lo-fi roots. Club instincts. Electronic music from Scranton, Pennsylvania.
            </p>
            <p className="about-hero-summary">
              Broey is the electronic project of Joe Montaro, a Scranton, Pennsylvania artist, producer, and audio engineer shaping records through hands-on production, guitar, sax, and sampling.
            </p>
            <p className="about-hero-note">
              Sound in the technical sense, and sound in the human one.
            </p>
            <div className="release-detail-cta-row">
              <Link href="/music" className="release-detail-primary-cta">
                Browse the catalog
              </Link>
              <Link href="/contact" className="release-detail-secondary-cta">
                Contact
              </Link>
            </div>
          </div>

          <figure className="about-portrait-panel">
            <div className="about-portrait-frame">
              <Image
                src={aboutPortraitImage}
                alt="Broey artist portrait lit in blue and purple."
                width={1440}
                height={1800}
                priority
                sizes="(min-width: 1024px) 32vw, 92vw"
                className="about-portrait-image"
              />
            </div>
            <figcaption>
              <span>Broey.</span>
              <span>Scranton, PA / 2025</span>
            </figcaption>
          </figure>
        </section>

        <div className="release-detail-lower-grid about-lower-grid">
          <section className="release-detail-section about-bio-section" aria-labelledby="about-bio-title">
            <SectionHeader
              eyebrow="Producer story"
              title="How the sound got here"
              titleId="about-bio-title"
            />
            <div className="about-bio-copy">
              {bioParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </section>

          <section className="release-detail-section about-highlights-section" aria-labelledby="about-highlights-title">
            <SectionHeader
              eyebrow="Highlights"
              title="Behind the sound"
              titleId="about-highlights-title"
            />
            <div className="about-highlight-grid">
              {artistHighlights.map((highlight, index) => (
                <article key={highlight.title} className="about-highlight-card">
                  <span className="about-highlight-number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3>{highlight.title}</h3>
                  <p>{highlight.copy}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="release-detail-section about-timeline-section" aria-labelledby="about-timeline-title">
            <SectionHeader
              eyebrow="Timeline"
              title="Selected points in the discography"
              titleId="about-timeline-title"
            />
            <ol className="about-timeline-list">
              {timelineItems.map((item) => (
                <li key={`${item.year}-${item.title}`} className="about-timeline-item">
                  <p className="about-timeline-year">{item.year}</p>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <PressMentionsSection variant="about" />

          <section className="release-detail-section about-final-cta" aria-labelledby="about-closing-title">
            <div>
              <p className="release-detail-section-kicker">Start here</p>
              <h2 id="about-closing-title">Start with the music.</h2>
              <p>
                The records are the center. The rest is here when you want the notes around them.
              </p>
            </div>
            <div className="release-detail-cta-row">
              <Link href="/music" className="release-detail-primary-cta">
                Browse the catalog
              </Link>
              <Link href="/press" className="release-detail-secondary-cta">
                View Press & Coverage
              </Link>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
