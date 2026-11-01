import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { prisma } from "@/lib/prisma";
import { deterministicId, parseTransfer } from "@/lib/data-transfer";

export const runtime = "nodejs";
export const maxDuration = 120;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const normalize = (s: string) => s.trim().toLocaleLowerCase().replace(/\s+/g, " ");

export async function POST(request: Request) {
  try {
    const { data } = await auth.getSession();
    if (!data?.user) return NextResponse.json({ error: "Sign in to import data." }, { status: 401 });
    const workspace = await requireCurrentWorkspace(data.user.id);
    const form = await request.formData(); const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an .xlsx or .db file." }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "File is larger than the 50 MB limit." }, { status: 413 });
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (ext !== ".xlsx" && ext !== ".db") return NextResponse.json({ error: "Only .xlsx and SQLite .db files are supported." }, { status: 400 });
    const parsed = await parseTransfer(Buffer.from(await file.arrayBuffer()), ext);
    const summary = { parties: parsed.parties.length, transactions: parsed.transactions.length, warnings: parsed.warnings.slice(0, 100), warningCount: parsed.warnings.length, hasPartyTypes: parsed.hasPartyTypes, hasOpeningBalances: parsed.hasOpeningBalances, workspace: workspace.name };
    if (form.get("mode") !== "import") return NextResponse.json(summary);

    const fallbackType = form.get("fallbackType") === "SUPPLIER" ? "SUPPLIER" : "CUSTOMER";
    const balanceMode = form.get("balanceMode") === "current" ? "current" : "opening";
    const partyIds = new Map<string, string>(); const nameIds = new Map<string, string>();
    const existing = await prisma.party.findMany({ where: { workbookId: workspace.id }, select: { id: true, name: true } });
    const existingNames = new Set(existing.map((p) => normalize(p.name)));
    const seenInFile = new Set<string>(); const duplicatesInFile: string[] = [];
    for (const p of parsed.parties) { const key = normalize(p.name); if (seenInFile.has(key)) duplicatesInFile.push(p.name); else seenInFile.add(key); }
    if (duplicatesInFile.length) return NextResponse.json({ error: "The file lists the same party name more than once. Rename or merge the duplicates in the file before importing.", conflicts: duplicatesInFile.slice(0, 30), conflictCount: duplicatesInFile.length }, { status: 409 });
    const conflicts = parsed.parties.filter((p) => existingNames.has(normalize(p.name)));
    if (conflicts.length) return NextResponse.json({ error: "Some imported party names already exist in this workspace. Rename them in the file or choose a different workspace before importing.", conflicts: conflicts.slice(0, 30).map((p) => p.name), conflictCount: conflicts.length }, { status: 409 });

    const partyBySourceId = new Map(parsed.parties.map((p) => [p.sourceId, p]));
    const sourceIdByName = new Map(parsed.parties.map((p) => [normalize(p.name), p.sourceId]));
    const txNetByParty = new Map<string, number>();
    for (const tx of parsed.transactions) {
      const party = tx.partySourceId ? partyBySourceId.get(tx.partySourceId) : undefined;
      const key = party?.sourceId ?? sourceIdByName.get(normalize(tx.partyName));
      if (!key) continue;
      txNetByParty.set(key, (txNetByParty.get(key) ?? 0) + (tx.entryType === "DEBIT" ? tx.amount : -tx.amount));
    }
    const partyRows = parsed.parties.map((p) => {
      const id = deterministicId(`${workspace.id}:${parsed.sha}`, `party:${p.sourceId}`); partyIds.set(p.sourceId, id); nameIds.set(normalize(p.name), id);
      const opening = p.openingBalance !== null ? p.openingBalance : p.recordedBalance !== null && balanceMode === "current" ? p.recordedBalance - (txNetByParty.get(p.sourceId) ?? 0) : p.recordedBalance ?? 0;
      return { id, workbookId: workspace.id, name: p.name.slice(0, 160), type: p.type ?? fallbackType, openingBalance: opening };
    });
    const transactionRows = parsed.transactions.flatMap((t) => {
      const party = t.partySourceId ? partyIds.get(t.partySourceId) : nameIds.get(normalize(t.partyName));
      if (!party) return [];
      return [{ id: deterministicId(`${workspace.id}:${parsed.sha}`, `transaction:${t.sourceId}`), partyId: party, date: t.date, description: t.description.slice(0, 500), amount: t.amount, entryType: t.entryType, ...(t.createdAt ? { createdAt: t.createdAt } : {}), ...(t.updatedAt ? { updatedAt: t.updatedAt } : {}) }];
    });
    const result = await prisma.$transaction(async (db) => {
      let partiesCreated = 0; let transactionsCreated = 0;
      for (let i = 0; i < partyRows.length; i += 500) partiesCreated += (await db.party.createMany({ data: partyRows.slice(i, i + 500), skipDuplicates: true })).count;
      for (let i = 0; i < transactionRows.length; i += 500) transactionsCreated += (await db.transaction.createMany({ data: transactionRows.slice(i, i + 500), skipDuplicates: true })).count;
      return { partiesCreated, transactionsCreated };
    }, { maxWait: 10_000, timeout: 120_000 });
    return NextResponse.json({ ...summary, ...result, skippedTransactions: parsed.transactions.length - transactionRows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed. Check the file format and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
