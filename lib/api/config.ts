import "server-only";
export function backendUrl(path: string): string {
  const configured = process.env.API_BASE_URL;
  if (!configured) throw new Error("API_BASE_URL is required.");
  const base = new URL(configured);
  if (base.username || base.password || base.search || base.hash ||
      !["http:", "https:"].includes(base.protocol) ||
      (process.env.NODE_ENV === "production" && base.protocol !== "https:")) {
    throw new Error("API_BASE_URL must use HTTPS in production, without credentials, query, or fragment.");
  }
  return `${base.toString().replace(/\/$/, "")}${path}`;
}
