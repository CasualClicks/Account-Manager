"use client";

import { useState } from "react";

type Preview = { parties: number; transactions: number; warnings: string[]; warningCount: number; hasPartyTypes: boolean; hasOpeningBalances: boolean; workspace: string; partiesCreated?: number; transactionsCreated?: number; skippedTransactions?: number };
export default function DataTransfer({ workspaceName, partyCount, transactionCount }: { workspaceName: string; partyCount: number; transactionCount: number }) {
  const [file, setFile] = useState<File | null>(null); const [fallbackType, setFallbackType] = useState("CUSTOMER"); const [balanceMode, setBalanceMode] = useState("opening"); const [preview, setPreview] = useState<Preview | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function send(mode: "preview" | "import") {
    if (!file) { setError("Choose an .xlsx or .db file first."); return; }
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.set("file", file); form.set("mode", mode); form.set("fallbackType", fallbackType); form.set("balanceMode", balanceMode);
      const response = await fetch("/api/data/import", { method: "POST", body: form }); const data = await response.json();
      if (!response.ok) { setError(data.error ?? "The import could not be completed."); if (data.conflicts?.length) setError(`${data.error} Existing names: ${data.conflicts.join(", ")}${data.conflictCount > data.conflicts.length ? ` and ${data.conflictCount - data.conflicts.length} more` : ""}`); return; }
      setPreview(data);
      if (mode === "import") { setFile(null); setPreview(data); }
    } catch { setError("Could not reach the server. Check that the app is running and try again."); }
    finally { setBusy(false); }
  }
  return <div className="transfer-grid">
    <section className="panel transfer-panel"><div className="panel-heading"><div><h2>Import ledger data</h2><p>Preview the file before adding rows to {workspaceName}.</p></div><span className="transfer-count">{partyCount} parties · {transactionCount} transactions</span></div>
      <label className="transfer-file"><span className="transfer-file-icon">↑</span><strong>{file ? file.name : "Choose a migration file"}</strong><small>.xlsx workbook or SQLite .db file · up to 50 MB</small><input type="file" accept=".xlsx,.db,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-sqlite3" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setPreview(null); setError(""); }}/></label>
      <div className="transfer-options"><label>Default party type for files without one<select value={fallbackType} onChange={(e) => setFallbackType(e.target.value)}><option value="CUSTOMER">Customer</option><option value="SUPPLIER">Supplier</option></select></label><fieldset><legend>Recorded balance means</legend><label><input type="radio" name="balance-mode" value="opening" checked={balanceMode === "opening"} onChange={() => setBalanceMode("opening")}/> Opening balance before these transactions</label><label><input type="radio" name="balance-mode" value="current" checked={balanceMode === "current"} onChange={() => setBalanceMode("current")}/> Current balance after these transactions</label></fieldset></div>
      {error && <p className="transfer-error" role="alert">{error}</p>}
      {preview && <div className="transfer-preview" aria-live="polite"><strong>{preview.parties} parties and {preview.transactions} transactions found</strong><span>Target workspace: {preview.workspace}</span>{preview.warningCount > 0 && <details><summary>{preview.warningCount} rows need attention</summary><ul>{preview.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul></details>}{preview.partiesCreated !== undefined && <span>Imported {preview.partiesCreated} parties and {preview.transactionsCreated} transactions{preview.skippedTransactions ? `; ${preview.skippedTransactions} transactions could not be matched to a party` : ""}.</span>}</div>}
      <div className="transfer-actions"><button className="button button-secondary" type="button" disabled={!file || busy} onClick={() => void send("preview")}>{busy ? "Working…" : "Preview import"}</button>{preview && preview.partiesCreated === undefined && <button className="button button-primary" type="button" disabled={busy} onClick={() => void send("import")}>{busy ? "Importing…" : `Import into ${workspaceName}`}</button>}</div>
      <p className="transfer-note">Imports are limited to the selected workspace. Parties with names that already exist there are flagged to avoid accidental duplicates. Documents are not imported from a spreadsheet or database file.</p>
    </section>
    <section className="panel transfer-panel export-panel"><div className="panel-heading"><div><h2>Export this workspace</h2><p>Download a migration-ready Excel workbook.</p></div><span className="transfer-export-icon">↓</span></div><p className="transfer-export-description">Includes parties, opening and current balances, transactions, and document metadata in separate sheets. File contents are stored separately and are not embedded in the workbook.</p><a className="button button-primary" href="/api/data/export">Download .xlsx export</a></section>
  </div>;
}
