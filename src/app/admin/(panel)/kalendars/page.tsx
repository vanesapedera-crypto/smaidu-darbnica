import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { requireSection } from "@/lib/auth";
import type { Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur } from "@/lib/pricing";
import { timeLabel } from "@/lib/dates";
import { listGoogleEvents, type GoogleEvent } from "@/lib/google-calendar";
import BookingCard, { isTrip, isVenue, matches, stateOf, type Filter } from "@/components/admin/team/BookingCard";
import PageHeader from "@/components/admin/PageHeader";
import { adminSecondary } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Kalendārs" };

const MONTHS = ["Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs", "Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"];
const WEEKDAYS = ["P", "O", "T", "C", "Pk", "S", "Sv"];
const WEEKDAY_NAMES = ["svētdiena", "pirmdiena", "otrdiena", "trešdiena", "ceturtdiena", "piektdiena", "sestdiena"];

const FILTERS: { value: Filter; label: string }[] = [
  { value: "visi", label: "Viss" },
  { value: "telpas", label: "Telpu noma" },
  { value: "izbraukumi", label: "Izbraukumi un citas vietas" },
  { value: "uznemumi", label: "Uzņēmumi" },
];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

type Props = { searchParams: Promise<{ m?: string; f?: string; atceltie?: string; r?: string; d?: string; v?: string }> };
/** Skats: saraksts (tikai dienas, kurās kaut kas ir, viena zem otras — no šodienas uz priekšu) vai mēneša režģis */
type View = "saraksts" | "menesis";

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

/**
 * Rezervāciju kalendārs visai komandai — tikai skatīšanai.
 * Rāda to pašu, ko pieteikumu sarakstā: statusu un vai klients ir apstiprinājis.
 * Labot var tikai administratore sadaļā "Pieteikumi" (to nosaka arī datubāzes RLS).
 */
export default async function CalendarPage({ searchParams }: Props) {
  const { db, role } = await requireSection("kalendars");
  const sp = await searchParams;

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
  const match = /^(\d{4})-(\d{2})$/.exec(sp.m ?? "");
  const year = match ? Number(match[1]) : Number(today.slice(0, 4));
  const month = match ? Math.min(11, Math.max(0, Number(match[2]) - 1)) : Number(today.slice(5, 7)) - 1;
  const filter: Filter = FILTERS.some((f) => f.value === sp.f) ? (sp.f as Filter) : role === "viewer" ? "telpas" : "visi";
  const showCancelled = sp.atceltie === "1";
  const view: View = sp.v === "menesis" ? "menesis" : "saraksts";

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  // Sarakstā — no šodienas gadu uz priekšu
  const start = view === "saraksts" ? today : iso(year, month, 1);
  const end = view === "saraksts" ? addDays(today, 365) : iso(year, month, daysInMonth);
  const prev = month === 0 ? `${year - 1}-12` : `${year}-${pad(month)}`;
  const next = month === 11 ? `${year + 1}-01` : `${year}-${pad(month + 2)}`;
  // r — atvērtā rezervācija, d — atvērtā diena (rāda tikai to)
  const href = (o: { m?: string; f?: Filter; atceltie?: boolean; r?: string; d?: string; v?: View }) => {
    const p = new URLSearchParams();
    if ((o.v ?? view) === "menesis") {
      p.set("v", "menesis");
      p.set("m", o.m ?? `${year}-${pad(month + 1)}`);
    }
    p.set("f", o.f ?? filter);
    if (o.atceltie ?? showCancelled) p.set("atceltie", "1");
    if (o.r) p.set("r", o.r);
    if (o.d) p.set("d", o.d);
    return `/admin/kalendars?${p}${o.r || o.d ? "#izvele" : ""}`;
  };

  const [{ data, error }, business, programs, settings] = await Promise.all([
    db.from("bookings").select("*").gte("event_date", start).lte("event_date", end).order("event_date").order("event_time", { nullsFirst: true }),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);
  // Google kalendāra notikumi (arī tie, kuros ielūdza Kristīne) — redz tikai administratore, jo tas ir personīgais kalendārs
  const google: GoogleEvent[] | null = role === "owner" && filter === "visi" ? await listGoogleEvents(db, start, end) : null;
  const googleByDay = new Map<string, GoogleEvent[]>();
  for (const g of google ?? []) googleByDay.set(g.date, [...(googleByDay.get(g.date) ?? []), g]);
  // Izmaksas — tas pats aprēķins, ko klients redz formā un apstiprinājuma e-pastā
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

  const bookings = ((data ?? []) as Booking[]).filter((b) => matches(b, filter) && (showCancelled || b.status !== "Atcelta"));
  const byDay = new Map<string, Booking[]>();
  for (const b of bookings) {
    const day = b.event_date!.slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), b]);
  }

  // Atvērtā rezervācija (r) vai diena (d)
  const selected = sp.r ? bookings.filter((b) => b.id === sp.r) : sp.d ? (byDay.get(sp.d) ?? []) : [];
  const selectedGoogle = !sp.r && sp.d ? (googleByDay.get(sp.d) ?? []) : [];
  const dayTitle = (day: string) => {
    const d = new Date(`${day}T12:00:00Z`);
    return `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()].toLowerCase()}, ${WEEKDAY_NAMES[d.getUTCDay()]}`;
  };

  // Mēneša režģis no pirmdienas
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <>
      <PageHeader
        title="Kalendārs"
        description={
          role === "owner"
            ? "Šo skatu redz arī komanda (bez labošanas iespējām). Labot — sadaļā “Pieteikumi”."
            : "Visas rezervācijas un to stāvoklis. Šeit var tikai skatīties — izmaiņas veic Vanesa."
        }
      />
      {role !== "owner" && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
          <Eye className="size-3.5" aria-hidden /> Tikai skatīšanai
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Skats: saraksts vai mēnesis */}
          <span className="mr-2 inline-flex rounded-full bg-white p-0.5 ring-1 ring-line">
            {(
              [
                ["saraksts", "Saraksts"],
                ["menesis", "Mēnesis"],
              ] as const
            ).map(([v, l]) => (
              <Link
                key={v}
                href={href({ v })}
                aria-current={view === v ? "page" : undefined}
                className={cn("rounded-full px-3 py-1 text-sm font-semibold", view === v ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}
              >
                {l}
              </Link>
            ))}
          </span>
          {view === "menesis" && (
          <>
          <Link href={href({ m: prev })} className={adminSecondary} aria-label="Iepriekšējais mēnesis">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <h2 className="min-w-44 text-center text-lg font-extrabold">
            {MONTHS[month]} {year}
          </h2>
          <Link href={href({ m: next })} className={adminSecondary} aria-label="Nākamais mēnesis">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
          <Link href={href({ m: today.slice(0, 7) })} className="ml-1 text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
            Šodien
          </Link>
          </>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={href({ f: f.value })}
              aria-current={f.value === filter ? "page" : undefined}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold ring-1",
                f.value === filter ? "bg-ink text-white ring-ink" : "bg-white text-ink-soft ring-line hover:text-ink",
              )}
            >
              {f.label}
            </Link>
          ))}
          <Link href={href({ atceltie: !showCancelled })} className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink-soft ring-1 ring-line hover:text-ink">
            {showCancelled ? "Slēpt atceltās" : "Rādīt atceltās"}
          </Link>
        </div>
      </div>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">Neizdevās ielādēt rezervācijas: {error.message}</p>}

      {/* Mēneša režģis */}
      {view === "menesis" && (
      <div className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="grid grid-cols-7 border-b border-line bg-surface text-center text-xs font-bold text-ink-soft">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const day = d ? iso(year, month, d) : "";
            const items = d ? (byDay.get(day) ?? []) : [];
            const gItems = d ? (googleByDay.get(day) ?? []) : [];
            return (
              <div key={i} className={cn("min-h-16 border-b border-r border-line p-1 text-xs sm:min-h-24 sm:p-1.5", (i + 1) % 7 === 0 && "border-r-0", !d && "bg-surface/50")}>
                {d && (
                  <>
                    <Link
                      href={items.length || gItems.length ? href({ d: day }) : "#"}
                      aria-disabled={!(items.length || gItems.length) || undefined}
                      className={cn("block", !(items.length || gItems.length) && "pointer-events-none")}
                    >
                      <span className={cn("inline-grid size-6 place-items-center rounded-full font-bold", day === today && "bg-brand text-ink", day === sp.d && "ring-2 ring-ink")}>
                        {d}
                      </span>
                      {/* Telefonā — punkti (uzspiežot atveras diena) */}
                      <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                        {items.map((b) => (
                          <span key={b.id} className={cn("size-2 rounded-full", stateOf(b).dot, isTrip(b) && "ring-2 ring-purple-500 ring-offset-1")} />
                        ))}
                        {gItems.map((g) => (
                          <span key={g.id} className="size-2 rounded-full bg-ink/40" />
                        ))}
                      </span>
                    </Link>
                    {/* Lielākā ekrānā — katra rezervācija atsevišķi; uzspiežot atveras tikai tā */}
                    <span className="mt-1 hidden space-y-1 sm:block">
                      {items.slice(0, 3).map((b) => (
                        <Link
                          key={b.id}
                          href={href({ r: b.id })}
                          className={cn(
                            "flex items-center gap-1 truncate rounded px-1.5 py-0.5 font-semibold ring-1 hover:ring-2",
                            // Izbraukuma ballītes — lillā; statusu rāda punktiņš
                            isTrip(b) ? "bg-purple-100 text-purple-900 ring-purple-300" : stateOf(b).tone,
                            b.id === sp.r && "ring-2 ring-ink",
                          )}
                        >
                          {isTrip(b) && <span className={cn("size-1.5 shrink-0 rounded-full", stateOf(b).dot)} />}
                          <span className="truncate">
                            {(b.event_time ?? "").slice(0, 5)} {b.company_name || b.parent_name || label(b)}
                          </span>
                        </Link>
                      ))}
                      {gItems.slice(0, Math.max(0, 3 - Math.min(items.length, 3))).map((g) => (
                        <Link key={g.id} href={href({ d: day })} className="flex items-center gap-1 truncate rounded bg-surface px-1.5 py-0.5 font-semibold text-ink-soft ring-1 ring-line hover:ring-2">
                          <span className="truncate">
                            {g.time} {g.title}
                          </span>
                        </Link>
                      ))}
                      {items.length + gItems.length > 3 && (
                        <Link href={href({ d: day })} className="block px-1 text-ink-soft hover:text-ink">
                          +{items.length + gItems.length - 3}
                        </Link>
                      )}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      )}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-500" /> Jauns, vēl nav apstiprināts</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-strong" /> Gaida klienta apstiprinājumu</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Klients nav apstiprinājis 3+ dienas</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Apstiprināta</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-purple-100 ring-1 ring-purple-300" /> Izbraukuma ballīte</span>
      </div>

      {/* Atvērtā rezervācija vai diena — tikai tā */}
      {(selected.length > 0 || selectedGoogle.length > 0) && (
        <section id="izvele" className="mt-8 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold">{dayTitle(selected[0]?.event_date?.slice(0, 10) ?? sp.d!)}</h3>
            <Link href={href({})} className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
              <X className="size-4" aria-hidden /> Aizvērt
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {selected.map((b) => (
              <BookingCard key={b.id} b={b} label={label(b)} costs={costsOf(b)} />
            ))}
            {selectedGoogle.map((g) => (
              <GoogleCard key={g.id} g={g} />
            ))}
          </ul>
        </section>
      )}

      {/* Visa mēneša saraksts — īsi; uzspiežot atveras tikai attiecīgā rezervācija */}
      <section className="mt-8 space-y-5">
        {byDay.size === 0 && googleByDay.size === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">{view === "saraksts" ? "Gaidāmu rezervāciju nav." : "Šajā mēnesī rezervāciju nav."}</p>}
        {[...new Set([...byDay.keys(), ...googleByDay.keys()])].sort().map((day) => [day, byDay.get(day) ?? []] as const).map(([day, items]) => (
          <div key={day}>
            <h3 className="text-sm font-extrabold">{dayTitle(day)}</h3>
            <ul className="mt-2 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              {items.map((b) => {
                const st = stateOf(b);
                const c = costsOf(b);
                return (
                  <li key={b.id}>
                    <Link
                      href={href({ r: b.id })}
                      className={cn(
                        "grid items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)_auto]",
                        isTrip(b) && "border-l-4 border-purple-400",
                        b.id === sp.r && "bg-brand-soft",
                      )}
                    >
                      <span className="text-sm font-semibold">{timeLabel(b.event_time, b.location) || "—"}</span>
                      <span className="min-w-0 truncate text-sm">
                        <b>{label(b)}</b> · {b.company_name || b.parent_name || "—"}
                        {c?.exact && <span className="text-ink-soft"> · {eur(c.total)}{c.plusVat ? " + PVN" : ""}</span>}
                      </span>
                      <span className={cn("w-fit rounded-full px-2.5 py-1 text-xs font-bold ring-1", st.tone)}>{st.label}</span>
                    </Link>
                  </li>
                );
              })}
              {(googleByDay.get(day) ?? []).map((g) => (
                <li key={g.id}>
                  <Link
                    href={href({ d: day })}
                    className="grid items-center gap-x-4 gap-y-1 px-4 py-3 text-ink-soft hover:bg-surface/60 sm:grid-cols-[110px_minmax(0,1fr)_auto]"
                  >
                    <span className="text-sm font-semibold">{g.time ? `${g.time}${g.endTime ? `–${g.endTime}` : ""}` : "Visu dienu"}</span>
                    <span className="min-w-0 truncate text-sm">
                      <b className="text-ink">{g.title}</b>
                      {g.location && ` · ${g.location}`}
                    </span>
                    <span className="w-fit rounded-full bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-line">Google kalendārs</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      {role === "owner" && filter === "visi" && google === null && (
        <p className="mt-6 text-sm text-ink-soft">Google kalendārs nav savienots vai nav pieejams — tā notikumi šeit netiek rādīti.</p>
      )}
    </>
  );
}

/** Notikums no Google kalendāra (nav pieteikums mājaslapā) */
function GoogleCard({ g }: { g: GoogleEvent }) {
  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">
            {g.time ? `${g.time}${g.endTime ? `–${g.endTime}` : ""}` : "Visu dienu"} · {g.title}
          </p>
          <p className="text-sm text-ink-soft">{[g.location, g.organizer && `Organizators: ${g.organizer}`].filter(Boolean).join(" · ")}</p>
        </div>
        <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-bold ring-1 ring-line">Google kalendārs</span>
      </div>
      {g.description.trim() && <p className="mt-3 rounded-xl bg-surface p-3 text-sm whitespace-pre-line">{g.description.trim()}</p>}
      {g.link && (
        <a href={g.link} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4">
          Atvērt Google kalendārā
        </a>
      )}
    </li>
  );
}
