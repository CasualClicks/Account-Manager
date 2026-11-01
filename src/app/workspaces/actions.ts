"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { deleteStorageObject } from "@/lib/storage";

export type WorkspaceFormState = { error: string } | null;

async function getOwnerId() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/auth/sign-in");
  return data.user.id;
}

export async function createWorkspace(_state: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a workspace name." };
  if (name.length > 100) return { error: "Workspace names can be up to 100 characters." };

  const ownerId = await getOwnerId();
  const created = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerId}))`;
    const count = await tx.workbook.count({ where: { ownerId } });
    if (count >= 5) return null;
    return tx.workbook.create({
      data: { ownerId, name },
      select: { id: true },
    });
  });

  if (!created) return { error: "You’ve reached the limit of 5 workspaces." };
  (await cookies()).set("active-workspace", created.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/parties");
}

export async function switchWorkspace(formData: FormData) {
  const id = String(formData.get("workspaceId") ?? "");
  const ownerId = await getOwnerId();
  const workspace = await prisma.workbook.findFirst({ where: { id, ownerId }, select: { id: true } });
  if (!workspace) redirect("/workspaces");
  (await cookies()).set("active-workspace", workspace.id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  redirect("/parties");
}

export async function renameWorkspace(_state: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  const id = String(formData.get("workspaceId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id) return { error: "Choose a workspace to rename." };
  if (!name) return { error: "Enter a workspace name." };
  if (name.length > 100) return { error: "Workspace names can be up to 100 characters." };

  const ownerId = await getOwnerId();
  try {
    const updated = await prisma.workbook.updateMany({ where: { id, ownerId }, data: { name } });
    if (!updated.count) return { error: "That workspace was not found." };
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { error: "You already have a workspace with that name." };
    }
    throw error;
  }

  revalidatePath("/", "layout");
  return null;
}

export async function deleteWorkspace(_state: WorkspaceFormState, formData: FormData): Promise<WorkspaceFormState> {
  const id = String(formData.get("workspaceId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "").trim();
  if (!id) return { error: "Choose a workspace to delete." };

  const ownerId = await getOwnerId();
  const workspace = await prisma.workbook.findFirst({
    where: { id, ownerId },
    select: {
      name: true,
      parties: { select: { transactions: { select: { documents: { select: { objectKey: true } } } } } },
    },
  });
  if (!workspace) return { error: "That workspace was not found." };
  if (confirmation !== workspace.name) return { error: "Type the workspace name exactly to confirm deletion." };
  if (await prisma.workbook.count({ where: { ownerId } }) <= 1) {
    return { error: "Keep at least one workspace. Create another before deleting this one." };
  }

  const objectKeys = workspace.parties.flatMap((party) =>
    party.transactions.flatMap((transaction) => transaction.documents.map((document) => document.objectKey)),
  );
  try {
    for (const key of objectKeys) await deleteStorageObject(key);
  } catch {
    return { error: "The workspace files could not be removed from storage. Nothing was deleted; check the storage connection and try again." };
  }

  const activeId = (await cookies()).get("active-workspace")?.value;
  const remainingId = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerId}))`;
    const workspaces = await tx.workbook.findMany({ where: { ownerId }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (workspaces.length <= 1 || !workspaces.some((item) => item.id === id)) return null;
    await tx.workbook.delete({ where: { id } });
    return workspaces.find((item) => item.id !== id)?.id ?? null;
  });
  if (!remainingId) return { error: "This workspace can’t be deleted because it is the only workspace left." };

  if (activeId === id) {
    (await cookies()).set("active-workspace", remainingId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  revalidatePath("/", "layout");
  redirect("/workspaces");
}
