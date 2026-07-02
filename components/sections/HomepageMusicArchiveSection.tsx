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
            House, UKG, Breakbeats, and the sounds that define Broey.
          </p>
          <Link href="/music" className="homepage-section-cta">
            Browse the catalog
          </Link>
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
