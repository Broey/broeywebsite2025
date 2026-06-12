import Link from "next/link";
import { MerchCard } from "@/components/ui/MerchCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { merch } from "@/content/merch";

export function MerchPreview() {
  return (
    <section aria-labelledby="merch-preview-title" className="home-merch-section">
      <div className="home-merch-section-inner">
        <div className="flex items-end justify-between gap-3 border-t border-white/10 pt-4">
          <SectionLabel>merch</SectionLabel>
          <Link
            href="/merch"
            className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)] transition hover:text-[var(--color-amber)]"
          >
            View merch store
          </Link>
        </div>
        <h2 id="merch-preview-title" className="sr-only">
          Broey gear
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {merch.slice(0, 4).map((item) => (
            <MerchCard key={item.slug} item={item} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
