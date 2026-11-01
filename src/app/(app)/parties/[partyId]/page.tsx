import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import NavigationReady from "@/components/navigation-ready";
import TransactionForm from "@/components/transaction-form";
import { prisma } from "@/lib/prisma";
import { requireSignedInUser, requireCurrentWorkspace } from "@/lib/current-workspace";

export const instant = false;

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Math.abs(value));
}

export default function PartyLedgerPage({ params }: { params: Promise<{ partyId: string }> }) {
  return <Suspense fallback={null}><PartyLedgerContent params={params} /></Suspense>;
}

async function PartyLedgerContent({ params }: { params: Promise<{ partyId: string }> }) {
  await connection();
  const user = await requireSignedInUser();
  const workspace = await requireCurrentWorkspace(user.id);
  const { partyId } = await params;
  const party = await prisma.party.findFirst({ where: { id: partyId, workbookId: workspace.id } });
  if (!party) notFound();

  const partyTransactions = await prisma.transaction.findMany({
    where: { partyId: party.id },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  const ledgerRows = partyTransactions.reduce<Array<(typeof partyTransactions)[number] & { runningBalance: number }>>(
    (rows, transaction) => {
      const previousBalance = rows.length ? rows[rows.length - 1].runningBalance : party.openingBalance.toNumber();
      const amount = transaction.amount.toNumber();
      const runningBalance = previousBalance + (transaction.entryType === "DEBIT" ? amount : -amount);
      return [...rows, { ...transaction, runningBalance }];
    },
    [],
  ).reverse();
  const balance = ledgerRows[0]?.runningBalance ?? party.openingBalance.toNumber();
  const currency = workspace.currency.trim();

  return (
    <>
      <NavigationReady routeKey={`party:${partyId}`} />
      <div className="ledger-back"><Link className="text-link" href="/parties"><span aria-hidden="true">←</span> All parties</Link><span className="sample-badge">{workspace.name}</span></div>
      <section className="ledger-heading"><div className="ledger-party-title"><span className="avatar avatar-large mint">{party.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</span><div><p className="eyebrow">{party.type} ACCOUNT</p><h1>{party.name}</h1><p className="welcome-subtitle">Every transaction recorded for this party.</p></div></div><div className="ledger-balance-card"><span>Current balance</span><strong>{money(balance, currency)}</strong><small>{balance >= 0 ? "You’ll receive" : "You’ll pay"}</small></div></section>
      <section className="panel ledger-panel"><div className="panel-heading"><div><h2>Transaction ledger</h2><p>{partyTransactions.length} {partyTransactions.length === 1 ? "transaction" : "transactions"} recorded</p></div><TransactionForm partyId={party.id}/></div><div className="table-wrap ledger-table-wrap"><table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th className="align-right">DEBIT</th><th className="align-right">CREDIT</th><th className="align-right">BALANCE</th></tr></thead><tbody>{ledgerRows.length ? ledgerRows.map((transaction) => <tr key={transaction.id}><td className="muted-cell">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(transaction.date)}</td><td><strong className="ledger-description">{transaction.description}</strong></td><td className="amount-cell align-right debit-amount">{transaction.entryType === "DEBIT" ? money(transaction.amount.toNumber(), currency) : "—"}</td><td className="amount-cell align-right credit-amount">{transaction.entryType === "CREDIT" ? money(transaction.amount.toNumber(), currency) : "—"}</td><td className="amount-cell align-right">{money(transaction.runningBalance, currency)} <small>{transaction.runningBalance >= 0 ? "Dr" : "Cr"}</small></td></tr>) : <tr><td className="empty-ledger" colSpan={5}>No transactions recorded for this party yet.</td></tr>}</tbody></table></div></section>
      <footer className="page-footer"><span>Ledgerly <span className="footer-dot">●</span> Your books, in good order.</span><span>All amounts in {currency} <span className="footer-divider">·</span> {workspace.name}</span></footer>
    </>
  );
}


