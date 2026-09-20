// Only the backend's documented authentication cookies cross the trust boundary.
export function authCookies(header: string, includeRefresh = false): string {
  const allowed = includeRefresh ? ["access_token", "refresh_token"] : ["access_token"];
  return header.split(";").map(value => value.trim()).filter(value => allowed.includes(value.split("=", 1)[0])).join("; ");
}

export function scopeAuthCookie(cookie: string, secure: boolean): string | null {
  const name = cookie.split("=", 1)[0];
  if (!["access_token", "refresh_token"].includes(name)) return null;
  let value = cookie.replace(/;\s*(Domain|Path)=[^;]*/gi, "");
  value += `; Path=${name === "refresh_token" ? "/api/backend/auth" : "/"}`;
  if (!/;\s*HttpOnly(?:;|$)/i.test(value)) value += "; HttpOnly";
  if (!/;\s*SameSite=/i.test(value)) value += "; SameSite=Lax";
  if (secure && !/;\s*Secure(?:;|$)/i.test(value)) value += "; Secure";
  return value;
}
