"use client";

import { useEffect, useState } from "react";

export function ContactActions() {
  const [whatsapp, setWhatsapp] = useState("");
  useEffect(() => { void fetch("/api/commerce-config").then((response) => response.json()).then((result: { settings?: { contact?: { whatsapp?: string } } }) => setWhatsapp((result.settings?.contact?.whatsapp || "").replace(/\D/g, ""))).catch(() => undefined); }, []);
  if (!whatsapp) return null;
  return <a className="whatsapp-float" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Afro.Fashionstyle, I need help with an outfit.")}`} target="_blank" rel="noreferrer" aria-label="Chat with Afro.Fashionstyle on WhatsApp"><span>WhatsApp</span>●</a>;
}
