"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function ThemeControl() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) {
      document.documentElement.dataset.theme = "dark";
      document.documentElement.style.colorScheme = "dark";
      return;
    }
    const saved = localStorage.getItem("afro-theme");
    const active = saved === "dark" || saved === "light" ? saved : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = active;
    document.documentElement.style.colorScheme = active;
  }, [isAdmin]);

  if (isAdmin) return null;

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("afro-theme", next);
  }

  return <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label="Toggle light or dark mode" title="Toggle light or dark mode">
    <span aria-hidden="true">◐</span>
  </button>;
}
