import { SectionLabel } from "@/components/ui/SectionLabel";
import { Button } from "@/components/ui/Button";

export function AboutPreview() {
  return (
    <section aria-labelledby="about-preview-title">
      <SectionLabel>about broey</SectionLabel>
      <h2 id="about-preview-title" className="site-heading text-2xl">
        Producer-led electronic music with lo-fi roots and club instincts.
      </h2>
      <p className="max-w-3xl text-sm text-[var(--color-muted)]">
        Broey is the electronic project of Joe Montaro, moving through house, UK garage,
        jungle, drum and bass, sax, guitar, warm low-end, and hands-on production.
      </p>
      <Button href="/about" className="mt-3" variant="secondary">
        About Broey
      </Button>
    </section>
  );
}

