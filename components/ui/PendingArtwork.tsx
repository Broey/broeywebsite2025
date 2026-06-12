type PendingArtworkProps = {
  alt: string;
  label: string;
  eyebrow?: string;
  className?: string;
};

export function PendingArtwork({
  alt,
  label,
  eyebrow = "Broey.",
  className = "",
}: PendingArtworkProps) {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      role="img"
      aria-label={alt}
      className={`pending-artwork relative overflow-hidden rounded-lg border border-white/10 ${className}`}
    >
      <div className="absolute inset-0 pending-artwork-noise" aria-hidden="true" />
      <div className="pending-artwork-ring" aria-hidden="true" />
      <div className="relative flex h-full min-h-[11rem] flex-col justify-between p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase text-white/65">
            {eyebrow}
          </p>
          <span className="pending-artwork-initials" aria-hidden="true">
            {initials || "B."}
          </span>
        </div>
        <div>
          <p className="site-heading text-2xl font-semibold leading-tight text-[var(--color-text)]">
            {label}
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-amber)]">
            Catalog tile
          </p>
        </div>
      </div>
    </div>
  );
}
