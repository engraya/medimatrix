import type { ErrorEvent } from "@sentry/nextjs";

// Send only error classification and frame locations, never form values,
// request bodies, session cookies, user identifiers, or replay recordings.
export function sanitizeEvent(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    level: event.level,
    environment: event.environment,
    release: event.release,
    exception: event.exception ? {
      values: event.exception.values?.map(exception => ({
        type: exception.type,
        value: "Application error",
        stacktrace: exception.stacktrace ? {
          frames: exception.stacktrace.frames?.map(frame => ({
            filename: frame.filename?.split(/[?#]/)[0],
            function: frame.function,
            lineno: frame.lineno,
            colno: frame.colno,
            in_app: frame.in_app,
          })),
        } : undefined,
      })),
    } : undefined,
  };
}
