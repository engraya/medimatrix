import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { NextRequest } from "next/server";
import { GET, POST } from "../app/api/backend/[...path]/route";

const originalFetch = globalThis.fetch;
const originalBase = process.env.API_BASE_URL;
const originalOrigin = process.env.APP_ORIGIN;
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalBase === undefined) delete process.env.API_BASE_URL; else process.env.API_BASE_URL = originalBase;
  if (originalOrigin === undefined) delete process.env.APP_ORIGIN; else process.env.APP_ORIGIN = originalOrigin;
});
const context = (path: string) => ({ params: Promise.resolve({ path: path.split("/") }) });
function request(path: string, headers: Record<string, string> = {}, body = "{}") {
  return new NextRequest(`http://localhost:3000/api/backend/${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
}
test("proxy rejects cross-origin and missing-CSRF-header mutations before contacting the backend", async () => {
  globalThis.fetch = async () => { throw new Error("Must not reach backend"); };
  process.env.APP_ORIGIN = "http://localhost:3000";
  const attempts: Record<string, string>[] = [{ origin: "https://evil.example", "x-requested-with": "fetch" }, { origin: "http://localhost:3000" }];
  for (const headers of attempts) {
    assert.equal((await POST(request("auth/login", headers), context("auth/login"))).status, 403);
  }
});
test("proxy refuses unknown routes and oversized requests", async () => {
  assert.equal((await GET(new NextRequest("http://localhost:3000/api/backend/internal"), context("internal"))).status, 404);
  assert.equal((await POST(request("auth/login", { origin: "http://localhost:3000", "x-requested-with": "fetch", "content-length": "99999999" }), context("auth/login"))).status, 413);
});
test("proxy forwards only auth cookies and rewrites upstream cookies without exposing foreign-domain scope", async () => {
  process.env.API_BASE_URL = "http://localhost:4000/api/v1";
  process.env.APP_ORIGIN = "http://localhost:3000";
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), "http://localhost:4000/api/v1/auth/login");
    assert.equal(new Headers(options?.headers).get("cookie"), "access_token=a");
    return Response.json({ success: true, data: null }, { headers: { "set-cookie": "access_token=new; Domain=backend.example; Path=/api/v1; HttpOnly" } });
  };
  const response = await POST(request("auth/login", { origin: "http://localhost:3000", "x-requested-with": "fetch", cookie: "access_token=a; refresh_token=r; unrelated=secret" }), context("auth/login"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie")!, /Path=\//);
  assert.doesNotMatch(response.headers.get("set-cookie")!, /Domain=/);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});
test("upstream redirects and server errors cannot expose credentials or private diagnostics", async () => {
  process.env.API_BASE_URL = "http://localhost:4000/api/v1";
  globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: "https://evil.example" } });
  assert.equal((await GET(new NextRequest("http://localhost:3000/api/backend/auth/me"), context("auth/me"))).status, 502);
  globalThis.fetch = async () => new Response("database password and patient data", { status: 500 });
  const response = await GET(new NextRequest("http://localhost:3000/api/backend/auth/me"), context("auth/me"));
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /password|patient/);
});
test("streamed bodies cannot evade the size limit by omitting Content-Length", async () => {
  process.env.API_BASE_URL = "http://localhost:4000/api/v1";
  process.env.APP_ORIGIN = "http://localhost:3000";
  globalThis.fetch = async (_url, options) => {
    await new Response(options?.body).text();
    throw new Error("Oversized body must not finish");
  };
  const response = await POST(request("auth/login", { origin: "http://localhost:3000", "x-requested-with": "fetch" }, "x".repeat(70 * 1024)), context("auth/login"));
  assert.equal(response.status, 413);
});
