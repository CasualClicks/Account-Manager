"use client";

import { usePathname } from "next/navigation";

export default function RouteBreadcrumb() {
  const pathname = usePathname();
  const label = pathname === "/" ? "Overview" : pathname === "/parties" ? "Parties" : pathname.startsWith("/workspaces") ? "Workspaces" : "Party ledger";
  return <strong>{label}</strong>;
}
