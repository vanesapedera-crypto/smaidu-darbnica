import Link from "next/link";
import { Building2, Search, User } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { BOOKING_STATUSES, type Booking } from "@/lib/bookings";
import { calendarEvent } from "@/lib/calendar";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur } from "@/lib/pricing";
import CalendarLink from "@/components/admin/CalendarLink";
import ClientConfirmation, { ConfirmationBadge } from "@/components/admin/ClientConfirmation";
import StatusSelect from "@/components/admin/StatusSelect";
import { adminInput, adminSecondary } from "@/components/admin/styles";
import { saveBookingNotes } from "../actions";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pieteikumi" };

type Props = { searchParams: Promise<{ tips?: string; statuss?: string; q?: string }> };

const TYPES = [
  { value: "", label: "Visi" },
  { value: "business", label: "Uzņēmumi" },
  { value: "private", label: "Privātpersonas" },
];

/**
 * Pieteikumu saraksts — paplašināta sākotnējā paneļa versija:
 * tā pati `bookings` tabula un statusa maiņa, plus filtri, meklēšana un detaļas.
 */
export default async function BookingsPage({ searchParams }: Props) {
  const { db } = await requireAdmin();
  const { tips = "", statuss = "", q = "" } = await searchParams;

  let query = db.from("bookings").select("*").order("event_date", { ascending: true, nullsFirst: false });
  if (tips === "business") query = query.eq("inquiry_type", "business");
  if (tips === "private") query = query.or("inquiry_type.eq.private,inquiry_type.is.null");
  if (BOOKING_STATUSES.includes(statuss as never)) query = query.eq("status", statuss);
  if (q.trim()) {
    // Meklē vārdā, uzņēmumā, telefonā un e-pastā (komati un iekavas tiek izņemti, lai nesabojātu filtru)
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(
      ["parent_name", "company_name", "phone", "email"].map((c) => `${c}.ilike.%${term}%`).join(","),
    );
  }

  const [{ data, error }, { data: serviceRows }, business, programs, settings] = await Promise.all([
    query,
    db.from("services").select("slug, title"),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);
  const prices = bookingPrices(settings);
  // Izmaksas ballītēm un telpu nomai — tas pats aprēķins, ko klients redz formā un saņem apstiprinājuma e-pastā
  const costsOf = (b: Booking) =>
    b.inquiry_type === "business" ? null : bookingCosts(b, programs.find((p) => p.slug === (b.program || b.service_slug)), prices);
  const bookings = (data ?? []) as Booking[];
  // Pakalpojuma slug → nosaukums (vecajos pieteikumos var būt arī brīvs teksts)
  // Ja pakalpojumi vēl nav datubāzē, nosaukumus ņem no lapas satura (lai panelī un kalendārā nav redzams slug)
  const serviceTitle = new Map<string, string>([
    ...[...business, ...programs].map((s) => [s.slug, s.title] as [string, string]),
    ...(serviceRows ?? []).map((s: { slug: string; title: string }) => [s.slug, s.title] as [string, string]),
  ]);
  const label = (slug: string | null) => (slug ? (serviceTitle.get(slug) ?? slug) : "—");

  const link = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ tips, statuss, q, ...params });
    for (const [k, v] of [...sp.entries()]) if (!v) sp.delete(k);
    return `/admin${sp.size ? `?${sp}` : ""}`;
  };

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">Pieteikumi</h1>
          <p className="mt-1 text-sm text-ink-soft">Uzņēmumu pieprasījumi un bērnu ballīšu rezervācijas no mājaslapas formām.</p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Link
              key={t.value}
              href={link({ tips: t.value })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                tips === t.value ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink",
              )}
            >
              {t.label}
            </Link>
          ))}
          <span className="mx-1 hidden w-px bg-line sm:block" />
          {["", ...BOOKING_STATUSES].map((s) => (
            <Link
              key={s || "all"}
              href={link({ statuss: s })}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold",
                statuss === s ? "bg-brand" : "bg-white ring-1 ring-line hover:ring-ink",
              )}
            >
              {s || "Visi statusi"}
            </Link>
          ))}
        </div>
        <form className="flex gap-2" action="/admin">
          {tips && <input type="hidden" name="tips" value={tips} />}
          {statuss && <input type="hidden" name="statuss" value={statuss} />}
          <input name="q" defaultValue={q} placeholder="Meklēt vārdu, uzņēmumu, telefonu…" className={cn(adminInput, "w-64")} />
          <button type="submit" className={adminSecondary} aria-label="Meklēt">
            <Search className="size-4" />
          </button>
        </form>
      </div>

      {error ? (
        <p className="mt-8 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          Kļūda, nolasot pieteikumus: {error.message}. Ja tas ir pirmais palaišanas reizes, pārliecinieties, ka datubāzes migrācija ir palaista.
        </p>
      ) : bookings.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-white p-10 text-center text-ink-soft ring-1 ring-line">Pieteikumu nav.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {bookings.map((b) => (
            <li key={b.id} className="relative rounded-2xl bg-white ring-1 ring-line">
              <details className="group">
                <summary className="cursor-pointer list-none p-4 pr-4 pb-16 sm:p-5 sm:pr-48 [&::-webkit-details-marker]:hidden">
                  <div className="grid gap-x-6 gap-y-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-lg",
                          b.inquiry_type === "business" ? "bg-ink text-brand" : "bg-brand-soft",
                        )}
                        title={b.inquiry_type === "business" ? "Uzņēmums" : "Privātpersona"}
                      >
                        {b.inquiry_type === "business" ? <Building2 className="size-4" /> : <User className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{b.company_name || b.parent_name || "—"}</p>
                        <p className="truncate text-sm text-ink-soft">
                          {b.company_name ? b.parent_name : b.phone}
                        </p>
                      </div>
                    </div>
                    <p className="truncate text-sm">
                      <span className="block text-ink-soft">Pakalpojums</span>
                      {label(b.service_slug || b.program)}
                    </p>
                    <p className="text-sm">
                      <span className="block text-ink-soft">Datums</span>
                      {b.event_date ? new Date(b.event_date).toLocaleDateString("lv-LV") : "—"} {b.event_time ?? ""}
                      {/* Vai klients ir apstiprinājis rezervāciju (redzams, neatverot pieteikumu) */}
                      <span className="block">
                        <ConfirmationBadge booking={b} />
                      </span>
                    </p>
                  </div>
                </summary>

                <div className="grid gap-6 border-t border-line p-4 sm:p-5 md:grid-cols-2">
                  <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                    {(
                      [
                        ["Kontaktpersona", b.parent_name],
                        ["Amats", b.contact_role],
                        ["Telefons", b.phone && <a href={`tel:${b.phone}`} className="font-semibold underline">{b.phone}</a>],
                        ["E-pasts", b.email && <a href={`mailto:${b.email}`} className="font-semibold underline">{b.email}</a>],
                        ["Uzņēmums", b.company_name],
                        ["Vieta", [b.location, b.event_city, b.address].filter(Boolean).join(", ")],
                        ["Ceļa izdevumi", b.travel_cost != null && `${b.travel_cost} € (${b.travel_km} km turp un atpakaļ)`],
                        ["Dalībnieki", b.participants],
                        ["Bērnu skaits", b.children_count],
                        ["Vecums", b.child_age],
                        ["Budžets", b.budget_range],
                        ["Saņemts", b.created_at && new Date(b.created_at).toLocaleString("lv-LV")],
                      ] as [string, React.ReactNode][]
                    )
                      .filter(([, v]) => v !== null && v !== undefined && v !== "")
                      .map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-ink-soft">{k}</dt>
                          <dd className="min-w-0 break-words">{v}</dd>
                        </div>
                      ))}
                  </dl>
                  <div className="space-y-4">
                    <ClientConfirmation booking={b} />
                    {b.message && (
                      <div>
                        <p className="text-sm text-ink-soft">Ziņojums</p>
                        <p className="mt-1 text-sm whitespace-pre-line">{b.message}</p>
                      </div>
                    )}
                    {(() => {
                      const costs = costsOf(b);
                      return (
                        costs && (
                          <div>
                            <p className="text-sm text-ink-soft">Izmaksas (tās pašas klients saņem apstiprinājuma e-pastā)</p>
                            <dl className="mt-1 space-y-1 text-sm">
                              {costs.lines.map((l) => (
                                <div key={l.label} className="flex justify-between gap-4">
                                  <dt>{l.label}</dt>
                                  <dd className="font-semibold whitespace-nowrap">
                                    {l.amount === null ? "pēc vienošanās" : eur(l.amount)}
                                  </dd>
                                </div>
                              ))}
                              {/* Kopsummu rāda tikai tad, ja visas cenas ir zināmas */}
                              {costs.exact && (
                                <div className="flex justify-between gap-4 border-t border-line pt-1">
                                  <dt className="font-extrabold">Kopā</dt>
                                  <dd className="font-extrabold whitespace-nowrap">{eur(costs.total)}</dd>
                                </div>
                              )}
                            </dl>
                          </div>
                        )
                      );
                    })()}
                    {/* Google kalendārs: aizpildīts notikums ar viesiem (tikai pieteikumiem ar datumu) */}
                    {(() => {
                      const event = calendarEvent(b, label(b.service_slug || b.program), costsOf(b));
                      return event && <CalendarLink event={event} withHost={b.inquiry_type !== "business"} />;
                    })()}
                    <form action={saveBookingNotes.bind(null, b.id)} className="space-y-2">
                      <label htmlFor={`notes-${b.id}`} className="text-sm text-ink-soft">
                        Iekšējās piezīmes
                      </label>
                      <textarea id={`notes-${b.id}`} name="admin_notes" defaultValue={b.admin_notes ?? ""} rows={3} className={adminInput} />
                      <button type="submit" className={adminSecondary}>
                        Saglabāt piezīmes
                      </button>
                    </form>
                  </div>
                </div>
              </details>
              {/* Statusa izvēle ārpus <summary>, lai klikšķis neatvērtu/neaizvērtu detaļas */}
              <div className="absolute bottom-4 left-4 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto">
                <StatusSelect
                  id={b.id}
                  status={b.status}
                  withHost={b.inquiry_type !== "business"}
                  guests={calendarEvent(b, label(b.service_slug || b.program))?.guests ?? null}
                  clientEmail={b.email}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
