"use client";

import Script from "next/script";

export function Turnstile({ action }: { action: string }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;
  return <>
    <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive"/>
    <div
      className="cf-turnstile"
      data-sitekey={siteKey}
      data-action={action}
      data-theme="light"
      data-size="flexible"
    />
  </>;
}
