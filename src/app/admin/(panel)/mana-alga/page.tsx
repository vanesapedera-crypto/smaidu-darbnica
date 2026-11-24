import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { atStudio, hostsOf, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS, staffEmailOf } from "@/lib/calendar";
import { getServices } from "@/lib/content/queries";
import { timeLabel } from "@/lib/dates";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PageHeader from "@/components/admin/PageHeader";
import { adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Mana alga" };

const MONTHS = ["janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs", "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris"];
const eur = (n: number) => `${n.toLocaleString("lv-LV", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/**
 * "Mana alga": katra meitene redz tikai savu algu — pasākumus mēnesī, algu par katru un ceļa izdevumus (ja vadīja mašīnu).
 * Dati nolasīti ar servera atslēgu un atlasīti tikai ielogotajai (citu algas netiek sūtītas uz pārlūku).
 */
export default async function MyPayPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { role, email } = await requireMember();
  const me = staffEmailOf(role, email);
  const myName = CALENDAR_HOSTS.find((h) => h.email === me)?.name;
  const { m } = await searchParams;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
  const month = m && /^\d{4}-\d{2}$/.test(m) ? m : today.slice(0, 7);
  const first = new Date(`${month}-01T12:00:00Z`);
  const shift = (n: number) => {
    const d = new Date(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.toISOString().slice(0, 7);
  };
  const db = supabaseAdmin();
  if (!db) return <PageHeader title="Mana alga" description="Pagaidām nav pieejams." />;

  const [{ data: bData }, { data: staffData }, { data: payData }, { data: rateData }, { data: carData }, privateS, businessS] = await Promise.all([
    db.from("bookings").select("*").eq("status", "Apstiprināta").gte("event_date", `${month}-01`).lt("event_date", `${shift(1)}-01`).order("event_date").order("event_time"),
    db.from("booking_staff").select("booking_id, email, status").eq("email", me),
    db.from("payroll").select("booking_id, person, pay").eq("person", me),
    db.from("pay_rates").select("key, amount"),
    db.from("booking_cars").select("booking_id, driver, amount").eq("driver", me),
    getServices("private"),
    getServices("business"),
  ]);
  const titles = new Map([...privateS, ...businessS].map((s) => [s.slug, s.title]));
  const rates = new Map(((rateData ?? []) as { key: string; amount: number | null }[]).map((r) => [r.key, r.amount]));
  const staff = (staffData ?? []) as { booking_id: string; status: string }[];
  const pays = (payData ?? []) as { booking_id: string; pay: number | null }[];
  const cars = (carData ?? []) as { booking_id: string; amount: number | null }[];

  const rateFor = (b: Booking) => {
    const slug = b.program || b.service_slug || "";
    return (slug && rates.get(slug)) ?? (b.inquiry_type === "business" ? rates.get("uznemums") : atStudio(b.location) ? rates.get("telpu-noma") : undefined) ?? rates.get("default") ?? null;
  };
  const rows = ((bData ?? []) as Booking[])
    .filter((b) => {
      const s = staff.find((x) => x.booking_id === b.id);
      if (s) return s.status !== "nevar";
      return Boolean(myName && hostsOf(b.message).split(/,\s*/).includes(myName)) || cars.some((c) => c.booking_id === b.id);
    })
    .map((b) => {
      const p = pays.find((x) => x.booking_id === b.id);
      const slug = b.program || b.service_slug || "";
      const title = b.inquiry_type === "business" ? b.company_name || titles.get(slug) || "Pasākums" : [atStudio(b.location) && "Telpu noma", titles.get(slug)].filter(Boolean).join(" + ") || "Pasākums";
      return {
        b,
        title,
        pay: p ? p.pay : rateFor(b),
        travel: cars.filter((c) => c.booking_id === b.id).reduce((t, c) => t + Number(c.amount ?? 0), 0),
      };
    });
  const pay = rows.reduce((t, r) => t + Number(r.pay ?? 0), 0);
  const travel = rows.reduce((t, r) => t + r.travel, 0);

  return (
    <>
      <PageHeader title="Mana alga" description="Tikai tavi pasākumi un tava alga. Summas var precizēt Vanesa vai Kristīne." />
      <div className="mt-6 flex items-center justify-between gap-3">
        <Link href={`/admin/mana-alga?m=${shift(-1)}`} className={adminSecondary} aria-label="Iepriekšējais mēnesis">
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <h2 className="text-lg font-extrabold capitalize">
          {MONTHS[first.getUTCMonth()]} {first.getUTCFullYear()}
        </h2>
        <Link href={`/admin/mana-alga?m=${shift(1)}`} className={adminSecondary} aria-label="Nākamais mēnesis">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Pasākumi", String(rows.length)],
          ["Alga", eur(pay)],
          ["Kopā ar ceļa izdevumiem", eur(pay + travel)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="text-sm text-ink-soft">{k}</p>
            <p className="mt-1 text-2xl font-extrabold">{v}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line sm:p-5">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-soft">Šajā mēnesī tev pasākumu nav.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead>
                <tr className="text-left text-ink-soft">
                  <th className="pb-2 font-semibold">Datums</th>
                  <th className="pb-2 font-semibold">Pasākums</th>
                  <th className="pb-2 text-right font-semibold">Alga</th>
                  <th className="pb-2 text-right font-semibold">Ceļa izdevumi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.b.id} className="border-t border-line">
                    <td className="py-2 whitespace-nowrap">
                      {r.b.event_date!.slice(8, 10)}.{r.b.event_date!.slice(5, 7)}. {timeLabel(r.b.event_time, r.b.inquiry_type === "business" ? null : r.b.location).slice(0, 5)}
                    </td>
                    <td className="py-2 font-semibold">{r.title}</td>
                    <td className="py-2 text-right">{r.pay === null ? <span className="text-ink-soft">vēl nav norādīta</span> : eur(Number(r.pay))}</td>
                    <td className="py-2 text-right">{r.travel ? eur(r.travel) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
