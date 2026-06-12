import { existsSync } from "fs";
import { join } from "path";
import { AudioPreview } from "@/components/ui/AudioPreview";
import { Button } from "@/components/ui/Button";
import { ReleaseArtwork } from "@/components/ui/ReleaseArtwork";
import type { ReleaseEntry } from "@/content/releases";
import { siteConfig } from "@/content/site";

const audioPreviewPath = "/assets/audio/latest-release.wav";

const publicFileExists = (assetPath: string) =>
  assetPath.startsWith("/") && existsSync(join(process.cwd(), "public", assetPath));

const isRealUrl = (url?: string) => Boolean(url && url !== "#");

export function Hero({ featured }: { featured: ReleaseEntry }) {
  const primaryListenUrl =
    featured.links.find((link) => link.primary && isRealUrl(link.url))?.url ??
    featured.links.find((link) => isRealUrl(link.url))?.url ??
    "/music";
  const releaseMeta = [featured.type, featured.year].filter(Boolean).join(" / ");
  const hasAudioPreview = publicFileExists(audioPreviewPath);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative mb-8 overflow-hidden border-b border-white/10 py-10 md:py-14"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(115deg,rgba(211,169,91,0.13),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_48%)]" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,0.85fr)] lg:items-center">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase text-[var(--color-cyan)]">
            Broey. / Independent electronic artist
          </p>
          <h1 id="hero-title" className="hero-title site-heading mt-4 font-bold">
            Electronic music with feeling, motion, and clean low-end pressure.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-[var(--color-muted)] sm:text-lg">
            {siteConfig.shortBio}
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button href={primaryListenUrl}>Listen to Latest Release</Button>
            <Button
              href="/music"
              variant="secondary"
              className="bg-transparent text-xs uppercase hover:text-[var(--color-amber)]"
            >
              Explore Selected Releases
            </Button>
          </div>

          <dl className="mt-8 grid max-w-2xl gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--color-muted)]">
                Current release
              </dt>
              <dd className="mt-1 text-lg font-semibold text-white">{featured.title}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--color-muted)]">
                Format
              </dt>
              <dd className="mt-1 text-lg font-semibold text-white">{releaseMeta}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-[var(--color-muted)]">
                Follow / buy
              </dt>
              <dd className="mt-1 text-lg font-semibold text-white">Music, merch, socials</dd>
            </div>
          </dl>
        </div>

        <div className="mx-auto w-full max-w-[34rem]">
          <div className="border border-white/10 bg-black/25 p-3 shadow-2xl shadow-black/45">
            <ReleaseArtwork release={featured} className="aspect-square rounded-sm" />
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold uppercase text-[var(--color-cyan)]">
                Latest release
              </p>
              <h2 className="site-heading mt-1 text-3xl font-semibold">{featured.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{featured.description}</p>
              {hasAudioPreview ? (
                <div className="mt-4">
                  <AudioPreview
                    src={audioPreviewPath}
                    label={`Preview ${featured.title} by Broey.`}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
