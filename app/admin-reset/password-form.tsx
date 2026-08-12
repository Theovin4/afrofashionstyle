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
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const normalizedPassword = password.normalize("NFKC").trim();
  const normalizedConfirmation = confirmation.normalize("NFKC").trim();
  const hasConfirmation = confirmation.length > 0;
  const passwordsMatch = hasConfirmation && normalizedPassword === normalizedConfirmation;
  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (!passwordsMatch) return setNotice("The passwords do not match. Use Show password to compare both fields.");
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(normalizedPassword)) return setNotice("Use at least 12 characters with upper and lowercase letters, a number and a symbol.");
    setBusy(true);
    setNotice("Updating your password...");
    const { error } = await supabase.auth.updateUser({ password: normalizedPassword });
    if (error) {
      setBusy(false);
      setNotice("The password could not be updated. Request a new recovery link and try again.");
      return;
    }
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign("/admin-login?updated=1");
  }}>
    <label>New password<input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setNotice(""); }} minLength={12} spellCheck={false} required/></label>
    <label>Confirm password<input name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setNotice(""); }} minLength={12} spellCheck={false} required/></label>
    <label className="password-visibility"><input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)}/> Show password</label>
    {hasConfirmation && <p className={passwordsMatch ? "password-match good" : "password-match bad"} aria-live="polite">{passwordsMatch ? "Passwords match." : `Passwords differ (${normalizedPassword.length} and ${normalizedConfirmation.length} characters).`}</p>}
    {notice && <p role="status" className={notice.startsWith("Updating") ? "admin-auth-success" : "payment-error"}>{notice}</p>}
    <button className="checkout-submit" disabled={busy || !passwordsMatch}>{busy ? "Updating..." : "Update password"}</button>
  </form>;
}
