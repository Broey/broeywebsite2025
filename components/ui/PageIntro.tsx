import { SectionLabel } from "@/components/ui/SectionLabel";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  titleId?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  titleId,
}: PageIntroProps) {
  return (
    <header className="page-intro">
      <SectionLabel>{eyebrow}</SectionLabel>
      <h1 id={titleId} className="page-intro-title">
        {title}
      </h1>
      <p className="page-intro-copy">{description}</p>
    </header>
  );
}
