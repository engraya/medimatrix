"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/shared";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/SubmitButton";

export default function Login() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) });
      // A full navigation drops all cached data from the previous identity.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin");
    } catch (error) { setError(errorMessage(error)); setBusy(false); }
  }
  return <main className="container max-w-md py-20 space-y-6">
    <h1 className="header">Staff sign in</h1>
    <form onSubmit={submit} className="space-y-6">
      <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" autoComplete="username" required /></div>
      <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      {error && <p role="alert" className="shad-error">{error}</p>}
      <SubmitButton isLoading={busy}>Sign in</SubmitButton>
    </form>
    <Link href="/account/forgot-password" className="block underline">Forgot password?</Link>
    <Link href="/" className="block underline">Patient sign in</Link>
  </main>;
}
