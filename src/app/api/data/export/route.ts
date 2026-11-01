import ExcelJS from "exceljs";
import { auth } from "@/lib/auth/server";
import { requireCurrentWorkspace } from "@/lib/current-workspace";
import { prisma } from "@/lib/prisma";


export async function GET() {
  const { data } = await auth.getSession();
  if (!data?.user) return Response.json({ error: "Sign in to export data." }, { status: 401 });
  const workspace = await requireCurrentWorkspace(data.user.id);
  const parties = await prisma.party.findMany({ where: { workbookId: workspace.id }, include: { transactions: { orderBy: [{ date: "asc" }, { createdAt: "asc" }], include: { documents: true } } }, orderBy: { name: "asc" } });
  const wb = new ExcelJS.Workbook(); wb.creator = "Ledgerly"; wb.created = new Date(); wb.modified = new Date();
  const summary = wb.addWorksheet("Summary"); summary.addRows([["workspace", workspace.name], ["currency", workspace.currency.trim()], ["parties", parties.length], ["transactions", parties.reduce((n, p) => n + p.transactions.length, 0)], ["exported_at", new Date()]]);
  const partySheet = wb.addWorksheet("Parties"); partySheet.columns = [
    { header: "source_account_id", key: "id", width: 38 }, { header: "party_name", key: "name", width: 32 }, { header: "recorded_balance", key: "balance", width: 20 }, { header: "party_type", key: "type", width: 16 }, { header: "opening_balance", key: "opening", width: 20 },
  ];
  const txSheet = wb.addWorksheet("Transactions"); txSheet.columns = [
    { header: "source_transaction_id", key: "id", width: 38 }, { header: "party_id", key: "partyId", width: 38 }, { header: "party_name", key: "party", width: 32 }, { header: "date", key: "date", width: 15 }, { header: "description", key: "description", width: 46 }, { header: "credit", key: "credit", width: 16 }, { header: "debit", key: "debit", width: 16 }, { header: "is_debit_flag", key: "flag", width: 15 }, { header: "day", key: "day", width: 10 }, { header: "month", key: "month", width: 10 }, { header: "year", key: "year", width: 10 }, { header: "amount", key: "amount", width: 16 }, { header: "entry_type", key: "type", width: 14 }, { header: "row_insertion_date_time", key: "created", width: 25 }, { header: "row_updation_date_time", key: "updated", width: 25 },
  ];
  const docSheet = wb.addWorksheet("Documents"); docSheet.columns = [
    { header: "source_transaction_id", key: "tx", width: 38 }, { header: "party_name", key: "party", width: 32 }, { header: "file_name", key: "name", width: 36 }, { header: "mime_type", key: "mime", width: 22 }, { header: "file_size_bytes", key: "size", width: 18 }, { header: "bucket", key: "bucket", width: 14 }, { header: "object_key", key: "key", width: 50 }, { header: "uploaded_at", key: "created", width: 25 },
  ];
  const txCount = parties.reduce((n, p) => n + p.transactions.length, 0);
  for (const party of parties) {
    const net = party.transactions.reduce((balance, tx) => balance + (tx.entryType === "DEBIT" ? tx.amount.toNumber() : -tx.amount.toNumber()), party.openingBalance.toNumber());
    partySheet.addRow({ id: party.id, name: party.name, balance: net, type: party.type, opening: party.openingBalance.toNumber() });
    for (const tx of party.transactions) {
      const day = tx.date.getUTCDate(), month = tx.date.getUTCMonth() + 1, year = tx.date.getUTCFullYear();
      txSheet.addRow({ id: tx.id, partyId: party.id, party: party.name, date: tx.date, description: tx.description, credit: tx.entryType === "CREDIT" ? tx.amount.toNumber() : 0, debit: tx.entryType === "DEBIT" ? tx.amount.toNumber() : 0, flag: tx.entryType === "CREDIT" ? 1 : 0, day, month, year, amount: tx.amount.toNumber(), type: tx.entryType, created: tx.createdAt, updated: tx.updatedAt });
      for (const doc of tx.documents) docSheet.addRow({ tx: tx.id, party: party.name, name: doc.fileName, mime: doc.mimeType, size: doc.fileSize, bucket: doc.bucket, key: doc.objectKey, created: doc.createdAt });
    }
  }
  summary.addRow(["document_metadata_rows", docSheet.rowCount - 1]);
  for (const sheet of [summary, partySheet, txSheet, docSheet]) { sheet.getRow(1).font = { bold: true }; sheet.views = [{ state: "frozen", ySplit: 1 }]; }
  const bytes = await wb.xlsx.writeBuffer();
  const safeName = workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
  return new Response(bytes, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="ledgerly-${safeName}-export.xlsx"`, "Cache-Control": "no-store", "X-Exported-Transactions": String(txCount) } });
}
