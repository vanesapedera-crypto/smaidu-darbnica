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

import { needsHeadcount } from "./bookings";
import { calendarIcs, type CalendarEvent } from "./calendar";
import { dateWords } from "./dates";
import { eur, type BookingCosts } from "./pricing";

type Row = Record<string, unknown>;

const escape = (v: unknown) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// E-pastu noformējums — lapas krāsās. E-pastos der tikai tabulas un stili pie elementa.
const INK = "#1a1816";
const SOFT = "#5e574f";
const BRAND = "#ffd54a";
const SURFACE = "#f3eee5";
const LINE = "#e6dfd3";

const eyebrow = (text: string) =>
  `<p style="margin:0 0 8px;font-size:11px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;color:${SOFT}">${text}</p>`;
/** Tabula "etiķete — vērtība"; tukšās rindas izlaiž. Vērtības jau ir droši HTML. */
const facts = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">${rows
    .filter(([, v]) => v)
    .map(
      ([label, v]) =>
        `<tr><td style="width:150px;padding:9px 12px 9px 0;border-bottom:1px solid ${LINE};color:${SOFT};vertical-align:top">${label}</td><td style="padding:9px 0;border-bottom:1px solid ${LINE};font-weight:bold">${v}</td></tr>`,
    )
    .join("")}</table>`;
/** Izmaksu tabula ar kopsummu (tā pati, ko klients redz formā un saņem apstiprinājumā) */
const costTable = (costs: BookingCosts) => {
  const order = ["room", "program", "extra", "surcharge", "travel"];
  const lines = [...costs.lines].sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind));
  return `${eyebrow("Izmaksas")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">${lines
    .map(
      (l) =>
        `<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ${LINE}">${escape(
          l.kind === "program" ? `Izklaides programma “${l.label}”` : l.label,
        )}${l.kind === "program" && l.note ? `<br><span style="font-size:13px;color:${SOFT}">${escape(l.note)}</span>` : ""}</td><td style="padding:10px 0;border-bottom:1px solid ${LINE};text-align:right;vertical-align:top;white-space:nowrap;font-weight:bold">${
          l.amount === null ? "pēc vienošanās" : eur(l.amount)
        }</td></tr>`,
    )
    .join("")}${
    // Kopsummu rāda tikai tad, ja rindas ir vairākas un visas cenas ir zināmas
    lines.length > 1 && costs.exact
      ? `<tr><td style="padding:12px 12px 0 0;font-size:17px;font-weight:bold">Kopā</td><td style="padding:12px 0 0;text-align:right;white-space:nowrap;font-size:17px;font-weight:bold">${eur(costs.total)}</td></tr>`
      : ""
  }</table>`;
};
/** E-pasta rāmis: tumša galvene ar virsrakstu (otrais vārds dzeltenā uzlīmē), balts saturs */
const shell = (title: string, sticker: string, body: string) =>
  `<div style="margin:0;padding:24px 12px;background:${SURFACE};font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${INK}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;border-collapse:separate">
<tr><td style="background:${INK};border-radius:20px 20px 0 0;padding:26px 32px 28px">
<p style="margin:0;font-size:26px;line-height:1.25;font-weight:bold;text-transform:uppercase;color:#ffffff">${title}<br><span style="display:inline-block;margin-top:4px;padding:2px 12px;border-radius:8px;background:${BRAND};color:${INK}">${sticker}</span></p>
</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 20px 20px;padding:28px 32px 30px">${body}</td></tr>
</table>
</div>`;

/**
 * Paziņojums komandai par jaunu pieteikumu — pilns pieteikums vienā e-pastā:
 * datums un laiks, programma, vieta, bērnu skaits, klienta kontakti, papildu informācija un izmaksas.
 * `info.title` — programmas vai pakalpojuma nosaukums, `info.time` — laika posms (piem. "14:00–17:00"),
 * `info.costs` — izmaksu kopsavilkums ballītēm un telpu nomai.
 */
export async function notifyNewBooking(row: Row, info: { title?: string; time?: string; costs?: BookingCosts | null } = {}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const isBusiness = row.inquiry_type === "business";
  const text = (k: string) => (row[k] === null || row[k] === undefined || row[k] === "" ? "" : escape(row[k]));
  const who = (row.company_name as string) || (row.parent_name as string) || "Jauns pieteikums";
  const date = dateWords(row.event_date);
  const subject = `${isBusiness ? "Pieprasījums" : "Rezervācija"}: ${who}${date ? ` · ${date}` : ""}${info.time ? ` ${info.time}` : ""}`;
  const travelling = row.location === "Izbraukums";
  const place = isBusiness ? text("event_city") : travelling ? text("address") : "Smaidu Darbnīca, Pasta iela 25, Tukums";
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.smaidudarbnica.lv").replace(/\/$/, "");
  const phone = String(row.phone ?? "");
  const email = String(row.email ?? "");

  const body = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 26px"><tr><td style="background:${SURFACE};border-radius:14px;padding:18px 20px">
${eyebrow("Datums un laiks")}
<p style="margin:0;font-size:22px;line-height:1.3;font-weight:bold"><span style="white-space:nowrap">${date || "Datums nav norādīts"}</span>${
    info.time ? ` <span style="white-space:nowrap">plkst. ${escape(info.time)}</span>` : ""
  }</p>
${place ? `<p style="margin:6px 0 0;color:${SOFT}">${place}</p>` : ""}
</td></tr></table>
${eyebrow("Pieteikums")}
${facts([
  [isBusiness ? "Pakalpojums" : "Izklaides programma", info.title ? escape(info.title) : isBusiness ? "" : "Nebūs nepieciešama (tikai telpu noma)"],
  ["Norises vieta", isBusiness ? "" : travelling ? "Izbraukums" : "Smaidu Darbnīcā"],
  ["Adrese", travelling ? text("address") : ""],
  ["Pasākuma veids", text("event_type")],
  ["Pilsēta / vieta", text("event_city")],
  ["Bērnu skaits", text("children_count")],
  ["Gaviļnieka vecums", text("child_age")],
  ["Dalībnieki", text("participants")],
  ["Budžets", text("budget_range")],
])}
${eyebrow("Klients")}
${facts([
  ["Vārds", text("parent_name")],
  ["Uzņēmums", text("company_name")],
  ["Amats", text("contact_role")],
  ["Telefons", phone ? `<a href="tel:${escape(phone.replace(/\s/g, ""))}" style="color:${INK}">${escape(phone)}</a>` : ""],
  ["E-pasts", email ? `<a href="mailto:${escape(email)}" style="color:${INK}">${escape(email)}</a>` : ""],
])}
${
  row.message
    ? `${eyebrow("Papildu informācija")}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px"><tr><td style="border-left:4px solid ${BRAND};background:#fbf9f5;padding:14px 18px;white-space:pre-wrap">${text("message")}</td></tr></table>`
    : ""
}
${info.costs ? costTable(info.costs) : ""}
<p style="margin:6px 0 0"><a href="${site}/admin" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${BRAND};color:${INK};font-weight:bold;text-decoration:none">Atvērt panelī un apstiprināt →</a></p>
<p style="margin:14px 0 0;font-size:13px;color:${SOFT}">Atbildot uz šo e-pastu, atbilde aizies klientam.</p>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender(),
        // Visi pieteikumi (uzņēmumu un privātie) nāk uz vienu adresi; ja vajag dalīt — iestatiet NOTIFY_EMAIL uzņēmumiem
        to: [(isBusiness && process.env.NOTIFY_EMAIL) || process.env.NOTIFY_EMAIL_PRIVATE || "smaidu.darbniica@gmail.com"],
        reply_to: email || undefined,
        subject,
        html: shell(isBusiness ? "Jauns" : "Jauna", isBusiness ? "pieprasījums" : "rezervācija", body),
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
    /** Saite, ar kuru klients apstiprina rezervāciju (poga "Apstiprinu rezervāciju"); ja nav — pogas nav */
    confirmUrl?: string;
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
  const p = (html: string, style = "") => `<p style="margin:0 0 16px;${style}">${html}</p>`;
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
    // Tikai programmām, kur bērnu skaits ietekmē cenu — ne telpu nomai vien un ne pārsteiguma tēlam
    needsHeadcount(row.program as string | null) ? point("Ja mainās bērnu skaits, lūdzam paziņot!") : "",
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
<p style="margin:0;font-size:28px;line-height:1.25;font-weight:bold;text-transform:uppercase;color:#ffffff">${
    info.confirmUrl ? "Apstipriniet" : "Rezervācija"
  }<br><span style="display:inline-block;margin-top:4px;padding:2px 12px;border-radius:8px;background:${BRAND};color:${INK}">${
    info.confirmUrl ? "rezervāciju" : "apstiprināta"
  }</span></p>
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
${
  info.confirmUrl
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 28px"><tr><td style="background:${INK};border-radius:14px;padding:22px 20px;text-align:center">
<p style="margin:0 0 14px;color:#ffffff;font-size:16px">Lūdzu, apstipriniet rezervāciju, nospiežot pogu:</p>
<a href="${info.confirmUrl}" style="display:inline-block;padding:14px 28px;border-radius:999px;background:${BRAND};color:${INK};font-size:17px;font-weight:bold;text-decoration:none">Apstiprinu rezervāciju</a>
<p style="margin:16px 0 0;font-size:14px"><a href="${info.confirmUrl}&amp;atcelt=1" style="color:#ffffff;text-decoration:underline">Atcelt rezervāciju</a></p>
</td></tr></table>`
    : ""
}
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
        subject: info.confirmUrl ? "Lūdzu, apstipriniet rezervāciju — Smaidu Darbnīca" : "Rezervācija apstiprināta — Smaidu Darbnīca",
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
        // Sūtītāja adresei nav pastkastītes — atbildes uz šo e-pastu nāk uz rezervāciju e-pastu
        reply_to: process.env.NOTIFY_EMAIL_PRIVATE || "smaidu.darbniica@gmail.com",
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

/** Īss paziņojums komandai (tas pats rāmis kā pārējiem e-pastiem) ar pogu uz paneli */
async function notifyTeam(subject: string, title: string, sticker: string, body: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.smaidudarbnica.lv").replace(/\/$/, "");
  const html = shell(
    title,
    sticker,
    `${body}
<p style="margin:22px 0 0"><a href="${site}/admin?statuss=Apstiprin%C4%81ta" style="display:inline-block;padding:12px 22px;border-radius:999px;background:${BRAND};color:${INK};font-weight:bold;text-decoration:none">Atvērt paneli →</a></p>`,
  );
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender(),
        to: [process.env.NOTIFY_EMAIL_PRIVATE || "smaidu.darbniica@gmail.com"],
        reply_to: replyTo || undefined,
        subject,
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[notify] Resend (komandai)", res.status, await res.text());
  } catch (e) {
    console.error("[notify] team notification failed", e);
  }
}

/** Klients nospieda "Apstiprinu rezervāciju" — paziņojums komandai */
export function notifyClientAccepted(info: { name: string; when: string; title: string; place: string }) {
  return notifyTeam(
    `Klients apstiprināja: ${info.name || "rezervācija"} · ${info.when}`,
    "Klients",
    "apstiprināja",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 22px"><tr><td style="background:${SURFACE};border-radius:14px;padding:18px 20px">
${eyebrow("Datums un laiks")}
<p style="margin:0;font-size:22px;line-height:1.3;font-weight:bold">${escape(info.when)}</p>
${info.place ? `<p style="margin:6px 0 0;color:${SOFT}">${escape(info.place)}</p>` : ""}
</td></tr></table>
${facts([
  ["Klients", escape(info.name)],
  ["Izklaides programma", escape(info.title)],
])}`,
  );
}

/** Klients savā lapā nospieda "Atcelt rezervāciju" — paziņojums komandai (laiks formā atkal ir brīvs) */
export function notifyClientCancelled(info: { name: string; when: string; title: string; place: string }) {
  return notifyTeam(
    `Klients ATCĒLA: ${info.name || "rezervācija"} · ${info.when}`,
    "Klients",
    "atcēla",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 22px"><tr><td style="background:${SURFACE};border-radius:14px;padding:18px 20px">
${eyebrow("Datums un laiks")}
<p style="margin:0;font-size:22px;line-height:1.3;font-weight:bold">${escape(info.when)}</p>
${info.place ? `<p style="margin:6px 0 0;color:${SOFT}">${escape(info.place)}</p>` : ""}
</td></tr></table>
${facts([
  ["Klients", escape(info.name)],
  ["Izklaides programma", escape(info.title)],
])}
<p style="margin:0">Rezervācijas statuss panelī ir nomainīts uz “Atcelta”, un laiks rezervācijas formā atkal ir brīvs. <b>Notikums Google kalendārā jāizdzēš ar roku.</b></p>`,
  );
}

/**
 * Atgādinājums komandai: klienti, kas 3 dienu laikā nav apstiprinājuši rezervāciju.
 * `dates` — pasākumu datumi (bez klientu datiem); panelī pie šīm rezervācijām ir pogas "WhatsApp" un "SMS".
 */
export function notifyUnconfirmed(dates: string[]) {
  const list = dates.map((d) => `<li>${escape(dateWords(d) || "datums nav norādīts")}</li>`).join("");
  return notifyTeam(
    `Nav apstiprināts: ${dates.length} ${dates.length === 1 ? "rezervācija" : "rezervācijas"}`,
    "Klients nav",
    "apstiprinājis",
    `<p style="margin:0 0 12px">Šīm rezervācijām apstiprinājuma e-pasts nosūtīts pirms vairāk nekā 3 dienām, bet klients to vēl nav apstiprinājis:</p>
<ul style="margin:0 0 16px;padding-left:20px;font-weight:bold">${list}</ul>
<p style="margin:0">Panelī pie katras ir pogas <b>WhatsApp</b> un <b>SMS</b> — tās atver ziņu ar jau uzrakstītu tekstu un apstiprināšanas saiti.</p>`,
  );
}
