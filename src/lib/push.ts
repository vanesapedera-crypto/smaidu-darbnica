import "server-only";
import webpush from "web-push";
import type { MemberContext } from "@/lib/auth";

/** Publiskā VAPID atslēga (nav slepena); privātā — Vercel env VAPID_PRIVATE_KEY */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BETNSPzCALMINPgAciclhEtMud7BZSIxoCOqC1eTM7fj3kE6GoD2-tJvp0tyw5-0ie7j4L40KaXftzbj8HrjqkU";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };
type Sub = { endpoint: string; p256dh: string; auth: string };

let configured: boolean | undefined;
function setup(): boolean {
  if (configured !== undefined) return configured;
  const priv = process.env.VAPID_PRIVATE_KEY;
  configured = Boolean(priv);
  if (priv) webpush.setVapidDetails("mailto:smaidu.darbniica@gmail.com", VAPID_PUBLIC_KEY, priv);
  return configured;
}

async function send(subs: Sub[], payload: PushPayload) {
  if (!setup() || !subs.length) return 0;
  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 24 })),
  );
  for (const r of results) if (r.status === "rejected") console.warn("[push]", (r.reason as { statusCode?: number })?.statusCode ?? r.reason);
  return results.filter((r) => r.status === "fulfilled").length;
}

/** Paziņojums uz visām ierīcēm, kur šie cilvēki ieslēguši paziņojumus */
export async function pushToEmails(db: MemberContext["db"], emails: string[], payload: PushPayload) {
  const list = emails.map((e) => e.toLowerCase());
  if (!list.length) return 0;
  const { data } = await db.from("push_subscriptions").select("endpoint, p256dh, auth").in("email", list);
  let subs = (data ?? []) as Sub[];
  // Administratore (sarakstā "Piedalās") — arī visas administratores ierīces
  if (list.includes("vanesa.pedera@gmail.com")) {
    const { data: admins } = await db.rpc("admin_push_subscriptions");
    subs = [...subs, ...((admins ?? []) as Sub[])].filter((s, i, all) => all.findIndex((x) => x.endpoint === s.endpoint) === i);
  }
  return send(subs, payload);
}

/** Paziņojums administratorei un Kristīnei (priekšniecei) — piem. komandas loceklis atbild "Nevaru" */
export async function pushToAdmin(db: MemberContext["db"], payload: PushPayload) {
  const [{ data: admins }, { data: boss }] = await Promise.all([
    db.rpc("admin_push_subscriptions"),
    db.from("push_subscriptions").select("endpoint, p256dh, auth").eq("email", "smaidu.darbnica@gmail.com"),
  ]);
  const all = [...((admins ?? []) as Sub[]), ...((boss ?? []) as Sub[])];
  return send(all.filter((s, i) => all.findIndex((x) => x.endpoint === s.endpoint) === i), payload);
}
