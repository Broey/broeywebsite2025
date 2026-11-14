import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/PageIntro";
import { staticPageMetadata } from "@/content/page-metadata";
import { artistRightsParagraphs } from "@/content/rights";
import { createPageMetadata } from "@/content/seo";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = createPageMetadata(staticPageMetadata.rights);

export default function RightsPage() {
  return (
    <article className="privacy-page release-detail-shell inner-page" aria-labelledby="rights-page-title">
      <PageIntro
        eyebrow="/ rights"
        title="Rights & Licensing"
        titleId="rights-page-title"
        description="Artist rights, AI usage, and licensing inquiries for Broey’s music and protected material."
      />

      <div className="privacy-sections">
        <section className="release-detail-section privacy-section" aria-labelledby="artist-rights-ai-usage">
          <div className="release-detail-section-header">
            <h2 id="artist-rights-ai-usage" className="release-detail-section-kicker">
              Artist Rights & AI Usage
            </h2>
          </div>
          <div className="release-detail-copy">
            {artistRightsParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </section>
      </div>

      <footer className="privacy-contact">
        <p>
          For rights and licensing inquiries, contact{" "}
          <a href={`mailto:${siteConfig.contact.email}`}>{siteConfig.contact.email}</a>.
          {" "}An inquiry does not itself grant permission.
        </p>
      </footer>
    </article>
  );
}
