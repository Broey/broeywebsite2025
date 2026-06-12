"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileMenu } from "@/components/site/MobileMenu";
import { BrandMark } from "@/components/site/BrandMark";
import { primaryNavItems } from "@/content/navigation";

export function Header() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <BrandMark width={110} height={28} priority />
        <nav className="site-header-nav" aria-label="Primary navigation">
          {primaryNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="site-header-nav-link"
              data-active={isActive(item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <MobileMenu />
      </div>
    </header>
  );
}
