import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  aboutPressItems,
  homePressItems,
  pressGroupOrder,
  pressGroups,
  pressMentionsCopy,
  type PressItem,
} from "@/content/press";

type PressMentionsSectionProps = {
  variant: "preview" | "full";
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

function PressMentionCard({
  item,
  compact = false,
}: {
  item: PressItem;
  compact?: boolean;
}) {
  const formattedDate = formatDate(item.date);
  const ariaLabel = `${item.ctaLabel}: ${item.title} via ${item.outlet}`;

  return (
    <article className="press-mention-card" data-compact={compact ? "true" : "false"}>
      <div className="press-mention-card-head">
        <p className="press-mention-outlet">{item.outlet}</p>
        <p className="press-mention-topic">{item.releaseOrTopic}</p>
      </div>

      {!compact ? <h3 className="press-mention-title">{item.title}</h3> : null}

      {item.pullQuote ? (
        <blockquote className="press-mention-quote">&quot;{item.pullQuote}&quot;</blockquote>
      ) : null}

      <p className="press-mention-summary">{item.summary}</p>

      <div className="press-mention-footer">
        {!compact && (formattedDate || item.author) ? (
          <p className="press-mention-meta">
            {[item.author, formattedDate].filter(Boolean).join(" / ")}
          </p>
        ) : null}
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="press-mention-link"
          aria-label={ariaLabel}
        >
          {item.ctaLabel} <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>
  );
}

function PressMentionFeatured({ item }: { item: PressItem }) {
  const formattedDate = formatDate(item.date);
  const ariaLabel = `${item.ctaLabel}: ${item.title} via ${item.outlet}`;

  return (
    <article className="press-mention-featured">
      <div className="press-mention-featured-head">
        <div>
          <p className="press-mention-outlet">{item.outlet}</p>
          <p className="press-mention-topic">{item.releaseOrTopic}</p>
        </div>
        <p className="press-mention-featured-label">Featured coverage</p>
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
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="press-mention-link"
          aria-label={ariaLabel}
        >
          {item.ctaLabel} <span aria-hidden="true">&rarr;</span>
        </a>
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
  const ariaLabel = `${item.ctaLabel}: ${item.title} via ${item.outlet}`;

  return (
    <article className="press-ledger-item" data-quiet={quiet ? "true" : "false"}>
      <div className="press-ledger-main">
        <p className="press-mention-outlet">{item.outlet}</p>
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
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className="press-mention-link"
          aria-label={ariaLabel}
        >
          {item.ctaLabel} <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </article>
  );
}

export function PressMentionsSection({ variant }: PressMentionsSectionProps) {
  if (variant === "preview") {
    const { preview } = pressMentionsCopy;

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
            action={
              <Link href={preview.ctaHref} className="homepage-section-cta homepage-section-cta-secondary">
                {preview.ctaLabel}
              </Link>
            }
          />
          <div className="press-mentions-grid press-mentions-preview-grid">
            {homePressItems.map((item) => (
              <PressMentionCard key={item.id} item={item} compact />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const { full } = pressMentionsCopy;
  const featuredItem = aboutPressItems.find((item) => item.group === "current-era");
  const ledgerGroups = pressGroupOrder.filter(
    (group) => group === "fragments" || group === "origin-story",
  );

  return (
    <section
      id={full.id}
      className="release-detail-section press-mentions press-mentions-full"
      aria-labelledby="about-press-title"
    >
      <SectionHeader
        eyebrow={full.eyebrow}
        title={full.heading}
        titleId="about-press-title"
        description={full.description}
      />
      <div className="press-mentions-groups">
        {featuredItem ? <PressMentionFeatured item={featuredItem} /> : null}

        {ledgerGroups.map((group) => {
          const groupItems = aboutPressItems.filter((item) => item.group === group);

          if (groupItems.length === 0) {
            return null;
          }

          return (
            <section
              key={group}
              className="press-mention-group"
              data-group={group}
              aria-labelledby={`press-group-${group}`}
            >
              <div className="press-mention-group-header">
                <h3 id={`press-group-${group}`}>{pressGroups[group].label}</h3>
                <p>{pressGroups[group].description}</p>
              </div>
              <div className="press-ledger-list">
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
        })}
      </div>
    </section>
  );
}
