import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readResponse, ApiError, resourceId } from "../lib/api/shared";
import { appointmentPageSchema, appointmentSchema, currentIdentitySchema, doctorListSchema, parseResponse, patientSchema, statsSchema } from "../lib/api/schemas";
import { authCookies, scopeAuthCookie } from "../lib/api/cookies";
import { PatientFormValidation, CreateAppointmentSchema, CancelAppointmentSchema } from "../lib/validation";

const samples = JSON.parse(readFileSync(new URL("../docs/sample-responses.json", import.meta.url), "utf8"));
const sample = (method: string, path: string) => samples.endpoints.find((entry: { method: string; path: string }) => entry.method === method && entry.path === path).sampleResponse;
const decoded = (method: string, path: string) => readResponse<unknown>(Response.json(sample(method, path)));

test("all provided response envelopes decode, retaining paginated metadata", async () => {
  for (const entry of samples.endpoints) {
    const value = await readResponse<unknown>(Response.json(entry.sampleResponse));
    assert.deepEqual(value, entry.sampleResponse.meta ? { items: entry.sampleResponse.data, ...entry.sampleResponse.meta } : entry.sampleResponse.data);
  }
});
test("identity, patients, doctors, and stats match the backend samples", async () => {
  assert.equal(parseResponse(currentIdentitySchema, await decoded("GET", "/auth/me")).role, "ADMIN");
  assert.ok(parseResponse(patientSchema, await decoded("GET", "/patients/me")).id);
  assert.equal(parseResponse(doctorListSchema, await decoded("GET", "/doctors")).length, 1);
  assert.deepEqual(parseResponse(statsSchema, await decoded("GET", "/appointments/stats")), { scheduledCount: 6, pendingCount: 4, cancelledCount: 2 });
});
test("all appointment projections work without requiring fields omitted from relations", async () => {
  const page = parseResponse(appointmentPageSchema, await decoded("GET", "/appointments"));
  assert.equal(page.total, 1);
  assert.equal(page.items[0].patient?.user?.name, "John Doe");
  for (const [method, path] of [["POST", "/appointments"], ["GET", "/appointments/:id"], ["PATCH", "/appointments/:id/schedule"], ["PATCH", "/appointments/:id/cancel"]]) {
    assert.ok(parseResponse(appointmentSchema, await decoded(method, path)).doctor?.name);
  }
});
test("invalid responses and statuses fail without leaking upstream details", async () => {
  await assert.rejects(readResponse(new Response("private stack and patient data", { status: 500 })), error => error instanceof ApiError && !error.message.includes("private"));
  await assert.rejects(readResponse(Response.json({ success: false, error: { message: "secret" } })), ApiError);
  await assert.rejects(readResponse(new Response("<html>error</html>")), ApiError);
  assert.throws(() => parseResponse(statsSchema, { scheduled: -1 }), ApiError);
  assert.equal(await readResponse(new Response(null, { status: 204 })), undefined);
});
test("record identifiers cannot inject paths or queries", () => {
  for (const id of ["../auth/me", "x?admin=true", "x/y", "", undefined]) assert.throws(() => resourceId(id as string), ApiError);
  assert.equal(resourceId("a_123-456"), "a_123-456");
});
test("cookies are allowlisted, scoped, and retain expiry on logout", () => {
  assert.equal(authCookies("analytics=private; refresh_token=r; access_token=a"), "access_token=a");
  assert.equal(authCookies("analytics=private; refresh_token=r; access_token=a", true), "refresh_token=r; access_token=a");
  const cookie = scopeAuthCookie("refresh_token=r; Domain=backend.example; Path=/api/v1/auth; Max-Age=0", true)!;
  assert.match(cookie, /Path=\/api\/backend\/auth/);
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /Max-Age=0/);
  assert.doesNotMatch(cookie, /Domain=/);
  assert.equal(scopeAuthCookie("unrelated=secret", true), null);
});
test("all consents are required and cancellation does not require a future appointment", () => {
  const patient = { birthDate: new Date(1994, 3, 2), gender: "Other", address: "12 Example Road", occupation: "Engineer", emergencyContactName: "Example Contact", emergencyContactNumber: "+2348012345678", insuranceProvider: "Example", insurancePolicyNumber: "POLICY-123", treatmentConsent: true, disclosureConsent: true, privacyConsent: true };
  assert.equal(PatientFormValidation.safeParse(patient).success, true);
  for (const name of ["treatmentConsent", "disclosureConsent", "privacyConsent"]) assert.equal(PatientFormValidation.safeParse({ ...patient, [name]: false }).success, false);
  assert.equal(PatientFormValidation.safeParse({ ...patient, birthDate: null }).success, false);
  assert.equal(CreateAppointmentSchema.safeParse({ doctorId: "d_123", schedule: new Date(0), reason: "Checkup" }).success, false);
  assert.equal(CancelAppointmentSchema.safeParse({ doctorId: "", schedule: new Date(0), cancellationReason: "Travel conflict" }).success, true);
});
