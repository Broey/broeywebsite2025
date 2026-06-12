import type { Metadata } from "next";
import {
  clipPlaceholders,
  featuredVideo,
  videoLinks,
} from "@/content/watch";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Watch",
  description:
    "Broey videos, visualizers, clips, reels, and behind-the-scenes motion work.",
  path: "/watch",
});

export default function WatchPage() {
  return (
    <section className="release-detail-shell">
      <div className="release-detail-kicker-row">
        <p className="release-detail-kicker">/ watch</p>
      </div>

      <section className="release-detail-hero" aria-labelledby="watch-title">
        <article className="release-detail-info-panel">
          <p className="release-detail-eyebrow">WATCH</p>
          <h1 id="watch-title" className="release-detail-title">
            Watch
          </h1>
          <p className="release-detail-description">{featuredVideo.description}</p>
          <div className="release-detail-cta-row">
            {featuredVideo.watchUrl ? (
              <a
                href={featuredVideo.watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="release-detail-primary-cta"
              >
                Open YouTube
              </a>
            ) : null}
          </div>
        </article>

        <div className="release-detail-artwork-panel">
          <div className="release-detail-artwork-frame">
            {featuredVideo.youtubeId ? (
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${featuredVideo.youtubeId}`}
                title={featuredVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full min-h-[280px] flex-col justify-end bg-[radial-gradient(circle_at_30%_20%,rgba(92,247,255,0.24),transparent_34%),linear-gradient(135deg,rgba(10,12,24,0.94),rgba(21,23,45,0.98))] p-6">
                <p className="release-detail-section-kicker">Featured video</p>
                <h2 className="site-heading mt-3 text-3xl">{featuredVideo.title}</h2>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="release-detail-lower-grid">
        <section className="release-detail-section" aria-labelledby="watch-links-title">
          <div className="release-detail-section-header">
            <h2 id="watch-links-title" className="release-detail-section-kicker">
              video channels
            </h2>
          </div>
          <div className="release-detail-copy">
            {videoLinks.map((link) => (
              <p key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="release-detail-inline-link"
                >
                  {link.label}
                </a>
                {link.description ? ` - ${link.description}` : null}
              </p>
            ))}
          </div>
        </section>

        <section className="release-detail-section" aria-labelledby="watch-clips-title">
          <div className="release-detail-section-header">
            <h2 id="watch-clips-title" className="release-detail-section-kicker">
              in the queue
            </h2>
          </div>
          <dl className="release-detail-definition-list">
            {clipPlaceholders.map((clip) => (
              <div key={clip.title}>
                <dt>{clip.title}</dt>
                <dd>
                  {clip.description} <span>{clip.status}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </section>
  );
}
