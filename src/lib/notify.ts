/**
 * E-pasta paziņojums par jaunu pieteikumu (caur Resend REST API — bez papildu bibliotēkām).
 *
 * Vides mainīgie:
 *   RESEND_API_KEY   — atslēga no resend.com (API Keys). Ja nav iestatīta, paziņojums netiek sūtīts.
 *   NOTIFY_EMAIL           — kam sūtīt uzņēmumu pieprasījumus (noklusējums: smaidu.darbnica@gmail.com — Kristīne)
 *   NOTIFY_EMAIL_PRIVATE   — kam sūtīt privātās rezervācijas (noklusējums: smaidudarbniica@gmail.com — Vanesa)
 *   NOTIFY_FROM      — sūtītājs; jābūt Resend apstiprinātā domēnā, piem. "Smaidu Darbnīca <pieteikumi@smaidudarbnica.lv>".
 *                      Kamēr domēns nav apstiprināts, der "onboarding@resend.dev" (sūta tikai uz Resend konta e-pastu).
 *
 * Kļūda e-pasta sūtīšanā nekad neaptur pieteikumu — tas jau ir saglabāts datubāzē un redzams panelī.
 */

type Row = Record<string, unknown>;

const LABELS: [string, string][] = [
  ["company_name", "Uzņēmums"],
  ["parent_name", "Kontaktpersona"],
  ["contact_role", "Amats"],
  ["phone", "Telefons"],
  ["email", "E-pasts"],
  ["service_slug", "Pakalpojums"],
  ["program", "Programma"],
  ["event_type", "Pasākuma veids"],
  ["event_date", "Datums"],
  ["event_time", "Laiks"],
  ["location", "Norises vieta"],
  ["event_city", "Pilsēta / vieta"],
  ["address", "Adrese"],
  ["travel_cost", "Ceļa izdevumi, €"],
  ["travel_km", "Attālums turp un atpakaļ, km"],
  ["participants", "Dalībnieki"],
  ["children_count", "Bērnu skaits"],
  ["child_age", "Bērnu vecums"],
  ["budget_range", "Budžets"],
  ["message", "Ziņojums"],
];

const escape = (v: unknown) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function notifyNewBooking(row: Row) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const isBusiness = row.inquiry_type === "business";
  const who = (row.company_name as string) || (row.parent_name as string) || "Jauns pieteikums";
  const subject = `${isBusiness ? "Pieprasījums" : "Rezervācija"}: ${who}${row.event_date ? ` · ${row.event_date}` : ""}`;

  const rows = LABELS.filter(([k]) => row[k] !== null && row[k] !== undefined && row[k] !== "")
    .map(
      ([k, label]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#7a7268;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0;white-space:pre-wrap">${escape(row[k])}</td></tr>`,
    )
    .join("");
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1816">
<p style="font-size:18px;margin:0 0 16px"><b>${escape(subject)}</b></p>
<table style="border-collapse:collapse">${rows}</table>
${site ? `<p style="margin-top:24px"><a href="${site}/admin" style="color:#1a1816">Atvērt administrēšanas paneli →</a></p>` : ""}
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Smaidu Darbnīca <onboarding@resend.dev>",
        to: [
          isBusiness
            ? process.env.NOTIFY_EMAIL || "smaidu.darbnica@gmail.com"
            : process.env.NOTIFY_EMAIL_PRIVATE || "smaidudarbniica@gmail.com",
        ],
        reply_to: typeof row.email === "string" && row.email ? row.email : undefined,
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Resend", res.status, await res.text());
  } catch (e) {
    console.error("[notify] failed", e);
  }
}

/**
 * E-pasts klientam, kad panelī pieteikuma statuss nomainīts uz "Apstiprināta".
 * Sūta tikai tad, ja klients formā norādījis e-pastu un ir iestatīts RESEND_API_KEY.
 * Lai e-pasti aizietu klientiem (ne tikai uz Resend konta adresi), NOTIFY_FROM jābūt apstiprinātā domēnā.
 */
export async function notifyClientConfirmed(
  row: Row,
  info: { title: string; when: string; where: string; phone: string; replyTo: string },
) {
  const key = process.env.RESEND_API_KEY;
  const to = typeof row.email === "string" ? row.email.trim() : "";
  if (!key || !to) return;

  const name = String(row.parent_name ?? "").trim().split(/\s+/)[0];
  const lines: [string, string][] = [
    [row.inquiry_type === "business" ? "Pakalpojums" : "Programma", info.title],
    ["Laiks", info.when],
    ["Vieta", info.where],
    ["Bērnu skaits", row.children_count ? String(row.children_count) : ""],
    ["Dalībnieki", row.participants ? String(row.participants) : ""],
  ];
  const rows = lines
    .filter(([, v]) => v)
    .map(
      ([label, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#7a7268;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:6px 0">${escape(v)}</td></tr>`,
    )
    .join("");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1816">
<p>Sveiki${name ? `, ${escape(name)}` : ""}!</p>
<p><b>Jūsu rezervācija ir apstiprināta.</b></p>
<table style="border-collapse:collapse">${rows}</table>
<p style="margin-top:20px">Ja ir jautājumi vai kas mainās, zvaniet ${escape(info.phone)} vai atbildiet uz šo e-pastu.</p>
<p>Uz tikšanos!<br>Smaidu Darbnīca</p>
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM || "Smaidu Darbnīca <onboarding@resend.dev>",
        to: [to],
        reply_to: info.replyTo,
        subject: "Rezervācija apstiprināta — Smaidu Darbnīca",
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Resend (klientam)", res.status, await res.text());
  } catch (e) {
    console.error("[notify] client confirmation failed", e);
  }
}
