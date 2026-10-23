import "server-only";
import type { AdminContext } from "./auth";
import type { CalendarEvent } from "./calendar";
import { absoluteUrl } from "./seo";

/**
 * Savienojums ar administratora Google kalendāru (Google Calendar API, OAuth).
 *
 * Kad savienojums ir izveidots (panelī poga "Savienot ar Google kalendāru"), apstiprinātas rezervācijas notikums
 * tiek ielikts tieši savienotā konta kalendārā — tā īpašnieks Google kalendārā var to brīvi labot (tekstu, laiku,
 * viesus), un izmaiņas Google pats nosūta viesiem. Ja savienojuma nav, notikumi aiziet kā līdz šim — ar .ics ielūgumu.
 *
 * Vides mainīgie (Vercel): GOOGLE_CLIENT_ID un GOOGLE_CLIENT_SECRET — no Google Cloud projekta
 * (sk. docs/google-kalendars.md). Atjaunošanas žetons glabājas tabulā `google_calendar`, ko var lasīt tikai administrators.
 */

const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];
const API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TIME_ZONE = "Europe/Riga";

export const isGoogleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const googleRedirectUri = () => absoluteUrl("/api/google/callback");

/** Saite uz Google piekrišanas lapu */
export function googleAuthUrl(state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    // Vienmēr prasa piekrišanu — tikai tad Google atdod atjaunošanas žetonu
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** Apmaina Google atgriezto kodu pret žetoniem; atgriež atjaunošanas žetonu un konta e-pastu */
export async function exchangeCode(code: string): Promise<{ refreshToken: string; email: string } | { error: string }> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: googleRedirectUri(),
      grant_type: "authorization_code",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.refresh_token) return { error: data.error_description || data.error || "Google neatdeva atjaunošanas žetonu." };
  // E-pasts no id_token (JWT) vidējās daļas
  let email = "";
  try {
    email = JSON.parse(Buffer.from(String(data.id_token).split(".")[1], "base64url").toString("utf8")).email ?? "";
  } catch {}
  return { refreshToken: data.refresh_token, email };
}

type Connection = { email: string; refreshToken: string };

/** Savienotais konts (tikai administratoram — tabulu aizsargā RLS); null, ja savienojuma nav */
export async function googleConnection(db: AdminContext["db"]): Promise<Connection | null> {
  if (!isGoogleConfigured()) return null;
  const { data, error } = await db.from("google_calendar").select("email, refresh_token").eq("id", 1).maybeSingle();
  if (error || !data?.refresh_token) return null;
  return { email: data.email ?? "", refreshToken: data.refresh_token };
}

// Piekļuves žetons derīgs stundu — glabājam atmiņā, lai vairākiem notikumiem pēc kārtas nav jāprasa katru reizi
let cachedToken: { refreshToken: string; token: string; until: number } | null = null;

async function accessToken(refreshToken: string): Promise<string | null> {
  if (cachedToken && cachedToken.refreshToken === refreshToken && cachedToken.until > Date.now()) return cachedToken.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    console.error("[google] access token", res.status, data.error);
    return null;
  }
  cachedToken = { refreshToken, token: data.access_token, until: Date.now() + ((data.expires_in ?? 3600) - 300) * 1000 };
  return data.access_token;
}

/** Notikuma ID Google kalendārā — nemainīgs pieteikumam (atkārtoti apstiprinot, tiek atjaunots tas pats notikums) */
const eventId = (bookingId: string) => `sd${bookingId.toLowerCase().replace(/[^0-9a-v]/g, "")}`;

/** "20261215T093000/20261215T103000" vai "20261215/20261216" → Google sākuma un beigu laiks */
function times(dates: string) {
  const [from, to] = dates.split("/");
  const iso = (v: string) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  if (from.includes("T")) {
    const dt = (v: string) => `${iso(v)}T${v.slice(9, 11)}:${v.slice(11, 13)}:00`;
    return { start: { dateTime: dt(from), timeZone: TIME_ZONE }, end: { dateTime: dt(to), timeZone: TIME_ZONE } };
  }
  return { start: { date: iso(from) }, end: { date: iso(to) } };
}

/**
 * Ieliek (vai atjauno) rezervācijas notikumu savienotajā Google kalendārā un nosūta ielūgumus viesiem.
 * Atgriež true, ja izdevās; false — tad jāsūta parastais .ics ielūgums.
 */
export async function upsertGoogleEvent(db: AdminContext["db"], bookingId: string, event: CalendarEvent, guests: string[]): Promise<boolean> {
  const conn = await googleConnection(db);
  if (!conn) return false;
  const token = await accessToken(conn.refreshToken);
  if (!token) return false;

  const id = eventId(bookingId);
  const own = conn.email.toLowerCase();
  const body = {
    id,
    status: "confirmed",
    summary: event.text,
    description: event.details,
    location: event.location,
    ...times(event.dates),
    attendees: [...new Set(guests.map((g) => g.toLowerCase()))].filter((g) => g && g !== own).map((email) => ({ email })),
  };
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  try {
    let res = await fetch(`${API}?sendUpdates=all`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
    // Notikums jau ir (rezervācija apstiprināta atkārtoti) — atjauno to; Google kalendārā ar roku pievienotos viesus saglabā
    if (res.status === 409) {
      const existing = await fetch(`${API}/${id}`, { headers, signal: AbortSignal.timeout(10000) })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      const known = new Set(body.attendees.map((a) => a.email));
      const kept = ((existing?.attendees ?? []) as { email?: string }[])
        .filter((a) => a.email && !known.has(a.email.toLowerCase()) && a.email.toLowerCase() !== own)
        .map((a) => ({ email: a.email!.toLowerCase() }));
      const merged = { ...body, attendees: [...body.attendees, ...kept] };
      res = await fetch(`${API}/${id}?sendUpdates=all`, { method: "PUT", headers, body: JSON.stringify(merged), signal: AbortSignal.timeout(10000) });
    }
    if (!res.ok) console.error("[google] event", res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error("[google] event failed", e);
    return false;
  }
}

/** Atceļ rezervācijas notikumu savienotajā Google kalendārā (viesi saņem paziņojumu). Ja notikuma nav — neko nedara. */
export async function cancelGoogleEvent(db: AdminContext["db"], bookingId: string): Promise<void> {
  const conn = await googleConnection(db);
  if (!conn) return;
  const token = await accessToken(conn.refreshToken);
  if (!token) return;
  try {
    const res = await fetch(`${API}/${eventId(bookingId)}?sendUpdates=all`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok && res.status !== 404 && res.status !== 410) console.error("[google] cancel", res.status, await res.text());
  } catch (e) {
    console.error("[google] cancel failed", e);
  }
}
