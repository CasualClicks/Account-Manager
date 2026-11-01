"use client";

import { useActionState } from "react";
import { createParty, type PartyFormState } from "@/app/parties/actions";

export default function PartyForm() {
  const [state, action, pending] = useActionState<PartyFormState, FormData>(createParty, null);
  return <form className="entity-form" action={action}>
    <label>Party name<input name="name" placeholder="Business or person name" maxLength={160} required/></label>
    <label>Party type<select name="type" defaultValue="CUSTOMER"><option value="CUSTOMER">Customer</option><option value="SUPPLIER">Supplier</option></select></label>
    <label>Opening balance (debit positive, credit negative)<input name="openingBalance" type="number" step="0.01" defaultValue="0"/></label>
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? "Adding…" : "Add party"}</button>
    {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
  </form>;
}
