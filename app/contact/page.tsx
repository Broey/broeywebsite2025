import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/ContactForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/content/seo";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact Broey about music, collaborations, audio work, press, or direct notes.",
  path: "/contact",
});

const discordLink = siteConfig.businessLinks.find((link) => link.label === "Join the Community");
const contactEmail = siteConfig.contact.email;

export default function ContactPage() {
  return (
    <section className="contact-page release-detail-shell inner-page" aria-labelledby="contact-page-title">
      <PageIntro
        eyebrow="/ contact"
        title="Contact"
        titleId="contact-page-title"
        description="Reach out about music, collaborations, mixing or audio work, press, or direct inquiries."
      />

      <section className="contact-main-panel" aria-label="Contact options">
        <div
          id="contact-form"
          className="release-detail-section contact-form-section"
          aria-labelledby="contact-form-title"
        >
          <SectionHeader
            eyebrow="Message"
            title="Send a Note"
            titleId="contact-form-title"
          />
          <ContactForm />
        </div>

        <aside className="release-detail-section contact-discord-panel" aria-labelledby="contact-discord-title">
          <SectionHeader
            eyebrow="Community"
            title="Prefer Discord?"
            titleId="contact-discord-title"
          />
          <p>
            For direct inquiries, email{" "}
            <a href={`mailto:${contactEmail}`} className="contact-inline-link">
              {contactEmail}
            </a>
            . Join the Broey Discord to share tracks, catch release notes, and talk casually.
          </p>
          {discordLink?.url && discordLink.url !== "#" ? (
            <a
              href={discordLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-discord-action"
            >
              Join the Community
            </a>
          ) : null}
        </aside>
      </section>
    </section>
  );
}
