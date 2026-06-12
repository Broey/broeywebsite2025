import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

export function BrandMark({
  href = "/",
  className = "",
  width = 114,
  height = 28,
  priority = false,
}: BrandMarkProps) {
  return (
    <Link href={href} aria-label="Broey homepage" className={`inline-flex ${className}`}>
      <Image
        src="/assets/logos/broey-logo-white-no-background.png"
        alt="Broey logo"
        width={width}
        height={height}
        priority={priority}
        className="h-auto w-auto max-w-[10.5rem]"
      />
    </Link>
  );
}
