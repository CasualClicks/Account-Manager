"use client";

import { useActionState, useRef } from "react";
import { createTransaction, type PartyFormState } from "@/app/parties/actions";

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export default function TransactionForm({ partyId }: { partyId: string }) {
  const [state, action, pending] = useActionState<PartyFormState, FormData>(createTransaction, null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  function showForm() {
    if (dateRef.current) dateRef.current.value = localToday();
    dialogRef.current?.showModal();
  }

  function closeForm() {
    dialogRef.current?.close();
  }

  return <>
    <button className="button button-primary" type="button" onClick={showForm}>+ Add transaction</button>
    <dialog ref={dialogRef} className="transaction-dialog" aria-labelledby="transaction-dialog-title">
      <div className="transaction-dialog-heading"><div><p className="eyebrow">NEW LEDGER ENTRY</p><h2 id="transaction-dialog-title">Add transaction</h2></div><button className="dialog-close" type="button" aria-label="Close" onClick={closeForm}>×</button></div>
      <form className="entity-form transaction-form" action={action}>
    <input type="hidden" name="partyId" value={partyId}/>
    <label>Description<input name="description" placeholder="Invoice, payment, goods supplied…" maxLength={500} required/></label>
    <label>Date<input ref={dateRef} name="date" type="date" required/></label>
    <label>Amount<input name="amount" type="number" min="0" step="0.01" required/></label>
    <label>Entry type<select name="entryType" defaultValue="DEBIT"><option value="DEBIT">Debit</option><option value="CREDIT">Credit</option></select></label>
    <div className="transaction-dialog-actions"><button className="button button-secondary" type="button" onClick={closeForm}>Cancel</button><button className="button button-primary" type="submit" disabled={pending}>{pending ? "Saving…" : "Add transaction"}</button></div>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
      </form>
    </dialog>
  </>;
}
