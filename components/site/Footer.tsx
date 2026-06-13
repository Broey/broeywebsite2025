import Link from "next/link";
import { EmailSignup } from "@/components/sections/EmailSignup";
import { BrandMark } from "@/components/site/BrandMark";
import { primaryNavItems } from "@/content/navigation";
import { socials } from "@/content/socials";

const listenPlatforms = ["Spotify", "Apple Music", "SoundCloud"] as const;
const followCommunityPlatforms = ["Instagram", "YouTube", "TikTok", "Discord"] as const;

const visibleSocials = new Map<string, (typeof socials)[number]>();

for (const item of socials) {
  if (item.url && item.url !== "#") {
    visibleSocials.set(item.platform, item);
  }
}

const footerLinkSections = [
  {
    id: "footer-listen",
    title: "Listen",
    platforms: listenPlatforms,
  },
  {
    id: "footer-follow-community",
    title: "Follow / Community",
    platforms: followCommunityPlatforms,
  },
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <BrandMark width={108} height={28} />
          <p className="mt-2 max-w-md text-sm text-[var(--color-muted)]">
            Music, visuals, merch, and release notes from Broey.
          </p>
        </div>

        <EmailSignup
          id="site-footer-mailing-list"
          className="site-footer-signup"
          variant="footer"
          heading="Stay close to the next Broey. era."
          body="New releases, merch drops, release notes, and occasional updates."
          hiddenFields={{ source: "site-footer" }}
        />

        <div className="site-footer-link-columns">
          <section className="site-footer-link-group" aria-labelledby="footer-site">
            <h2 id="footer-site" className="site-footer-link-group-title">
              Site
            </h2>
            <nav aria-label="Footer navigation" className="site-footer-link-list">
              {primaryNavItems.map((item) => (
                <Link key={item.href} href={item.href} className="site-footer-link">
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>

          {footerLinkSections.map((section) => (
            <section key={section.id} className="site-footer-link-group" aria-labelledby={section.id}>
              <h2 id={section.id} className="site-footer-link-group-title">
                {section.title}
              </h2>
              <div className="site-footer-link-list">
                {section.platforms.map((platform) => {
                  const item = visibleSocials.get(platform);

                  if (!item) {
                    return null;
                  }

                  return (
                    <a
                      key={item.platform}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="site-footer-link"
                    >
                      {item.platform}
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="site-footer-copyright">
          &copy; {new Date().getFullYear()} Broey.
        </p>
      </div>
    </footer>
  );
}
