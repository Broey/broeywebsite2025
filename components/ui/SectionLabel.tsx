type SectionLabelProps = {
  children: React.ReactNode;
  tone?: "breadcrumb" | "section";
  className?: string;
};

export function SectionLabel({
  children,
  tone = "breadcrumb",
  className,
}: SectionLabelProps) {
  const toneClass =
    tone === "section" ? "system-label--section" : "system-label--breadcrumb";

  return <p className={`${toneClass} mb-3 ${className ?? ""}`}>{children}</p>;
}
