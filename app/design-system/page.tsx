import type { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";

export const metadata: Metadata = {
  title: "Design System",
  description: "Broey website design-system reference for internal visual QA.",
  robots: {
    index: false,
    follow: false,
  },
};

const tokens = [
  { name: "Primary yellow", value: "--color-amber", color: "var(--color-amber)" },
  { name: "Metadata blue", value: "--color-cyan", color: "var(--color-cyan)" },
  { name: "Muted text", value: "--color-muted", color: "var(--color-muted)" },
  { name: "Dark card", value: "--surface-card", color: "linear-gradient(180deg, rgba(25, 29, 37, 0.72), rgba(12, 14, 18, 0.88))" },
];

export default function DesignSystemPage() {
  return (
    <section className="design-system-page">
      <div className="design-system-intro">
        <SectionLabel>/ design system</SectionLabel>
        <h1 className="system-page-title">Broey visual system</h1>
        <p className="system-body-large">
          A single reference for the site tokens, type scale, labels, buttons, cards,
          image treatment, form fields, and navigation state.
        </p>
      </div>

      <section className="system-section" aria-labelledby="system-type-title">
        <div className="system-section-header">
          <div>
            <SectionLabel tone="section">Typography</SectionLabel>
            <h2 id="system-type-title" className="system-section-title">
              Locked type scale
            </h2>
          </div>
          <p className="system-section-meta">Display / H1 / H2 / Body / Meta</p>
        </div>
        <div className="system-hero-card">
          <div>
            <p className="system-label--section">Current release</p>
            <h3 className="system-display-title">STEREO LUV</h3>
          </div>
          <div>
            <p className="system-label--breadcrumb">/ music</p>
            <h3 className="system-page-title">Music</h3>
            <p className="system-body">
              Selected releases, current-era highlights, and official listening links.
            </p>
          </div>
        </div>
      </section>

      <section className="system-section" aria-labelledby="system-colors-title">
        <div className="system-section-header">
          <div>
            <SectionLabel tone="section">Color</SectionLabel>
            <h2 id="system-colors-title" className="system-section-title">
              Semantic accents
            </h2>
          </div>
        </div>
        <div className="system-token-grid">
          {tokens.map((token) => (
            <article key={token.value} className="system-token">
              <div
                className="system-token-swatch"
                style={{ background: token.color }}
                aria-hidden="true"
              />
              <p className="system-token-name">{token.name}</p>
              <p className="system-token-value">{token.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="system-section" aria-labelledby="system-components-title">
        <div className="system-section-header">
          <div>
            <SectionLabel tone="section">Components</SectionLabel>
            <h2 id="system-components-title" className="system-section-title">
              Buttons, cards, images, fields
            </h2>
          </div>
          <p className="system-section-meta">Shared radius / border / padding</p>
        </div>

        <div className="system-grid">
          <article className="system-card">
            <p className="system-label--breadcrumb">Single / 2026</p>
            <h3 className="system-card-title">Release card</h3>
            <p className="system-body-small">
              Cards share a dark surface, subtle border, compact radius, and amber hover state.
            </p>
            <div className="system-button-row">
              <Button>Play</Button>
              <Button variant="secondary">View Release</Button>
            </div>
          </article>

          <article className="system-card">
            <div className="system-image-frame">
              <Image
                src="/assets/cover-art/latest-release.png"
                alt="Broey latest release artwork."
                width={800}
                height={800}
                sizes="(min-width: 1024px) 26vw, 92vw"
              />
            </div>
            <p className="system-label--section" style={{ marginTop: "1rem" }}>
              Feature image
            </p>
            <h3 className="system-card-title">Artwork frame</h3>
          </article>

          <form className="system-form-card">
            <p className="system-label--section">Form field</p>
            <h3 className="system-card-title">Contact input</h3>
            <label className="system-field" style={{ marginTop: "1rem" }}>
              <span>Email</span>
              <input type="email" placeholder="broey@example.com" />
            </label>
            <label className="system-field" style={{ marginTop: "0.78rem" }}>
              <span>Message</span>
              <textarea placeholder="Short, direct, specific." />
            </label>
            <div className="system-button-row">
              <Button>Send Inquiry</Button>
            </div>
          </form>
        </div>
      </section>

      <section className="system-section" aria-labelledby="system-nav-title">
        <div className="system-section-header">
          <div>
            <SectionLabel tone="section">Navigation</SectionLabel>
            <h2 id="system-nav-title" className="system-section-title">
              Active state
            </h2>
          </div>
        </div>
        <div className="system-card">
          <nav className="system-nav-preview" aria-label="Design-system navigation preview">
            <a className="site-header-nav-link" href="/">
              Home
            </a>
            <a className="site-header-nav-link" href="/music" data-active="true">
              Music
            </a>
            <a className="site-header-nav-link" href="/merch">
              Merch
            </a>
          </nav>
        </div>
      </section>

      <section className="system-section" aria-labelledby="system-links-title">
        <div className="system-section-header">
          <div>
            <SectionLabel tone="section">Links</SectionLabel>
            <h2 id="system-links-title" className="system-section-title">
              Tertiary action
            </h2>
          </div>
        </div>
        <Button href="/music" variant="tertiary">
          View selected releases <span aria-hidden="true">&rarr;</span>
        </Button>
      </section>
    </section>
  );
}
