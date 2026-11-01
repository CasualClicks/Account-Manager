"use client";

import { useEffect, useState } from "react";

export default function NavigationFeedback() {
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let resetTimer: number | undefined;

    function clearPending() {
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = undefined;
      document.documentElement.removeAttribute("data-navigation-pending");
      setPending(false);
    }

    function onDocumentClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;

      document.documentElement.setAttribute("data-navigation-pending", "true");
      setPending(true);
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(clearPending, 20000);
    }

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("ledgerly:navigation-ready", clearPending);
    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("ledgerly:navigation-ready", clearPending);
      if (resetTimer) window.clearTimeout(resetTimer);
      document.documentElement.removeAttribute("data-navigation-pending");
    };
  }, []);

  if (!pending) return null;
  return <div className="content-nav-feedback" role="status" aria-live="polite"><span className="content-nav-spinner" aria-hidden="true" />Loading page…</div>;
}
