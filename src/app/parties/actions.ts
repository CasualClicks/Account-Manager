"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentWorkspace } from "@/lib/current-workspace";

export type PartyFormState = { error: string } | null;

async function getOwner() {
  const { data } = await auth.getSession();
  if (!data?.user) redirect("/auth/sign-in");
  return data.user;
}

export async function createParty(_state: PartyFormState, formData: FormData): Promise<PartyFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const openingBalance = String(formData.get("openingBalance") ?? "0").trim();
  if (!name) return { error: "Enter a party name." };
  if (name.length > 160) return { error: "Party names can be up to 160 characters." };
  if (type !== "CUSTOMER" && type !== "SUPPLIER") return { error: "Choose customer or supplier." };
  if (!/^-?\d{1,12}(\.\d{1,2})?$/.test(openingBalance)) return { error: "Enter a valid opening balance with up to 2 decimal places." };

  const user = await getOwner();
  const workspace = await requireCurrentWorkspace(user.id);
  const duplicate = await prisma.party.findFirst({ where: { workbookId: workspace.id, name: { equals: name, mode: "insensitive" } }, select: { id: true } });
  if (duplicate) return { error: "A party with that name already exists in this workspace." };
  try {
    await prisma.party.create({ data: { workbookId: workspace.id, name, type, openingBalance } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return { error: "A party with that name already exists in this workspace." };
    }
    throw error;
  }
  revalidatePath("/parties");
  redirect("/parties");
}

export async function createTransaction(_state: PartyFormState, formData: FormData): Promise<PartyFormState> {
  const partyId = String(formData.get("partyId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const dateValue = String(formData.get("date") ?? "");
  const amount = String(formData.get("amount") ?? "").trim();
  const entryType = String(formData.get("entryType") ?? "");
  if (!description || description.length > 500) return { error: "Enter a description up to 500 characters." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue) || Number.isNaN(Date.parse(`${dateValue}T00:00:00Z`))) return { error: "Enter a valid transaction date." };
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(amount)) return { error: "Enter an amount of zero or more with up to 2 decimal places." };
  if (entryType !== "DEBIT" && entryType !== "CREDIT") return { error: "Choose debit or credit." };

  const user = await getOwner();
  const workspace = await requireCurrentWorkspace(user.id);
  const party = await prisma.party.findFirst({ where: { id: partyId, workbookId: workspace.id } });
  if (!party) return { error: "That party isn’t in the selected workspace." };
  await prisma.transaction.create({
    data: { partyId: party.id, date: new Date(`${dateValue}T00:00:00.000Z`), description, amount, entryType },
  });
  revalidatePath(`/parties/${party.id}`);
  revalidatePath("/parties");
  redirect(`/parties/${party.id}`);
}
