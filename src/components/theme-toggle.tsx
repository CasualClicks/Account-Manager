"use client";

import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    localStorage.setItem("ledgerly-theme", next);
    document.documentElement.dataset.theme = next;
    window.dispatchEvent(new Event("ledgerly-theme-change"));
  }

  return <button className="icon-button theme-toggle" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} type="button" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>;
}

function getSnapshot(): Theme {
  const saved = localStorage.getItem("ledgerly-theme");
  if (saved === "dark" || saved === "light") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("ledgerly-theme-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("ledgerly-theme-change", callback);
  };
}
