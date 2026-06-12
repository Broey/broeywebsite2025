import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { socials } from "@/content/socials";
import type { ExternalLinkKind } from "@/content/releases";

const priorityPlatforms = ["Spotify", "Instagram", "YouTube", "TikTok", "Discord"];

const socialKindMap = {
  social: "social",
  streaming: "streaming",
  community: "social",
  "mailing-list": "promo",
  shop: "shop",
} satisfies Record<string, ExternalLinkKind>;

export function StayConnected() {
  const priorityLinks = priorityPlatforms
    .map((platform) => socials.find((link) => link.platform === platform))
    .filter((link): link is NonNullable<typeof link> => Boolean(link));

  return (
    <section aria-labelledby="stay-connected-title">
      <SectionLabel>stay connected</SectionLabel>
      <h2 id="stay-connected-title" className="site-heading text-2xl">
        Follow Broey where it matters most.
      </h2>
      <p className="max-w-2xl text-sm text-[var(--color-muted)]">
        Music, updates, community, and videos from the main Broey channels.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {priorityLinks.map((link) => (
          <ExternalServiceButton
            key={link.platform}
            label={link.platform}
            platform={link.platform}
            url={link.url}
            kind={socialKindMap[link.kind ?? "social"]}
            primary={link.platform === "Spotify"}
            className="w-full"
          />
        ))}
      </div>
    </section>
  );
}
