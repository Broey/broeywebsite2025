"use client";

import Link from "next/link";
import { useState } from "react";
import { mobileNavItems } from "@/content/navigation";

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="site-menu">
      <button
        className="site-menu-button"
        onClick={() => setOpen((state) => !state)}
        aria-expanded={open}
        aria-controls="mobile-menu"
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span className="site-menu-icon" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
      {open ? (
        <div id="mobile-menu" className="site-menu-panel">
          <ul className="site-menu-list">
            {mobileNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="site-menu-link"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

