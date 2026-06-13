import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { PressMentionsSection } from "@/components/sections/PressMentionsSection";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { siteUrl } from "@/content/seo";
import { siteConfig } from "@/content/site";

const aboutDescription =
  "Broey is the project of Joe Montaro, a Scranton-area producer and audio engineer building electronic music from lo-fi roots, club instincts, warm texture, and emotional movement.";
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
  "Broey started as a way to chase feeling through sound: dusty chords, clipped drums, warped samples, warm noise, and the kind of small imperfections that make electronic music feel human.",
  "What began in the world of lo-fi, chillhop, and beat-driven production gradually opened into a wider electronic language: house, UK garage, bass music, ambient textures, and dance records that still carry the same emotional center.",
  "Based in the Scranton area, Joe has spent more than 15 years producing, engineering, and shaping his own sound. The Broey catalog has moved through streaming releases, select label partnerships, physical moments, vinyl runs, and editorial support across major DSPs, while staying self-directed at its core. Rather than following one fixed lane, the project has grown by letting each era push into a new corner of the sound.",
  <>
    Early Broey releases leaned into the warmth and intimacy of lo-fi production: soft melodies, textured drums, and tracks that felt lived-in from the first loop. That foundation still runs through the music, even as the catalog has expanded. Releases like <em>Fragments</em>, <em>4u</em>, <em>Mean Something</em>, <em>dancing dumpster fire</em>, <em>STEREO LUV</em>, and <em>blu.</em> show a project moving between reflection and release: sometimes hazy and emotional, sometimes raw, bright, and built for motion.
  </>,
  "The current Broey era is less about fitting a genre and more about building a world around the catalog. The music pulls from dance floors, late-night headphones, internet scenes, and years of production instinct, but the throughline is the same: honest electronic music with texture, feeling, movement, and a little bit of dirt around the edges.",
  "This site is the home base for that world: music, visuals, merch, release notes, press, and direct connection with the people following along.",
];

const artistHighlights = [
  {
    title: "15+ years behind the sound",
    copy: "Producing, engineering, and developing a catalog across lo-fi, electronic, house, bass, and experimental spaces.",
  },
  {
    title: "Lo-fi foundation, wider electronic future",
    copy: "A sound rooted in warmth and texture, now expanding into club-focused and genre-fluid electronic releases.",
  },
  {
    title: "Streaming, vinyl, and physical moments",
    copy: "Broey's catalog has lived across digital platforms and physical runs, including vinyl releases from earlier lo-fi-era work.",
  },
  {
    title: "Label history without a fixed lane",
    copy: "Releases have moved through both independent paths and select label partnerships, without a long-term exclusive label deal defining the project.",
  },
  {
    title: "Editorial and outside support",
    copy: "Broey's music has received DSP/editorial support and outside coverage from outlets including We Rave You, Insight Music, and LOUDNESS.",
  },
  {
    title: "Built across scenes",
    copy: "From lo-fi and chillhop to house, garage, bass, and left-field electronic releases, the catalog keeps moving without losing its emotional center.",
  },
];

const timelineItems = [
  {
    year: "Early roots",
    title: "Learning the language",
    copy: "Years of production, engineering, sampling, and learning how to turn small textures into full records.",
  },
  {
    year: "Lo-fi era",
    title: "Warmth and intimacy",
    copy: "Warm beats, intimate melodies, vinyl moments, playlist support, and the foundation of the Broey sound.",
  },
  {
    year: "Expansion",
    title: "A wider frame",
    copy: "Projects like Fragments opened the catalog into brighter, more rhythmic, and more emotionally direct electronic territory.",
  },
  {
    year: "Current era",
    title: "Motion and raw electronic feeling",
    copy: "dancing dumpster fire, STEREO LUV, blu., and the newer release world push Broey deeper into movement, club influence, and raw electronic feeling.",
  },
];

const absoluteAboutUrl = new URL("/about", siteUrl).toString();

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
            image: new URL(aboutPortraitImage, siteUrl).toString(),
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
              Broey is the project of Joe Montaro, a Scranton-area producer and audio engineer building a catalog around warm texture, emotional movement, and left-field electronic production.
            </p>
            <p className="about-hero-note">
              Sound in the technical sense, and sound in the human one.
            </p>
            <div className="release-detail-cta-row">
              <Link href="/music" className="release-detail-primary-cta">
                Explore Selected Releases
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
              eyebrow="Bio"
              title="About Broey."
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
              eyebrow="The Arc"
              title="From early roots to the current era"
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
              <h2 id="about-closing-title">Follow the next era.</h2>
              <p className="about-final-bridge">
                Explore the catalog, watch the visuals, browse merch, read the press, or join the community.
              </p>
              <p>
                Start with the music, read the release notes, or follow along as the next era takes shape.
              </p>
            </div>
            <div className="release-detail-cta-row">
              <Link href="/music" className="release-detail-primary-cta">
                Explore Selected Releases
              </Link>
              <Link href="/press" className="release-detail-secondary-cta">
                View Press Archive
              </Link>
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
