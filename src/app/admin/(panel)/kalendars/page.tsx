import { ChevronDown } from "lucide-react";
import { requireSection } from "@/lib/auth";
import type { Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur } from "@/lib/pricing";
import { timeLabel } from "@/lib/dates";
import { listGoogleEvents, type GoogleEvent } from "@/lib/google-calendar";
import BookingCard, { isTrip, isVenue, stateOf } from "@/components/admin/team/BookingCard";
import PageHeader from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kalendārs" };

const MONTHS = ["janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs", "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris"];
const WEEKDAY_NAMES = ["svētdiena", "pirmdiena", "otrdiena", "trešdiena", "ceturtdiena", "piektdiena", "sestdiena"];

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);


/**
 * Rezervāciju kalendārs — vienkāršs saraksts: viena zem otras tikai tās dienas, kurās kaut kas notiek,
 * no šodienas uz priekšu. Pagājušās rezervācijas — sakļautā sadaļā "Arhīvs". Atceltās nerāda.
 * Uzspiežot uz rezervācijas, zem tās uzreiz atveras visa informācija (bez lapas pārlādes).
 */
export default async function CalendarPage() {
  const { db, role } = await requireSection("kalendars");
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });

  const [{ data, error }, business, programs, settings] = await Promise.all([
    db.from("bookings").select("*").not("event_date", "is", null).neq("status", "Atcelta").order("event_date").order("event_time", { nullsFirst: true }),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);
  // Google kalendāra notikumi (arī tie, kuros ielūdza Kristīne) — redz tikai administratore
  const google: GoogleEvent[] = role === "owner" ? ((await listGoogleEvents(db, today, addDays(today, 120))) ?? []) : [];

  const prices = bookingPrices(settings);
  const costsOf = (b: Booking) =>
    b.inquiry_type === "business" ? null : bookingCosts(b, programs.find((p) => p.slug === (b.program || b.service_slug)), prices);
  const titles = new Map([...business, ...programs].map((s) => [s.slug, s.title]));
  const label = (b: Booking) => {
    const slug = b.service_slug || b.program;
    const program = slug ? (titles.get(slug) ?? slug) : null;
    if (program) return isVenue(b) ? `Telpu noma + ${program}` : program;
    return isVenue(b) ? "Telpu noma" : "—";
  };

  // Skatītājiem (piem. telpu uzkopšanai) — tikai rezervācijas mūsu telpās
  const all = ((data ?? []) as Booking[]).filter((b) => role !== "viewer" || isVenue(b));
  const group = (list: Booking[]) => {
    const map = new Map<string, Booking[]>();
    for (const b of list) {
      const day = b.event_date!.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), b]);
    }
    return map;
  };
  const upcoming = group(all.filter((b) => b.event_date!.slice(0, 10) >= today));
  // Arhīvs — jaunākās dienas augšā
  const archive = group(all.filter((b) => b.event_date!.slice(0, 10) < today).reverse());
  const googleByDay = new Map<string, GoogleEvent[]>();
  for (const g of google) googleByDay.set(g.date, [...(googleByDay.get(g.date) ?? []), g]);
  const upcomingDays = [...new Set([...upcoming.keys(), ...googleByDay.keys()])].sort();

  const dayTitle = (day: string) => {
    const d = new Date(`${day}T12:00:00Z`);
    const year = day.slice(0, 4) !== today.slice(0, 4) ? ` ${d.getUTCFullYear()}` : "";
    return `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}${year}, ${WEEKDAY_NAMES[d.getUTCDay()]}`;
  };

  const renderDay = (day: string, items: Booking[], gItems: GoogleEvent[] = []) => (
    <div key={day}>
      <h3 className={cn("text-sm font-extrabold", day === today && "text-ink")}>
        {day === today ? "Šodien · " : ""}
        {dayTitle(day)}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((b) => {
          const st = stateOf(b);
          const c = costsOf(b);
          return (
            <li key={b.id}>
              <details className="group">
              <summary
                className={cn(
                  "grid cursor-pointer list-none items-center gap-x-4 gap-y-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-line hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)_auto_auto] [&::-webkit-details-marker]:hidden",
                  isTrip(b) && "border-l-4 border-purple-400",
                  isVenue(b) && "border-l-4 border-brand-strong",
                  "group-open:bg-brand-soft group-open:ring-2 group-open:ring-ink",
                )}
              >
                <span className="text-sm font-semibold">{timeLabel(b.event_time, b.location) || "—"}</span>
                <span className="min-w-0 truncate text-sm">
                  <b>{label(b)}</b> · {b.company_name || b.parent_name || "—"}
                  {c?.exact && (
                    <span className="text-ink-soft">
                      {" "}
                      · {eur(c.total)}
                      {c.plusVat ? " + PVN" : ""}
                    </span>
                  )}
                </span>
                <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1", st.tone)}>{st.label}</span>
                <ChevronDown className="hidden size-4 text-ink-soft transition-transform group-open:rotate-180 sm:block" aria-hidden />
              </summary>
              <ul className="mt-2">
                <BookingCard b={b} label={label(b)} costs={c} />
              </ul>
              </details>
            </li>
          );
        })}
        {gItems.map((g) => (
          <li key={g.id}>
            <a
              href={g.link || undefined}
              target="_blank"
              rel="noreferrer"
              className="grid items-center gap-x-4 gap-y-1 rounded-2xl bg-white px-4 py-3 text-ink-soft ring-1 ring-line hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)_auto]"
            >
              <span className="text-sm font-semibold">{g.time ? `${g.time}${g.endTime ? `–${g.endTime}` : ""}` : "Visu dienu"}</span>
              <span className="min-w-0 truncate text-sm">
                <b className="text-ink">{g.title}</b>
                {g.location && ` · ${g.location}`}
              </span>
              <span className="w-fit rounded-full bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-line">Google kalendārs</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <>
      <PageHeader title="Kalendārs" />

      {error && <p className="mt-4 text-sm font-semibold text-destructive">Neizdevās ielādēt rezervācijas: {error.message}</p>}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border-l-4 border-brand-strong bg-white ring-1 ring-line" /> Telpu noma</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border-l-4 border-purple-400 bg-white ring-1 ring-line" /> Izbraukuma ballīte</span>
      </div>

      <section className="mt-6 space-y-6">
        {upcomingDays.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Gaidāmu rezervāciju nav.</p>}
        {upcomingDays.map((day) => renderDay(day, upcoming.get(day) ?? [], googleByDay.get(day) ?? []))}
      </section>

      {archive.size > 0 && (
        <details className="mt-10 rounded-2xl bg-surface/60 p-4 ring-1 ring-line sm:p-5">
          <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-ink">Arhīvs — notikušās rezervācijas ({[...archive.values()].flat().length})</summary>
          <div className="mt-4 space-y-6">{[...archive.entries()].map(([day, items]) => renderDay(day, items))}</div>
        </details>
      )}
    </>
  );
}
