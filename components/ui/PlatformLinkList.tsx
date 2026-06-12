import type { ExternalLink, ExternalLinkKind } from "@/content/releases";
import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";

type PlatformLinkListProps = {
  links: ExternalLink[];
  groupByKind?: boolean;
  limit?: number;
  hidePending?: boolean;
  showActionLabel?: boolean;
};

const groupLabels: Record<ExternalLinkKind, string> = {
  streaming: "Streaming",
  disco: "Disco",
  video: "Video",
  download: "Downloads",
  promo: "Promo",
  social: "Social",
  shop: "Shop",
};

export function PlatformLinkList({
  links,
  groupByKind = false,
  limit,
  hidePending = false,
  showActionLabel = true,
}: PlatformLinkListProps) {
  const availableLinks = hidePending ? links.filter((link) => link.url && link.url !== "#") : links;
  const visibleLinks = typeof limit === "number" ? availableLinks.slice(0, limit) : availableLinks;

  if (!visibleLinks.length) {
    return hidePending ? null : <p className="text-xs text-[var(--color-muted)]">Platform links coming soon.</p>;
  }

  if (!groupByKind) {
    return (
      <div className="flex flex-wrap gap-2">
        {visibleLinks.map((link) => (
          <ExternalServiceButton
            key={`${link.platform}-${link.kind}`}
            {...link}
            showActionLabel={showActionLabel}
          />
        ))}
      </div>
    );
  }

  const groups = visibleLinks.reduce<Partial<Record<ExternalLinkKind, ExternalLink[]>>>(
    (acc, link) => {
      acc[link.kind] = [...(acc[link.kind] ?? []), link];
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-3">
      {Object.entries(groups).map(([kind, groupLinks]) => (
        <div key={kind}>
          <p className="mb-2 text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
            {groupLabels[kind as ExternalLinkKind]}
          </p>
          <div className="flex flex-wrap gap-2">
            {groupLinks.map((link) => (
              <ExternalServiceButton
                key={`${link.platform}-${link.kind}`}
                {...link}
                showActionLabel={showActionLabel}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
