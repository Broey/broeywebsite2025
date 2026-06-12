import type { ExternalLinkKind } from "@/content/releases";

type ExternalServiceButtonProps = {
  label: string;
  platform: string;
  url?: string;
  kind: ExternalLinkKind;
  primary?: boolean;
  className?: string;
  showActionLabel?: boolean;
};

const kindLabel: Record<ExternalLinkKind, string> = {
  streaming: "Listen",
  disco: "Disco",
  video: "Watch",
  download: "Download",
  promo: "Promo",
  social: "Follow",
  shop: "Shop",
};

export function ExternalServiceButton({
  label,
  platform,
  url,
  kind,
  primary = false,
  className = "",
  showActionLabel = true,
}: ExternalServiceButtonProps) {
  const isPending = !url || url === "#";
  const base =
    "inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition-colors";
  const active = primary
    ? "border-[var(--color-amber)] bg-[var(--color-amber)] text-black hover:bg-amber-300"
    : "border-white/20 bg-white/[0.03] text-[var(--color-text)] hover:border-[var(--color-cyan)] hover:text-white";
  const pending = "cursor-not-allowed border-white/10 bg-white/[0.02] text-[var(--color-muted)]";
  const activeText = kind === "disco" ? platform : `${kindLabel[kind]} ${platform}`;
  const text = isPending ? `${label} coming soon` : showActionLabel ? activeText : platform;

  if (isPending) {
    return (
      <span aria-disabled="true" className={`${base} ${pending} ${className}`}>
        {text}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${active} ${className}`}
    >
      {text}
    </a>
  );
}
