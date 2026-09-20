import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { api, refreshSession } from "../lib/api/client";

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test("concurrent refresh callers share one rotation request", async () => {
  let refreshes = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith("/auth/me")) return new Response(null, { status: 401 });
    assert.ok(String(url).endsWith("/auth/refresh"));
    refreshes++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return Response.json({ success: true, data: { user: {} } });
  };
  assert.deepEqual(await Promise.all([refreshSession(), refreshSession(), refreshSession()]), [true, true, true]);
  assert.equal(refreshes, 1);
});
test("valid sessions do not rotate tokens again", async () => {
  globalThis.fetch = async url => {
    assert.ok(String(url).endsWith("/auth/me"));
    return Response.json({ success: true, data: { user: {} } });
  };
  assert.equal(await refreshSession(), true);
});
test("protected requests retry once after refresh and never loop on persistent 401", async () => {
  let protectedCalls = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith("/patients/me")) { protectedCalls++; return new Response(null, { status: 401 }); }
    return Response.json({ success: true, data: { user: {} } });
  };
  await assert.rejects(api("/patients/me"));
  assert.equal(protectedCalls, 2);
});
test("logout waits for an in-flight rotation before clearing the session", async () => {
  let rotated = false;
  globalThis.fetch = async url => {
    if (String(url).endsWith("/auth/me")) return new Response(null, { status: 401 });
    if (String(url).endsWith("/auth/refresh")) {
      await new Promise(resolve => setTimeout(resolve, 10));
      rotated = true;
    }
    if (String(url).endsWith("/auth/logout")) assert.equal(rotated, true);
    return Response.json({ success: true, data: null });
  };
  await Promise.all([refreshSession(), api("/auth/logout", { method: "POST" })]);
});
