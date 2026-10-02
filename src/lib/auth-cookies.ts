/** Kopīgas sīkdatņu konstantes — izmanto gan lib/auth.ts, gan src/proxy.ts. */

export const ACCESS_COOKIE = "sd_access";
export const REFRESH_COOKIE = "sd_refresh";

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

/** Nolasa JWT derīguma termiņu (sekundes) bez paraksta pārbaudes — tikai lēmumam par atjaunošanu. */
export function tokenExpiresAt(token: string): number {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : 0;
  } catch {
    return 0;
  }
}
