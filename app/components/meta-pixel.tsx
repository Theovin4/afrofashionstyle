"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID = "4611600329085591";
const consentKey = "afro-fashionstyle-marketing-consent";
const consentEvent = "afro:marketing-consent";
const externalIdCookie = "af_meta_external_id";

type MetaEventName = "PageView" | "ViewContent" | "Search" | "AddToCart" | "InitiateCheckout" | "Contact" | "Lead" | "AddPaymentInfo";
type MetaUserData = {
  email?: string; phone?: string; firstName?: string; lastName?: string; city?: string;
  state?: string; zip?: string; country?: string; externalId?: string; fbp?: string; fbc?: string;
};
export type VerifiedPurchaseEvent = {
  eventId: string;
  customData: Record<string, unknown>;
};

function developmentLog(eventName: string, eventId: string, channel: "browser" | "server") {
  if (process.env.NODE_ENV === "development") {
    console.debug("[Meta event]", { eventName, eventId, channel });
  }
}

function readCookies() {
  return Object.fromEntries(document.cookie.split("; ").filter(Boolean).map((item) => {
    const separator = item.indexOf("=");
    return [item.slice(0, separator), decodeURIComponent(item.slice(separator + 1))];
  }));
}

export function hasMarketingConsent() {
  return typeof window !== "undefined" && localStorage.getItem(consentKey) === "granted";
}

export function attributionData(): MetaUserData {
  if (typeof window === "undefined" || !hasMarketingConsent()) return {};
  const cookies = readCookies();
  const fbclid = new URLSearchParams(window.location.search).get("fbclid")?.trim();
  if (fbclid && /^[A-Za-z0-9_.-]{8,500}$/.test(fbclid)) {
    const expectedSuffix = `.${fbclid}`;
    if (!cookies._fbc?.endsWith(expectedSuffix)) {
      cookies._fbc = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${encodeURIComponent(cookies._fbc)}; Max-Age=7776000; Path=/; SameSite=Lax; Secure`;
    }
  }
  if (!cookies[externalIdCookie]) {
    cookies[externalIdCookie] = crypto.randomUUID();
    document.cookie = `${externalIdCookie}=${encodeURIComponent(cookies[externalIdCookie])}; Max-Age=31536000; Path=/; SameSite=Lax; Secure`;
  }
  return { fbp: cookies._fbp, fbc: cookies._fbc, externalId: cookies[externalIdCookie] };
}

function browserEvent(eventName: string, parameters: Record<string, unknown> | undefined, eventId: string) {
  let attempts = 0;
  const dispatch = () => {
    if (window.fbq) {
      window.fbq("track", eventName, parameters, { eventID: eventId });
      developmentLog(eventName, eventId, "browser");
      return;
    }
    attempts += 1;
    if (attempts < 20) window.setTimeout(dispatch, 100);
  };
  dispatch();
}

async function serverEvent(eventName: MetaEventName, parameters: Record<string, unknown> | undefined, eventId: string, userData: MetaUserData) {
  developmentLog(eventName, eventId, "server");
  await fetch("/api/meta/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      consent: true,
      eventName,
      eventId,
      sourceUrl: window.location.href,
      customData: parameters,
      userData: { ...userData, ...attributionData() },
    }),
  });
}

export function trackMeta(eventName: MetaEventName, parameters?: Record<string, unknown>, userData: MetaUserData = {}) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;
  const eventId = crypto.randomUUID();
  browserEvent(eventName, parameters, eventId);
  void serverEvent(eventName, parameters, eventId, userData).catch(() => undefined);
  return eventId;
}

export function trackMetaWithUser(eventName: MetaEventName, parameters: Record<string, unknown>, userData: MetaUserData) {
  return trackMeta(eventName, parameters, userData);
}

export function trackVerifiedPurchase(event: VerifiedPurchaseEvent) {
  if (typeof window === "undefined" || !hasMarketingConsent()) return;
  const storageKey = `meta-purchase:${event.eventId}`;
  if (sessionStorage.getItem(storageKey)) return;
  sessionStorage.setItem(storageKey, "1");
  browserEvent("Purchase", event.customData, event.eventId);
}

function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRoute = useRef("");

  useEffect(() => {
    if (!hasMarketingConsent()) return;
    attributionData();
    const routeKey = `${pathname}?${searchParams.toString()}`;
    if (lastRoute.current === routeKey) return;
    lastRoute.current = routeKey;
    const timer = window.setTimeout(() => trackMeta("PageView"), 500);
    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleContact(event: MouseEvent) {
      if (!hasMarketingConsent()) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      const method = href.startsWith("mailto:") ? "email"
        : href.startsWith("tel:") ? "phone"
          : /(?:wa\.me|whatsapp\.com)/i.test(href) ? "whatsapp"
            : link.dataset.metaContact || "";
      if (method) trackMeta("Contact", { contact_method: method });
    }
    document.addEventListener("click", handleContact);
    return () => document.removeEventListener("click", handleContact);
  }, []);

  return null;
}

function ConsentBanner({ onDecision }: { onDecision: (granted: boolean) => void }) {
  return <div className="consent-banner" role="dialog" aria-label="Cookie choices" aria-live="polite">
    <div><b>Your privacy choices</b><p>With your permission, we use Google and Meta analytics and advertising cookies to measure shopping activity and improve relevant advertising. Necessary store functions work without optional marketing cookies.</p><a href="/privacy">Read our privacy policy</a></div>
    <div><button onClick={() => onDecision(false)}>Decline optional</button><button className="accept" onClick={() => onDecision(true)}>Allow marketing</button></div>
  </div>;
}

export function MetaPixel() {
  const [consent, setConsent] = useState<"unknown" | "granted" | "denied">("unknown");
  const [choosing, setChoosing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(consentKey);
    const granted = saved === "granted";
    window.gtag?.("consent", "update", {
      ad_storage: granted ? "granted" : "denied",
      analytics_storage: granted ? "granted" : "denied",
      ad_user_data: granted ? "granted" : "denied",
      ad_personalization: granted ? "granted" : "denied",
    });
    queueMicrotask(() => setConsent(saved === "granted" ? "granted" : saved === "denied" ? "denied" : "unknown"));
  }, []);

  function decide(granted: boolean) {
    const value = granted ? "granted" : "denied";
    localStorage.setItem(consentKey, value);
    window.gtag?.("consent", "update", {
      ad_storage: value,
      analytics_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    });
    setConsent(value);
    setChoosing(false);
    window.dispatchEvent(new CustomEvent(consentEvent, { detail: value }));
  }

  return <>
    {consent === "granted" && <>
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
      <Suspense fallback={null}><RouteTracker/></Suspense>
    </>}
    {(consent === "unknown" || choosing) && <ConsentBanner onDecision={decide}/>}
    {consent !== "unknown" && !choosing && <button className="privacy-choices" type="button" onClick={() => setChoosing(true)} aria-label="Review cookie and advertising privacy choices">
      Privacy choices
    </button>}
  </>;
}
