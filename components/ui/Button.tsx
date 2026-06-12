import Link from "next/link";

type Variant = "primary" | "secondary" | "tertiary";

type ButtonProps = {
  href?: string;
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
};

const styles: Record<Variant, string> = {
  primary: "system-button system-button--primary",
  secondary: "system-button system-button--secondary",
  tertiary: "system-tertiary-link",
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
}: ButtonProps) {
  const merged = `${styles[variant]} ${className ?? ""}`;

  if (href) {
    return (
      <Link href={href} className={merged}>
        {children}
      </Link>
    );
  }

  return <button className={merged}>{children}</button>;
}

