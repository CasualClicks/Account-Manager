import SignOutButton from "@/components/sign-out-button";
import WorkspaceSwitcher from "@/components/workspace-switcher";
import Link from "next/link";
import { Suspense } from "react";
import SidebarNav from "@/components/sidebar-nav";

type WorkspaceOption = { id: string; name: string; currency: string };
type AppSidebarProps = { workspaces: WorkspaceOption[]; activeWorkspaceId: string; displayName: string; email: string };

export default function AppSidebar({ workspaces, activeWorkspaceId, displayName, email }: AppSidebarProps) {
  const initials = displayName.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A";
  return (
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><span aria-hidden="true">▤</span></span><span>ledgerly<span className="brand-dot">.</span></span></Link>
      <div className="workspace-label">WORKSPACE</div>
      <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={activeWorkspaceId} />
      <Link className="workspace-manage-link" href="/workspaces">Manage workspaces ({workspaces.length}/5)</Link>
      <div className="nav-label">MENU</div>
      <Suspense fallback={<nav className="side-nav" aria-label="Main navigation"><Link className="nav-item" href="/">Overview</Link><Link className="nav-item" href="/parties">Parties</Link></nav>}><SidebarNav /></Suspense>
      <div className="sidebar-bottom">
        <Link className="nav-item" href="#settings"><span aria-hidden="true">⚙</span><span>Settings</span></Link>
        <div className="profile"><span className="avatar dark">{initials}</span><span className="profile-copy"><strong>{displayName}</strong><small>{email}</small></span><SignOutButton/></div>
      </div>
    </aside>
  );
}
