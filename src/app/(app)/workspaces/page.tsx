import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { requireSignedInUser, getWorkspaceContext } from "@/lib/current-workspace";
import WorkspaceForm from "@/components/workspace-form";
import WorkspaceManager from "@/components/workspace-manager";
import NavigationReady from "@/components/navigation-ready";

export const instant = false;

export default function WorkspacesPage() {
  return <Suspense fallback={null}><WorkspacesContent /></Suspense>;
}

async function WorkspacesContent() {
  await connection();
  const user = await requireSignedInUser();
  const { workspaces } = await getWorkspaceContext(user.id);

  return (
    <>
      <NavigationReady routeKey="workspaces" />
      <section className="directory-heading">
        <div><p className="eyebrow"><span className="live-dot"/> YOUR BUSINESS BOOKS</p><h1>Workspaces</h1><p className="welcome-subtitle">Keep each business or purpose in its own ledger.</p></div>
        <div className="workspace-page-actions"><Link className="button button-secondary" href="/parties">Back to parties →</Link><span className="sample-badge">{workspaces.length} of 5 workspaces</span></div>
      </section>
      <section className="workspace-list-section" aria-label="Workspaces">
        <WorkspaceManager workspaces={workspaces} />
      </section>
      {workspaces.length < 5 && <section className="panel workspace-create-panel"><div className="panel-heading"><div><h2>Create workspace</h2><p>Add a ledger for a separate business or purpose.</p></div></div><WorkspaceForm/> </section>}
    </>
  );
}
