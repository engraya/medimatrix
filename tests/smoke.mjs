import { chromium, expect } from "@playwright/test";
import { generate } from "selfsigned";
import { createServer } from "node:https";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import path from "node:path";

// The production frontend talks to an isolated HTTPS fixture server, never clinical data.
const fixtures = JSON.parse(await readFile(new URL("../docs/sample-responses.json", import.meta.url), "utf8"));
const sample = (method, route) => structuredClone(fixtures.endpoints.find(entry => entry.method === method && entry.path === route).sampleResponse);
const directory = path.resolve("test-results");
await mkdir(directory, { recursive: true });
const certificates = await generate([{ name: "commonName", value: "localhost" }], {
  days: 1, keySize: 2048, extensions: [{ name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }, { type: 7, ip: "127.0.0.1" }] }],
});
const certificatePath = path.join(directory, "fixture-ca.pem");
await writeFile(certificatePath, certificates.cert);
let registered = false;
let refreshes = 0;
const backend = createServer({ key: certificates.private, cert: certificates.cert }, async (request, response) => {
  const route = new URL(request.url, "https://localhost").pathname.replace("/api/v1", "");
  const role = request.headers.cookie?.includes("access_token=staff") ? "ADMIN" : request.headers.cookie?.includes("access_token=patient") ? "PATIENT" : null;
  const send = (value, status = 200) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(value)); };
  if (route === "/auth/login") {
    let raw = ""; for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    if (body.email !== "staff@example.com" || body.password !== "TestPassword123!") return send({ success: false }, 401);
    response.setHeader("Set-Cookie", ["access_token=staff; HttpOnly; Secure; Path=/api/v1", "refresh_token=test; HttpOnly; Secure; Path=/api/v1/auth"]);
    return send(sample("POST", "/auth/login"));
  }
  if (route === "/auth/patient/start") return send(sample("POST", route));
  if (route === "/auth/patient/verify") {
    response.setHeader("Set-Cookie", "access_token=patient; HttpOnly; Secure; Path=/api/v1");
    return send(sample("POST", route));
  }
  if (route === "/auth/logout") {
    response.setHeader("Set-Cookie", ["access_token=; Max-Age=0; Path=/api/v1", "refresh_token=; Max-Age=0; Path=/api/v1/auth"]);
    return send(sample("POST", route));
  }
  if (route === "/auth/refresh") {
    if (!request.headers.cookie?.includes("refresh_token=test")) return send({ success: false }, 401);
    refreshes++;
    response.setHeader("Set-Cookie", "access_token=staff; HttpOnly; Secure; Path=/api/v1");
    return send(sample("POST", route));
  }
  if (!role) return send({ success: false }, 401);
  if (route === "/auth/me") {
    const identity = sample("GET", route); identity.data.user.role = role;
    return send(identity);
  }
  if (route === "/patients/me") return registered ? send(sample("GET", route)) : send({ success: false }, 404);
  if (route === "/patients" && request.method === "POST") { registered = true; return send(sample("POST", route), 201); }
  if (route === "/doctors") {
    const query = new URL(request.url, "https://localhost").searchParams;
    if ([...query.keys()].some(key => key !== "active")) return send({ success: false }, 400);
    const doctors = sample("GET", route);
    // Live doctors are unpaginated, unlike the supplied example metadata.
    delete doctors.meta;
    return send(doctors);
  }
  if (route === "/files" && request.method === "POST") {
    let body = ""; for await (const chunk of request) body += chunk;
    if (!body.includes('name="file"')) return send({ success: false }, 400);
    return send(sample("POST", route), 201);
  }
  if (/^\/files\/[^/]+\/url$/.test(route)) return send(sample("GET", "/files/:id/url"));
  if (/^\/files\/[^/]+\/download$/.test(route)) {
    response.writeHead(200, { "content-type": "application/pdf", "content-disposition": "attachment" });
    return response.end("%PDF-1.4\nFixture document\n%%EOF");
  }
  if (route === "/appointments/stats") return role === "ADMIN" ? send(sample("GET", route)) : send({ success: false }, 403);
  if (route === "/appointments" && request.method === "GET") return role === "ADMIN" ? send(sample("GET", route)) : send({ success: false }, 403);
  if (route === "/appointments" && request.method === "POST") return send(sample("POST", route), 201);
  if (/^\/appointments\/[^/]+$/.test(route)) return send(sample("GET", "/appointments/:id"));
  if (/^\/appointments\/[^/]+\/(schedule|cancel)$/.test(route)) return role === "ADMIN" ? send(sample("PATCH", `/appointments/:id/${route.split("/").at(-1)}`)) : send({ success: false }, 403);
  return send({ success: false }, 404);
});
backend.listen(4443, "localhost");
await once(backend, "listening");
const mode = process.env.SMOKE_MODE === "dev" ? "dev" : "start";
const frontend = spawn(process.execPath, ["node_modules/next/dist/bin/next", mode, "--port", "3100", "--hostname", "localhost"], {
  windowsHide: true,
  env: { ...process.env, NODE_ENV: mode === "dev" ? "development" : "production", API_BASE_URL: "https://localhost:4443/api/v1", APP_ORIGIN: "http://localhost:3100", NODE_EXTRA_CA_CERTS: certificatePath },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
frontend.stdout.on("data", chunk => { output += chunk; });
frontend.stderr.on("data", chunk => { output += chunk; });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { if ((await fetch("http://localhost:3100/login")).ok) { ready = true; break; } } catch {}
    if (frontend.exitCode !== null) throw new Error(output);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, `Frontend did not start: ${output}`);
  browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
  const browserContext = await browser.newContext();
  const page = await browserContext.newPage();
  page.setDefaultTimeout(20_000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /Content Security Policy|Hydration|hydration/.test(message.text())) errors.push(message.text()); });
  const response = await page.goto("http://localhost:3100/login");
  assert.match(response.headers()["content-security-policy"], /nonce-/);
  assert.equal(response.headers()["x-frame-options"], "DENY");
  await page.getByLabel("Email", { exact: true }).fill("staff@example.com");
  await page.getByLabel("Password", { exact: true }).fill("TestPassword123!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/admin");
  await page.getByText("John Doe", { exact: true }).waitFor();
  assert.equal(await page.getByText("Page 1 of 1").count(), 1);
  const cookies = await page.context().cookies();
  assert.ok(cookies.find(cookie => cookie.name === "access_token")?.httpOnly);
  assert.equal(cookies.find(cookie => cookie.name === "refresh_token")?.path, "/api/backend/auth");
  await page.context().clearCookies({ name: "access_token" });
  const otherTab = await page.context().newPage();
  await Promise.all([page.goto("http://localhost:3100/session"), otherTab.goto("http://localhost:3100/session")]);
  await Promise.all([page.waitForURL("**/admin"), otherTab.waitForURL("**/admin")]);
  assert.equal(refreshes, 1, "Two tabs must not rotate the same refresh token twice");
  await otherTab.close();
  await page.getByRole("button", { name: "cancel", exact: true }).click();
  await page.getByLabel("Reason for Cancellation").fill("Travel conflict");
  await page.getByRole("button", { name: "Cancel Appointment", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("http://localhost:3100/");
  assert.ok(!(await page.context().cookies()).some(cookie => cookie.name === "access_token"));
  await page.goto("http://localhost:3100/admin");
  await page.waitForURL("**/session");
  await page.getByRole("heading", { name: "Please sign in" }).waitFor();
  await page.goto("http://localhost:3100/");
  await page.getByLabel("Full Name").fill("John Doe");
  await page.getByLabel("Email Address").fill("john.doe@example.com");
  await page.getByPlaceholder("(+234) 8098-569-1234").fill("+2348012345678");
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByLabel("Verification code").fill("123456");
  await page.getByRole("button", { name: "Verify and continue" }).click();
  await page.waitForURL("**/register");
  await page.getByText("Personal Information", { exact: true }).waitFor();
  await page.getByLabel("Date of birth", { exact: true }).fill("04/02/1994");
  await page.getByLabel("Date of birth", { exact: true }).press("Tab");
  await page.getByLabel("Address", { exact: true }).fill("12 Example Road");
  await page.getByLabel("Profession", { exact: true }).fill("Engineer");
  await page.getByLabel("Emergency contact name", { exact: true }).fill("Example Contact");
  await page.getByLabel("Emergency contact number", { exact: true }).fill("+2348012345678");
  await page.getByLabel("Insurance provider", { exact: true }).fill("Example Insurance");
  await page.getByLabel("Insurance policy number", { exact: true }).fill("POLICY-123");
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "Submit and Continue" }).click();
  await page.waitForURL("**/new-appointment");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: /Dr. Ada/ }).click();
  await page.getByLabel("Appointment Reason").fill("Routine check-up");
  await page.getByRole("button", { name: "Submit Appointment" }).click();
  await page.waitForURL("**/success?appointmentId=*");
  await page.getByText("Your selected doctor", { exact: true }).or(page.getByText("Dr. Ada Okafor", { exact: true })).waitFor();
  await page.getByRole("link", { name: "Documents", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "report.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nFixture document\n%%EOF") });
  await page.getByRole("button", { name: "Upload document", exact: true }).click();
  await page.getByText("Document uploaded.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Create download link" }).click();
  const downloadReady = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download document (temporary link)" }).click();
  assert.equal(await (await downloadReady).failure(), null);
  await page.goto("http://localhost:3100/admin");
  await page.getByRole("heading", { name: "404", exact: true }).waitFor();
  assert.match(await page.locator("body").innerText(), /404|not found/i);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:3100/login");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await page.goto("http://localhost:3100/reset-password#token=test-fragment-token");
  await page.getByLabel("Token from your email").waitFor();
  await expect(page.getByLabel("Token from your email")).toHaveValue("test-fragment-token", { timeout: 20_000 });
  assert.equal(new URL(page.url()).hash, "");
  assert.deepEqual(errors, [], `Browser errors: ${errors.join("\n")}`);
  console.log(`${mode} browser smoke checks passed: CSP, staff login/dashboard/cancellation/logout, two-tab refresh, unauthenticated redirect, patient OTP/registration/booking, document upload/download, patient/admin isolation, mobile layout, reset token links.`);
} finally {
  await browser?.close();
  frontend.kill();
  backend.closeAllConnections(); backend.close();
  await writeFile(path.join(directory, `${mode}-server.log`), output);
}
