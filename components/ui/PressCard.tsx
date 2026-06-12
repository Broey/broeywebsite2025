import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import type { PressEntry } from "@/content/press";

export function PressCard({ item }: { item: PressEntry }) {
  return (
    <article className="card flex h-full flex-col p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-amber)]">
        {item.type} / {item.outlet}
      </p>
      <h3 className="mt-3 text-lg font-semibold leading-tight text-white">{item.title}</h3>
      <p className="mt-2 flex-1 text-sm text-[var(--color-muted)]">{item.summary}</p>
      <ExternalServiceButton
        label={item.ctaLabel}
        platform={item.outlet}
        url={item.href}
        kind={item.type === "video" ? "video" : "promo"}
        className="mt-4 w-full"
      />
    </article>
  );
}
