import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  titleId?: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  meta,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={`section-header ${className ?? ""}`}>
      <div className="section-header-copy">
        <SectionLabel tone="section" className="section-header-eyebrow">
          {eyebrow}
        </SectionLabel>
        <h2 id={titleId} className="section-header-title">
          {title}
        </h2>
        {description ? <p className="section-header-description">{description}</p> : null}
      </div>
      {meta || action ? (
        <div className="section-header-aside">
          {meta ? <p className="section-header-meta">{meta}</p> : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}
