import Link from "next/link";
import { EmailSignup } from "@/components/sections/EmailSignup";

export function HomepageMusicArchiveSection() {
  return (
    <section
      className="homepage-music-signup-section"
      aria-labelledby="homepage-music-archive-title"
    >
      <div className="homepage-music-signup-card">
        <div className="homepage-music-signup-pane homepage-music-archive-pane">
          <p className="release-detail-section-kicker">selected releases</p>
          <h2 id="homepage-music-archive-title" className="homepage-section-heading">
            Broey selects
          </h2>
          <p className="homepage-section-lede">
            Learn more about Broey and explore music and releases spanning house, UK garage,
            breakbeats, and more.
          </p>
          <div className="homepage-section-cta-row">
            <Link href="/music" className="homepage-section-cta">
              Explore the music
            </Link>
            <Link href="/about" className="homepage-section-cta homepage-section-cta-secondary">
              About Broey
            </Link>
          </div>
        </div>
        <EmailSignup
          id="homepage-mailing-list"
          className="homepage-music-signup-pane homepage-split-signup"
          eyebrow="mailing list"
          heading="Join the list"
          body="New tracks, drop notes, odd scraps."
          buttonLabel="Join"
        />
      </div>
    </section>
  );
}
