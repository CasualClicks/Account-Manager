import "server-only";

import ExcelJS from "exceljs";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export type TransferParty = { sourceId: string; name: string; type: "CUSTOMER" | "SUPPLIER" | null; recordedBalance: number | null; openingBalance: number | null };
export type TransferTransaction = { sourceId: string; partySourceId: string | null; partyName: string; date: Date; description: string; amount: number; entryType: "DEBIT" | "CREDIT"; createdAt?: Date; updatedAt?: Date };
export type ParsedTransfer = { parties: TransferParty[]; transactions: TransferTransaction[]; warnings: string[]; hasPartyTypes: boolean; hasOpeningBalances: boolean; sha: string };

const clean = (v: unknown) => String(v ?? "").trim();
const header = (v: unknown) => clean(v).toLowerCase().replace(/[^a-z0-9]/g, "");
function col(row: Record<string, unknown>, ...names: string[]) { for (const name of names) { const key = Object.keys(row).find((k) => header(k) === header(name)); if (key && row[key] !== undefined && row[key] !== null && row[key] !== "") return row[key]; } return undefined; }
function num(v: unknown): number | null { if (v === undefined || v === null || v === "") return null; const n = typeof v === "number" ? v : Number(String(v).replace(/[₹,$\s]/g, "")); return Number.isFinite(n) ? n : null; }
function date(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
  if (typeof v === "number" && v > 0 && v < 100000) { const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000); return Number.isNaN(d.getTime()) ? null : d; }
  if (v !== undefined && v !== null && v !== "") { const d = new Date(String(v)); if (!Number.isNaN(d.getTime())) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }
  return null;
}
function timestamp(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (v !== undefined && v !== null && v !== "") { const d = new Date(String(v)); if (!Number.isNaN(d.getTime())) return d; }
  return null;
}
function partyType(v: unknown): TransferParty["type"] { const x = header(v); if (["supplier", "vendor", "creditor"].includes(x)) return "SUPPLIER"; if (["customer", "client", "debtor"].includes(x)) return "CUSTOMER"; return null; }
function entryType(row: Record<string, unknown>): { type: "DEBIT" | "CREDIT"; amount: number | null } {
  const debit = num(col(row, "debit", "debit_amount", "paid")); const credit = num(col(row, "credit", "credit_amount", "received"));
  if (debit !== null || credit !== null) { if ((debit ?? 0) !== 0 || (credit ?? 0) === 0) return { type: "DEBIT", amount: Math.abs(debit ?? 0) }; return { type: "CREDIT", amount: Math.abs(credit ?? 0) }; }
  const raw = col(row, "entry_type", "credit_or_debit", "credit or debit flag", "type", "transaction_type"); const x = header(raw);
  const flag = col(row, "is_debit_flag", "debit_flag", "isdebit");
  const isCredit = ["credit", "received", "cr"].includes(x) || (flag !== undefined && ["1", "true", "credit"].includes(header(flag)));
  return { type: isCredit ? "CREDIT" : "DEBIT", amount: num(col(row, "amount", "value")) };
}
function rows(sheet: ExcelJS.Worksheet) {
  const keys = sheet.getRow(1).values as unknown[]; const headers = keys.slice(1).map((v) => clean(v)); const output: Record<string, unknown>[] = [];
  sheet.eachRow((r, index) => { if (index === 1) return; const values = r.values as unknown[]; const item: Record<string, unknown> = {}; headers.forEach((key, i) => { if (key) item[key] = values[i + 1]; }); if (Object.values(item).some((v) => v !== null && v !== undefined && v !== "")) output.push(item); });
  return output;
}
function recordsToParsed(partiesIn: Record<string, unknown>[], txIn: Record<string, unknown>[], sha: string): ParsedTransfer {
  const warnings: string[] = []; const parties: TransferParty[] = []; const sourceToName = new Map<string, string>();
  partiesIn.forEach((r, i) => {
    const name = clean(col(r, "party_name", "name", "account_name", "party")); if (!name) { warnings.push(`Party row ${i + 2}: missing party name; skipped.`); return; }
    const sourceId = clean(col(r, "source_account_id", "account_id", "party_id", "id")) || `party-row-${i + 2}`;
    const p = { sourceId, name, type: partyType(col(r, "party_type", "type", "category")), recordedBalance: num(col(r, "recorded_balance", "balance", "current_balance")), openingBalance: num(col(r, "opening_balance", "openingbalance")) };
    parties.push(p); sourceToName.set(sourceId, name);
  });
  const transactions: TransferTransaction[] = [];
  txIn.forEach((r, i) => {
    const sourceId = clean(col(r, "source_transaction_id", "transaction_id", "id")) || `transaction-row-${i + 2}`;
    const partySourceId = clean(col(r, "party_id", "account_id", "source_account_id")) || null;
    const partyName = clean(col(r, "party_name", "account_name", "party")) || (partySourceId ? sourceToName.get(partySourceId) ?? "" : "");
    const txDate = date(col(r, "date", "transaction_date", "created_at")); const { type, amount } = entryType(r);
    if (!partyName || !txDate || amount === null || amount < 0) { warnings.push(`Transaction row ${i + 2}: missing party, valid date, or amount; skipped.`); return; }
    transactions.push({ sourceId, partySourceId, partyName, date: txDate, description: clean(col(r, "description", "notes", "narration")), amount: Math.abs(amount), entryType: type, createdAt: timestamp(col(r, "row_insertion_date_time", "created_at")) ?? undefined, updatedAt: timestamp(col(r, "row_updation_date_time", "updated_at")) ?? undefined });
  });
  if (!parties.length) throw new Error("No parties were found. Expected a Parties sheet/table with a party_name column.");
  return { parties, transactions, warnings, hasPartyTypes: parties.some((p) => p.type), hasOpeningBalances: parties.some((p) => p.openingBalance !== null), sha };
}

export async function parseTransfer(buffer: Buffer, ext: string): Promise<ParsedTransfer> {
  const sha = createHash("sha256").update(buffer).digest("hex");
  if (ext === ".xlsx") {
    const wb = new ExcelJS.Workbook(); await wb.xlsx.load(buffer as never);
    const pSheet = wb.worksheets.find((s) => header(s.name) === "parties") ?? wb.worksheets[0];
    const tSheet = wb.worksheets.find((s) => header(s.name) === "transactions");
    if (!pSheet || !tSheet) throw new Error("The Excel file must include Parties and Transactions sheets.");
    return recordsToParsed(rows(pSheet), rows(tSheet), sha);
  }
  if (ext !== ".db") throw new Error("Choose an .xlsx or SQLite .db file.");
  const dir = await mkdtemp(path.join(tmpdir(), "account-import-")); const file = path.join(dir, "source.db"); await writeFile(file, buffer);
  let db: DatabaseSync | undefined;
  try {
    db = new DatabaseSync(file, { readOnly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];
    const find = (names: string[]) => tables.find((t) => names.includes(header(t.name)));
    const pTable = find(["party", "parties", "account", "accounts"]); const tTable = find(["transaction", "transactions", "entries", "ledger"]);
    if (!pTable || !tTable) throw new Error("The .db file needs party/account and transaction/ledger tables.");
    const quote = (s: string) => `"${s.replaceAll('"', '""')}"`;
    const pRows = db.prepare(`SELECT * FROM ${quote(pTable.name)}`).all() as Record<string, unknown>[];
    const tRows = db.prepare(`SELECT * FROM ${quote(tTable.name)}`).all() as Record<string, unknown>[];
    return recordsToParsed(pRows, tRows, sha);
  } finally { db?.close(); await rm(dir, { recursive: true, force: true }); }
}

export function deterministicId(scope: string, key: string) {
  const bytes = createHash("sha256").update(`${scope}:${key}`).digest().subarray(0, 16); bytes[6] = (bytes[6] & 0x0f) | 0x50; bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = bytes.toString("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
