import Link from "next/link";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { archiveReleases } from "@/content/release-filters";
import { releaseDetailHref } from "@/content/release-actions";
import { releases } from "@/content/releases";

const releaseTypeLabel = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
} as const;

const releaseSortValue = (release: (typeof releases)[number]) => {
  if (release.releaseDate) {
    return Date.parse(release.releaseDate);
  }

  return release.year ?? 0;
};

export function MusicArchivePreview() {
  const previewReleases = archiveReleases(releases)
    .filter((release) => !release.featured)
    .sort((a, b) => releaseSortValue(b) - releaseSortValue(a))
    .slice(0, 4);

  return (
    <section aria-labelledby="music-preview-title">
      <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-5">
        <SectionLabel>releases</SectionLabel>
        <Link
          href="/music"
          className="text-xs font-semibold uppercase text-[var(--color-muted)] transition hover:text-[var(--color-amber)]"
        >
          Explore Selected Releases
        </Link>
      </div>
      <h2 id="music-preview-title" className="sr-only">
        Selected releases
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {previewReleases.map((release) => (
          <article
            key={release.slug}
            className="grid grid-cols-[7.25rem_1fr] gap-3 rounded-md border border-white/10 bg-white/[0.025] p-3 transition hover:border-[var(--color-cyan)]/50"
          >
            <ReleaseArtwork release={release} className="aspect-square" />
            <div className="flex min-w-0 flex-col justify-center">
              <h3 className="truncate text-lg font-semibold leading-tight text-white">
                {release.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                {releaseTypeLabel[release.type]}
                {release.year ? ` / ${release.year}` : ""}
              </p>
              <Link
                href={releaseDetailHref(release)}
                className="mt-3 text-xs font-semibold uppercase text-[var(--color-amber)] transition hover:text-white"
              >
                View Release
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
