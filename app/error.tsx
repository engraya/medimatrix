"use client";
import Link from "next/link";
import { CareShell } from "@/components/CareShell";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <CareShell>
      <div className="space-y-6">
        <h1 className="header">Unable to load this page</h1>
        <p>Please try again. If your session has expired, sign in again.</p>
        <Button onClick={reset}>Try again</Button>
        <Link className="block underline" href="/session">
          Restore session
        </Link>
        <Link className="block underline" href="/">
          Home
        </Link>
      </div>
    </CareShell>
  );
}
