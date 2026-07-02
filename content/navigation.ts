export type NavItem = {
  href: string;
  label: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/music", label: "Music" },
  { href: "/merch", label: "Merch" },
  { href: "/about", label: "About" },
  { href: "/press", label: "Press" },
  { href: "/contact", label: "Contact" },
];

export const mobileNavItems: NavItem[] = [
  ...primaryNavItems,
];
