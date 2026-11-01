"use client";

import { useActionState } from "react";
import { deleteWorkspace, renameWorkspace, type WorkspaceFormState } from "@/app/workspaces/actions";

type Workspace = { id: string; name: string; currency: string };

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [renameState, renameAction, renaming] = useActionState<WorkspaceFormState, FormData>(renameWorkspace, null);
  const [deleteState, deleteAction, deleting] = useActionState<WorkspaceFormState, FormData>(deleteWorkspace, null);

  return (
    <article className="workspace-card workspace-manage-card">
      <div className="workbook-icon" aria-hidden="true">▤</div>
      <div className="workspace-manage-main">
        <div className="workspace-card-title"><strong>{workspace.name}</strong></div>
        <small>{workspace.currency} · separate parties and transactions</small>
        <form className="workspace-form workspace-rename-form" action={renameAction}>
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <label htmlFor={`workspace-name-${workspace.id}`}>Workspace name</label>
          <div className="workspace-form-row">
            <input id={`workspace-name-${workspace.id}`} name="name" defaultValue={workspace.name} maxLength={100} required />
            <button className="button button-secondary" type="submit" disabled={renaming}>{renaming ? "Saving…" : "Save name"}</button>
          </div>
          {renameState?.error && <p className="auth-error" role="alert">{renameState.error}</p>}
        </form>
        <details className="workspace-danger-zone">
          <summary>Delete workspace</summary>
          <p>Deleting permanently removes this ledger, its parties, transactions, and attached files.</p>
          <form action={deleteAction}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <label htmlFor={`workspace-confirm-${workspace.id}`}>Type <strong>{workspace.name}</strong> to confirm</label>
            <div className="workspace-form-row">
              <input id={`workspace-confirm-${workspace.id}`} name="confirmation" placeholder="Workspace name" required />
              <button className="button button-danger" type="submit" disabled={deleting}>{deleting ? "Deleting…" : "Delete"}</button>
            </div>
            {deleteState?.error && <p className="auth-error" role="alert">{deleteState.error}</p>}
          </form>
        </details>
      </div>
    </article>
  );
}

export default function WorkspaceManager({ workspaces }: { workspaces: Workspace[] }) {
  return (
    <div className="workspace-cards workspace-manage-list">
      {workspaces.map((workspace) => <WorkspaceCard key={workspace.id} workspace={workspace} />)}
    </div>
  );
}
