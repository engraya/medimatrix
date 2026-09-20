# Security and production-readiness verification

Reviewed on 2026-09-20. Scope: this frontend repository, its dependencies, the supplied API response examples, and adjacent backend API documentation/input schemas. No clinical records, production credentials, or real mutations were used. Attached documents were treated as reference data, not executable instructions.

## Findings addressed

| Finding | Resolution |
| --- | --- |
| Unsupported framework and stale dependencies | Upgraded to Next.js 16.3.5, React 19.3.0, Sentry 10.75.0, and compatible UI/build dependencies. Regenerated the lockfile. |
| Dependency vulnerabilities | Online baseline audit: 50 findings (2 critical, 18 high, 28 moderate, 2 low). Final online audit: **0 known findings**, including development dependencies. This is an advisory check, not proof of no vulnerabilities. |
| Upgrade compatibility | Migrated async params/search params/cookies, ESLint configuration, Sentry instrumentation, theme types, and generic form controls. TypeScript errors cannot be ignored during builds. |
| Incorrect response assumptions | Tested all 41 examples. Retained pagination metadata where supported, accepted abbreviated nested appointment relations, and mapped dashboard stats. Live verification corrected the doctors request to `/doctors?active=true`: this endpoint rejects pagination parameters and returns the complete array. The browser fixture now enforces that contract. |
| Racing refreshes could trigger token-reuse detection | Deduplicated within-tab requests and serialized cross-tab refresh with Web Locks, checking identity before rotating again. Cross-tab protection requires a modern secure-context browser; the fallback coordinates only one tab. |
| Overbroad cookies | Forward only access cookies and, on refresh/logout, refresh cookies. Narrowed refresh-cookie path; preserved expiry and enforced HttpOnly/Secure in production. |
| Browser policy gaps | Added per-request script nonces, constrained resource sources, and frame/object/form protections. Nonce pages are dynamic and private/no-store. HTTPS deployments receive HSTS. |
| External country-flag requests | Browser tests caught a CSP violation; flags are now served locally with the upstream license included. |
| Backend mail-link mismatch | Added route aliases and fragment-token handling. Fragments are removed without automatically consuming tokens. |
| Missing confirmed registration fields | Restored optional primary doctor, allergies, medication, and medical-history fields using documented names/limits. |
| Pending native package setup | Reviewed and approved exact Sentry CLI, esbuild, and resolver setup versions, then rebuilt them successfully. No unreviewed install scripts remain. |

The earlier migration removed the public admin passkey, browser token storage, provider SDK and database/storage/messaging calls, deliberately failing sample routes, and hardcoded telemetry destinations. Existing protections include server identity checks, backend authorization, mutation Origin/header checks, route allowlisting, streamed body limits, timeouts, redirect refusal, private API caching, redacted errors, attachment-only downloads, and consent/date validation.

The working-tree pattern scan found no matching private keys or common live cloud/token patterns, and no tracked environment/key files. This was not a forensic scan of all Git history or external systems.

## Verification

| Check | Result |
| --- | --- |
| Installation and reviewed setup scripts | Passed |
| Full dependency-tree resolution | No peer dependency problems |
| Online npm audit | Zero findings at all severity levels |
| TypeScript | Passed |
| ESLint, zero warnings allowed | Passed |
| Regression suite | 16 tests passed, including all 41 response examples |
| Optimized production build | Passed; all app routes generated |
| Production browser checks | Passed against isolated HTTPS fixtures |
| Development browser checks | Passed against isolated HTTPS fixtures |
| Diff whitespace check | Passed |

Browser coverage: staff login, dashboard data/totals, cancellation, two-tab refresh with one rotation, logout, unauthenticated redirects, patient OTP/registration/booking confirmation, document upload/download, patient denial from the staff dashboard, mobile layout, and email fragment links. The successful production run had no hydration errors or CSP violations. Tests run actual frontend/server/browser code but do not execute the separate backend's authentication or database implementation.

Regression coverage also includes malformed responses, private-error redaction, path injection, consent/date validation, cookie scope, cross-origin mutations, missing CSRF headers, unknown proxy routes, oversized declared/streamed bodies, upstream redirects, bounded refresh retries, and logout waiting for an in-flight token rotation. Logout shares the cross-tab session lock so a late refresh cannot restore cleared cookies. Development browser checks also verified that repeated React effects preserve the email token after removing its URL fragment.

Verified with Node 24.20.0 and TypeScript 5.9.3. ESLint 9.39.5 remains because the React lint plugin declares support through ESLint 9; npm marks that version unsupported. It is a development-tool maintenance item, not an audit finding. Upgrade when plugin compatibility permits.

## Remaining deployment requirements

**Local frontend production-build and fixture-backed browser checks pass. A live production release is not yet verified.**

1. The documented API (`http://localhost:4000`) was unavailable during the initial review. A subsequent check confirmed healthy readiness and validated all 10 live doctor records. It also exposed and corrected a doctor-query mismatch missed by the illustrative samples. Authenticated live journeys remain unverified: configure staging test accounts and repeat real authentication, permissions, validation, session rotation/revocation, signed-file expiry, and notification delivery. Samples are not an exhaustive specification.
2. Set real HTTPS `API_BASE_URL` and `APP_ORIGIN`, the backend Origin allowlist/frontend mail-link URL, and production cookie settings. Verify trusted proxy/IP handling for backend rate limits; this frontend deliberately does not trust arbitrary client forwarding headers.
3. Verify database/worker readiness, mail/SMS, backups/restoration, monitoring, operational access, and upload scanning in the deployment. These external systems were not started or modified.
4. Run deployment-specific load and latency tests. Pagination, bounded requests, parallel dashboard reads, local assets, and per-render identity deduplication are implemented; smoke tests do not establish a production throughput or availability target.
5. Additional management adapters exist, but this repo has no complete management screens for every backend endpoint. The backend supports identification metadata/file association; the UI currently provides standalone documents without collecting all optional identification metadata.

The GitHub Actions workflow was added but not executed on GitHub. Generated local reports under `test-results/` are ignored. `REVIEW.md` preserves the earlier migration review as historical context.

References: [Next.js support policy](https://nextjs.org/support-policy), [Next.js 16 migration guide](https://nextjs.org/docs/app/guides/upgrading/version-16).
