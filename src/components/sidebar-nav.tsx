"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavIcon({ name }: { name: "overview" | "parties" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg {...common} aria-hidden="true">{name === "overview" ? <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></> : <><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20v-1.4a5.5 5.5 0 0 1 11 0V20M16 5.3a3.2 3.2 0 0 1 0 6.2m1.2 2.3a5.3 5.3 0 0 1 3.3 4.9V20"/></>}</svg>;
}

export default function SidebarNav() {
  const pathname = usePathname();
  return <nav className="side-nav" aria-label="Main navigation">
    <Link className={`nav-item ${pathname === "/" ? "active" : ""}`} href="/"><NavIcon name="overview"/><span>Overview</span></Link>
    <Link className={`nav-item ${pathname.startsWith("/parties") || pathname.startsWith("/workspaces") ? "active" : ""}`} href="/parties"><NavIcon name="parties"/><span>Parties</span></Link>
  </nav>;
}
