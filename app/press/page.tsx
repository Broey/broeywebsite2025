import type { Metadata } from "next";
import { PressMentionsSection } from "@/components/sections/PressMentionsSection";
import { PageIntro } from "@/components/ui/PageIntro";
import { createPageMetadata } from "@/content/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Press & Coverage",
  description:
    "Press and coverage for Broey, including independent reviews, features, interviews, podcasts, video appearances, and coverage of dancing dumpster fire and Fragments.",
  path: "/press",
});

export default function PressPage() {
  return (
    <section className="press-page release-detail-shell inner-page" aria-labelledby="press-page-title">
      <PageIntro
        eyebrow="/ press"
        title="Press & Coverage"
        titleId="press-page-title"
        description="Reviews, features, interviews, podcasts, and video coverage from across the Broey catalog."
      />
      <PressMentionsSection variant="archive" />
    </section>
  );
}
