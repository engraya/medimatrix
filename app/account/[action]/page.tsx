"use client";
import { FormEvent, useState, use, useEffect, useRef } from "react";
import Link from "next/link";
import { CareShell } from "@/components/CareShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SubmitButton from "@/components/SubmitButton";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/shared";

export default function AccountAction({
  params,
}: {
  params: Promise<{ action: string }>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { action } = use(params);
  const tokenInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const token = fragment.get("token");
    // Repeated effects must not clear a token already consumed from the URL.
    if (tokenInput.current && token) tokenInput.current.value = token;
    if (window.location.hash)
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
  }, []);
  const allowed = [
    "forgot-password",
    "reset-password",
    "verify-email",
  ].includes(action);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!allowed) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const payload =
        action === "forgot-password"
          ? { email: values.get("email") }
          : {
              token: values.get("token"),
              ...(action === "reset-password"
                ? { password: values.get("password") }
                : {}),
            };
      await api(`/auth/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setDone(true);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }
  if (!allowed)
    return (
      <CareShell>
        <div className="space-y-6">
          <Link href="/">Page not found. Return home.</Link>
        </div>
      </CareShell>
    );
  return (
    <CareShell>
      <div className="space-y-6">
        <h1 className="header">
          {action === "forgot-password"
            ? "Forgot password"
            : action === "reset-password"
              ? "Reset password"
              : "Verify email"}
        </h1>
        {done ? (
          <p role="status">
            {action === "forgot-password"
              ? "If the account exists, password reset instructions will be sent to it."
              : "Your request was completed."}
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            {action === "forgot-password" ? (
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="token">Token from your email</Label>
                <Input
                  id="token"
                  name="token"
                  ref={tokenInput}
                  autoComplete="off"
                  required
                />
              </div>
            )}
            {action === "reset-password" && (
              <div>
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  required
                />
              </div>
            )}
            {error && (
              <p role="alert" className="shad-error">
                {error}
              </p>
            )}
            <SubmitButton isLoading={busy}>Continue</SubmitButton>
          </form>
        )}
        <Link href="/login" className="block underline">
          Return to sign in
        </Link>
        {action === "forgot-password" && (
          <Link href="/account/reset-password" className="block underline">
            I have a reset token
          </Link>
        )}
      </div>
    </CareShell>
  );
}
