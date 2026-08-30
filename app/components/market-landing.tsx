import Image from "next/image";
import Link from "next/link";
import { PremiumHeader } from "./premium-header";
import { SiteFooter } from "./site-footer";

type MarketLandingProps = {
  market: "USA" | "UK";
  eyebrow: string;
  heading: string;
  introduction: string;
  paragraphs: string[];
  delivery: string;
  currency: string;
  faqs: Array<{ question: string; answer: string }>;
};

export function MarketLanding({ market, eyebrow, heading, introduction, paragraphs, delivery, currency, faqs }: MarketLandingProps) {
  return <main>
    <PremiumHeader />
    <article className="bg-[var(--paper)] text-[var(--ink)]">
      <header className="grid min-h-[620px] lg:grid-cols-2">
        <div className="flex flex-col items-start justify-center px-6 py-20 sm:px-12 lg:px-[8vw]">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="my-6 max-w-3xl font-serif text-5xl leading-[0.98] font-medium sm:text-6xl lg:text-8xl">{heading}</h1>
          <p className="max-w-xl text-base leading-7 opacity-80 sm:text-lg">{introduction}</p>
          <div className="mt-8 flex flex-wrap gap-4"><Link className="button primary" href="/shop">Shop the collection</Link><Link className="button" href="/size-guide">View size guide</Link></div>
        </div>
        <div className="relative min-h-[420px] lg:min-h-full"><Image src="/campaign-hero.webp" alt={`Afro.Fashionstyle African fashion available in the ${market}`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover"/></div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1.5fr_.8fr] lg:px-10 lg:py-28">
        <div className="space-y-6 text-[15px] leading-8 opacity-85 sm:text-base">{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        <aside className="h-fit border border-current/15 bg-[var(--cream)] p-7 sm:p-9"><span className="eyebrow">Shopping from the {market}</span><dl className="mt-7 space-y-6"><div><dt className="text-xs uppercase tracking-widest opacity-60">Currency</dt><dd className="mt-2 font-serif text-2xl">{currency}</dd></div><div><dt className="text-xs uppercase tracking-widest opacity-60">Delivery estimate</dt><dd className="mt-2 font-serif text-2xl">{delivery}</dd></div><div><dt className="text-xs uppercase tracking-widest opacity-60">Secure payments</dt><dd className="mt-2 leading-7">PayPal, Flutterwave and cryptocurrency</dd></div></dl></aside>
      </section>

      <section className="bg-[var(--cream)] px-6 py-20 sm:px-10 lg:py-28"><div className="mx-auto max-w-5xl"><span className="eyebrow">Helpful answers</span><h2 className="my-5 font-serif text-4xl font-medium sm:text-6xl">African fashion delivery to the {market}</h2><div className="mt-10 divide-y divide-current/15 border-y border-current/15">{faqs.map((faq) => <details className="group py-6" key={faq.question}><summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-medium"><span>{faq.question}</span><span aria-hidden="true" className="text-2xl group-open:rotate-45">+</span></summary><p className="max-w-3xl pt-4 text-sm leading-7 opacity-75">{faq.answer}</p></details>)}</div></div></section>
    </article>
    <SiteFooter />
  </main>;
}
