import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

export const requireSignedInUser = cache(async function requireSignedInUser() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/auth/sign-in");
  return data.user;
});

export const getUserWorkspaces = cache(async function getUserWorkspaces(ownerId: string) {
  const workspaces = await prisma.workbook.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, currency: true },
  });
  return workspaces.map((workspace) => ({
    ...workspace,
    name: workspace.name === "My workspace" ? "My Workspace" : workspace.name,
  }));
});

export async function ensureWorkspace(ownerId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerId}))`;
    const found = await tx.workbook.findMany({
      where: { ownerId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, currency: true },
    });
    const workspaces = found.map((workspace) => ({
      ...workspace,
      name: workspace.name === "My workspace" ? "My Workspace" : workspace.name,
    }));
    if (workspaces.length) return workspaces;
    const workspace = await tx.workbook.create({
      data: { ownerId, name: "My Workspace" },
      select: { id: true, name: true, currency: true },
    });
    return [workspace];
  });
}

export const getWorkspaceContext = cache(async function getWorkspaceContext(ownerId: string) {
  const found = await getUserWorkspaces(ownerId);
  const workspaces = found.length ? found : await ensureWorkspace(ownerId);
  const selectedId = (await cookies()).get("active-workspace")?.value;
  const activeWorkspace = workspaces.find((item) => item.id === selectedId) ?? workspaces[0];
  if (!activeWorkspace) throw new Error("No workspace is available for this account.");
  return { workspaces, activeWorkspace };
});

export async function getCurrentWorkspace(ownerId: string) {
  return (await getWorkspaceContext(ownerId)).activeWorkspace;
}

export async function requireCurrentWorkspace(ownerId: string) {
  const workspace = await getCurrentWorkspace(ownerId);
  if (!workspace) throw new Error("No workspace is available for this account.");
  return workspace;
}
