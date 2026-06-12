import type { Metadata } from "next";
import { PressMentionsSection } from "@/components/sections/PressMentionsSection";
import { PageIntro } from "@/components/ui/PageIntro";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Press",
  description:
    "Press and mentions for Broey., including independent reviews, features, interviews, and coverage of dancing dumpster fire, Fragments, and the project's evolution.",
  path: "/press",
});

export default function PressPage() {
  return (
    <section className="press-page release-detail-shell inner-page" aria-labelledby="press-page-title">
      <PageIntro
        eyebrow="/ press"
        title="Press & Mentions"
        titleId="press-page-title"
        description="Independent coverage of Broey. releases, interviews, and the story around the current electronic era."
      />
      <PressMentionsSection variant="archive" />
    </section>
  );
}
