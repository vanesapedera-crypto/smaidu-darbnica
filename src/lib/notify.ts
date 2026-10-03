/**
 * E-pasta paziņojums par jaunu pieteikumu (caur Resend REST API — bez papildu bibliotēkām).
 *
 * Vides mainīgie:
 *   RESEND_API_KEY   — atslēga no resend.com (API Keys). Ja nav iestatīta, paziņojums netiek sūtīts.
 *   NOTIFY_EMAIL_PRIVATE   — kam sūtīt visus pieteikumus (noklusējums: smaidu.darbniica@gmail.com — Vanesa)
 *   NOTIFY_EMAIL           — nav obligāts: cita adrese uzņēmumu pieprasījumiem (ja nav — tie nāk uz to pašu adresi)
 *   NOTIFY_FROM      — sūtītājs; jābūt Resend apstiprinātā domēnā, piem. "Smaidu Darbnīca <pieteikumi@smaidudarbnica.lv>".
 *                      Kamēr domēns nav apstiprināts, der "onboarding@resend.dev" (sūta tikai uz Resend konta e-pastu).
 *
 * Kļūda e-pasta sūtīšanā nekad neaptur pieteikumu — tas jau ir saglabāts datubāzē un redzams panelī.
 */

import { calendarIcs, type CalendarEvent } from "./calendar";
import { eur, type BookingCosts } from "./pricing";

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
        from: sender(),
        // Visi pieteikumi (uzņēmumu un privātie) nāk uz vienu adresi; ja vajag dalīt — iestatiet NOTIFY_EMAIL uzņēmumiem
        to: [(isBusiness && process.env.NOTIFY_EMAIL) || process.env.NOTIFY_EMAIL_PRIVATE || "smaidu.darbniica@gmail.com"],
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

/** Sūtītāja adrese un tās e-pasta daļa (kalendāra ielūguma organizatoram) */
const sender = () => process.env.NOTIFY_FROM || "Smaidu Darbnīca <onboarding@resend.dev>";
const senderEmail = () => sender().match(/<([^>]+)>/)?.[1] ?? sender();

/**
 * E-pasts klientam, kad panelī pieteikuma statuss nomainīts uz "Apstiprināta".
 * Teksts — Smaidu Darbnīcas ierastais apstiprinājums: datums un laiks, izmaksas, lūgums paziņot par bērnu skaita
 * izmaiņām, ierašanās laiks, saite uz telpu nomas noteikumiem (tikai rezervācijām mūsu telpās), lūgums padalīties
 * ar fotogrāfijām, atcelšanas kārtība un logo.
 * Sūta tikai tad, ja klients formā norādījis e-pastu un ir iestatīts RESEND_API_KEY.
 * Lai e-pasti aizietu klientiem (ne tikai uz Resend konta adresi), NOTIFY_FROM jābūt apstiprinātā domēnā.
 */
export async function notifyClientConfirmed(
  row: Row,
  info: {
    /** Datums un laiks vienā rindā, piem. "5.09.2026. plkst. 14:00–17:00" */
    when: string;
    /** No cikiem gaidām klientu (15 min pirms sākuma) — tikai rezervācijām mūsu telpās ar laiku */
    arrival?: string;
    /** Norises vieta — tikai izbraukuma ballītēm un uzņēmumu pasākumiem */
    place?: string;
    /** Telefons atcelšanas SMS */
    smsPhone: string;
    replyTo: string;
    /** Izmaksu kopsavilkums (ballītēm un telpu nomai); uzņēmumu pieprasījumiem nav */
    costs?: BookingCosts | null;
    /** Saite uz telpu nomas noteikumiem — tikai rezervācijām mūsu telpās */
    rulesUrl?: string;
    /** Logo attēla adrese (PNG uz tumša fona — galvenei) */
    logoUrl?: string;
    /** Kontakti e-pasta apakšā */
    footer?: { address: string; phone: string; email: string; site: string };
  },
) {
  const key = process.env.RESEND_API_KEY;
  const to = typeof row.email === "string" ? row.email.trim() : "";
  if (!key || !to) return;

  const isBusiness = row.inquiry_type === "business";
  const name = String(row.parent_name ?? "").trim().split(/\s+/)[0];
  const price = (l: BookingCosts["lines"][number]) => (l.amount === null ? "pēc vienošanās" : eur(l.amount));

  // Noformējums — lapas krāsās (tumšā galvene ar logo, dzeltenie akcenti). E-pastos der tikai tabulas un stili pie elementa.
  const INK = "#1a1816";
  const SOFT = "#5e574f";
  const BRAND = "#ffd54a";
  const SURFACE = "#f3eee5";
  const LINE = "#e6dfd3";
  const p = (html: string, style = "") => `<p style="margin:0 0 16px;${style}">${html}</p>`;
  const eyebrow = (text: string) =>
    `<p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${SOFT}">${text}</p>`;
  // Rinda ar dzeltenu punktu (bērnu skaits, ierašanās laiks)
  const point = (html: string) =>
    `<tr><td style="width:22px;vertical-align:top;padding:0 0 10px"><span style="display:inline-block;width:10px;height:10px;margin-top:6px;border-radius:10px;background:${BRAND}"></span></td><td style="padding:0 0 10px">${html}</td></tr>`;

  // Izmaksas: vispirms telpu noma, tad programma un pārējais (kā ierastajā apstiprinājumā)
  const order = ["room", "program", "extra", "surcharge", "travel"];
  const costLines = info.costs ? [...info.costs.lines].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind)) : [];
  const costs = info.costs
    ? `${eyebrow("Izmaksas")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">${costLines
        .map(
          (l) =>
            `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE}">${escape(
              l.kind === "program" ? `Izklaides programma “${l.label}”` : l.label,
            )}${l.kind === "program" && l.note ? `<br><span style="font-size:13px;color:${SOFT}">${escape(l.note)}</span>` : ""}</td><td style="padding:10px 0;border-bottom:1px solid ${LINE};text-align:right;vertical-align:top;white-space:nowrap;font-weight:bold">${price(l)}</td></tr>`,
        )
        .join("")}${
        // Kopsummu rāda tikai tad, ja rindas ir vairākas un visas cenas ir zināmas
        costLines.length > 1 && info.costs.exact
          ? `<tr><td style="padding:12px 12px 0 0;font-size:17px;font-weight:bold">Kopā</td><td style="padding:12px 0 0;text-align:right;white-space:nowrap;font-size:17px;font-weight:bold">${eur(info.costs.total)}</td></tr>`
          : ""
      }</table>`
    : "";

  const points = [
    // Tikai rezervācijām ar izklaides programmu — telpu nomai vien bērnu skaitam nav nozīmes
    row.program ? point("Ja mainās bērnu skaits, lūdzam paziņot!") : "",
    info.arrival ? point(`Gaidīsim Jūs no plkst. <b>${escape(info.arrival)}</b>, lai būtu iespēja sagatavoties pasākumam!`) : "",
  ].join("");

  const footer = info.footer
    ? `<tr><td style="background:${INK};border-radius:0 0 20px 20px;padding:22px 32px;font-size:13px;line-height:1.7;color:#bdb6ab">
<span style="color:#ffffff;font-weight:bold">Smaidu Darbnīca</span><br>
${escape(info.footer.address)}<br>
<a href="tel:${escape(info.footer.phone.replace(/\s/g, ""))}" style="color:#bdb6ab;text-decoration:none">${escape(info.footer.phone)}</a> · <a href="mailto:${escape(info.footer.email)}" style="color:#bdb6ab;text-decoration:none">${escape(info.footer.email)}</a><br>
<a href="${info.footer.site}" style="color:${BRAND};text-decoration:none">${escape(info.footer.site.replace(/^https?:\/\//, ""))}</a>
</td></tr>`
    : "";

  const html = `<div style="margin:0;padding:24px 12px;background:${SURFACE};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate">
<tr><td style="background:${INK};border-radius:20px 20px 0 0;padding:28px 32px 30px">
${info.logoUrl ? `<img src="${info.logoUrl}" alt="Smaidu Darbnīca" width="110" style="display:block;width:110px;height:auto;border:0;margin:0 0 22px">` : ""}
<p style="margin:0;font-size:28px;line-height:1.25;font-weight:bold;text-transform:uppercase;color:#ffffff">Rezervācija<br><span style="display:inline-block;margin-top:4px;padding:2px 12px;border-radius:8px;background:${BRAND};color:${INK}">apstiprināta</span></p>
</td></tr>
<tr><td style="background:#ffffff;padding:30px 32px 26px${footer ? "" : ";border-radius:0 0 20px 20px"}">
${p(`Sveiki${name ? `, ${escape(name)}` : ""}!`, "font-size:17px;font-weight:bold")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 26px"><tr><td style="background:${SURFACE};border-radius:14px;padding:18px 20px">
${eyebrow("Datums un laiks")}
<p style="margin:0;font-size:22px;line-height:1.3;font-weight:bold">${escape(info.when)
  // Datums un laiks katrs paliek vienā rindā (telefonā laiks pāriet jaunā rindā, nevis pārlūzt pa vidu)
  .split(" plkst. ")
  .map((part, i) => `<span style="white-space:nowrap">${i ? "plkst. " : ""}${part}</span>`)
  .join(" ")}</p>
${info.place ? `<p style="margin:6px 0 0;color:${SOFT}">${escape(info.place)}</p>` : ""}
</td></tr></table>
${costs}
${points ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px">${points}</table>` : ""}
${
  info.rulesUrl
    ? `${p("Ar telpu nomas noteikumiem varat iepazīties šeit:", "margin-bottom:10px")}
<p style="margin:0 0 26px"><a href="${info.rulesUrl}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${BRAND};color:${INK};font-weight:bold;text-decoration:none">Telpu lietošanas noteikumi →</a></p>`
    : ""
}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 22px"><tr><td style="border-left:4px solid ${BRAND};background:#fbf9f5;padding:14px 18px">
Ja ${isBusiness ? "pasākuma" : "ballītes"} laikā izdosies iemūžināt kādus skaistus mirkļus, būsim ļoti pateicīgi, ja varēsiet atsūtīt mums dažas fotogrāfijas. Ar Jūsu piekrišanu tās varētu publicēt mūsu sociālo tīklu lapās, lai iedvesmotu arī citus svinēt kopā ar mums.
</td></tr></table>
${p(`Atcelšanas gadījumā lūdzam sūtīt SMS uz tālr. <b>${escape(info.smsPhone)}</b>, norādot atcelšanas datumu un laiku.`, `font-size:14px;color:${SOFT};margin-bottom:24px`)}
<p style="margin:0;font-size:17px;font-weight:bold">Tiekamies, lai radītu smaidu!</p>
<p style="margin:4px 0 0">Smaidīgu dienu,<br><b>SMAIDU DARBNĪCA</b></p>
</td></tr>
${footer}
</table>
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender(),
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

/**
 * Kalendāra ielūgums komandai, kad pieteikums apstiprināts: e-pasts ar .ics pielikumu (METHOD:REQUEST).
 * Google kalendārs šādu ielūgumu ieliek saņēmēja kalendārā automātiski — ja sūtītājs saņēmējam ir zināms
 * (adrese ir kontaktos) vai Google kalendāra iestatījumos izvēlēts "Pievienot ielūgumus: no visiem".
 * `uid` — nemainīgs pieteikumam (atkārtots ielūgums atjauno to pašu notikumu, nevis veido jaunu).
 */
export async function sendCalendarInvite(event: CalendarEvent, attendees: string[], uid: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || attendees.length === 0) return;

  const ics = calendarIcs(event, { uid, organizer: senderEmail(), attendees });
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1816">
<p style="font-size:18px;margin:0 0 12px"><b>${escape(event.text)}</b></p>
${event.location ? `<p style="margin:0 0 12px">${escape(event.location)}</p>` : ""}
<p style="white-space:pre-wrap;margin:0">${escape(event.details)}</p>
<p style="margin-top:20px;font-size:13px;color:#7a7268">Apstiprināta rezervācija — notikums pielikumā tiek pievienots Google kalendāram automātiski.</p>
</div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender(),
        to: attendees,
        subject: `Kalendārs: ${event.text}`,
        html,
        attachments: [
          {
            filename: "invite.ics",
            content: Buffer.from(ics, "utf-8").toString("base64"),
            content_type: "text/calendar; charset=utf-8; method=REQUEST",
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Resend (kalendārs)", res.status, await res.text());
  } catch (e) {
    console.error("[notify] calendar invite failed", e);
  }
}
