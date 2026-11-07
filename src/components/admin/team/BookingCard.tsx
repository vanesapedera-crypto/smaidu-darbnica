import { atStudio, type Booking } from "@/lib/bookings";
import { timeLabel } from "@/lib/dates";
import { confirmationState } from "@/components/admin/ClientConfirmation";
import { VAT_NOTE, amountText, eur, type BookingCosts } from "@/lib/pricing";
import { cn } from "@/lib/utils";

/** Rezervācijas kartīte tikai skatīšanai (kalendārs un pieteikumu saraksts komandai). */

export type Filter = "visi" | "telpas" | "izbraukumi" | "uznemumi";

export const isVenue = (b: Booking) => b.inquiry_type !== "business" && atStudio(b.location);
/** Izbraukuma ballīte (kalendārā — lillā) */
export const isTrip = (b: Booking) => b.inquiry_type !== "business" && b.location === "Izbraukums";

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

/** Pieteikuma veids — tas pats, ko rāda pieteikumu sarakstā */
function kindLabel(b: Booking): string {
  if (b.inquiry_type === "business") return "Uzņēmumiem";
  if (b.location === "Izbraukums") return "Izbraukums";
  if (b.location && b.location !== "Smaidu Darbnīcā") return b.location;
  return b.program ? "Telpu noma + programma" : "Telpu noma";
}

const lvDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("lv-LV", { timeZone: "Europe/Riga", dateStyle: "short", timeStyle: "short" }) : null;

/**
 * Rezervācija tikai skatīšanai — visa tā pati informācija, ko administratore redz pieteikumu sarakstā:
 * kontakti, vieta, ceļa izdevumi, bērni/dalībnieki, budžets, ziņojums, izmaksas, piezīmes, apstiprinājumi.
 */
export default function BookingCard({
  b,
  label,
  costs,
  showDate = false,
}: {
  b: Booking;
  label: string;
  costs?: BookingCosts | null;
  showDate?: boolean;
}) {
  const s = stateOf(b);
  const date = showDate && b.event_date ? new Date(`${b.event_date.slice(0, 10)}T12:00:00Z`).toLocaleDateString("lv-LV", { timeZone: "UTC" }) : "";
  const message = (b.message ?? "")
    .split("\n")
    .filter((l) => !l.startsWith("Izmaksas:"))
    .join("\n")
    .trim();

  const rows: [string, React.ReactNode][] = [
    ["Veids", kindLabel(b)],
    ["Uzņēmums / iestāde", b.company_name],
    [b.company_name ? "Kontaktpersona" : "Klients", b.parent_name],
    ["Amats", b.contact_role],
    ["Telefons", b.phone && <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="font-semibold underline decoration-brand decoration-2 underline-offset-4">{b.phone}</a>],
    ["E-pasts", b.email && <a href={`mailto:${b.email}`} className="font-semibold underline decoration-brand decoration-2 underline-offset-4">{b.email}</a>],
    ["Vieta", [b.location, b.event_city, b.address].filter(Boolean).join(", ")],
    ["Ceļa izdevumi", b.travel_cost != null && `${eur(b.travel_cost)}${b.travel_km != null ? ` (${b.travel_km} km turp un atpakaļ)` : ""}`],
    ["Bērnu skaits", b.children_count],
    ["Vecums", b.child_age],
    ["Dalībnieki", b.participants],
    ["Pasākuma veids", b.event_type],
    ["Budžets", b.budget_range],
    ["Saņemts", lvDateTime(b.created_at)],
    ["Apstiprinājums nosūtīts", lvDateTime(b.confirmation_sent_at)],
    ["Klients apstiprināja", lvDateTime(b.client_confirmed_at)],
    ["Klients atcēla", lvDateTime(b.client_cancelled_at)],
  ];

  return (
    <li className={cn("rounded-2xl bg-white ring-1 ring-line", isTrip(b) && "border-l-4 border-purple-400")}>
      <div className="flex flex-wrap items-start justify-between gap-2 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="font-bold">
            {date && `${date} · `}
            {timeLabel(b.event_time, b.location) || "Laiks nav norādīts"} · {label}
          </p>
          <p className="text-sm text-ink-soft">
            {b.company_name || b.parent_name || "—"}
            {costs?.exact && ` · ${eur(costs.total)}${costs.plusVat ? " + PVN" : ""}`}
          </p>
        </div>
        <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1", s.tone)}>{s.label}</span>
      </div>

      <div className="grid gap-6 border-t border-line p-4 sm:p-5 md:grid-cols-2">
        <dl className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-1.5 text-sm">
          {rows
            .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-soft">{k}</dt>
                <dd className="min-w-0 font-semibold break-words">{v}</dd>
              </div>
            ))}
        </dl>

        <div className="space-y-4">
          {costs && (
            <div>
              <p className="text-sm text-ink-soft">Izmaksas</p>
              <dl className="mt-1 space-y-1 text-sm">
                {costs.lines.map((l) => (
                  <div key={l.label} className="flex justify-between gap-4">
                    <dt>{l.label}</dt>
                    <dd className="font-semibold whitespace-nowrap">{amountText(l)}</dd>
                  </div>
                ))}
                {costs.exact ? (
                  <div className="flex justify-between gap-4 border-t border-line pt-1">
                    <dt className="font-extrabold">Kopā</dt>
                    <dd className="font-extrabold whitespace-nowrap">{eur(costs.total)}</dd>
                  </div>
                ) : (
                  <p className="text-ink-soft">Kopsumma vēl nav zināma.</p>
                )}
                {costs.plusVat && <p className="text-ink-soft">{VAT_NOTE}</p>}
              </dl>
            </div>
          )}
          {message && (
            <div>
              <p className="text-sm text-ink-soft">Ziņojums / papildu informācija</p>
              <p className="mt-1 rounded-xl bg-surface p-3 text-sm whitespace-pre-line">{message}</p>
            </div>
          )}
          {b.admin_notes && (
            <div>
              <p className="text-sm text-ink-soft">Piezīmes</p>
              <p className="mt-1 text-sm whitespace-pre-line">{b.admin_notes}</p>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
