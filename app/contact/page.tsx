import type { Metadata } from "next";
import { ContactForm } from "@/components/sections/ContactForm";
import { PageIntro } from "@/components/ui/PageIntro";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { createPageMetadata } from "@/content/seo";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact Broey. about music, collaborations, audio work, press, community, or project notes.",
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
        description="Reach out about music, collaborations, audio work, press, community, or project notes."
      />

      <section className="contact-main-panel" aria-label="Contact options">
        <div
          id="contact-form"
          className="release-detail-section contact-form-section"
          aria-labelledby="contact-form-title"
        >
          <SectionHeader
            eyebrow="Message"
            title="Send an Inquiry"
            titleId="contact-form-title"
            description="Use the form for music questions, collaborations, audio work, press, community notes, or anything connected to Broey."
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
            . Join the Broey Discord for community, updates, direct sharing, and a more casual way to stay connected.
          </p>
          <p className="contact-discord-note">
            Good for quick updates, direct sharing, and casual conversation.
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
