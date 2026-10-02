import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  cookieOptions,
  tokenExpiresAt,
} from "@/lib/auth-cookies";

/**
 * Administrēšanas paneļa aizsardzība.
 *
 * 1. Bez sesijas sīkdatnēm /admin lapas pāradresē uz /admin/login (API atgriež 401).
 * 2. Ja piekļuves žetons drīz beigsies, to atjauno ar refresh žetonu un ieliek
 *    gan pieprasījumā (lai lapa redz jauno žetonu), gan atbildē (pārlūkam).
 *
 * Šī ir tikai pirmā barjera. Īstā pārbaude (vai lietotājs ir administrators)
 * notiek serverī ar requireAdmin() un Supabase RLS politikās.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const now = Math.floor(Date.now() / 1000);

  if (access && tokenExpiresAt(access) - 60 > now) return NextResponse.next();

  if (refresh) {
    const session = await refreshSession(refresh);
    if (session) {
      request.cookies.set(ACCESS_COOKIE, session.access_token);
      request.cookies.set(REFRESH_COOKIE, session.refresh_token);
      const response = NextResponse.next({ request });
      response.cookies.set(ACCESS_COOKIE, session.access_token, cookieOptions(session.expires_in));
      response.cookies.set(REFRESH_COOKIE, session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
      return response;
    }
  }

  if (isApi) {
    return NextResponse.json({ success: false, error: "Nav autorizēts" }, { status: 401 });
  }
  const login = new URL("/admin/login", request.url);
  const response = NextResponse.redirect(login);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

type RefreshedSession = { access_token: string; refresh_token: string; expires_in: number };

async function refreshSession(refreshToken: string): Promise<RefreshedSession | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return (await res.json()) as RefreshedSession;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/bookings/:id+"],
};
