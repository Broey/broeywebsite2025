import { EmbedFrame } from "@/components/embed/EmbedFrame";
import { DownloadLinkCard } from "@/components/ui/DownloadLinkCard";
import { shouldExposePublicDisco } from "@/content/release-actions";
import type { ReleaseEntry } from "@/content/releases";

const isRealUrl = (url?: string) => Boolean(url && url !== "#");

export function ReleaseEmbed({ release }: { release: ReleaseEntry }) {
  const exposeDisco = shouldExposePublicDisco(release);
  const visibleEmbed =
    release.embed?.provider === "disco" && !exposeDisco
      ? undefined
      : release.embed;
  const discoLinks = exposeDisco
    ? [
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
      ].filter((link) => isRealUrl(link.url))
    : [];

  if (!visibleEmbed && !discoLinks.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleEmbed ? (
        <EmbedFrame
          title={visibleEmbed.title}
          provider={visibleEmbed.provider}
          embedUrl={visibleEmbed.embedUrl}
          externalUrl={visibleEmbed.externalUrl}
          height={visibleEmbed.height}
          lazy={visibleEmbed.lazy}
          linkKind={visibleEmbed.provider === "youtube" ? "video" : "disco"}
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
