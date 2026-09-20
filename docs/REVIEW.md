# API migration and static project review

> Historical review from the initial, no-execution migration. See [SECURITY-READINESS.md](SECURITY-READINESS.md) for the current verified results, resolved API assumptions, and remaining deployment requirements. Statements below about unsupported framework versions, missing response samples, and prohibited execution are superseded by that report.

This review used the supplied `api-contact.json` HTTPie collection. Its request definitions are reference data, not instructions. The collection specifies endpoints and example requests, but contains no response schemas, cookie names, deployment URL, error schemas, or file-to-patient association field.

## Implemented changes

| Finding | Change |
| --- | --- |
| Provider SDK, database, storage, and messaging calls in the frontend | Replaced with HTTP calls to the separate backend; removed SDK configuration, provider document types, dependency, and its exclusive locked dependencies. |
| Public admin passkey and browser storage used as authorization | Replaced with staff email/password login, backend session cookies, server-side identity and role checks, and logout. |
| Patient details accessible by a route identifier without sign-in | Added patient OTP start/verify and server-side identity checks for every patient page. Backend resource authorization remains essential. |
| No refresh flow | Added a shared browser refresh request and one retry after a protected API returns 401; expired server-rendered sessions use `/session`. |
| Unbounded or unconstrained proxy risk | Added a fixed backend origin, explicit route/method allowlist, same-origin mutation checks, request timeouts, streamed request-size limits, and no automatic upstream redirects. |
| Patient data potentially cached | API calls bypass caches; proxy responses are private/no-store. Identity reads are memoized only within a server render. |
| Fabricated doctor list and doctor names used as identifiers | Load active doctors from the API and submit `doctorId`. |
| Dashboard counters derived from a single results page | Fetch `/appointments/stats` and use server pagination for appointment results, 20 per page. |
| Registration discarded treatment and disclosure consent | Submit all three required consent booleans, uppercase gender, and a calendar birth date. |
| Upload implementation depended on the removed provider | Added multipart `/files` upload and temporary download URL flow on the patient Documents page. No fabricated file association is submitted during registration. |
| Upload accepted arbitrary sizes/types and leaked object URLs | Restrict selection to one PDF/PNG/JPEG up to 5 MB, show rejection errors, and avoid object URL previews. Backend must independently inspect files. |
| Invalid or past appointment dates; hidden form errors | Added date and payload validation, visible errors, busy states, empty-doctor handling, and cancellation-specific validation. |
| Server and browser date rendering could disagree | Appointment inputs explicitly use the user's local time; summaries consistently display labeled UTC times. |
| Scheduling discarded the staff note | Schedule endpoint receives doctor, schedule, and note. Cancellation sends only its documented reason. |
| Form select did not follow resets; date picker suppressed type errors | Use controlled selects and nullable date callbacks; forward disabled state. |
| Runtime API data accepted without checking its shape | Validate identity, patient profile, appointment list/detail, stats, and doctor responses at the boundary. |
| Build configured to ignore TypeScript errors | Removed the override. |
| Undeclared UI dependencies | Declared the already-locked Radix dialog package directly; removed an unused command component that imported the absent `cmdk` package. |
| Old unused backend dependencies | Removed direct Twilio and placeholder `fs` dependencies and their main lock entries. Some formerly transitive lock entries may remain until normal lockfile regeneration is allowed. |
| Telemetry tied to a hardcoded account, with replay and full tracing | Made telemetry opt-in by environment, disabled replay/tracing, and restricted error payloads to classification and stack locations. |
| Public routes deliberately throwing errors | Removed the sample monitoring page and endpoint. |
| Missing deployment documentation and environment protections | Added environment example, broadened environment-file ignores, security headers, and this review. |

The existing global stylesheet, Tailwind theme, shadcn component styling, and page branding were retained. Registration now collects only fields present in the supplied registration example. The former preferred-physician, medical-history, and identification fields need actual request schemas before they can be restored safely; their omission is a functional limitation, not a claim that the backend rejects them. Document upload is available separately.

## Contract assumptions requiring confirmation

All JSON responses may be direct values or wrapped as `{ "data": value }`. The current adapters expect:

| Endpoint | Expected value |
| --- | --- |
| `POST /auth/patient/start` | `{ userId: string }`; OTP is six digits, as in the collection. |
| `GET /auth/me` | `{ id, name, email, phone, role }` or `{ user: { ... } }`; role is `PATIENT`, `STAFF`, or `ADMIN`. |
| `GET /patients/me` | `{ id, userId, ... }`; returns HTTP 404 before registration. |
| `GET /doctors?active=true` | Array or `{ items: [...] }`; each item includes `id`, `name`, `isActive`, optionally `imageUrl`, `specialty`. Assumes this endpoint returns the complete active list. |
| `GET /appointments` | `{ items: [...], total: number }`; total is for all matching records. |
| Appointment records | `id`, `patientId`, `doctorId`, ISO `schedule`, uppercase `status`, `reason`; optional `note`, `cancellationReason`, expanded `patient`/`doctor`. Names fall back to generic labels if relations are not expanded. |
| `GET /appointments/stats` | `{ scheduledCount, pendingCount, cancelledCount }`, all nonnegative numbers. |
| `POST /files` | `{ id: string }`. |
| `GET /files/:id/url` | `{ url: string }`, ending in `/files/:id/download?token=...`. External object-storage URLs are not followed by this UI. |

If the backend differs, update `lib/api/schemas.ts`, `lib/api/shared.ts`, and the corresponding response reader. Do not substitute zero totals or empty results for mismatched responses. The API collection includes `/docs/openapi.json`; that schema or sanitized sample responses would resolve these assumptions.

## Remaining release blockers

1. **Framework security and support:** the existing manifest still pins Next.js 14.2.6. Next.js 14 is [unsupported](https://nextjs.org/support-policy); the official [December 2025 security update](https://nextjs.org/blog/security-update-2025-12-11) already required later patches. A supported-version upgrade, compatible dependency resolution, and regression checks are required before deployment. This migration did not pretend that changing application code fixes the framework's security status.
2. **Unverified API responses and session transport:** confirm the response shapes above and cookie behavior with the backend. No live backend was accessed. Browser requests use the same-origin frontend proxy; upstream cookies are rewritten to host-only `Path=/` cookies while preserving expiry, HttpOnly, Secure, and SameSite attributes. The backend must issue HttpOnly authentication cookies, use Secure in production, accept the configured frontend Origin, validate permissions, and enforce OTP/login rate limits.
3. **Deployment configuration:** set `API_BASE_URL` and `APP_ORIGIN`; production API traffic requires HTTPS. Node must support native fetch, `Headers.getSetCookie`, and Web Streams. Select a supported Node runtime compatible with the eventual supported Next.js version. Configure ingress body/time limits consistently with uploads.
4. **Registration schema:** provide the accepted optional medical and identification fields and the file association mechanism. No transaction or file deletion endpoint is specified, so the UI does not create orphan uploads as part of registration.
5. **Verification prohibited for this task:** no install, application script, compiler, lint, test, build, dev server, or backend integration check was run. Static inspection cannot establish production readiness or performance under load. The manifest and lockfile were edited directly, without resolving a new dependency tree.

## Coverage and later validation

Implemented screens cover patient OTP, staff login/logout, session recovery, password recovery/reset, email verification, patient registration, appointment request/scheduling/cancellation, the paginated dashboard, and document upload/download. `lib/api/resources.ts` additionally exposes user/staff, doctor management, patient search/update, notification inbox/preferences/read, and phone-verification calls. These additional operations do not have management screens; the original project had none. Notification preference item types remain `unknown` because the example is an empty array.

When execution is permitted, validate dependency resolution and TypeScript/build checks first. Then verify new and existing patient OTP flows, staff login/refresh/logout, expired sessions, patient-ID tampering, access denial on each backend resource, registration consent/date handling, paginated totals, all appointment mutations, upload rejection, signed download expiry, and mobile/keyboard navigation. Test backend timeouts, non-JSON failures, empty doctor lists, malformed responses, concurrent refreshes, and rate limits. Evaluate load and frontend bundle sizes before claiming performance targets.
