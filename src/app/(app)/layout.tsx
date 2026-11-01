import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import AppSidebar from "@/components/app-sidebar";
import NavigationFeedback from "@/components/navigation-feedback";
import RouteBreadcrumb from "@/components/route-breadcrumb";
import ThemeToggle from "@/components/theme-toggle";
import { getWorkspaceContext, requireSignedInUser } from "@/lib/current-workspace";

async function SidebarContent() {
  const user = await requireSignedInUser();
  const { workspaces, activeWorkspace } = await getWorkspaceContext(user.id);
  return <AppSidebar workspaces={workspaces} activeWorkspaceId={activeWorkspace.id} displayName={user.name || "Account"} email={user.email} />;
}

function SidebarLoading() {
  return <aside className="sidebar sidebar-loading" aria-hidden="true"><div className="brand"><span className="brand-mark">▤</span><span>ledgerly<span className="brand-dot">.</span></span></div><div className="sidebar-loading-block"/><div className="sidebar-loading-block short"/><div className="sidebar-loading-block"/><div className="sidebar-loading-block"/></aside>;
}

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <Suspense fallback={<SidebarLoading />}><SidebarContent /></Suspense>
      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs"><Link href="/parties">Workbooks</Link><span aria-hidden="true">›</span><Suspense fallback={<strong>Ledger</strong>}><RouteBreadcrumb /></Suspense></div>
          <div className="top-actions"><label className="search-box"><span aria-hidden="true">⌕</span><input aria-label="Search" placeholder="Search anything..."/><kbd>⌘ K</kbd></label><ThemeToggle/><button className="icon-button notification" aria-label="Notifications" type="button"><span aria-hidden="true">♧</span><i/></button></div>
        </header>
        <NavigationFeedback />
        <div className="page-content">{children}</div>
      </section>
    </main>
  );
}
