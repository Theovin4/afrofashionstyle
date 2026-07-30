"use client";

import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";
import { useEffect, useState } from "react";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);

export function AdminMfa() {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("Loading security status…");

  useEffect(() => {
    void (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        window.location.assign("/admin");
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((factor) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setNotice("Enter the current six-digit code from your authenticator app.");
        return;
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Afro Fashionstyle Commerce Studio",
      });
      if (error) {
        setNotice(error.message);
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setNotice("Scan this QR code, then enter the six-digit code.");
    })();
  }, []);

  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (!factorId || !/^\d{6}$/.test(code)) return;
    setNotice("Verifying…");
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setNotice("The code was not accepted. Wait for a new code and try again.");
      return;
    }
    window.location.assign("/admin");
  }}>
    {qrCode && <Image src={qrCode} alt="Authenticator enrollment QR code" width={220} height={220} unoptimized/>}
    <p role="status">{notice}</p>
    <label>Authenticator code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" required/></label>
    <button className="checkout-submit" disabled={!factorId || code.length !== 6}>Verify and continue</button>
  </form>;
}
