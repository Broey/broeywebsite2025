type DownloadLinkCardProps = {
  label: string;
  description: string;
  url?: string;
};

export function DownloadLinkCard({ label, description, url }: DownloadLinkCardProps) {
  const isPending = !url || url === "#";

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{description}</p>
      {isPending ? (
        <span className="mt-3 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)]">
          Pending
        </span>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex rounded-full border border-[var(--color-amber)] bg-[var(--color-amber)] px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-300"
        >
          Open
        </a>
      )}
    </div>
  );
}
