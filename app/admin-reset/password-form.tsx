"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export function AdminPasswordForm() {
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  return <form onSubmit={async (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") || "");
    const confirmation = String(fields.get("confirmation") || "");
    if (password !== confirmation) return setNotice("The passwords do not match.");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(password)) return setNotice("Use at least 12 characters with upper and lowercase letters, a number and a symbol.");
    setBusy(true);
    setNotice("Updating your password...");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setNotice("The password could not be updated. Request a new recovery link and try again.");
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/admin-login?updated=1");
  }}>
    <label>New password<input name="password" type="password" autoComplete="new-password" minLength={12} required/></label>
    <label>Confirm password<input name="confirmation" type="password" autoComplete="new-password" minLength={12} required/></label>
    {notice && <p role="status" className={notice.startsWith("Updating") ? "admin-auth-success" : "payment-error"}>{notice}</p>}
    <button className="checkout-submit" disabled={busy}>{busy ? "Updating..." : "Update password"}</button>
  </form>;
}
