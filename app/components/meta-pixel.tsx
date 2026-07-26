"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID = "4611600329085591";

function readCookies() {
  return Object.fromEntries(document.cookie.split("; ").filter(Boolean).map((item) => {
    const separator = item.indexOf("=");
    return [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
  }));
}

function attributionData() {
  const cookies = readCookies();
  const fbclid = new URLSearchParams(window.location.search).get("fbclid")?.trim();
  if (fbclid && /^[A-Za-z0-9_.-]{8,500}$/.test(fbclid)) {
    const expectedSuffix = `.${fbclid}`;
    if (!cookies._fbc?.endsWith(expectedSuffix)) {
      cookies._fbc = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${encodeURIComponent(cookies._fbc)}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`;
    }
  }
  return { fbp: cookies._fbp, fbc: cookies._fbc };
}

export function trackMeta(event: string, parameters?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const eventId = crypto.randomUUID();
  window.fbq?.("track", event, parameters, { eventID: eventId });
  const attribution = attributionData();
  void fetch("/api/meta/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName: event,
      eventId,
      sourceUrl: window.location.href,
      customData: parameters,
      userData: attribution,
    }),
  }).catch(() => undefined);
}

export function trackMetaWithUser(
  event: string,
  parameters: Record<string, unknown>,
  userData: Record<string, string>,
) {
  if (typeof window === "undefined") return;
  const eventId = crypto.randomUUID();
  window.fbq?.("track", event, parameters, { eventID: eventId });
  const attribution = attributionData();
  void fetch("/api/meta/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName: event,
      eventId,
      sourceUrl: window.location.href,
      customData: parameters,
      userData: { ...userData, ...attribution },
    }),
  }).catch(() => undefined);
}

function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    attributionData();
    const timer = window.setTimeout(() => trackMeta("PageView"), 500);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
        `}
      </Script>
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta requires a 1x1 noscript tracking pixel. */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

export function PurchaseTracker({ value, currency }: { value: number; currency: string }) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      trackMeta("Purchase", {
        value,
        currency,
        content_type: "product",
        content_ids: ["afro-fashionstyle-order"],
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [currency, value]);
  return null;
}
