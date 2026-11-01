"use client";

import { useEffect } from "react";

export default function NavigationReady({ routeKey }: { routeKey: string }) {
  useEffect(() => {
    window.dispatchEvent(new Event("ledgerly:navigation-ready"));
  }, [routeKey]);
  return null;
}
