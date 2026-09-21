"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CareShell } from "@/components/CareShell";
import { api, refreshSession } from "@/lib/api/client";
import { currentIdentitySchema, parseResponse } from "@/lib/api/schemas";
import { resourceId } from "@/lib/api/shared";

export default function Session() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function restore() {
      try {
        if (!(await refreshSession())) throw new Error("Session expired");
        const user = parseResponse(
          currentIdentitySchema,
          await api<unknown>("/auth/me"),
        );
        window.location.replace(
          user.role === "PATIENT"
            ? `/patients/${resourceId(user.id)}/register`
            : "/admin",
        );
      } catch {
        setFailed(true);
      }
    }
    void restore();
  }, []);
  return (
    <CareShell>
      <div className="space-y-6">
        <h1 className="header">
          {failed ? "Please sign in" : "Restoring your session…"}
        </h1>
        {failed && (
          <>
            <Link className="block underline" href="/">
              Patient sign in
            </Link>
            <Link className="block underline" href="/login">
              Staff sign in
            </Link>
          </>
        )}
      </div>
    </CareShell>
  );
}
