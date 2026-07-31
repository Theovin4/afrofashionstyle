import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "header" | "commerce" | "status" | "footer" | "admin" | "adminMark";
  href?: string | null;
  priority?: boolean;
  decorative?: boolean;
};

export function BrandLogo({ variant = "header", href = "/", priority = false, decorative = false }: BrandLogoProps) {
  const artwork = <span className="brand-logo-artwork">
    <Image src="/afro-fashionstyle-logo.png" alt={decorative ? "" : "Afro.Fashionstyle"} width={1280} height={1280} priority={priority} sizes={variant === "footer" ? "180px" : variant === "adminMark" ? "82px" : "220px"}/>
  </span>;
  const className = `brand-logo brand-logo--${variant}`;

  if (!href) return <span className={className} aria-hidden={decorative || undefined}>{artwork}</span>;
  return <Link className={className} href={href} aria-label="Afro.Fashionstyle home">{artwork}</Link>;
}
