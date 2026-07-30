"use client";

import { useState } from "react";
import { PremiumHeader } from "../components/premium-header";
import { SiteFooter } from "../components/site-footer";
import { trackMetaWithUser } from "../components/meta-pixel";

export default function ContactPage() {
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);
  return <main><PremiumHeader/><section className="contact-page"><div><span className="eyebrow">Personal assistance</span><h1>Let’s find your<br/>perfect piece.</h1><p>Ask about sizing, measurements, styling or a made-to-order outfit. Our support team is available 24/7.</p><a href="https://wa.me/2347049841931" target="_blank" rel="noreferrer">WhatsApp us →</a><a href="mailto:afrofashionclub@gmail.com">Email support →</a></div>
    <form onSubmit={async (event) => {
      event.preventDefault(); setSending(true); setNotice(""); const form = event.currentTarget; const fields = new FormData(form);
      const name = String(fields.get("name") || ""); const email = String(fields.get("email") || ""); const phone = String(fields.get("phone") || "");
      const response = await fetch("/api/enquiries", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, phone, subject: fields.get("subject"), message: fields.get("message") }) });
      const result = await response.json() as { message?: string; error?: string }; setNotice(result.message || result.error || "Please try again."); setSending(false);
      if (response.ok) {
        const [firstName = "", ...lastName] = name.trim().split(/\s+/);
        trackMetaWithUser("Lead", { content_name: "Customer style enquiry" }, { email, phone, firstName, lastName: lastName.join(" ") });
        form.reset();
      }
    }}>
      <div className="form-split"><label>Name<input name="name" required minLength={2}/></label><label>Email<input name="email" type="email" required/></label></div>
      <label>Phone (optional)<input name="phone" type="tel"/></label>
      <label>What can we help with?<select name="subject"><option>Sizing and measurements</option><option>Made-to-order enquiry</option><option>Styling assistance</option><option>Order support</option></select></label>
      <label>Your message<textarea name="message" required minLength={10} maxLength={3000} rows={6}/></label>
      <button disabled={sending}>{sending ? "Sending…" : "Send enquiry"}</button>{notice && <p role="status">{notice}</p>}
    </form>
  </section><SiteFooter/></main>;
}
