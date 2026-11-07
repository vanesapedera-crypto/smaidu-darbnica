import Link from "next/link";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { requireMember } from "@/lib/auth";
import type { Booking } from "@/lib/bookings";
import { getServices } from "@/lib/content/queries";
import BookingCard, { isVenue, matches, stateOf, type Filter } from "@/components/admin/team/BookingCard";
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

type Props = { searchParams: Promise<{ m?: string; f?: string; atceltie?: string }> };

/**
 * Rezervāciju kalendārs visai komandai — tikai skatīšanai.
 * Rāda to pašu, ko pieteikumu sarakstā: statusu un vai klients ir apstiprinājis.
 * Labot var tikai administratore sadaļā "Pieteikumi" (to nosaka arī datubāzes RLS).
 */
export default async function CalendarPage({ searchParams }: Props) {
  const { db, role } = await requireMember();
  const sp = await searchParams;

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
  const match = /^(\d{4})-(\d{2})$/.exec(sp.m ?? "");
  const year = match ? Number(match[1]) : Number(today.slice(0, 4));
  const month = match ? Math.min(11, Math.max(0, Number(match[2]) - 1)) : Number(today.slice(5, 7)) - 1;
  const filter: Filter = FILTERS.some((f) => f.value === sp.f) ? (sp.f as Filter) : role === "viewer" ? "telpas" : "visi";
  const showCancelled = sp.atceltie === "1";

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const start = iso(year, month, 1);
  const end = iso(year, month, daysInMonth);
  const prev = month === 0 ? `${year - 1}-12` : `${year}-${pad(month)}`;
  const next = month === 11 ? `${year + 1}-01` : `${year}-${pad(month + 2)}`;
  const href = (o: { m?: string; f?: Filter; atceltie?: boolean }) => {
    const p = new URLSearchParams();
    p.set("m", o.m ?? `${year}-${pad(month + 1)}`);
    p.set("f", o.f ?? filter);
    if (o.atceltie ?? showCancelled) p.set("atceltie", "1");
    return `/admin/kalendars?${p}`;
  };

  const [{ data, error }, business, programs] = await Promise.all([
    db.from("bookings").select("*").gte("event_date", start).lte("event_date", end).order("event_date").order("event_time", { nullsFirst: true }),
    getServices("business"),
    getServices("private"),
  ]);
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
        <div className="flex items-center gap-2">
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
            return (
              <div key={i} className={cn("min-h-16 border-b border-r border-line p-1 text-xs sm:min-h-24 sm:p-1.5", (i + 1) % 7 === 0 && "border-r-0", !d && "bg-surface/50")}>
                {d && (
                  <a href={items.length ? `#d-${day}` : undefined} className={cn("block h-full", !items.length && "pointer-events-none")}>
                    <span className={cn("inline-grid size-6 place-items-center rounded-full font-bold", day === today && "bg-brand text-ink")}>{d}</span>
                    {/* Telefonā — punkti, lielākā ekrānā — laiks un nosaukums */}
                    <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                      {items.map((b) => (
                        <span key={b.id} className={cn("size-2 rounded-full", stateOf(b).dot)} />
                      ))}
                    </span>
                    <span className="mt-1 hidden space-y-1 sm:block">
                      {items.slice(0, 3).map((b) => (
                        <span key={b.id} className={cn("block truncate rounded px-1.5 py-0.5 font-semibold ring-1", stateOf(b).tone)}>
                          {(b.event_time ?? "").slice(0, 5)} {b.company_name || b.parent_name || label(b)}
                        </span>
                      ))}
                      {items.length > 3 && <span className="block px-1 text-ink-soft">+{items.length - 3}</span>}
                    </span>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-sky-500" /> Jauns, vēl nav apstiprināts</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-brand-strong" /> Gaida klienta apstiprinājumu</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-red-500" /> Klients nav apstiprinājis 3+ dienas</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" /> Apstiprināta</span>
      </div>

      {/* Saraksts pa dienām */}
      <section className="mt-8 space-y-6">
        {byDay.size === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Šajā mēnesī rezervāciju nav.</p>}
        {[...byDay.entries()].map(([day, items]) => {
          const d = new Date(`${day}T12:00:00Z`);
          return (
            <div key={day} id={`d-${day}`} className="scroll-mt-6">
              <h3 className="text-sm font-extrabold">
                {d.getUTCDate()}. {MONTHS[d.getUTCMonth()].toLowerCase()}, {WEEKDAY_NAMES[d.getUTCDay()]}
              </h3>
              <ul className="mt-2 space-y-2">
                {items.map((b) => (
                  <BookingCard key={b.id} b={b} label={label(b)} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>
    </>
  );
}
