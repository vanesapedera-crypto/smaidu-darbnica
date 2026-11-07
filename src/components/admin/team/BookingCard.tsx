import { atStudio, type Booking } from "@/lib/bookings";
import { timeLabel } from "@/lib/dates";
import { confirmationState } from "@/components/admin/ClientConfirmation";
import { cn } from "@/lib/utils";

/** Rezervācijas kartīte tikai skatīšanai (kalendārs un pieteikumu saraksts komandai). */

export type Filter = "visi" | "telpas" | "izbraukumi" | "uznemumi";

export const isVenue = (b: Booking) => b.inquiry_type !== "business" && atStudio(b.location);
export const matches = (b: Booking, f: Filter) =>
  f === "visi" ? true : f === "telpas" ? isVenue(b) : f === "uznemumi" ? b.inquiry_type === "business" : b.inquiry_type !== "business" && !isVenue(b);

/** Stāvoklis vienā vārdā — tas pats, ko redz pieteikumu sarakstā */
export function stateOf(b: Booking): { label: string; tone: string; dot: string } {
  if (b.status === "Atcelta") return { label: "Atcelta", tone: "bg-surface text-ink-soft ring-line line-through", dot: "bg-ink/25" };
  if (b.status !== "Apstiprināta") return { label: "Jauns pieteikums — vēl nav apstiprināts", tone: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" };
  const c = confirmationState(b);
  if (c?.state === "confirmed") return { label: "Klients apstiprināja", tone: "bg-emerald-50 text-emerald-800 ring-emerald-300", dot: "bg-emerald-500" };
  if (c?.state === "overdue") return { label: `Klients nav apstiprinājis · ${c.days} d.`, tone: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" };
  if (c?.state === "waiting") return { label: `Gaida klienta apstiprinājumu · ${c.days} d.`, tone: "bg-brand/30 text-ink ring-brand", dot: "bg-brand-strong" };
  return { label: "Apstiprināta", tone: "bg-emerald-50 text-emerald-800 ring-emerald-300", dot: "bg-emerald-500" };
}

export default function BookingCard({ b, label, showDate = false }: { b: Booking; label: string; showDate?: boolean }) {
  const s = stateOf(b);
  const date = showDate && b.event_date ? new Date(`${b.event_date.slice(0, 10)}T12:00:00Z`).toLocaleDateString("lv-LV", { timeZone: "UTC" }) : "";
  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">
            {date && `${date} · `}{timeLabel(b.event_time, b.location) || "Laiks nav norādīts"} · {label}
          </p>
          <p className="text-sm text-ink-soft">
            {b.inquiry_type === "business" ? "Uzņēmums" : isVenue(b) ? "Mūsu telpās" : b.location === "Izbraukums" ? "Izbraukums" : b.location}
            {b.address && !isVenue(b) ? ` · ${b.address}` : ""}
          </p>
        </div>
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1", s.tone)}>{s.label}</span>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {b.company_name && <Row k="Uzņēmums / iestāde" v={b.company_name} />}
        <Row k={b.company_name ? "Kontaktpersona" : "Klients"} v={b.parent_name} />
        <Row k="Telefons" v={b.phone} href={b.phone ? `tel:${b.phone.replace(/\s/g, "")}` : undefined} />
        <Row k="E-pasts" v={b.email} href={b.email ? `mailto:${b.email}` : undefined} />
        <Row k="Bērnu skaits" v={b.children_count ? String(b.children_count) : null} />
        <Row k="Vecums" v={b.child_age} />
        <Row k="Dalībnieki" v={b.participants ? String(b.participants) : null} />
      </dl>
      {b.message && <p className="mt-3 rounded-xl bg-surface p-3 text-sm whitespace-pre-line">{b.message}</p>}
      {b.admin_notes && (
        <p className="mt-2 text-sm whitespace-pre-line">
          <span className="font-bold">Piezīmes: </span>
          {b.admin_notes}
        </p>
      )}
    </li>
  );
}

function Row({ k, v, href }: { k: string; v: string | null | undefined; href?: string }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="inline text-ink-soft">{k}: </dt>
      <dd className="inline font-semibold break-words">
        {href ? (
          <a href={href} className="underline decoration-brand decoration-2 underline-offset-4">{v}</a>
        ) : (
          v
        )}
      </dd>
    </div>
  );
}
