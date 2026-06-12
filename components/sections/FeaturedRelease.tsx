import { ReleaseEmbed } from "@/components/embed/ReleaseEmbed";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { ReleaseCard } from "@/components/ui/ReleaseCard";
import type { ReleaseEntry } from "@/content/releases";

type FeaturedReleaseProps = {
  release: ReleaseEntry;
  showEmbed?: boolean;
};

export function FeaturedRelease({ release, showEmbed = false }: FeaturedReleaseProps) {
  return (
    <section aria-labelledby="featured-title">
      <SectionLabel>latest release</SectionLabel>
      <h2 id="featured-title" className="site-heading mb-3 text-2xl">
        {release.title}
      </h2>
      <div className="grid gap-5 md:grid-cols-[2fr_1fr] md:items-end">
        <div>
          <ReleaseCard release={release} featured />
        </div>
        <div className="flex items-end">
          <p className="max-w-sm text-sm text-[var(--color-muted)]">
            A focused preview for the current Broey. release, with the wider catalog just below.
          </p>
        </div>
      </div>
      {showEmbed ? (
        <div className="mt-4">
          <ReleaseEmbed release={release} />
        </div>
      ) : null}
    </section>
  );
}
