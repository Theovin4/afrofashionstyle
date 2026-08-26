"use client";

import { useState } from "react";
import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";
import { trackMetaWithUser } from "../components/meta-pixel";
import { showActionToast } from "../components/action-toast";

export default function ContactPage() {
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState("");
  return <main><PremiumHeader/><section className="contact-page"><div><span className="eyebrow">Personal assistance</span><h1>Let’s find your<br/>perfect piece.</h1><p>Ask about sizing, measurements, styling or a made-to-order outfit. Our support team is available 24/7.</p><a href="https://wa.me/2347049841931" target="_blank" rel="noreferrer">WhatsApp us →</a><a href="mailto:afrofashionclub@gmail.com">Email support →</a></div>
    <form onSubmit={async (event) => {
      event.preventDefault(); setSending(true); setNotice(""); setWhatsappUrl(""); const form = event.currentTarget; const fields = new FormData(form);
      const name = String(fields.get("name") || ""); const email = String(fields.get("email") || ""); const phone = String(fields.get("phone") || "");
      let response: Response;
      let result: { message?: string; error?: string; whatsappUrl?: string };
      try {
        response = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, phone, subject: fields.get("subject"), message: fields.get("message"), website: fields.get("website") }) });
        result = await response.json();
      } catch {
        response = new Response(null, { status: 503 });
        result = { error: "We could not send your enquiry. Please contact us on WhatsApp." };
      }
      setNotice(result.message || result.error || "Please try again.");
      setWhatsappUrl(result.whatsappUrl || `https://wa.me/2347049841931?text=${encodeURIComponent(`Hello Afro.Fashionstyle, I need help with ${String(fields.get("subject") || "an enquiry")}.`)}`);
      setSending(false);
      if (response.ok) {
        showActionToast(result.message || "Your enquiry was sent successfully.");
        const [firstName = "", ...lastName] = name.trim().split(/\s+/);
        trackMetaWithUser("Lead", { content_name: "Customer style enquiry" }, { email, phone, firstName, lastName: lastName.join(" ") });
        form.reset();
      } else showActionToast(result.error || "Your enquiry could not be sent.", "error");
    }}>
      <div className="form-split"><label>Name<input name="name" autoComplete="name" required minLength={2}/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label></div>
      <label>Phone (optional)<input name="phone" type="tel" autoComplete="tel"/></label>
      <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label>
      <label>What can we help with?<select name="subject"><option>Sizing and measurements</option><option>Made-to-order enquiry</option><option>Styling assistance</option><option>Order support</option></select></label>
      <label>Your message<textarea name="message" required minLength={10} maxLength={3000} rows={6}/></label>
      <button disabled={sending}>{sending ? "Sending…" : "Send enquiry"}</button>{notice && <p role="status">{notice}</p>}{whatsappUrl && <a className="contact-whatsapp-followup" href={whatsappUrl} target="_blank" rel="noreferrer" data-meta-contact="whatsapp">Continue on WhatsApp →</a>}
    </form>
  </section><SiteFooter/></main>;
}
