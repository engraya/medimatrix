import { NextRequest } from "next/server";
import { backendUrl } from "@/lib/api/config";
import { authCookies, scopeAuthCookie } from "@/lib/api/cookies";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Explicit contract routes prevent an open proxy.
const routes: [RegExp, string[]][] = [
  [/^\/health\/(live|ready)$/, ["GET"]],
  [/^\/auth\/(login|refresh|logout|patient\/start|patient\/verify|forgot-password|reset-password|verify-email|phone\/start|phone\/verify)$/, ["POST"]],
  [/^\/auth\/me$/, ["GET"]],
  [/^\/doctors$/, ["GET", "POST"]],
  [/^\/doctors\/[\w-]+$/, ["GET", "PATCH", "DELETE"]],
  [/^\/users\/me$/, ["GET", "PATCH"]],
  [/^\/users$/, ["GET"]],
  [/^\/users\/staff$/, ["POST"]],
  [/^\/users\/[\w-]+\/role$/, ["PATCH"]],
  [/^\/patients$/, ["GET", "POST"]],
  [/^\/patients\/me$/, ["GET"]],
  [/^\/patients\/[\w-]+$/, ["GET", "PATCH"]],
  [/^\/appointments$/, ["GET", "POST"]],
  [/^\/appointments\/(stats|[\w-]+)$/, ["GET"]],
  [/^\/appointments\/[\w-]+\/(schedule|cancel)$/, ["PATCH"]],
  [/^\/files$/, ["POST"]],
  [/^\/files\/[\w-]+\/(url|download)$/, ["GET"]],
  [/^\/notifications$/, ["GET"]],
  [/^\/notifications\/preferences$/, ["GET", "PUT"]],
  [/^\/notifications\/read-all$/, ["POST"]],
  [/^\/notifications\/[\w-]+\/read$/, ["PATCH"]],
];
async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const path = "/" + (await context.params).path.join("/");
  if (!routes.some(([pattern, methods]) => pattern.test(path) && methods.includes(request.method))) {
    return Response.json({ message: "Not found" }, { status: 404 });
  }
  if (request.method !== "GET") {
    if (process.env.NODE_ENV === "production" && !process.env.APP_ORIGIN) {
      return Response.json({ message: "Service not configured" }, { status: 503 });
    }
    const expectedOrigin = process.env.APP_ORIGIN || request.nextUrl.origin;
    if (request.headers.get("origin") !== expectedOrigin || request.headers.get("x-requested-with") !== "fetch") {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }
  }
  const limit = path === "/files" ? 6 * 1024 * 1024 : 64 * 1024;
  if (Number(request.headers.get("content-length")) > limit) {
    return Response.json({ message: "Request too large" }, { status: 413 });
  }
  let tooLarge = false;
  try {
    const headers = new Headers({ Accept: "application/json" });
    headers.set("cookie", authCookies(request.headers.get("cookie") ?? "", path === "/auth/refresh" || path === "/auth/logout"));
    for (const name of ["content-type", "origin", "x-requested-with"]) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    let received = 0;
    const body = request.body?.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (received > limit) { tooLarge = true; controller.error(new Error("Request too large")); }
        else controller.enqueue(chunk);
      },
    }));
    const upstream = await fetch(backendUrl(path + request.nextUrl.search), {
      method: request.method, headers,
      body: request.method === "GET" ? undefined : body,
      ...({ duplex: "half" } as {}),
      cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(30_000),
    });
    if (upstream.status >= 300 && upstream.status < 400) {
      await upstream.body?.cancel();
      return Response.json({ message: "Unexpected upstream redirect" }, { status: 502 });
    }
    const outgoing = new Headers({ "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" });
    for (const name of ["content-type", "content-disposition", "retry-after"]) {
      const value = upstream.headers.get(name);
      if (value) outgoing.set(name, value);
    }
    for (const cookie of upstream.headers.getSetCookie()) {
      const scoped = scopeAuthCookie(cookie, process.env.NODE_ENV === "production");
      if (scoped) outgoing.append("Set-Cookie", scoped);
    }
    if (path.endsWith("/download")) {
      outgoing.set("Content-Disposition", "attachment");
      outgoing.set("Content-Security-Policy", "sandbox; default-src 'none'");
    }
    if (upstream.status >= 500) {
      await upstream.body?.cancel();
      return Response.json({ message: "Backend unavailable" }, { status: upstream.status, headers: outgoing });
    }
    return new Response(upstream.body, { status: upstream.status, headers: outgoing });
  } catch {
    return Response.json({ message: tooLarge ? "Request too large" : "Backend unavailable" }, { status: tooLarge ? 413 : 502, headers: { "Cache-Control": "no-store" } });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as PUT, proxy as DELETE };
