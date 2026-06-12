import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EmailSignup } from "@/components/sections/EmailSignup";
import { PressMentionsSection } from "@/components/sections/PressMentionsSection";
import { PageIntro } from "@/components/ui/PageIntro";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { releaseDetailHref } from "@/content/release-actions";
import { siteUrl } from "@/content/seo";
import { releases, type ReleaseEntry } from "@/content/releases";
import { siteConfig } from "@/content/site";

const aboutDescription =
  "Learn the story of Broey., from early lofi foundations and independent artist growth to genre-fluid electronic music, selected press, reviews, interviews, and the current era.";
const aboutPortraitImage = "/assets/brand/broey-headshot-2025.jpg";
const aboutSocialImage = {
  url: aboutPortraitImage,
  width: 1440,
  height: 1800,
  alt: "Broey artist portrait lit in blue and purple.",
};

export const metadata: Metadata = {
  title: {
    absolute: "About Broey. | Artist, Producer & Audio Engineer",
  },
  description: aboutDescription,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Broey. | Artist, Producer & Audio Engineer",
    description: aboutDescription,
    url: "/about",
    siteName: siteConfig.name,
    images: [aboutSocialImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Broey. | Artist, Producer & Audio Engineer",
    description: aboutDescription,
    images: [aboutPortraitImage],
    site: siteConfig.seo.twitterHandle,
    creator: siteConfig.seo.twitterHandle,
  },
};

const findRelease = (slug: string) =>
  releases.find((release) => release.slug === slug);

const selectedReleases = [
  "free",
  "blu",
  "stereo-luv",
  "dancing-dumpster-fire",
]
  .map(findRelease)
  .filter((release): release is ReleaseEntry => Boolean(release));

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
};

const releaseMeta = (release: ReleaseEntry) =>
  [releaseTypeLabel[release.type], release.year].filter(Boolean).join(" / ");

const aboutPillars = [
  {
    title: "Music",
    copy: "Selected releases from the current Broey. era, with artwork, credits, listening links, and release notes.",
    href: "/music",
  },
  {
    title: "Watch",
    copy: "Videos, interviews, podcasts, visual pieces, and other media from the Broey. world.",
    href: "/watch",
  },
  {
    title: "Merch",
    copy: "Limited apparel and objects tied to releases, visuals, and the broader project.",
    href: "/merch",
  },
  {
    title: "Community",
    copy: "Discord, direct sharing, updates, works in progress, and a grounded way to stay connected.",
  },
];

const bioParagraphs = [
  "Broey. is the genre-fluid electronic project of Joe Montaro, an artist, producer, audio engineer, and self-taught multi-instrumentalist from Scranton, Pennsylvania. Built independently over years of releases, collaborations, experiments, and direct-to-fan work, Broey. has grown from a small lofi production project into a broader electronic artist world shaped by house, UK garage, jungle, drum and bass, sax-led texture, guitar, vocal fragments, and raw emotional production.",
  "The project did not start there. Broey.'s earliest releases came from a lofi, chillhop, and instrumental hip-hop world: warm chords, soft guitars, jazz textures, vinyl haze, and wordless scenes built more around feeling than explanation. That music became the foundation, but not the final form.",
  "Over time, Broey. began pushing those instincts into faster, heavier, and more physical spaces. The emotional core stayed intact, but the language changed. Lofi sketches gave way to club pressure. Dreamy loops became house, jungle, UKG, drum and bass, acid, glitches, sax lines, and unpredictable electronic structures.",
  "Along the way, the project developed beyond releases alone. Broey. has built an independent catalog, collaborated with artists and producers across multiple releases, appeared in interviews, earned independent blog coverage, released merch, developed a direct community, and handled much of the creative operation end-to-end: production, mixing, mastering direction, release direction, artwork direction, content, and rollout strategy.",
  "That evolution is the center of the current Broey. era. Releases like Fragments, dancing dumpster fire, STEREO LUV, blu., and FREE show an artist less interested in fitting one genre than in finding the right container for a feeling. Some tracks are polished. Some are raw. Some are built for motion. Some feel like memories breaking apart in real time.",
  "Broey. is not trying to erase the early work. It is part of the story. But the project now points forward: emotionally direct, genre-fluid, producer-led electronic music with a human pulse.",
];

const artistStatement =
  "The early music taught me how to build a feeling. The current music is me pushing that feeling through new pressure: faster drums, heavier movement, stranger textures, and less fear around what a Broey. track is supposed to be. I am not trying to erase where it started. I am just not interested in letting the first chapter define the whole project.";

const artistHighlights = [
  {
    title: "15+ years making music",
    copy: "A self-taught multi-instrumentalist and producer background shaped by years of writing, recording, experimenting, and learning by doing.",
  },
  {
    title: "Independent since 2018",
    copy: "Broey. has grown through singles, EPs, remixes, collaborations, merch, community, and direct-to-fan work across multiple eras of sound.",
  },
  {
    title: "Producer-led from end to end",
    copy: "The project is built around hands-on creative control: production, mixing, mastering direction, sound design, visuals, release planning, content, and community.",
  },
  {
    title: "Covered across the evolution",
    copy: "From early interviews to recent reviews of Fragments and dancing dumpster fire, outside coverage has followed the project's shift into a broader electronic world.",
  },
];

const timelineItems = [
  {
    year: "2018",
    title: "First chapter",
    copy: "Broey. begins releasing music publicly, building an early catalog rooted in lofi, chillhop, instrumental hip-hop, guitar, jazz texture, and wordless emotional production.",
  },
  {
    year: "2019",
    title: "Early recognition",
    copy: "Early interviews with BuzzMusic and W. Wang's World Commentary document the foundation: Scranton roots, self-taught production, multi-instrumental background, and a feeling-first approach to music.",
  },
  {
    year: "2020-2021",
    title: "Collaboration and world-building",
    copy: "Collaborative projects and label releases expand the Broey. world through concept-driven instrumentals, visual storytelling, field recordings, and wider producer-community connections.",
  },
  {
    year: "2022-2023",
    title: "Transition",
    copy: "The sound starts pushing away from lofi comfort zones into heavier drums, bass music, jungle, drum and bass, house, and more physical electronic structures.",
  },
  {
    year: "2024",
    title: "Fragments",
    copy: "Fragments marks a clear bridge into the current Broey. era, drawing coverage from independent music outlets and reframing the project around dance, house, sax, processed vocals, and genre-fluid electronic movement.",
  },
  {
    year: "2025-2026",
    title: "Current era",
    copy: "dancing dumpster fire, STEREO LUV, blu., FREE, and related releases push the project into a rawer, more direct electronic identity: emotional, physical, imperfect, and forward-facing.",
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
            jobTitle: "Artist, producer, audio engineer, and self-taught multi-instrumentalist",
            image: new URL(aboutPortraitImage, siteUrl).toString(),
            homeLocation: {
              "@type": "Place",
              name: "Scranton, Pennsylvania",
            },
          }),
        }}
      />
      <section className="about-page release-detail-shell inner-page" aria-labelledby="about-page-title">
        <PageIntro
          eyebrow="/ about"
          title="About"
          titleId="about-page-title"
          description="The story of Broey., from early lofi foundations to the current genre-fluid electronic era."
        />

        <section className="hero-panel about-hero" aria-labelledby="about-artist-title">
          <div className="about-hero-copy">
            <p className="release-detail-eyebrow">Artist identity</p>
            <h2 id="about-artist-title" className="about-hero-title">
              BROEY.
            </h2>
            <p className="about-hero-positioning">
              Genre-fluid electronic music with a human pulse.
            </p>
            <p className="about-hero-summary">
              Broey. is the genre-fluid electronic project of Joe Montaro, an artist, producer, audio engineer, and self-taught multi-instrumentalist from Scranton, Pennsylvania.
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
              title="Current identity, full journey"
              titleId="about-bio-title"
            />
            <div className="about-bio-copy">
              {bioParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              <p>{artistStatement}</p>
            </div>
          </section>

          <section className="release-detail-section about-highlights-section" aria-labelledby="about-highlights-title">
            <SectionHeader
              eyebrow="Artist Highlights"
              title="Built from the ground up."
              titleId="about-highlights-title"
              description="Broey. is more than a release name. It is an independent artist project built across production, engineering, collaborations, community, merch, content, and direct-to-fan growth."
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
              eyebrow="The Path Here"
              title="From first sketches to the current era."
              titleId="about-timeline-title"
              description="A compressed timeline of the Broey. project, from early foundations to the current electronic sound."
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

          <PressMentionsSection variant="full" />

          <section className="release-detail-section" aria-labelledby="about-find-title">
            <SectionHeader
              eyebrow="What you'll find here"
              title="Music, watch, merch, and community"
              titleId="about-find-title"
            />
            <div className="about-pillar-grid">
              {aboutPillars.map((pillar, index) => {
                const cardContent = (
                  <>
                    <span className="about-pillar-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3>{pillar.title}</h3>
                    <p>{pillar.copy}</p>
                  </>
                );

                return pillar.href ? (
                  <Link key={pillar.title} href={pillar.href} className="about-pillar-card">
                    {cardContent}
                  </Link>
                ) : (
                  <article key={pillar.title} className="about-pillar-card">
                    {cardContent}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="release-detail-section" aria-labelledby="about-selected-title">
            <SectionHeader
              eyebrow="Start here"
              title="Selected Releases"
              titleId="about-selected-title"
              action={
              <Link href="/music" className="release-detail-inline-link">
                Selected Releases
              </Link>
              }
            />
            <div className="about-selected-grid">
              {selectedReleases.map((release) => (
                <Link
                  key={release.slug}
                  href={releaseDetailHref(release)}
                  className="release-detail-more-card"
                >
                  <ReleaseArtwork release={release} className="release-detail-more-artwork" />
                  <div className="min-w-0">
                    <p>{releaseMeta(release)}</p>
                    <h3>{release.title}</h3>
                    <span>{release.mood ?? release.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <EmailSignup id="about-mailing-list" variant="panel" />
        </div>
      </section>
    </>
  );
}
