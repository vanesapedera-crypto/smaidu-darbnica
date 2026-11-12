import { ChevronDown } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { hostsOf, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import { Star } from "lucide-react";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur } from "@/lib/pricing";
import { timeLabel } from "@/lib/dates";
import { Suspense } from "react";
import { listGoogleEvents } from "@/lib/google-calendar";
import type { MemberContext } from "@/lib/auth";
import BookingCard, { isTrip, isVenue, stateOf } from "@/components/admin/team/BookingCard";
import PageHeader from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kalendārs" };

const MONTHS = ["janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs", "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris"];
const WEEKDAY_NAMES = ["svētdiena", "pirmdiena", "otrdiena", "trešdiena", "ceturtdiena", "piektdiena", "sestdiena"];

/** Komandas grafika pasākums (tabula team_events) */
type TeamEvent = { id: string; event_date: string; time: string | null; title: string; place: string | null; team: string | null; details: string | null; published: boolean };

/** Kārtošanai dienas ietvaros: "16.30 un 17.40" → 990; "no rīta" → agri; "vakarā" → 18.00; nezināms — beigās */
function minuteOf(t: string | null | undefined): number {
  const m = /(\d{1,2})[.:](\d{2})/.exec(t ?? "");
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  if (/rīt/i.test(t ?? "")) return 0;
  if (/vakar/i.test(t ?? "")) return 18 * 60;
  return 24 * 60;
}

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);


/**
 * Rezervāciju kalendārs — vienkāršs saraksts: viena zem otras tikai tās dienas, kurās kaut kas notiek,
 * no šodienas uz priekšu. Pagājušās rezervācijas — sakļautā sadaļā "Arhīvs". Atceltās nerāda.
 * Uzspiežot uz rezervācijas, zem tās uzreiz atveras visa informācija (bez lapas pārlādes).
 */
export default async function CalendarPage() {
  const { db, role, email } = await requireSection("kalendars");
  // Ielogojusies animatore (pēc e-pasta CALENDAR_HOSTS sarakstā) — viņas vadītās rezervācijas izceļ ar "Tu vadi"
  const me = CALENDAR_HOSTS.find((h) => h.email === email.toLowerCase())?.name;
  const isMine = (b: Booking) => Boolean(me && hostsOf(b.message).split(/,\s*/).includes(me));
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });

  const [{ data, error }, { data: eventRows }, business, programs, settings] = await Promise.all([
    db.from("bookings").select("*").not("event_date", "is", null).neq("status", "Atcelta").order("event_date").order("event_time", { nullsFirst: true }),
    // Komandas grafiks (sadaļa "Komandas grafiks"); komanda redz tikai "Rādīt kalendārā" (to nosaka datubāzes RLS)
    db.from("team_events").select("*").order("event_date"),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);

  const prices = bookingPrices(settings);
  const costsOf = (b: Booking) =>
    b.inquiry_type === "business" ? null : bookingCosts(b, programs.find((p) => p.slug === (b.program || b.service_slug)), prices);
  const titles = new Map([...business, ...programs].map((s) => [s.slug, s.title]));
  const programTitle = (b: Booking) => {
    const slug = b.service_slug || b.program;
    return slug ? (titles.get(slug) ?? slug) : null;
  };
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

  const events = (eventRows ?? []) as TeamEvent[];
  const eventsByDay = new Map<string, TeamEvent[]>();
  for (const e of events) {
    const day = String(e.event_date).slice(0, 10);
    eventsByDay.set(day, [...(eventsByDay.get(day) ?? []), e]);
  }
  const eventDays = [...eventsByDay.keys()];
  const upcomingDays = [...new Set([...upcoming.keys(), ...eventDays.filter((d) => d >= today)])].sort();
  const archiveDays = [...new Set([...archive.keys(), ...eventDays.filter((d) => d < today)])].sort().reverse();
  const archiveCount = [...archive.values()].flat().length + events.filter((e) => String(e.event_date).slice(0, 10) < today).length;
  // Komandas pasākumā — vai ielogojusies animatore ir komandā (vārds komandas tekstā, punkti nav svarīgi)
  const norm = (t: string) => ` ${t.toLowerCase().replace(/\./g, "").replace(/[^a-zāčēģīķļņšūž0-9]+/g, " ")} `;
  const inTeam = (e: TeamEvent) => Boolean(me && norm(e.team ?? "").includes(norm(me)));

  const dayTitle = (day: string) => {
    const d = new Date(`${day}T12:00:00Z`);
    const year = day.slice(0, 4) !== today.slice(0, 4) ? ` ${d.getUTCFullYear()}` : "";
    return `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}${year}, ${WEEKDAY_NAMES[d.getUTCDay()]}`;
  };

  const eventRow = (e: TeamEvent) => {
    const mine = inTeam(e);
    return (
      <li key={e.id}>
        <details className="group">
          <summary
            className={cn(
              "grid cursor-pointer list-none items-center gap-x-4 gap-y-1 rounded-2xl bg-white px-4 py-3 ring-1 ring-line hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)_auto_auto] [&::-webkit-details-marker]:hidden",
              "border-l-4 border-sky-400",
              mine && "bg-amber-50 ring-2 ring-amber-400",
              "group-open:bg-brand-soft group-open:ring-2 group-open:ring-ink",
            )}
          >
            <span className="text-sm font-semibold">{e.time || "—"}</span>
            <span className="min-w-0 text-sm">
              <span className="block truncate">
                {mine && (
                  <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 align-middle text-xs font-extrabold text-ink">
                    <Star className="size-3 fill-current" aria-hidden /> Tu vadi
                  </span>
                )}
                <b>{e.title}</b>
                {e.place && ` · ${e.place}`}
              </span>
              {e.team && <span className="mt-0.5 block truncate text-xs text-ink-soft">Komanda: {e.team}</span>}
            </span>
            {role === "owner" && !e.published ? (
              <span className="w-fit rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-ink-soft ring-1 ring-line">Komanda neredz</span>
            ) : (
              <span />
            )}
            <ChevronDown className="hidden size-4 text-ink-soft transition-transform group-open:rotate-180 sm:block" aria-hidden />
          </summary>
          <div className="mt-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-line sm:p-5">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[110px_1fr]">
              <dt className="text-ink-soft">Laiks</dt>
              <dd className="font-semibold">{e.time || "—"}</dd>
              <dt className="text-ink-soft">Vieta</dt>
              <dd className="font-semibold">{e.place || "—"}</dd>
              <dt className="text-ink-soft">Komanda</dt>
              <dd className="font-semibold">{e.team || "—"}</dd>
            </dl>
            {e.details && <p className="mt-3 rounded-xl bg-surface p-3 whitespace-pre-line">{e.details}</p>}
            {role === "owner" && (
              <a href={`/admin/grafiks/${e.id}`} className="mt-3 inline-block font-semibold underline decoration-brand decoration-2 underline-offset-4">
                Labot
              </a>
            )}
          </div>
        </details>
      </li>
    );
  };

  const renderDay = (day: string, items: Booking[], dayEvents: TeamEvent[] = []) => (
    <div key={day}>
      <h3 className={cn("text-sm font-extrabold", day === today && "text-ink")}>
        {day === today ? "Šodien · " : ""}
        {dayTitle(day)}
      </h3>
      <ul className="mt-2 space-y-2">
        {[
          ...items.map((b) => ({ min: minuteOf(b.event_time), node: (() => {
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
                  isMine(b) && "bg-amber-50 ring-2 ring-amber-400",
                  "group-open:bg-brand-soft group-open:ring-2 group-open:ring-ink",
                )}
              >
                <span className="text-sm font-semibold">{timeLabel(b.event_time, b.location) || "—"}</span>
                <span className="min-w-0 text-sm">
                  <span className="block truncate">
                    {isMine(b) && (
                      <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 align-middle text-xs font-extrabold text-ink">
                        <Star className="size-3 fill-current" aria-hidden /> Tu vadi
                      </span>
                    )}
                    <b>{isVenue(b) ? "Telpu noma" : label(b)}</b> · {b.company_name || b.parent_name || "—"}
                    {c?.exact && (
                      <span className="text-ink-soft">
                        {" "}
                        · {eur(c.total)}
                        {c.plusVat ? " + PVN" : ""}
                      </span>
                    )}
                  </span>
                  {/* Telpu nomai ar izklaides programmu — programma un kas to vada (mazākiem burtiem) */}
                  {(() => {
                    const program = isVenue(b) ? programTitle(b) : null;
                    const hosts = hostsOf(b.message);
                    const parts = [program && `Izklaides programma: ${program}`, hosts && `Vada: ${hosts}`].filter(Boolean);
                    return parts.length > 0 && <span className="mt-0.5 block truncate text-xs text-ink-soft">{parts.join(" · ")}</span>;
                  })()}
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
        })() })),
          ...dayEvents.map((e) => ({ min: minuteOf(e.time), node: eventRow(e) })),
        ]
          .sort((x, y) => x.min - y.min)
          .map((x) => x.node)}
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
        {events.length > 0 && (
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border-l-4 border-sky-400 bg-white ring-1 ring-line" /> Komandas grafiks</span>
        )}
      </div>

      <section className="mt-6 space-y-6">
        {upcomingDays.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Gaidāmu rezervāciju nav.</p>}
        {upcomingDays.map((day) => renderDay(day, upcoming.get(day) ?? [], eventsByDay.get(day)))}
      </section>

      {/* Google kalendāra notikumi, kas nav no mājaslapas (piem. Kristīnes) — tikai administratorei; ielādējas atsevišķi, lai lapa nav jāgaida */}
      {role === "owner" && (
        <Suspense fallback={<p className="mt-8 text-sm text-ink-soft">Ielādē Google kalendāru…</p>}>
          <GoogleEvents db={db} from={today} to={addDays(today, 120)} dayTitle={dayTitle} />
        </Suspense>
      )}

      {archiveDays.length > 0 && (
        <details className="mt-10 rounded-2xl bg-surface/60 p-4 ring-1 ring-line sm:p-5">
          <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-ink">Arhīvs — notikušās rezervācijas ({archiveCount})</summary>
          <div className="mt-4 space-y-6">{archiveDays.map((day) => renderDay(day, archive.get(day) ?? [], eventsByDay.get(day)))}</div>
        </details>
      )}
    </>
  );
}

/** Notikumi no Google kalendāra (nav pieteikumi mājaslapā), sakārtoti pa dienām */
async function GoogleEvents({ db, from, to, dayTitle }: { db: MemberContext["db"]; from: string; to: string; dayTitle: (d: string) => string }) {
  const events = await listGoogleEvents(db, from, to);
  if (!events?.length) return null;
  const days = [...new Set(events.map((g) => g.date))].sort();
  return (
    <details className="mt-10 rounded-2xl bg-surface/60 p-4 ring-1 ring-line sm:p-5">
      <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-ink">Citi notikumi Google kalendārā ({events.length})</summary>
      <div className="mt-4 space-y-6">
        {days.map((day) => (
          <div key={day}>
            <h3 className="text-sm font-extrabold">{dayTitle(day)}</h3>
            <ul className="mt-2 space-y-2">
              {events
                .filter((g) => g.date === day)
                .map((g) => (
                  <li key={g.id}>
                    <a
                      href={g.link || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="grid items-center gap-x-4 gap-y-1 rounded-2xl bg-white px-4 py-3 text-ink-soft ring-1 ring-line hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)]"
                    >
                      <span className="text-sm font-semibold">{g.time ? `${g.time}${g.endTime ? `–${g.endTime}` : ""}` : "Visu dienu"}</span>
                      <span className="min-w-0 truncate text-sm">
                        <b className="text-ink">{g.title}</b>
                        {g.location && ` · ${g.location}`}
                      </span>
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
