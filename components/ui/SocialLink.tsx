import Link from "next/link";

export function SocialLink({
  label,
  href,
  platform,
}: {
  label: string;
  href: string;
  platform: string;
}) {
  return (
    <Link
      href={href}
      className="social-link"
    >
      <span className="social-link-platform">{platform}</span>
      <span className="sr-only">:</span>
      <span className="social-link-label">{label}</span>
    </Link>
  );
}

