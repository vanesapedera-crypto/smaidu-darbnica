import { Eye, Search } from "lucide-react";
import { requireMember } from "@/lib/auth";
import type { Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices } from "@/lib/pricing";
import BookingCard, { isVenue } from "@/components/admin/team/BookingCard";
import PageHeader from "@/components/admin/PageHeader";
import { adminInput, adminSecondary } from "@/components/admin/styles";

export const metadata = { title: "Pieteikumi" };

type Props = { searchParams: Promise<{ q?: string }> };

/**
 * Pieteikumi vadībai (Kristīnei) — tikai skatīšanai: gaidāmie, notikušie un atceltie, ar meklēšanu.
 * Labot un apstiprināt var tikai administratore sadaļā /admin (to nosaka arī datubāzes RLS).
 */
export default async function BookingsReadOnlyPage({ searchParams }: Props) {
  const { db } = await requireMember(["manager"]);
  const { q = "" } = await searchParams;

  let query = db.from("bookings").select("*").order("event_date", { ascending: true, nullsFirst: false });
  if (q.trim()) {
    const term = q.trim().replace(/[,()%*]/g, " ");
    query = query.or(["parent_name", "company_name", "phone", "email"].map((c) => `${c}.ilike.%${term}%`).join(","));
  }
  const [{ data, error }, business, programs, settings] = await Promise.all([query, getServices("business"), getServices("private"), getSettings()]);
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

  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" });
  const bookings = (data ?? []) as Booking[];
  const isPast = (b: Booking) => Boolean(b.event_date && b.event_date.slice(0, 10) < today);
  const active = bookings.filter((b) => b.status !== "Atcelta" && !isPast(b));
  const past = bookings.filter((b) => b.status !== "Atcelta" && isPast(b)).reverse();
  const cancelled = bookings.filter((b) => b.status === "Atcelta");

  const list = (items: Booking[]) => (
    <ul className="mt-3 space-y-2">
      {items.map((b) => (
        <BookingCard key={b.id} b={b} label={label(b)} costs={costsOf(b)} showDate />
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader title="Pieteikumi" description="Visi pieteikumi un rezervācijas. Apstiprina un labo Vanesa." />
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft ring-1 ring-line">
        <Eye className="size-3.5" aria-hidden /> Tikai skatīšanai
      </p>

      <form className="mt-6 flex flex-wrap gap-2">
        <label className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input name="q" defaultValue={q} placeholder="Meklēt pēc vārda, uzņēmuma, telefona vai e-pasta" className={`${adminInput} pl-9`} />
        </label>
        <button className={adminSecondary}>Meklēt</button>
      </form>

      {error && <p className="mt-4 text-sm font-semibold text-destructive">Neizdevās ielādēt pieteikumus: {error.message}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-extrabold">Gaidāmie ({active.length})</h2>
        {active.length ? list(active) : <p className="mt-2 text-sm text-ink-soft">Nav.</p>}
      </section>
      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-extrabold">Notikušie ({past.length})</summary>
          {list(past)}
        </details>
      )}
      {cancelled.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-extrabold">Atceltie ({cancelled.length})</summary>
          {list(cancelled)}
        </details>
      )}
    </>
  );
}
