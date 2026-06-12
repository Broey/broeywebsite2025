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
            Current Broey. catalog
          </h2>
          <p className="homepage-section-lede">
            Current-era singles, EPs, remixes, and release notes.
          </p>
          <Link href="/music" className="homepage-section-cta">
            Explore Selected Releases
          </Link>
        </div>
        <EmailSignup
          id="homepage-mailing-list"
          className="homepage-music-signup-pane homepage-split-signup"
          eyebrow="mailing list"
          heading="Join the Community"
          body="New tracks, drop notes, odd scraps."
          buttonLabel="Join"
        />
      </div>
    </section>
  );
}
