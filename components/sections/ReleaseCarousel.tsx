import Link from "next/link";
import { existsSync } from "fs";
import { join } from "path";
import { ReleaseCarouselShell } from "@/components/sections/ReleaseCarouselShell";
import { AudioPreview } from "@/components/ui/AudioPreview";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { archiveReleases } from "@/content/release-filters";
import { releases } from "@/content/releases";
import type { ReleaseEntry } from "@/content/releases";

const releaseTypeLabel: Record<ReleaseEntry["type"], string> = {
  single: "Single",
  ep: "EP",
  remix: "Remix",
  mix: "Mix",
  set: "Set",
};

const isRealUrl = (url?: string) => Boolean(url && url !== "#");

const publicFileExists = (assetPath?: string) =>
  Boolean(
    assetPath &&
      assetPath.startsWith("/") &&
      existsSync(join(process.cwd(), "public", assetPath)),
  );

const releaseSortValue = (release: ReleaseEntry) => {
  if (release.releaseDate) {
    return Date.parse(release.releaseDate);
  }

  return release.year ?? 0;
};

const releaseHref = (release: ReleaseEntry) => {
  const primaryLink =
    release.links.find((link) => link.primary && isRealUrl(link.url)) ??
    release.links.find((link) => isRealUrl(link.url));

  return primaryLink?.url ?? release.disco?.publicUrl ?? "/music";
};

const releaseCtaLabel = (release: ReleaseEntry) => {
  const primaryLink =
    release.links.find((link) => link.primary && isRealUrl(link.url)) ??
    release.links.find((link) => isRealUrl(link.url));

  if (primaryLink) {
    return `Open in ${primaryLink.platform}`;
  }

  return release.embed?.provider === "disco" || release.disco ? "Open in Disco" : "View selected releases";
};

export function ReleaseCarousel() {
  const carouselTitleId = "release-carousel-title";
  const sortedReleases = archiveReleases(releases).sort((a, b) => {
    if (a.featured && !b.featured) {
      return -1;
    }

    if (!a.featured && b.featured) {
      return 1;
    }

    return releaseSortValue(b) - releaseSortValue(a);
  });

  return (
    <section aria-labelledby={carouselTitleId}>
      <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <SectionLabel>selected releases</SectionLabel>
          <h2 id={carouselTitleId} className="site-heading mt-2 text-3xl font-semibold">
            Swipe through the selected catalog
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
            A tactile listening surface for Broey. releases, with the selected catalog still
            available for deeper browsing.
          </p>
        </div>
        <Link
          href="/music"
          className="text-xs font-semibold uppercase text-[var(--color-amber)] transition hover:text-white"
        >
          View selected releases
        </Link>
      </div>

      <ReleaseCarouselShell labelledBy={carouselTitleId}>
        {sortedReleases.map((release) => {
          const meta = [releaseTypeLabel[release.type], release.year].filter(Boolean).join(" / ");
          const href = releaseHref(release);
          const hasExternalHref = isRealUrl(href);
          const hasAudioPreview = publicFileExists(release.audioPreview);
          const isFeatured = Boolean(release.featured);

          return (
            <article
              key={release.slug}
              data-carousel-card
              data-active={isFeatured ? "true" : "false"}
              className={`release-carousel-card group flex w-[min(84vw,28rem)] shrink-0 snap-center flex-col rounded-md border bg-white/[0.055] p-3 shadow-2xl shadow-black/35 backdrop-blur-xl transition duration-300 hover:border-[var(--color-cyan)]/60 sm:p-4 md:w-[28rem] ${
                isFeatured ? "border-[var(--color-cyan)]/55" : "border-white/10"
              }`}
            >
              <ReleaseArtwork release={release} />
              <div className="flex flex-1 flex-col pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-[var(--color-cyan)]">
                      {meta}
                    </p>
                    <h3 className="site-heading mt-1 truncate text-2xl font-semibold text-white">
                      {release.title}
                    </h3>
                  </div>
                  {isFeatured ? (
                    <span className="shrink-0 rounded-full border border-[var(--color-cyan)]/45 px-2 py-1 text-[0.65rem] font-semibold uppercase text-[var(--color-cyan)]">
                      Featured
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 min-h-[3.9rem] text-sm text-[var(--color-muted)]">
                  {release.mood ?? release.description}
                </p>
                <div className="mt-auto pt-4">
                  {hasAudioPreview ? (
                    <AudioPreview
                      src={release.audioPreview!}
                      label={`Preview ${release.title} by Broey.`}
                    />
                  ) : (
                    <Link
                      href={hasExternalHref ? href : "/music"}
                      target={hasExternalHref ? "_blank" : undefined}
                      rel={hasExternalHref ? "noopener noreferrer" : undefined}
                      className="inline-flex w-full items-center justify-center rounded-full bg-[var(--color-amber)] px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    >
                      {releaseCtaLabel(release)}
                    </Link>
                  )}
                  {hasAudioPreview ? (
                    <Link
                      href={hasExternalHref ? href : "/music"}
                      target={hasExternalHref ? "_blank" : undefined}
                      rel={hasExternalHref ? "noopener noreferrer" : undefined}
                      className="mt-3 inline-flex text-sm font-semibold text-[var(--color-text)] underline-offset-4 transition hover:text-[var(--color-cyan)] hover:underline"
                    >
                      {releaseCtaLabel(release)}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </ReleaseCarouselShell>
    </section>
  );
}
