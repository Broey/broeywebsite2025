import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  aboutPressItems,
  homePressItems,
  pressArchiveItems,
  pressGroupOrder,
  pressGroups,
  pressMentionsCopy,
  type PressItem,
  type PressItemGroup,
} from "@/content/press";

type PressMentionsSectionProps = {
  variant: "preview" | "about" | "archive";
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date?: string) {
  if (!date) {
    return null;
  }

  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

const pressTypeLabel: Record<PressItem["type"], string> = {
  feature: "Feature",
  review: "Review",
  interview: "Interview",
  podcast: "Podcast",
  video: "Video",
  roundup: "Roundup",
};

function pressLinkAria(item: PressItem, labelOverride?: string) {
  const label = labelOverride ?? item.ctaLabel;
  return `${label}: ${item.title} via ${item.outlet}`;
}

function PressExternalLink({
  item,
  label,
}: {
  item: PressItem;
  label?: string;
}) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="press-mention-link"
      aria-label={pressLinkAria(item, label)}
    >
      {label ?? item.ctaLabel} <span aria-hidden="true">&rarr;</span>
    </a>
  );
}

function getYouTubeEmbedUrl(item: PressItem) {
  if (item.embedUrl) {
    return item.embedUrl;
  }

  return item.videoId
    ? `https://www.youtube-nocookie.com/embed/${item.videoId}`
    : null;
}

function PressFeatured({
  item,
  label = "Featured coverage",
  showTypeTag = false,
}: {
  item: PressItem;
  label?: string;
  showTypeTag?: boolean;
}) {
  const formattedDate = formatDate(item.date);
  const typeLabel = pressTypeLabel[item.type];

  return (
    <article className="press-mention-featured">
      <div className="press-mention-featured-head">
        <div>
          <p className="press-mention-outlet">{item.outlet}</p>
          <p className="press-mention-topic">{item.releaseOrTopic}</p>
        </div>
        <p className="press-mention-featured-label">{label}</p>
        {showTypeTag ? <p className="press-mention-type">{typeLabel}</p> : null}
      </div>

      <h3 className="press-mention-featured-title">{item.title}</h3>

      {item.pullQuote ? (
        <blockquote className="press-mention-featured-quote">
          &quot;{item.pullQuote}&quot;
        </blockquote>
      ) : null}

      <p className="press-mention-summary">{item.summary}</p>

      <div className="press-mention-footer">
        {formattedDate || item.author ? (
          <p className="press-mention-meta">
            {[item.author, formattedDate].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        <PressExternalLink item={item} />
      </div>
    </article>
  );
}

function PressLedgerItem({
  item,
  quiet = false,
  showTypeTag = false,
}: {
  item: PressItem;
  quiet?: boolean;
  showTypeTag?: boolean;
}) {
  const formattedDate = formatDate(item.date);
  const typeLabel = pressTypeLabel[item.type];

  return (
    <article className="press-ledger-item" data-quiet={quiet ? "true" : "false"}>
      <div className="press-ledger-main">
        <p className="press-mention-outlet">{item.outlet}</p>
        <p className="press-mention-topic">{item.releaseOrTopic}</p>
        <h4 className="press-ledger-title">{item.title}</h4>
        {item.pullQuote && !quiet ? (
          <blockquote className="press-ledger-quote">&quot;{item.pullQuote}&quot;</blockquote>
        ) : null}
        <p className="press-ledger-summary">{item.summary}</p>
      </div>

      <div className="press-ledger-aside">
        {showTypeTag ? <p className="press-mention-type">{typeLabel}</p> : null}
        {formattedDate || item.author ? (
          <p className="press-mention-meta">
            {[item.author, formattedDate].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        <PressExternalLink item={item} />
      </div>
    </article>
  );
}

function PressInterviewCard({ item }: { item: PressItem }) {
  const formattedDate = formatDate(item.date);
  const typeLabel = pressTypeLabel[item.type];

  return (
    <article className="press-interview-card">
      <div className="press-mention-card-head">
        <div>
          <p className="press-mention-outlet">{item.outlet}</p>
          <p className="press-mention-topic">{item.releaseOrTopic}</p>
        </div>
        <p className="press-mention-type">{typeLabel}</p>
      </div>

      <h4 className="press-interview-title">{item.title}</h4>

      {item.pullQuote ? (
        <blockquote className="press-interview-quote">&quot;{item.pullQuote}&quot;</blockquote>
      ) : null}

      <p className="press-ledger-summary">{item.summary}</p>

      <div className="press-mention-footer">
        {formattedDate || item.author ? (
          <p className="press-mention-meta">
            {[item.author, formattedDate].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        <PressExternalLink item={item} />
      </div>
    </article>
  );
}

function PressVideoCard({ item }: { item: PressItem }) {
  const embedUrl = getYouTubeEmbedUrl(item);

  return (
    <article className="press-video-card">
      {embedUrl ? (
        <div className="press-video-frame">
          <iframe
            src={embedUrl}
            title={`${item.title} YouTube video`}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : null}

      <div className="press-video-copy">
        <div>
          <p className="press-mention-outlet">{item.outlet}</p>
          <p className="press-mention-topic">{item.releaseOrTopic}</p>
        </div>
        <h4 className="press-video-title">{item.title}</h4>
        <p className="press-ledger-summary">{item.summary}</p>
        <PressExternalLink item={item} label="Watch on YouTube" />
      </div>
    </article>
  );
}

function HomePressTeaser() {
  const { preview } = pressMentionsCopy;

  if (homePressItems.length === 0) {
    return null;
  }

  return (
    <section
      id="selected-press"
      className="homepage-press-section press-mentions press-mentions-preview"
      aria-labelledby="homepage-press-title"
    >
      <div className="homepage-section-inner">
        <div className="homepage-press-strip-header">
          <h2 id="homepage-press-title" className="homepage-press-strip-title">
            {preview.heading}
          </h2>
          <p className="homepage-press-strip-copy">{preview.description}</p>
        </div>

        <div className="homepage-press-callouts" aria-label="Selected press coverage">
          {homePressItems.map((item) => (
            <article key={item.id} className="homepage-press-callout">
              <div className="homepage-press-callout-head">
                <p className="press-mention-outlet">{item.outlet}</p>
                <p className="homepage-press-release-label">
                  <span className="homepage-press-release-kicker">Release</span>
                  <span className="homepage-press-release-separator" aria-hidden="true">
                    &mdash;
                  </span>
                  <span className="homepage-press-release-title">
                    {item.releaseOrTopic}
                  </span>
                </p>
              </div>
              {item.pullQuote ? (
                <blockquote className="homepage-press-callout-quote">
                  &quot;{item.pullQuote}&quot;
                </blockquote>
              ) : null}
              <PressExternalLink item={item} label="Read coverage" />
            </article>
          ))}
        </div>

        <div className="homepage-press-actions" aria-label="More press coverage">
          <Link href={preview.ctaHref} className="homepage-press-archive-link">
            {preview.ctaLabel} <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function AboutPressTeaser() {
  const { about } = pressMentionsCopy;
  const featuredItem = aboutPressItems.find((item) => item.group === "featured-coverage");
  const supportingItems = aboutPressItems
    .filter((item) => item.id !== featuredItem?.id)
    .slice(0, 2);

  if (!featuredItem) {
    return null;
  }

  return (
    <section
      id={about.id}
      className="release-detail-section press-mentions about-press-teaser"
      aria-labelledby="about-press-title"
    >
      <SectionHeader
        eyebrow={about.eyebrow}
        title={about.heading}
        titleId="about-press-title"
        description={about.description}
      />
      <div className="about-press-teaser-grid">
        <article className="about-press-teaser-feature">
          <p className="press-mention-outlet">{featuredItem.outlet}</p>
          <p className="press-mention-topic">Release &mdash; {featuredItem.releaseOrTopic}</p>
          {featuredItem.pullQuote ? (
            <blockquote className="press-ledger-quote">
              &quot;{featuredItem.pullQuote}&quot;
            </blockquote>
          ) : null}
          <p className="press-ledger-summary">{featuredItem.summary}</p>
          <PressExternalLink item={featuredItem} label="Read Coverage" />
        </article>

        <div className="about-press-mini-list">
          {supportingItems.map((item) => (
            <article key={item.id} className="about-press-mini-item">
              <div>
                <p className="press-mention-outlet">{item.outlet}</p>
                <p className="press-mention-topic">Release &mdash; {item.releaseOrTopic}</p>
              </div>
              {item.pullQuote ? (
                <blockquote className="press-mini-quote">
                  &quot;{item.pullQuote}&quot;
                </blockquote>
              ) : null}
            </article>
          ))}
        </div>
      </div>
      <div className="about-press-teaser-footer">
        <Link href={about.ctaHref} className="release-detail-secondary-cta">
          {about.ctaLabel} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </section>
  );
}

function ArchiveGroup({ group }: { group: PressItemGroup }) {
  const groupItems = pressArchiveItems.filter((item) => item.group === group);

  if (groupItems.length === 0) {
    return null;
  }

  const featuredItem = groupItems[0];

  return (
    <section
      className="press-mention-group press-archive-group"
      data-group={group}
      aria-labelledby={`press-group-${group}`}
    >
      <div className="press-mention-group-header">
        <h3 id={`press-group-${group}`}>{pressGroups[group].label}</h3>
        <p>{pressGroups[group].description}</p>
      </div>
      {group === "featured-coverage" && featuredItem ? (
        <PressFeatured item={featuredItem} label="Featured Coverage" showTypeTag />
      ) : null}
      {group === "written-coverage" ? (
        <div className="press-ledger-list press-archive-list">
          {groupItems.map((item) => (
            <PressLedgerItem
              key={item.id}
              item={item}
              quiet={false}
              showTypeTag
            />
          ))}
        </div>
      ) : null}
      {group === "interviews-podcasts" ? (
        <div className="press-interview-list">
          {groupItems.map((item) => (
            <PressInterviewCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
      {group === "video-features" ? (
        <div className="press-video-grid">
          {groupItems.map((item) => (
            <PressVideoCard key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function PressArchive() {
  const { archive } = pressMentionsCopy;

  return (
    <section
      id={archive.id}
      className="release-detail-section press-mentions press-archive-section"
      aria-label="Press coverage archive"
    >
      <div className="press-mentions-groups">
        {pressGroupOrder.map((group) => (
          <ArchiveGroup key={group} group={group} />
        ))}
      </div>
    </section>
  );
}

export function PressMentionsSection({ variant }: PressMentionsSectionProps) {
  if (variant === "preview") {
    return <HomePressTeaser />;
  }

  if (variant === "about") {
    return <AboutPressTeaser />;
  }

  return <PressArchive />;
}
