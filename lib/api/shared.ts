export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}
export async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Do not surface upstream stack traces or patient data.
    const messages: Record<number, string> = {
      400: "Please check the information and try again.",
      401: "Your session has expired. Please sign in again.",
      403: "You do not have permission to perform this action.",
      404: "The requested record was not found.",
      409: "This conflicts with an existing record. Refresh and try again.",
      410: "This link has expired. Request a new one.",
      413: "The file is too large.",
      415: "This file format is not supported.",
      423: "Your account is temporarily locked. Please try again later.",
      422: "Please check the information and try again.",
      429: "Too many requests. Please wait before trying again.",
    };
    throw new ApiError(response.status, messages[response.status] ?? "The service is unavailable. Please try again later.");
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  if (!text) return undefined as T;
  let body;
  try { body = JSON.parse(text); }
  catch { throw new ApiError(502, "The service returned an invalid response."); }
  if (!body || typeof body !== "object" || body.success !== true || !("data" in body)) {
    throw new ApiError(502, "The service returned an invalid response.");
  }
  if (Array.isArray(body.data) && body.meta) {
    const meta = body.meta;
    if (typeof meta !== "object" || !Number.isSafeInteger(meta.page) || meta.page < 1 ||
        !Number.isSafeInteger(meta.limit) || meta.limit < 1 || meta.limit > 100 ||
        !Number.isSafeInteger(meta.total) || meta.total < 0 ||
        !Number.isSafeInteger(meta.totalPages) || meta.totalPages < 0) {
      throw new ApiError(502, "The service returned invalid pagination.");
    }
    return { ...meta, items: body.data } as T;
  }
  return body.data as T;
}
export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to complete the request. Please try again.";
}
export function resourceId(value: string): string {
  if (typeof value !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new ApiError(400, "Invalid record identifier.");
  return encodeURIComponent(value);
}
