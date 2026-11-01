import { redirect } from "next/navigation";
import { connection } from "next/server";
import AuthForm from "@/components/auth-form";
import { auth } from "@/lib/auth/server";

export const instant = false;

export default async function SignUpPage() {
  await connection();
  const { data } = await auth.getSession();
  if (data?.session) redirect("/");
  return <AuthForm mode="sign-up"/>;
}
