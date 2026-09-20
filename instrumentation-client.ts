import * as Sentry from "@sentry/nextjs";
import { sanitizeEvent } from "@/lib/telemetry";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  sendDefaultPii: false,
  tracesSampleRate: 0,
  beforeSend: sanitizeEvent,
  beforeBreadcrumb: () => null,
});
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
