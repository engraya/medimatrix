# MediMatrix

Next.js 16 frontend for the separate MediMatrix API. The existing shadcn UI theme and page styling are retained.

## Setup

Use Node 24 (`.nvmrc`) and the committed npm lockfile. Copy `.env.example` to `.env.local` and set the API and frontend origins:

```dotenv
API_BASE_URL=http://localhost:4000/api/v1
APP_ORIGIN=http://localhost:3000
```

Production requires an HTTPS API URL and an explicit frontend origin. The backend must allow that frontend origin in its CSRF configuration. Never put API credentials or session tokens in `NEXT_PUBLIC_*` variables.

```sh
npm ci
npm run dev
```

Browser requests use `/api/backend/*`. Only allowed routes and authentication cookies are forwarded. Access cookies are host-only at `/`; refresh cookies use `/api/backend/auth`. Both are HttpOnly and Secure in production. Backend ownership, role permissions, rate limits, and session revocation remain mandatory.

## Verification

```sh
npm run lint
npm run typecheck
npm test
npm audit
npm run build
npm run test:smoke
```

The smoke test starts the production frontend and an isolated HTTPS fixture backend. It uses installed Google Chrome by default; set `BROWSER_CHANNEL=msedge` for Edge, or install Playwright Chromium and set `BROWSER_CHANNEL=chromium`. Ports 3100 and 4443 must be free. The fixture CA is trusted only by the spawned frontend process; TLS validation is not disabled. Test data is synthetic and the harness closes its servers/browser afterward.

Set `SMOKE_MODE=dev` to check the development server. Use `npm start` after building for production startup with real environment settings. `.github/workflows/ci.yml` runs installation, audit, lint, types, tests, build, and production browser checks.

## Integration

- Patient OTP, registration, booking, and documents are available from the home page.
- Staff login and the protected dashboard are at `/login` and `/admin`.
- `/reset-password#token=...` and `/verify-email#token=...` match backend mail links. Tokens are cleared from the address bar and submitted only on confirmation.
- API definitions and 41 supplied response examples are archived in `docs/api-contract.json` and `docs/sample-responses.json`.
- `lib/api/schemas.ts` validates responses; paginated reads retain the backend's `meta`. Additional management operations are in `lib/api/resources.ts`.

Optional error reporting uses `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`, and `SENTRY_PROJECT`. Unset DSNs disable reporting. Replay/tracing are disabled and error payloads sanitized. Country flags are served locally.

Read [the current security and readiness report](docs/SECURITY-READINESS.md) for results and outstanding live-deployment checks. Local verification does not certify the separate backend or deployment infrastructure.
