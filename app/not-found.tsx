import Link from "next/link";
import { BrandStatusLogo } from "./components/brand-status-logo";

export default function NotFound() {
  return <main className="status-page"><div className="status-card">
    <BrandStatusLogo/>
    <span className="eyebrow">404 · Page not found</span>
    <h1>This thread has wandered.</h1>
    <p>The page you requested is no longer here, but the collection is waiting for you.</p>
    <div className="status-actions"><Link className="button primary" href="/#shop">Shop the collection</Link><Link className="text-link" href="/">Return home →</Link></div>
  </div></main>;
}
