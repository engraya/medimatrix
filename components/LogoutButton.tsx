"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/shared";
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><Button variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setError("");
    try {
      await api("/auth/logout", { method: "POST" });
      // Purge in-memory patient data and the router cache when ending a session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    }
    catch (error) { setError(errorMessage(error)); setBusy(false); }
  }}>Sign out</Button>{error && <p role="alert" className="shad-error">{error}</p>}</div>;
}
