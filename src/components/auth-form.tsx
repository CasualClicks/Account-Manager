"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthFormState } from "@/app/auth/actions";

export default function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const action = mode === "sign-in" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(action, null);
  const isSignUp = mode === "sign-up";

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" href="/"><span className="brand-mark">L</span><span>ledgerly<span className="brand-dot">.</span></span></Link>
        <p className="eyebrow">ACCOUNT MANAGER</p>
        <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-description">{isSignUp ? "Set up your workspace to start managing party ledgers." : "Sign in to continue to your account books."}</p>
        <form action={formAction} className="auth-form">
          {isSignUp && <label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label>}
          <label>Email address<input name="email" type="email" autoComplete="email" required/></label>
          <label>Password<input name="password" type="password" autoComplete={isSignUp ? "new-password" : "current-password"} required minLength={8}/></label>
          {state?.error && <p className="auth-error" role="alert">{state.error}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={pending}>{pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}</button>
        </form>
        <p className="auth-switch">{isSignUp ? "Already have an account?" : "New to Ledgerly?"} <Link href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
      </section>
    </main>
  );
}
