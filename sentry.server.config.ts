import * as Sentry from "@sentry/nextjs";
import { sanitizeEvent } from "@/lib/telemetry";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: sanitizeEvent,
  beforeBreadcrumb: () => null,
});
