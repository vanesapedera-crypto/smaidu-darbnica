import { CALENDAR_HOSTS } from "@/lib/calendar";
import { saveCars } from "@/app/admin/payroll-actions";
import SubmitOnce from "@/components/admin/SubmitOnce";
import { adminInput, adminSecondary } from "@/components/admin/styles";

export type Car = { driver: string; driver_name: string; amount: number | null; note: string | null };

/**
 * "Transports": ar kuru mašīnu brauc (kurš vada) un cik ceļa izdevumi viņam pienākas.
 * Parasti viena mašīna; lieliem pasākumiem — pievieno vēl. Ceļa izdevumi algās pienākas tikai vadītājam.
 */
export default function CarsForm({ bookingId, cars, suggested }: { bookingId: string; cars: Car[]; suggested?: number | null }) {
  const rows = [...cars, { driver: "", driver_name: "", amount: cars.length ? null : (suggested ?? null), note: null }];
  return (
    <form action={saveCars.bind(null, bookingId)} className="space-y-2 text-sm">
      {rows.map((c, i) => {
        const host = CALENDAR_HOSTS.find((h) => h.email === c.driver);
        const isNew = i === cars.length;
        return (
          <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_110px_1fr]">
            <select name="car_driver" defaultValue={host ? host.email : ""} className={adminInput} aria-label="Kurš vada">
              <option value="">{isNew ? (cars.length ? "+ vēl viena mašīna…" : "Kurš vada mašīnu…") : "Cits (ieraksti vārdu) / noņemt"}</option>
              {CALENDAR_HOSTS.map((h) => (
                <option key={h.email} value={h.email}>
                  {h.name}
                </option>
              ))}
            </select>
            <input name="car_other" defaultValue={!host && c.driver.startsWith("x:") ? c.driver_name : ""} placeholder="vai cits vārds (piem. Mārtiņš)" className={adminInput} />
            <input name="car_amount" defaultValue={c.amount === null ? "" : String(c.amount).replace(".", ",")} inputMode="decimal" placeholder="€" className={adminInput} aria-label="Ceļa izdevumi €" />
            <input name="car_note" defaultValue={c.note ?? ""} placeholder="piezīme (km, mašīna)" className={adminInput} />
          </div>
        );
      })}
      <p className="text-xs text-ink-soft">Ceļa izdevumi pienākas tikai tam, kurš vada. Lai noņemtu mašīnu — izvēlies tukšu un izdzēs vārdu. {suggested ? `Rezervācijā ceļa izdevumi: ${suggested} €.` : ""}</p>
      <SubmitOnce className={adminSecondary}>Saglabāt transportu</SubmitOnce>
    </form>
  );
}
