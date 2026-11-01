export type DemoParty = {
  id: string;
  name: string;
  type: "Customer" | "Supplier";
  initials: string;
  color: "lavender" | "peach" | "mint" | "blue";
  openingBalance: number;
};

export type DemoTransaction = {
  id: string;
  partyId: string;
  date: string;
  description: string;
  amount: number;
  entryType: "DEBIT" | "CREDIT";
  timeLabel: string;
};

export const demoParties: DemoParty[] = [
  { id: "aarav-kumar", name: "Aarav Kumar", type: "Customer", initials: "AK", color: "lavender", openingBalance: 24000 },
  { id: "nisha-and-co", name: "Nisha & Co.", type: "Supplier", initials: "NK", color: "peach", openingBalance: -28000 },
  { id: "rohan-kirana-store", name: "Rohan Kirana Store", type: "Customer", initials: "RK", color: "mint", openingBalance: 4750 },
  { id: "meera-shah", name: "Meera Shah", type: "Supplier", initials: "MS", color: "peach", openingBalance: -20800 },
  { id: "priya-sharma", name: "Priya Sharma", type: "Customer", initials: "PS", color: "blue", openingBalance: 0 },
];

export const demoTransactions: DemoTransaction[] = [
  { id: "txn-2041", partyId: "aarav-kumar", date: "2026-10-27", description: "Invoice #INV-2041", amount: 18500, entryType: "DEBIT", timeLabel: "10:42 am" },
  { id: "txn-2040", partyId: "meera-shah", date: "2026-10-26", description: "Monthly supplies", amount: 7200, entryType: "CREDIT", timeLabel: "Yesterday" },
  { id: "txn-2039", partyId: "rohan-kirana-store", date: "2026-10-26", description: "Goods supplied", amount: 12000, entryType: "DEBIT", timeLabel: "Yesterday" },
  { id: "txn-2038", partyId: "priya-sharma", date: "2026-10-24", description: "Invoice #INV-2038", amount: 3450, entryType: "DEBIT", timeLabel: "24 Oct" },
];

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
}

export function getPartyBalance(party: DemoParty) {
  return demoTransactions
    .filter((transaction) => transaction.partyId === party.id)
    .reduce(
      (balance, transaction) =>
        balance + (transaction.entryType === "DEBIT" ? transaction.amount : -transaction.amount),
      party.openingBalance,
    );
}
