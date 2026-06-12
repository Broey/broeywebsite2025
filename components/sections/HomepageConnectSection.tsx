import Link from "next/link";
import { BrandMark } from "@/components/site/BrandMark";
import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { primaryNavItems } from "@/content/navigation";
import type { ExternalLinkKind } from "@/content/releases";
import { socials, type SocialLinkEntry } from "@/content/socials";

const priorityPlatforms = ["Spotify", "Apple Music", "SoundCloud", "Instagram", "YouTube", "Discord"];

const socialKindMap = {
  social: "social",
  streaming: "streaming",
  community: "social",
  "mailing-list": "promo",
  shop: "shop",
} satisfies Record<NonNullable<SocialLinkEntry["kind"]>, ExternalLinkKind>;

const livePriorityLinks = priorityPlatforms
  .map((platform) => socials.find((link) => link.platform === platform && link.url !== "#"))
  .filter((link): link is SocialLinkEntry => Boolean(link));

const liveSocials = socials.filter((item) => item.url && item.url !== "#");

export function HomepageConnectSection() {
  return (
    <section aria-labelledby="homepage-connect-title" className="homepage-connect-section">
      <div className="homepage-section-inner homepage-connect-inner">
        <div className="homepage-connect-grid">
          <div className="homepage-connect-panel">
            <SectionLabel>who / where</SectionLabel>
            <h2
              id="homepage-connect-title"
              className="site-heading mt-3 text-3xl font-semibold text-white md:text-4xl"
            >
              Broey in one place.
            </h2>
            <p className="mt-4 max-w-2xl text-sm text-[var(--color-muted)]">
              Artist and audio engineer from Scranton. Music first; the rest is here when you
              need it.
            </p>
            <div className="homepage-connect-actions">
              <Link href="/about" className="homepage-section-cta">
                About Broey
              </Link>
              <Link href="/contact" className="homepage-section-cta homepage-section-cta-secondary">
                Contact
              </Link>
            </div>
          </div>

          <div className="homepage-connect-panel">
            <SectionLabel>channels</SectionLabel>
            <h3 className="homepage-connect-heading">
              Listen / Follow
            </h3>
            <p className="mt-3 text-sm text-[var(--color-muted)]">
              The main places to listen, follow, or jump into the room.
            </p>
            <div className="homepage-connect-links">
              {livePriorityLinks.map((link) => (
                <ExternalServiceButton
                  key={link.platform}
                  label={link.platform}
                  platform={link.platform}
                  url={link.url}
                  kind={socialKindMap[link.kind ?? "social"]}
                  primary={link.platform === "Spotify"}
                  className="homepage-connect-link"
                />
              ))}
            </div>
          </div>
        </div>

        <footer className="homepage-integrated-footer">
          <div>
            <BrandMark width={108} height={28} />
            <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
              Music, visuals, merch, release notes.
            </p>
          </div>
          <div className="space-y-3 md:text-right">
            <nav aria-label="Homepage footer navigation" className="flex flex-wrap gap-3 text-sm md:justify-end">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-[var(--color-muted)] transition hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {liveSocials.slice(0, 6).map((item) => (
                <Link
                  key={item.platform}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition hover:border-[var(--color-cyan)] hover:text-white"
                >
                  {item.platform}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--color-muted)] md:col-span-2">
            (c) {new Date().getFullYear()} Broey.
          </p>
        </footer>
      </div>
    </section>
  );
}
