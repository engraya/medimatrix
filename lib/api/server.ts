import "server-only";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { cache } from "react";
import { currentIdentitySchema, parseResponse } from "./schemas";
import { backendUrl } from "./config";
import { ApiError, readResponse } from "./shared";
import { authCookies } from "./cookies";
export async function serverApi<T>(path: string): Promise<T> {
  const cookieHeader = authCookies((await cookies()).toString());
  return readResponse<T>(await fetch(backendUrl(path), {
    headers: { Cookie: cookieHeader, Accept: "application/json" },
    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(30_000),
  }));
}
export const requireIdentity = cache(async () => {
  try {
    return parseResponse(currentIdentitySchema, await serverApi<unknown>("/auth/me"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/session");
    throw error;
  }
});
export async function requirePatient(userId: string) {
  const identity = await requireIdentity();
  if (identity.role !== "PATIENT" || identity.id !== userId) notFound();
  return identity;
}
export async function requireStaff() {
  const identity = await requireIdentity();
  if (!["ADMIN", "STAFF"].includes(identity.role)) notFound();
  return identity;
}
