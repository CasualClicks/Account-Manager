"use client";

import { useActionState } from "react";
import { createWorkspace, type WorkspaceFormState } from "@/app/workspaces/actions";

export default function WorkspaceForm() {
  const [state, action, pending] = useActionState<WorkspaceFormState, FormData>(createWorkspace, null);
  return <form className="workspace-form" action={action}>
    <label htmlFor="workspace-name">Workspace name</label>
    <div className="workspace-form-row"><input id="workspace-name" name="name" placeholder="e.g. Retail business" maxLength={100} required/><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Creating…" : "Create workspace"}</button></div>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
  </form>;
}
