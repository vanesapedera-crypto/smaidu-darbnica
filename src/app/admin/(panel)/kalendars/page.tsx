import { ChevronDown } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { hostsOf, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import { Star } from "lucide-react";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur, parseCostOverride } from "@/lib/pricing";
import { timeLabel } from "@/lib/dates";
import { Suspense } from "react";
import { listGoogleEvents } from "@/lib/google-calendar";
import type { MemberContext } from "@/lib/auth";
import BookingCard, { isTrip, isVenue, stateOf } from "@/components/admin/team/BookingCard";
import PageHeader from "@/components/admin/PageHeader";
import BookingAdminPanel, { type BookingAdminContext } from "@/components/admin/BookingAdminPanel";
import StaffAnswer from "@/components/admin/StaffAnswer";
import type { StaffRow } from "@/lib/staff";
import GoogleCalendarCard from "@/components/admin/GoogleCalendarCard";
import { googleConnection } from "@/lib/google-calendar";
import { adminInput, adminPrimary, adminSecondary } from "@/components/admin/styles";
import Link from "next/link";
import { Plus } from "lucide-react";
import ResendInvites from "@/components/admin/ResendInvites";
import { convertAllTeamEvents, convertTeamEvent } from "@/app/admin/actions";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabaseAdmin } from "@/lib/supabase-admin";

/** Pasākums, kurā ielogojusies piedalās — koši rozā, labi redzams */
const MINE_ROW = "bg-pink-200 ring-4 ring-pink-500 border-l-8 border-pink-600 shadow-md group-open:bg-pink-200 group-open:ring-4 group-open:ring-pink-600";

export const metadata = { title: "Kalendārs" };
// Poga "Nosūtīt ielūgumus vēlreiz" sūta daudz notikumu pēc kārtas — atļaujam ilgāku izpildes laiku
export const maxDuration = 60;

type Props = { searchParams: Promise<{ q?: string; google?: string }> };

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
export default async function CalendarPage({ searchParams }: Props) {
  const { db, role, email } = await requireSection("kalendars");
  const { q = "", google } = await searchParams;
  const owner = role === "owner";
  // Kristīne (vadība) — informēta par visu: redz jaunos, atceltos un komandas atbildes (bez labošanas)
  const seesAll = true; // visa komanda redz pilnīgi visu to pašu, ko administratore — tikai bez labošanas
  // Ielogojusies animatore (pēc e-pasta CALENDAR_HOSTS sarakstā) — viņas vadītās rezervācijas izceļ ar "Tu piedalies"
  const me = CALENDAR_HOSTS.find((h) => h.email === email.toLowerCase())?.name;
  const isMine = (b: Booking) => b.status !== "Atcelta" && (Boolean(me && hostsOf(b.message).split(/,\s*/).includes(me)) || Boolean(myRow(b)));
  // Google kalendāra savienojums ir administratorei; komandai to nolasa ar servera atslēgu (tikai skatīšanai)
  const googleDb = (owner ? db : supabaseAdmin()) as MemberContext["db"] | null;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });

  const [{ data, error }, { data: eventRows }, business, programs, settings] = await Promise.all([
    db.from("bookings").select("*").not("event_date", "is", null).order("event_date").order("event_time", { nullsFirst: true }),
    // Izbraukumi un pasākumi, kas ievadīti ar roku (tabula team_events) — visa komanda redz visus (lasa ar servera atslēgu)
    ((owner ? db : (supabaseAdmin() ?? db)) as typeof db).from("team_events").select("*").order("event_date"),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);

  // Administratorei: jaunie pieteikumi (arī bez datuma un uzņēmumu pieprasījumi), atceltie, meklēšana, Google savienojums
  const term = q.trim().replace(/[,()%*]/g, " ");
  const [pendingRes, cancelledRes, searchRes, googleConn] = seesAll
    ? await Promise.all([
        db.from("bookings").select("*").eq("status", "Jauns").order("created_at", { ascending: false }),
        db.from("bookings").select("*").eq("status", "Atcelta").order("event_date", { ascending: false, nullsFirst: false }).limit(100),
        term
          ? db.from("bookings").select("*").or(["parent_name", "company_name", "phone", "email"].map((c) => `${c}.ilike.%${term}%`).join(",")).order("event_date", { ascending: false, nullsFirst: false })
          : Promise.resolve({ data: null }),
        owner ? googleConnection(db) : Promise.resolve(null),
      ])
    : [{ data: null }, { data: null }, { data: null }, null];
  const pending = (pendingRes.data ?? []) as Booking[];
  const cancelled = (cancelledRes.data ?? []) as Booking[];
  const found = (searchRes.data ?? null) as Booking[] | null;
  const ctx: BookingAdminContext = { programs, settings, googleConnected: Boolean(googleConn) };

  // Kas piedalās un ko atbildēja (ja tabulas vēl nav — tukšs; tad rāda vārdus no "Vada:" rindas)
  const { data: staffData } = await db.from("booking_staff").select("booking_id, email, name, status, responded_at");
  const staffBy = new Map<string, StaffRow[]>();
  for (const r of (staffData ?? []) as StaffRow[]) staffBy.set(r.booking_id, [...(staffBy.get(r.booking_id) ?? []), r]);
  const myEmail = email.toLowerCase();
  const myRow = (b: Booking) => (staffBy.get(b.id) ?? []).find((r) => r.email.toLowerCase() === myEmail);

  const prices = bookingPrices(settings);
  const costsOf = (b: Booking) =>
    b.inquiry_type === "business"
      ? parseCostOverride(b.message)?.length
        ? bookingCosts(b, undefined, prices)
        : null
      : bookingCosts(b, programs.find((p) => p.slug === (b.program || b.service_slug)), prices);
  const titles = new Map([...business, ...programs].map((s) => [s.slug, s.title]));
  const programTitle = (b: Booking) => {
    const slug = b.service_slug || b.program;
    return slug ? (titles.get(slug) ?? slug) : null;
  };
  const label = (b: Booking) => {
    const slug = b.service_slug || b.program;
    const program = slug ? (titles.get(slug) ?? slug) : null;
    if (program) return isVenue(b) ? `Telpu noma + ${program}` : program;
    return isVenue(b) ? "Telpu noma" : b.inquiry_type === "business" ? "Pasākums" : "—";
  };

  // Skatītājiem (piem. telpu uzkopšanai) — tikai rezervācijas mūsu telpās
  // Arī atceltās: paliek pie sava datuma (ar lielu "ATCELTA"), pēc datuma — arhīvā
  const all = (data ?? []) as Booking[];
  const active = all.filter((b) => b.status !== "Atcelta");
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
              "border-l-4 border-purple-400",
              "group-open:bg-brand-soft group-open:ring-2 group-open:ring-ink",
              mine && MINE_ROW,
            )}
          >
            <span className="text-sm font-semibold">{e.time || "—"}</span>
            <span className="min-w-0 text-sm">
              <span className="block truncate">
                {mine && (
                  <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-pink-600 px-3 py-1 align-middle text-xs font-extrabold tracking-wide text-white uppercase shadow">
                    <Star className="size-3 fill-current" aria-hidden /> Tu piedalies
                  </span>
                )}
                <b>{e.title}</b>
                {e.place && ` · ${e.place}`}
              </span>
              {e.team && <span className="mt-0.5 block truncate text-xs text-ink-soft">Piedalās: {e.team}</span>}
            </span>
            <span />
            <ChevronDown className="hidden size-4 text-ink-soft transition-transform group-open:rotate-180 sm:block" aria-hidden />
          </summary>
          <div className="mt-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-line sm:p-5">
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[110px_1fr]">
              <dt className="text-ink-soft">Laiks</dt>
              <dd className="font-semibold">{e.time || "—"}</dd>
              <dt className="text-ink-soft">Vieta</dt>
              <dd className="font-semibold">{e.place || "—"}</dd>
              <dt className="text-ink-soft">Piedalās</dt>
              <dd className="font-semibold">{e.team || "—"}</dd>
            </dl>
            {e.details && <p className="mt-3 rounded-xl bg-surface p-3 whitespace-pre-line">{e.details}</p>}
            {role === "owner" && (
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <a href={`/admin/grafiks/${e.id}`} className="font-semibold underline decoration-brand decoration-2 underline-offset-4">
                  Labot
                </a>
                <form action={convertTeamEvent.bind(null, e.id)}>
                  <button type="submit" className={adminSecondary}>
                    Pievienot meitenes (pārvērst par rezervāciju)
                  </button>
                </form>
              </div>
            )}
          </div>
        </details>
      </li>
    );
  };

  /** Viena rezervācija sarakstā; uzspiežot atveras — administratorei pārvaldība, komandai tikai skatīšana */
  const bookingRow = (b: Booking, showDate = false) => {

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
                  isMine(b) && MINE_ROW,
                  b.status === "Atcelta" && "bg-red-50 ring-2 ring-red-300 border-l-4 border-red-500 group-open:bg-red-50 group-open:ring-red-400",
                )}
              >
                <span className={cn("text-sm font-semibold", b.status === "Atcelta" && "text-red-700 line-through")}>
                  {showDate && (b.event_date ? `${b.event_date.slice(8, 10)}.${b.event_date.slice(5, 7)}. ` : "bez datuma ")}
                  {timeLabel(b.event_time, b.location) || (showDate ? "" : "—")}
                </span>
                <span className="min-w-0 text-sm">
                  <span className={cn("block truncate", b.status === "Atcelta" && "text-ink-soft")}>
                    {b.status === "Atcelta" && (
                      <span className="mr-2 inline-flex items-center rounded-md bg-red-600 px-2.5 py-1 align-middle text-xs font-extrabold tracking-widest text-white uppercase">
                        ✕ Atcelta
                      </span>
                    )}
                    {isMine(b) && (
                      <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-pink-600 px-3 py-1 align-middle text-xs font-extrabold tracking-wide text-white uppercase shadow">
                        <Star className="size-3 fill-current" aria-hidden /> Tu piedalies
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
                  {b.status === "Atcelta" && (
                    <span className="mt-0.5 block truncate text-xs font-semibold text-red-700">
                      {b.client_cancelled_at ? "Atcēla klients" : "Atcelta"}
                      {b.cancel_reason ? ` · Iemesls: ${b.cancel_reason}` : owner ? " · iemesls nav norādīts" : ""}
                    </span>
                  )}
                  {/* Programma (telpu nomai) un kas piedalās — visiem pasākumiem ar izklaides programmu vai pakalpojumu */}
                  {(() => {
                    const program = isVenue(b) ? programTitle(b) : null;
                    const hosts = hostsOf(b.message);
                    const hasProgram = Boolean(programTitle(b));
                    return (
                      (program || hosts || hasProgram) && (
                        <span className="mt-0.5 block truncate text-xs text-ink-soft">
                          {program && `Izklaides programma: ${program}`}
                          {program && (hosts || hasProgram) && " · "}
                          {(staffBy.get(b.id) ?? []).length ? (
                            <>
                              Piedalās:{" "}
                              {(staffBy.get(b.id) ?? []).map((r, i) => (
                                <span key={r.email}>
                                  {i > 0 && ", "}
                                  <b className={r.status === "nevar" ? "text-red-700" : r.status === "var" ? "text-emerald-700" : "text-ink"}>
                                    {r.name}
                                    {r.status === "var" ? " ✓" : r.status === "nevar" ? " ✗ nevar" : " ?"}
                                  </b>
                                </span>
                              ))}
                            </>
                          ) : hosts ? (
                            <>Piedalās: <b className="text-ink">{hosts}</b></>
                          ) : (
                            hasProgram && <span className={owner ? "font-semibold text-destructive" : ""}>Piedalās: vēl nav norādīts</span>
                          )}
                        </span>
                      )
                    );
                  })()}
                </span>
                <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1", st.tone)}>{st.label}</span>
                <ChevronDown className="hidden size-4 text-ink-soft transition-transform group-open:rotate-180 sm:block" aria-hidden />
              </summary>
              {owner ? (
                <BookingAdminPanel b={b} labelText={label(b)} costs={c} ctx={ctx} staff={staffBy.get(b.id) ?? []} />
              ) : (
                <>
                  {myRow(b) && (
                    <div className="mt-2 rounded-2xl bg-white p-4 ring-1 ring-line">
                      <StaffAnswer bookingId={b.id} status={myRow(b)!.status} />
                    </div>
                  )}
                  <ul className="mt-2">
                    <BookingCard b={b} label={label(b)} costs={c} />
                  </ul>
                </>
              )}
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
          ...items.map((b) => ({ min: minuteOf(b.event_time), node: bookingRow(b) })),
          ...dayEvents.map((e) => ({ min: minuteOf(e.time), node: eventRow(e) })),
        ]
          .sort((x, y) => x.min - y.min)
          .map((x) => x.node)}
      </ul>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Kalendārs"
        description={owner ? "Visi pieteikumi un pasākumi vienuviet. Uzspiežot uz pasākuma — apstiprināšana, kas piedalās, labošana." : undefined}
      />

      {seesAll && (
        <>
          {owner && <GoogleCalendarCard db={db} message={google} />}
          <form className="mt-6 flex flex-wrap gap-2" action="/admin/kalendars">
            <label className="relative min-w-60 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input name="q" defaultValue={q} placeholder="Meklēt vārdu, uzņēmumu, telefonu…" className={`${adminInput} pl-9`} />
            </label>
            <button className={adminSecondary}>Meklēt</button>
          </form>
          {found && (
            <section className="mt-6">
              <h2 className="text-base font-extrabold">Atrasts: {found.length}</h2>
              <ul className="mt-2 space-y-2">{found.map((b) => bookingRow(b, true))}</ul>
            </section>
          )}
          {owner && !q && (
            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <Link href="/admin/kalendars/jauns" className={adminPrimary}>
                <Plus className="size-4" aria-hidden /> Pievienot rezervāciju
              </Link>
              <ResendInvites />
            </div>
          )}
          {owner && !q && events.length > 0 && (
            <form action={convertAllTeamEvents} className="mt-4 rounded-2xl bg-purple-50 p-4 ring-1 ring-purple-200">
              <p className="text-sm text-purple-900">
                <b>{events.length} izbraukumi</b> ievadīti ar roku (bijušais komandas grafiks) — tos nevar labot tāpat kā rezervācijas.
                Pārvērtiet tos par rezervācijām: tad visiem pasākumiem var mainīt datumu, laiku, informāciju un pievienot meitenes (Varu/Nevaru, atgādinājumi, Google).
              </p>
              <button type="submit" className={`${adminPrimary} mt-3`}>
                Pārvērst visus par rezervācijām
              </button>
            </form>
          )}
          {/* Komandas atbildes: kāda nevar — jāmeklē cits; visas var — jāapstiprina klientam */}
          {!q && (() => {
            const today_ = today;
            const list = [...active, ...pending].filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);
            const declined = list.filter((b) => (b.event_date ?? "9999") >= today_ && (staffBy.get(b.id) ?? []).some((r) => r.status === "nevar"));
            const ready = list.filter((b) => b.status === "Jauns" && (staffBy.get(b.id) ?? []).length > 0 && (staffBy.get(b.id) ?? []).every((r) => r.status === "var"));
            return (
              <>
                {declined.length > 0 && (
                  <section className="mt-6 rounded-2xl bg-red-50 p-4 ring-2 ring-red-300 sm:p-5">
                    <h2 className="text-base font-extrabold text-red-700">Jāmeklē aizvietotājs ({declined.length})</h2>
                    <p className="text-sm text-red-700">{owner ? "Kāda no komandas nevar piedalīties — atveriet pasākumu un sadaļā “Kas piedalās” atzīmējiet citu." : "Kāda no komandas nevar piedalīties — Vanesa meklē aizvietotāju."}</p>
                    <ul className="mt-3 space-y-2">{declined.map((b) => bookingRow(b, true))}</ul>
                  </section>
                )}
                {ready.length > 0 && (
                  <section className="mt-6 rounded-2xl bg-emerald-50 p-4 ring-2 ring-emerald-300 sm:p-5">
                    <h2 className="text-base font-extrabold text-emerald-800">Komanda gatava — jāapstiprina klientam ({ready.length})</h2>
                    <p className="text-sm text-emerald-800">{owner ? "Visas atbildēja “Varu”. Atveriet pasākumu un nospiediet “Apstiprināt un nosūtīt klientam”." : "Visas atbildēja “Varu” — Vanesa apstiprinās klientam."}</p>
                    <ul className="mt-3 space-y-2">{ready.map((b) => bookingRow(b, true))}</ul>
                  </section>
                )}
              </>
            );
          })()}
          {!q && pending.length > 0 && (owner || role === "manager") && (
            <section className="mt-6 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 sm:p-5">
              <h2 className="text-base font-extrabold">Gaida apstiprinājumu ({pending.length})</h2>
              <p className="text-sm text-ink-soft">{owner ? "Atveriet pieteikumu, sadaļā “Kas piedalās” atzīmējiet komandu un nospiediet “Jautāt komandai” — klientam apstiprinājumu sūta, kad komanda atbildējusi." : "Jaunie pieteikumi — tos apstiprina Vanesa."}</p>
              <ul className="mt-3 space-y-2">{pending.map((b) => bookingRow(b, true))}</ul>
            </section>
          )}
        </>
      )}

      {/* Komandas loceklim: pasākumi, uz kuriem jāatbild "Varu" / "Nevaru" */}
      {!owner && (() => {
        const mine = active.filter((b) => myRow(b)?.status === "gaida" && b.event_date!.slice(0, 10) >= today);
        return (
          mine.length > 0 && (
            <section className="mt-6 rounded-2xl bg-amber-50 p-4 ring-2 ring-amber-300 sm:p-5">
              <h2 className="text-base font-extrabold">Gaida tavu atbildi ({mine.length})</h2>
              <ul className="mt-3 space-y-3">
                {mine.map((b) => (
                  <li key={b.id} className="rounded-xl bg-white p-3 ring-1 ring-line">
                    <p className="text-sm font-bold">
                      {dayTitle(b.event_date!.slice(0, 10))} · {timeLabel(b.event_time, b.location) || "—"} · {label(b)}
                    </p>
                    <div className="mt-2">
                      <StaffAnswer bookingId={b.id} status="gaida" />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        );
      })()}

      {error && <p className="mt-4 text-sm font-semibold text-destructive">Neizdevās ielādēt rezervācijas: {error.message}</p>}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border-l-4 border-brand-strong bg-white ring-1 ring-line" /> Telpu noma</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm border-l-4 border-purple-400 bg-white ring-1 ring-line" /> Izbraukuma ballīte</span>
      </div>

      <section className="mt-6 space-y-6">
        {upcomingDays.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Gaidāmu rezervāciju nav.</p>}
        {upcomingDays.map((day) => renderDay(day, upcoming.get(day) ?? [], eventsByDay.get(day)))}
      </section>

      {/* Google kalendāra notikumi, kas nav no mājaslapas (piem. Kristīnes) — tikai administratorei; ielādējas atsevišķi, lai lapa nav jāgaida */}
      {seesAll && googleDb && (
        <Suspense fallback={<p className="mt-8 text-sm text-ink-soft">Ielādē Google kalendāru…</p>}>
          <GoogleEvents db={googleDb} from={today} to={addDays(today, 120)} dayTitle={dayTitle} />
        </Suspense>
      )}

      {seesAll && cancelled.filter((b) => !b.event_date).length > 0 && (
        <details className="mt-10 rounded-2xl bg-surface/60 p-4 ring-1 ring-line sm:p-5">
          <summary className="cursor-pointer text-sm font-extrabold text-ink-soft hover:text-ink">Atceltie pieteikumi bez datuma ({cancelled.filter((b) => !b.event_date).length})</summary>
          <ul className="mt-4 space-y-2 opacity-80">{cancelled.filter((b) => !b.event_date).map((b) => bookingRow(b, true))}</ul>
        </details>
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
