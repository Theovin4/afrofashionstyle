import Image from "next/image";
import Link from "next/link";

export function BrandStatusLogo() {
  return <Link className="status-brand" href="/" aria-label="Afro.Fashionstyle home">
    <Image src="/afro-fashionstyle-logo.png" alt="Afro.Fashionstyle" width={240} height={120} priority/>
  </Link>;
}
