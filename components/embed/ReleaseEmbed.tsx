import { EmbedFrame } from "@/components/embed/EmbedFrame";
import { DownloadLinkCard } from "@/components/ui/DownloadLinkCard";
import type { ReleaseEntry } from "@/content/releases";

const isRealUrl = (url?: string) => Boolean(url && url !== "#");

export function ReleaseEmbed({ release }: { release: ReleaseEntry }) {
  const discoLinks = [
    {
      label: "Listen on Disco",
      description: "Open the public listening destination for this release.",
      url: release.disco?.publicUrl,
    },
    {
      label: "Promo share",
      description: "Open the shareable promo destination when available.",
      url: release.disco?.promoUrl,
    },
    {
      label: "Download",
      description: "Open download delivery when available.",
      url: release.disco?.downloadUrl,
    },
  ].filter((link) => isRealUrl(link.url));

  return (
    <div className="space-y-3">
      {release.embed ? (
        <EmbedFrame
          title={release.embed.title}
          provider={release.embed.provider}
          embedUrl={release.embed.embedUrl}
          externalUrl={release.embed.externalUrl}
          height={release.embed.height}
          lazy={release.embed.lazy}
          linkKind={release.embed.provider === "youtube" ? "video" : "disco"}
        />
      ) : (
        <EmbedFrame
          title={`${release.title} player/download module pending`}
          provider="Disco"
          externalUrl={release.disco?.publicUrl}
          height={260}
        />
      )}
      {discoLinks.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {discoLinks.map((link) => (
            <DownloadLinkCard key={link.label} {...link} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--color-muted)]">Additional links coming soon.</p>
      )}
    </div>
  );
}
