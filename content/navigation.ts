export type NavItem = {
  href: string;
  label: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/music", label: "Music" },
  { href: "/watch", label: "Watch" },
  { href: "/merch", label: "Merch" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export const mobileNavItems: NavItem[] = [
  ...primaryNavItems,
];
