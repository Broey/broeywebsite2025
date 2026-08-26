import type { ReleaseEntry, ReleaseStatus } from "@/content/releases";

const statusLabels: Record<ReleaseStatus, string> = {
  unreleased: "Unreleased",
};

type Props = {
  release: Pick<ReleaseEntry, "status" | "year">;
  className?: string;
  showEra?: boolean;
};

export function ReleaseStatusMeta({ release, className, showEra = true }: Props) {
  if (!release.status) {
    return null;
  }

  const label = statusLabels[release.status];
  const era = showEra && release.year ? String(release.year) : undefined;

  return (
    <div
      className={["release-status-meta", className].filter(Boolean).join(" ")}
      aria-label={[label, era ? `${era} catalog era` : undefined].filter(Boolean).join(", ")}
      data-release-status={release.status}
    >
      <span className="release-status-pill">{label}</span>
      {era ? (
        <>
          <span className="release-status-separator" aria-hidden="true">·</span>
          <span className="release-status-era">{era}</span>
        </>
      ) : null}
    </div>
  );
}
