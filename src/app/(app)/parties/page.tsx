import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import NavigationReady from "@/components/navigation-ready";
import PartyForm from "@/components/party-form";
import { prisma } from "@/lib/prisma";
import { requireSignedInUser, requireCurrentWorkspace } from "@/lib/current-workspace";

export const instant = false;

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
}

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(Math.abs(amount));
}

export default function PartiesPage() {
  return <Suspense fallback={null}><PartiesContent /></Suspense>;
}

async function PartiesContent() {
  await connection();
  const user = await requireSignedInUser();
  const workspace = await requireCurrentWorkspace(user.id);
  const parties = await prisma.party.findMany({
    where: { workbookId: workspace.id },
    include: { transactions: { select: { amount: true, entryType: true } } },
    orderBy: { name: "asc" },
  });
  const balanceFor = (party: (typeof parties)[number]) => party.transactions.reduce(
    (balance, transaction) => balance + (transaction.entryType === "DEBIT" ? transaction.amount.toNumber() : -transaction.amount.toNumber()),
    party.openingBalance.toNumber(),
  );

  return (
    <>
      <NavigationReady routeKey="parties" />
      <section className="directory-heading"><div><p className="eyebrow"><span className="live-dot"/> {workspace.name.toUpperCase()} WORKSPACE</p><h1>Parties</h1><p className="welcome-subtitle">Customers and suppliers in this workspace, with each party’s transactions.</p></div><div className="directory-heading-actions"><Link className="sample-badge" href="/data-transfer">Import / export</Link><Link className="sample-badge" href="/workspaces">Manage workspaces</Link></div></section>
      <section className="directory-summary"><div><strong>{parties.length}</strong><span>parties</span></div><div><strong>{parties.filter((party) => party.type === "CUSTOMER").length}</strong><span>customers</span></div><div><strong>{parties.filter((party) => party.type === "SUPPLIER").length}</strong><span>suppliers</span></div></section>
      <section className="panel directory-panel"><div className="panel-heading"><div><h2>All parties</h2><p>Each party opens its ledger and transaction history.</p></div><details className="add-entity-menu"><summary className="button button-primary">+ Add party</summary><div className="entity-popover"><PartyForm/></div></details></div>
        {parties.length ? <div className="directory-list">{parties.map((party) => { const balance = balanceFor(party); return <Link className="directory-row party-link" href={`/parties/${party.id}`} key={party.id}><span className="avatar mint">{initials(party.name)}</span><span className="directory-party-name"><strong>{party.name}</strong><small>{party.type === "CUSTOMER" ? "Customer" : "Supplier"}</small></span><span className="directory-activity">{balance >= 0 ? "You’ll receive" : "You’ll pay"}</span><span className="directory-balance"><strong>{money(balance, workspace.currency.trim())}</strong><small>Current balance</small></span><span className="row-chevron" aria-hidden="true">›</span></Link>; })}</div> : <div className="empty-ledger workspace-empty">No parties yet. Add a customer or supplier to start this workspace’s ledger.</div>}
      </section>
      <footer className="page-footer"><span>Ledgerly <span className="footer-dot">●</span> Your books, in good order.</span><span>All amounts in {workspace.currency.trim()} <span className="footer-divider">·</span> {workspace.name}</span></footer>
    </>
  );
}
