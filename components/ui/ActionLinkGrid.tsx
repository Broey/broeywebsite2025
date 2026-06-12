import Link from "next/link";
import { ExternalServiceButton } from "@/components/ui/ExternalServiceButton";
import type { SiteLinkEntry } from "@/content/site";
import type { ExternalLinkKind } from "@/content/releases";

const kindMap = {
  internal: "promo",
  social: "social",
  shop: "shop",
  community: "social",
  "mailing-list": "promo",
  booking: "promo",
} satisfies Record<SiteLinkEntry["kind"], ExternalLinkKind>;

export function ActionLinkGrid({ links }: { links: SiteLinkEntry[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => {
        const isInternal = link.url.startsWith("/");

        return (
          <article key={link.label} className="card flex flex-col p-4">
            <p className="text-sm font-semibold text-white">{link.label}</p>
            {link.description ? (
              <p className="mt-2 flex-1 text-sm text-[var(--color-muted)]">{link.description}</p>
            ) : null}
            {isInternal ? (
              <Link
                href={link.url}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition-colors hover:border-[var(--color-cyan)] hover:text-white"
              >
                Open {link.label}
              </Link>
            ) : (
              <ExternalServiceButton
                label={link.label}
                platform={link.label}
                url={link.url}
                kind={kindMap[link.kind]}
                className="mt-4 w-full"
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
