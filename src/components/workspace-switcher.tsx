"use client";

import { useState } from "react";
import { switchWorkspace } from "@/app/workspaces/actions";

type WorkspaceOption = { id: string; name: string; currency: string };

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
}) {
  const [switching, setSwitching] = useState(false);

  return (
    <form className="workspace-switcher" action={switchWorkspace}>
      <select
        className="workbook-picker"
        name="workspaceId"
        defaultValue={activeWorkspaceId}
        aria-label="Select workspace"
        disabled={switching}
        onChange={(event) => {
          setSwitching(true);
          event.currentTarget.form?.requestSubmit();
        }}
      >
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      <span className="sr-only" aria-live="polite">
        {switching ? "Switching workspace…" : "Selecting a workspace switches immediately."}
      </span>
    </form>
  );
}
