import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import type { ExternalLinkKind } from "@/content/releases";

type EmbedFrameProps = {
  title: string;
  provider: string;
  embedUrl?: string;
  externalUrl?: string;
  height?: number;
  lazy?: boolean;
  linkKind?: ExternalLinkKind;
};

export function EmbedFrame({
  title,
  provider,
  embedUrl,
  externalUrl,
  height = 320,
  lazy = true,
  linkKind = "disco",
}: EmbedFrameProps) {
  const hasEmbed = Boolean(embedUrl && embedUrl !== "#");

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30 p-2 shadow-2xl shadow-black/20">
      {hasEmbed ? (
        <iframe
          title={title}
          src={embedUrl}
          width="100%"
          height={height}
          loading={lazy ? "lazy" : "eager"}
          className="block w-full max-w-full rounded-lg border-0 bg-black/30"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <div
          className="pending-artwork flex min-h-[12rem] flex-col justify-between rounded-lg border border-white/10 p-4"
          style={{ minHeight: `${Math.min(height, 360)}px` }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-cyan)]">
              {provider} embed
            </p>
            <p className="mt-3 text-lg font-semibold text-white">{title}</p>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Player embed pending. Native title and description stay visible for SEO.
            </p>
          </div>
          <ExternalServiceButton
            label={provider}
            platform={provider}
            url={externalUrl}
            kind={linkKind}
            className="mt-4 w-fit"
          />
        </div>
      )}
    </div>
  );
}
