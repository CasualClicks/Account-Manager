"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function SignOutButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return <button className="icon-button profile-menu" type="button" aria-label="Sign out" title="Sign out" disabled={pending} onClick={async () => {
    setPending(true);
    await authClient.signOut();
    router.push("/auth/sign-in");
    router.refresh();
  }}>{pending ? "…" : "↪"}</button>;
}
