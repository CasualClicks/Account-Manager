"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export type AuthFormState = { error: string } | null;

function field(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function signIn(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  try {
    const { error } = await auth.signIn.email({ email, password });
    if (error) return { error: error.message || "Unable to sign in. Check your details and try again." };
  } catch {
    return { error: "Unable to reach Neon Auth. Check the Auth URL and try again." };
  }
  redirect("/");
}

export async function signUp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !email || !password) return { error: "Complete every field to create your account." };
  if (password.length < 8) return { error: "Use a password with at least 8 characters." };

  try {
    const { error } = await auth.signUp.email({ email, name, password });
    if (error) return { error: error.message || "Unable to create your account." };
  } catch {
    return { error: "Unable to reach Neon Auth. Check the Auth URL and try again." };
  }
  redirect("/");
}
