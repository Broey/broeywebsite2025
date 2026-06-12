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

function pressLinkAria(item: PressItem) {
  return `${item.ctaLabel}: ${item.title} via ${item.outlet}`;
}

function PressExternalLink({ item }: { item: PressItem }) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="press-mention-link"
      aria-label={pressLinkAria(item)}
    >
      {item.ctaLabel} <span aria-hidden="true">&rarr;</span>
    </a>
  );
}

function PressFeatured({
  item,
  label = "Featured coverage",
}: {
  item: PressItem;
  label?: string;
}) {
  const formattedDate = formatDate(item.date);

  return (
    <article className="press-mention-featured">
      <div className="press-mention-featured-head">
        <div>
          <p className="press-mention-outlet">{item.outlet}</p>
          <p className="press-mention-topic">{item.releaseOrTopic}</p>
        </div>
        <p className="press-mention-featured-label">{label}</p>
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
}: {
  item: PressItem;
  quiet?: boolean;
}) {
  const formattedDate = formatDate(item.date);

  return (
    <article className="press-ledger-item" data-quiet={quiet ? "true" : "false"}>
      <div className="press-ledger-main">
        <p className="press-mention-outlet">{item.outlet}</p>
        <p className="press-mention-topic">{item.releaseOrTopic}</p>
        {item.pullQuote && !quiet ? (
          <blockquote className="press-ledger-quote">&quot;{item.pullQuote}&quot;</blockquote>
        ) : null}
        <p className="press-ledger-summary">{item.summary}</p>
      </div>

      <div className="press-ledger-aside">
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

function HomePressTeaser() {
  const { preview } = pressMentionsCopy;
  const featuredItem = homePressItems[0];
  const supportingItems = homePressItems.slice(1);

  if (!featuredItem) {
    return null;
  }

  return (
    <section
      className="homepage-press-section press-mentions press-mentions-preview"
      aria-labelledby="homepage-press-title"
    >
      <div className="homepage-section-inner">
        <SectionHeader
          eyebrow={preview.eyebrow}
          title={preview.heading}
          titleId="homepage-press-title"
          description={preview.description}
        />
        <div className="homepage-press-teaser">
          <article className="homepage-press-feature">
            {featuredItem.pullQuote ? (
              <blockquote className="homepage-press-quote">
                &quot;{featuredItem.pullQuote}&quot;
              </blockquote>
            ) : null}
            <div className="homepage-press-actions">
              <PressExternalLink item={featuredItem} />
              <Link href={preview.ctaHref} className="press-mention-link press-mention-link-secondary">
                {preview.ctaLabel} <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </article>

          {supportingItems.length > 0 ? (
            <div className="homepage-press-support" aria-label="More press mentions">
              <p className="homepage-press-support-label">Also mentioned</p>
              {supportingItems.map((item) => (
                <article key={item.id} className="homepage-press-row">
                  <div>
                    <p className="press-mention-outlet">{item.outlet}</p>
                    <p className="press-mention-topic">{item.releaseOrTopic}</p>
                  </div>
                  <PressExternalLink item={item} />
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AboutPressTeaser() {
  const { about } = pressMentionsCopy;
  const featuredItem = aboutPressItems.find((item) => item.group === "current-era");
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
        action={
          <Link href={about.ctaHref} className="release-detail-inline-link">
            {about.ctaLabel}
          </Link>
        }
      />
      <div className="about-press-teaser-grid">
        <article className="about-press-teaser-feature">
          <p className="press-mention-outlet">{featuredItem.outlet}</p>
          {featuredItem.pullQuote ? (
            <blockquote className="press-ledger-quote">
              &quot;{featuredItem.pullQuote}&quot;
            </blockquote>
          ) : null}
          <p className="press-ledger-summary">{featuredItem.summary}</p>
          <PressExternalLink item={featuredItem} />
        </article>

        <div className="about-press-mini-list">
          {supportingItems.map((item) => (
            <article key={item.id} className="about-press-mini-item">
              <p className="press-mention-outlet">{item.outlet}</p>
              <p className="press-mention-topic">{item.releaseOrTopic}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArchiveGroup({ group }: { group: PressItemGroup }) {
  const groupItems = pressArchiveItems.filter((item) => item.group === group);

  if (groupItems.length === 0) {
    return null;
  }

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
      <div className="press-ledger-list press-archive-list">
        {groupItems.map((item) => (
          <PressLedgerItem
            key={item.id}
            item={item}
            quiet={group === "origin-story"}
          />
        ))}
      </div>
    </section>
  );
}

function PressArchive() {
  const { archive } = pressMentionsCopy;
  const featuredItem = pressArchiveItems.find((item) => item.group === "current-era");
  const archiveGroups = pressGroupOrder.filter(
    (group) => group !== "current-era" && group !== "media-appearance",
  );

  return (
    <section
      id={archive.id}
      className="release-detail-section press-mentions press-archive-section"
      aria-labelledby="press-archive-title"
    >
      <SectionHeader
        eyebrow={archive.eyebrow}
        title={archive.heading}
        titleId="press-archive-title"
        description={archive.description}
      />
      <div className="press-mentions-groups">
        {featuredItem ? <PressFeatured item={featuredItem} label="Featured current-era coverage" /> : null}
        {archiveGroups.map((group) => (
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
