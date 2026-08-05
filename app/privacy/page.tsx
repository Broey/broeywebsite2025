import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { privacyNotice } from "@/content/privacy";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Notice",
  description: "How the Broey website handles Contact and newsletter information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <article className="privacy-page release-detail-shell inner-page" aria-labelledby="privacy-page-title">
      <PageIntro
        eyebrow="/ privacy"
        title="Privacy Notice"
        titleId="privacy-page-title"
        description={privacyNotice.introduction}
      />

      <div className="privacy-sections">
        {privacyNotice.sections.map((section) => {
          const headingId = `privacy-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

          return (
            <section
              key={section.title}
              className="release-detail-section privacy-section"
              aria-labelledby={headingId}
            >
              <div className="release-detail-section-header">
                <h2 id={headingId} className="release-detail-section-kicker">
                  {section.title}
                </h2>
              </div>
              <div className="release-detail-copy">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="privacy-contact">
        <p>
          Privacy contact: <a href={`mailto:${privacyNotice.contactEmail}`}>{privacyNotice.contactEmail}</a>
        </p>
        <p>Effective {privacyNotice.effectiveDate}</p>
      </footer>
    </article>
  );
}
