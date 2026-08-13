"use client";

import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
type ToastDetail = { message: string; kind: ToastKind; id: string };

const EVENT_NAME = "afro:action-toast";

export function showActionToast(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastDetail>(EVENT_NAME, {
    detail: { message, kind, id: crypto.randomUUID() },
  }));
}

export function ActionToastViewport() {
  const [toasts, setToasts] = useState<ToastDetail[]>([]);

  useEffect(() => {
    function receive(event: Event) {
      const toast = (event as CustomEvent<ToastDetail>).detail;
      if (!toast?.message) return;
      setToasts((current) => [...current.slice(-2), toast]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 4500);
    }
    window.addEventListener(EVENT_NAME, receive);
    return () => window.removeEventListener(EVENT_NAME, receive);
  }, []);

  return <div className="action-toast-viewport" aria-live="polite" aria-atomic="false">
    {toasts.map((toast) => <div className={`action-toast ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} key={toast.id}>
      <span aria-hidden="true">{toast.kind === "success" ? "✓" : toast.kind === "error" ? "!" : "i"}</span>
      <p>{toast.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>×</button>
    </div>)}
  </div>;
}
