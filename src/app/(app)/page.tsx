import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import NavigationReady from "@/components/navigation-ready";
import { prisma } from "@/lib/prisma";
import { requireSignedInUser, requireCurrentWorkspace } from "@/lib/current-workspace";

export const instant = false;

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Math.abs(value));
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
}

export default function Home() {
  return <Suspense fallback={null}><DashboardContent /></Suspense>;
}

async function DashboardContent() {
  await connection();
  const user = await requireSignedInUser();
  const workspace = await requireCurrentWorkspace(user.id);
  const [parties, recentTransactions, monthTransactions] = await Promise.all([
    prisma.party.findMany({ where: { workbookId: workspace.id }, include: { transactions: true }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { party: { workbookId: workspace.id } },
      include: { party: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 8,
    }),
    (() => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      return prisma.transaction.findMany({
        where: { party: { workbookId: workspace.id }, date: { gte: thisMonth } },
        include: { party: { select: { type: true } } },
      });
    })(),
  ]);
  const partyBalances = parties.map((party) => ({
    party,
    balance: party.transactions.reduce((total, transaction) => total + (transaction.entryType === "DEBIT" ? transaction.amount.toNumber() : -transaction.amount.toNumber()), party.openingBalance.toNumber()),
  }));
  const receivable = partyBalances.filter(({ party, balance }) => party.type === "CUSTOMER" && balance > 0).reduce((total, item) => total + item.balance, 0);
  const payable = partyBalances.filter(({ party, balance }) => party.type === "SUPPLIER" && balance < 0).reduce((total, item) => total + Math.abs(item.balance), 0);
  const received = monthTransactions.filter((item) => item.party.type === "CUSTOMER" && item.entryType === "CREDIT").reduce((total, item) => total + item.amount.toNumber(), 0);
  const paid = monthTransactions.filter((item) => item.party.type === "SUPPLIER" && item.entryType === "DEBIT").reduce((total, item) => total + item.amount.toNumber(), 0);
  const currency = workspace.currency.trim();

  return (
    <>
      <NavigationReady routeKey="overview" />
      <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot"/> {workspace.name.toUpperCase()} WORKSPACE</p><h1>{workspace.name}</h1><p className="welcome-subtitle">A live overview of this workspace’s parties and ledger.</p></div><div className="welcome-actions"><Link className="button button-secondary" href="/workspaces">Manage workspaces</Link><Link className="button button-primary" href="/parties">Open parties</Link></div></section>
      <section className="stat-grid" aria-label="Account summary">
        {[["Receivable", receivable, "green"], ["Payable", payable, "amber"], ["Received this month", received, "blue"], ["Paid this month", paid, "violet"]].map(([label, amount, color]) => <article className="stat-card" key={String(label)}><div className="stat-heading"><span>{label}</span><span className={`stat-icon ${color}`}>₹</span></div><strong className="stat-value">{money(Number(amount), currency)}</strong><div className="stat-foot"><span>{partyBalances.length} {partyBalances.length === 1 ? "party" : "parties"}</span><span className="stat-period">{workspace.name}</span></div></article>)}
      </section>
      <section className="overview-grid">
        <article className="panel activity-panel"><div className="panel-heading"><div><h2>Recent transactions</h2><p>Select a party to open its complete ledger</p></div><Link className="text-link" href="/parties">View parties →</Link></div><div className="table-wrap"><table><thead><tr><th>PARTY</th><th>DESCRIPTION</th><th>DATE</th><th className="align-right">AMOUNT</th></tr></thead><tbody>{recentTransactions.length ? recentTransactions.map((transaction) => <tr key={transaction.id}><td><Link className="party-cell party-link" href={`/parties/${transaction.partyId}`}><span className="avatar mint">{initials(transaction.party.name)}</span><span><strong>{transaction.party.name}</strong><small>{transaction.description}</small></span></Link></td><td className="muted-cell">{transaction.entryType === "DEBIT" ? "Debit entry" : "Credit entry"}</td><td className="muted-cell">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(transaction.date)}</td><td className={`amount-cell align-right ${transaction.entryType === "DEBIT" ? "in" : "out"}`}>{transaction.entryType === "DEBIT" ? "+" : "−"}{money(transaction.amount.toNumber(), currency)}</td></tr>) : <tr><td className="empty-ledger" colSpan={4}>No transactions in this workspace yet.</td></tr>}</tbody></table></div></article>
        <article className="panel balance-panel"><div className="panel-heading"><div><h2>Party balances</h2><p>This workspace only</p></div></div><div className="party-list">{partyBalances.slice(0, 4).map(({ party, balance }) => <Link className="party-balance party-link" href={`/parties/${party.id}`} key={party.id}><span className="avatar mint">{initials(party.name)}</span><div className="party-balance-info"><strong>{party.name}</strong><small>{party.type === "CUSTOMER" ? "Customer" : "Supplier"}</small></div><div className="balance-number"><strong>{money(balance, currency)}</strong><small>{balance >= 0 ? "You’ll receive" : "You’ll pay"}</small></div></Link>)}{!partyBalances.length && <p className="empty-ledger">Add a party to start this ledger.</p>}</div><Link className="panel-footer-link" href="/parties">All parties →</Link></article>
      </section>
      <footer className="page-footer"><span>Ledgerly <span className="footer-dot">●</span> Your books, in good order.</span><span>All amounts in {currency} <span className="footer-divider">·</span> {workspace.name}</span></footer>
    </>
  );
}
