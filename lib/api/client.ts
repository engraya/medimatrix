"use client";
import { readResponse } from "./shared";
let refreshRequest: Promise<boolean> | undefined;
export function refreshSession(): Promise<boolean> {
  if (!refreshRequest) {
    const restore = async () => {
      const options = { credentials: "same-origin" as const, cache: "no-store" as const, headers: { "X-Requested-With": "fetch" } };
      // Another tab may have already refreshed while this tab waited for the lock.
      const current = await fetch("/api/backend/auth/me", { ...options, signal: AbortSignal.timeout(30_000) });
      if (current.ok) return true;
      if (current.status !== 401) return false;
      const refreshed = await fetch("/api/backend/auth/refresh", { ...options, method: "POST", signal: AbortSignal.timeout(30_000) });
      return refreshed.ok;
    };
    refreshRequest = (async (): Promise<boolean> => {
      if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request("medimatrix-session", restore);
      return await restore();
    })().catch(() => false).finally(() => { refreshRequest = undefined; });
  }
  return refreshRequest;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const send = () => fetch(`/api/backend${path}`, {
    ...init, credentials: "same-origin", cache: "no-store",
    signal: init.signal ?? AbortSignal.timeout(30_000),
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      "X-Requested-With": "fetch", ...init.headers,
    },
  });
  // Logout must finish after any token rotation so a late refresh cannot sign
  // the browser back in after its cookies have been cleared.
  if (path === "/auth/logout" && refreshRequest) await refreshRequest;
  let response = path === "/auth/logout" && typeof navigator !== "undefined" && navigator.locks
    ? await navigator.locks.request("medimatrix-session", send)
    : await send();
  if (response.status === 401 && !path.startsWith("/auth/")) {
    if (await refreshSession()) response = await send();
  }
  return readResponse<T>(response);
}
