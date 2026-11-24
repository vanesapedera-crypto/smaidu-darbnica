import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { atStudio, hostsOf, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import { getServices } from "@/lib/content/queries";
import { timeLabel } from "@/lib/dates";
import PageHeader from "@/components/admin/PageHeader";
import MigrationNotice from "@/components/admin/team/MigrationNotice";
import SubmitOnce from "@/components/admin/SubmitOnce";
import { adminInput, adminSecondary } from "@/components/admin/styles";
import { missingTable } from "@/lib/team/files";
import { savePayRates, savePayroll } from "@/app/admin/payroll-actions";

export const metadata = { title: "Algas" };

const MONTHS = ["janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs", "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris"];
const eur = (n: number) => `${n.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const val = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

type PayRow = { booking_id: string; person: string; name: string; pay: number | null; travel: number | null };
type Rate = { key: string; title: string; amount: number | null };
type Staff = { booking_id: string; email: string; name: string; status: string };

/**
 * Algas pa mēnešiem (tikai administratore un Kristīne): katrs apstiprinātais pasākums, kas tajā piedalījās,
 * alga (no standarta cenas vai ar roku) un ceļa izdevumi (no rezervācijas, sadalīti uz visiem — var labot).
 * Augšā — kopsavilkums pa cilvēkiem.
 */
export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { db } = await requireSection("kalendars", true);
  const { m } = await searchParams;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const first = new Date(`${month}-01T12:00:00Z`);
  const shift = (n: number) => {
    const d = new Date(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.toISOString().slice(0, 7);
  };
  const end = `${shift(1)}-01`;

  const [{ data: bData }, payRes, rateRes, { data: staffData }, privateS, businessS] = await Promise.all([
    db.from("bookings").select("*").eq("status", "Apstiprināta").gte("event_date", `${month}-01`).lt("event_date", end).order("event_date").order("event_time"),
    db.from("payroll").select("booking_id, person, name, pay, travel"),
    db.from("pay_rates").select("key, title, amount"),
    db.from("booking_staff").select("booking_id, email, name, status"),
    getServices("private"),
    getServices("business"),
  ]);
  if (missingTable(payRes.error) || missingTable(rateRes.error)) return <MigrationNotice title="Algas" file="20261124090000_payroll.sql" />;

  const bookings = (bData ?? []) as Booking[];
  const saved = (payRes.data ?? []) as PayRow[];
  const rates = new Map(((rateRes.data ?? []) as Rate[]).map((r) => [r.key, r]));
  const staff = (staffData ?? []) as Staff[];
  const titles = new Map([...privateS, ...businessS].map((s) => [s.slug, s.title]));

  // Standarta cenu saraksts: visas izklaides programmas + telpu noma + uzņēmumu pasākums + pārējie
  const rateKeys: { key: string; title: string }[] = [
    ...privateS.map((s) => ({ key: s.slug, title: s.title })),
    { key: "telpu-noma", title: "Telpu noma (bez programmas)" },
    { key: "uznemums", title: "Uzņēmumu / iestāžu pasākums" },
    { key: "default", title: "Pārējie pasākumi" },
  ];
  const rateFor = (b: Booking) => {
    const slug = b.program || b.service_slug || "";
    const r = (slug && rates.get(slug)) || (b.inquiry_type === "business" ? rates.get("uznemums") : atStudio(b.location) ? rates.get("telpu-noma") : undefined) || rates.get("default");
    return r?.amount ?? null;
  };

  // Katram pasākumam — dalībnieki ar algu un ceļa izdevumiem (saglabātais vai noklusējums)
  const events = bookings.map((b) => {
    const mine = staff.filter((s) => s.booking_id === b.id && s.status !== "nevar");
    let people: { person: string; name: string }[] = mine.map((s) => ({ person: s.email.toLowerCase(), name: s.name }));
    if (!people.length) {
      const names = hostsOf(b.message).split(/,\s*/).filter(Boolean);
      people = CALENDAR_HOSTS.filter((h) => names.includes(h.name)).map((h) => ({ person: h.email, name: h.name }));
    }
    const extras = saved.filter((r) => r.booking_id === b.id && r.person.startsWith("x:")).map((r) => ({ person: r.person, name: r.name }));
    people = [...people, ...extras.filter((x) => !people.some((p) => p.person === x.person))];
    const defPay = rateFor(b);
    const defTravel = b.travel_cost && people.length ? Math.round((Number(b.travel_cost) / people.length) * 100) / 100 : null;
    const rows = people.map((p) => {
      const s = saved.find((r) => r.booking_id === b.id && r.person === p.person);
      return { ...p, pay: s ? s.pay : defPay, travel: s ? s.travel : defTravel, savedRow: Boolean(s) };
    });
    const slug = b.program || b.service_slug || "";
    const title = b.inquiry_type === "business" ? b.company_name || titles.get(slug) || "Pasākums" : [atStudio(b.location) && "Telpu noma", titles.get(slug)].filter(Boolean).join(" + ") || "Pasākums";
    const who = b.inquiry_type === "business" ? "" : b.parent_name || "";
    return { b, title, who, rows };
  });

  // Kopsavilkums pa cilvēkiem
  const totals = new Map<string, { name: string; events: number; pay: number; travel: number }>();
  for (const e of events)
    for (const r of e.rows) {
      const t = totals.get(r.name) ?? { name: r.name, events: 0, pay: 0, travel: 0 };
      t.events += 1;
      t.pay += Number(r.pay ?? 0);
      t.travel += Number(r.travel ?? 0);
      totals.set(r.name, t);
    }
  const summary = [...totals.values()].sort((a, b) => b.pay + b.travel - (a.pay + a.travel));
  const sum = summary.reduce((s, t) => s + t.pay + t.travel, 0);
  const missing = events.reduce((n, e) => n + e.rows.filter((r) => r.pay === null).length, 0);

  return (
    <>
      <PageHeader title="Algas" description="Pasākumi pa mēnešiem: kas piedalījās, alga un ceļa izdevumi. Redz tikai administratore un Kristīne." />

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link href={`/admin/algas?m=${shift(-1)}`} className={adminSecondary} aria-label="Iepriekšējais mēnesis">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <h2 className="text-lg font-extrabold capitalize">
          {MONTHS[first.getUTCMonth()]} {first.getUTCFullYear()}
        </h2>
        <Link href={`/admin/algas?m=${shift(1)}`} className={adminSecondary} aria-label="Nākamais mēnesis">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      {/* Kopsavilkums */}
      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line sm:p-6">
        <h3 className="text-base font-extrabold">Kopā par mēnesi</h3>
        {summary.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Šajā mēnesī apstiprinātu pasākumu ar dalībniekiem nav.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="pb-2 font-semibold">Kas</th>
                  <th className="pb-2 font-semibold">Pasākumi</th>
                  <th className="pb-2 text-right font-semibold">Alga</th>
                  <th className="pb-2 text-right font-semibold">Ceļa izdevumi</th>
                  <th className="pb-2 text-right font-semibold">Kopā</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((t) => (
                  <tr key={t.name} className="border-t border-line">
                    <td className="py-2 font-bold">{t.name}</td>
                    <td className="py-2">{t.events}</td>
                    <td className="py-2 text-right">{eur(t.pay)}</td>
                    <td className="py-2 text-right">{eur(t.travel)}</td>
                    <td className="py-2 text-right font-extrabold">{eur(t.pay + t.travel)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-ink">
                  <td className="pt-2 font-extrabold" colSpan={4}>
                    Pavisam kopā
                  </td>
                  <td className="pt-2 text-right font-extrabold">{eur(sum)}</td>
                </tr>
              </tbody>
            </table>
            {missing > 0 && <p className="mt-2 text-sm font-semibold text-destructive">{missing} reizēm alga vēl nav norādīta — ievadiet zemāk vai standarta cenās.</p>}
          </div>
        )}
      </section>

      {/* Pasākumi */}
      <section className="mt-6 space-y-4">
        {events.map(({ b, title, who, rows }) => (
          <form key={b.id} action={savePayroll.bind(null, b.id)} className="rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
            <p className="font-bold">
              {b.event_date!.slice(8, 10)}.{b.event_date!.slice(5, 7)}. {timeLabel(b.event_time, b.inquiry_type === "business" ? null : b.location)} · {title}
              {who && <span className="font-normal text-ink-soft"> · {who}</span>}
            </p>
            {b.travel_cost ? <p className="text-xs text-ink-soft">Ceļa izdevumi rezervācijā: {eur(Number(b.travel_cost))} (sadalīti uz visiem — var labot)</p> : null}
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[460px] text-sm">
                <thead>
                  <tr className="text-left text-ink-soft">
                    <th className="pb-1 font-semibold">Kas</th>
                    <th className="pb-1 font-semibold">Alga (€)</th>
                    <th className="pb-1 font-semibold">Ceļa izdevumi (€)</th>
                    <th className="pb-1" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.person} className="border-t border-line">
                      <td className="py-1.5 pr-2 font-semibold">
                        {r.name}
                        <input type="hidden" name="person" value={r.person} />
                        <input type="hidden" name={`name__${r.person}`} value={r.name} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input name={`pay__${r.person}`} defaultValue={val(r.pay)} inputMode="decimal" placeholder="—" className={`${adminInput} max-w-28 ${r.pay === null ? "ring-2 ring-red-300" : ""}`} />
                      </td>
                      <td className="py-1.5 pr-2">
                        <input name={`travel__${r.person}`} defaultValue={val(r.travel)} inputMode="decimal" placeholder="0" className={`${adminInput} max-w-28`} />
                      </td>
                      <td className="py-1.5 text-xs text-ink-soft">
                        {r.person.startsWith("x:") ? (
                          <label className="inline-flex items-center gap-1">
                            <input type="checkbox" name="remove" value={r.person} /> noņemt
                          </label>
                        ) : !r.savedRow ? (
                          "nav saglabāts"
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-line">
                    <td className="py-1.5 pr-2">
                      <input name="new_name" placeholder="+ cits cilvēks (vārds)" className={adminInput} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input name="new_pay" inputMode="decimal" placeholder="alga" className={`${adminInput} max-w-28`} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input name="new_travel" inputMode="decimal" placeholder="ceļš" className={`${adminInput} max-w-28`} />
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <SubmitOnce className={adminSecondary}>Saglabāt</SubmitOnce>
            </div>
          </form>
        ))}
      </section>

      {/* Standarta cenas */}
      <details className="mt-8 rounded-2xl bg-white ring-1 ring-line" open={rates.size === 0 || undefined}>
        <summary className="cursor-pointer p-4 font-extrabold sm:p-5">Standarta algas (vienam cilvēkam par pasākumu)</summary>
        <form action={savePayRates} className="border-t border-line p-4 sm:p-5">
          <p className="mb-3 text-sm text-ink-soft">Šī summa automātiski ieliekas katram dalībniekam; konkrētā pasākumā to var izlabot.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {rateKeys.map((r) => (
              <label key={r.key} className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2 text-sm">
                <span className="font-semibold">{r.title}</span>
                <input type="hidden" name="rate_key" value={r.key} />
                <input type="hidden" name={`rate_title__${r.key}`} value={r.title} />
                <input name={`rate__${r.key}`} defaultValue={val(rates.get(r.key)?.amount)} inputMode="decimal" placeholder="€" className={`${adminInput} max-w-24`} />
              </label>
            ))}
          </div>
          <div className="mt-3">
            <SubmitOnce className={adminSecondary}>Saglabāt standarta algas</SubmitOnce>
          </div>
        </form>
      </details>
    </>
  );
}
