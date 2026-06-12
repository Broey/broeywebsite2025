type EmbedPreviewPanelProps = {
  provider: string;
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function EmbedPreviewPanel({
  provider,
  eyebrow,
  title,
  description,
  children,
}: EmbedPreviewPanelProps) {
  return (
    <div className="artist-panel p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-cyan)]">
          {eyebrow ?? `${provider} player`}
        </p>
        <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">{description}</p>
      </div>
      {children}
    </div>
  );
}
