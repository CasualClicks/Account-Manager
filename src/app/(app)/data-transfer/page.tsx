import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import NavigationReady from "@/components/navigation-ready";
import DataTransfer from "@/components/data-transfer";
import { requireCurrentWorkspace, requireSignedInUser } from "@/lib/current-workspace";
import { prisma } from "@/lib/prisma";

export default function DataTransferPage() { return <Suspense fallback={null}><Content /></Suspense>; }
async function Content() {
  await connection(); const user = await requireSignedInUser(); const workspace = await requireCurrentWorkspace(user.id);
  const [parties, transactions] = await Promise.all([
    prisma.party.count({ where: { workbookId: workspace.id } }),
    prisma.transaction.count({ where: { party: { workbookId: workspace.id } } }),
  ]);
  return <><NavigationReady routeKey="data-transfer"/><section className="directory-heading"><div><p className="eyebrow"><span className="live-dot"/> {workspace.name.toUpperCase()} WORKSPACE</p><h1>Import &amp; export</h1><p className="welcome-subtitle">Move ledger data into or out of this workspace.</p></div><Link className="button button-secondary" href="/parties">← Back to parties</Link></section><DataTransfer workspaceName={workspace.name} partyCount={parties} transactionCount={transactions}/></>;
}
