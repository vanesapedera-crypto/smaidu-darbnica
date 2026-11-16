import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { getServices } from "@/lib/content/queries";
import { FIXED_VENUES } from "@/lib/bookings";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import SubmitOnce from "@/components/admin/SubmitOnce";
import { createManualBooking } from "@/app/admin/actions";
import PageHeader from "@/components/admin/PageHeader";
import TimeSelect from "@/components/site/TimeSelect";
import { adminInput, adminPrimary } from "@/components/admin/styles";

export const metadata = { title: "Pievienot rezervāciju" };

const ERRORS: Record<string, string> = {
  vards: "Ierakstiet klienta vārdu vai uzņēmumu.",
  datums: "Norādiet datumu.",
};

/** Rezervācija, ko administratore pievieno pati (piem. pēc telefona zvana) */
export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ kluda?: string; veids?: string }>;
}) {
  await requireSection("kalendars", true);
  const { kluda, veids } = await searchParams;
  const business = veids === "uznemums";
  const services = await getServices(business ? "business" : "private");
  const f = (label: string, el: React.ReactNode, wide = false) => (
    <label className={`text-sm text-ink-soft ${wide ? "sm:col-span-2" : ""}`}>
      {label}
      <span className="mt-1 block">{el}</span>
    </label>
  );

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/kalendars"
        className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden /> Kalendārs
      </Link>
      <PageHeader
        title="Pievienot rezervāciju"
        description="Piem. pēc telefona zvana. Visu var labot arī vēlāk, atverot rezervāciju kalendārā."
      />

      <div className="mt-4 flex gap-2 text-sm">
        <Link
          href="/admin/kalendars/jauns"
          className={`rounded-full px-3 py-1.5 font-bold ring-1 ${business ? "ring-line" : "bg-ink text-white ring-ink"}`}
        >
          Ballīte / telpu noma
        </Link>
        <Link
          href="/admin/kalendars/jauns?veids=uznemums"
          className={`rounded-full px-3 py-1.5 font-bold ring-1 ${business ? "bg-ink text-white ring-ink" : "ring-line"}`}
        >
          Uzņēmums / iestāde
        </Link>
      </div>

      {kluda && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-destructive ring-1 ring-red-200">
          {ERRORS[kluda] ?? `Neizdevās saglabāt: ${kluda}`}
        </p>
      )}

      <form
        action={createManualBooking}
        className="mt-6 grid gap-4 rounded-2xl bg-white p-5 ring-1 ring-line sm:grid-cols-2"
      >
        <input
          type="hidden"
          name="inquiry_type"
          value={business ? "business" : "private"}
        />
        {business &&
          f(
            "Uzņēmums / iestāde",
            <input name="company_name" className={adminInput} />,
            true,
          )}
        {f(
          business ? "Kontaktpersona" : "Klients (vārds, uzvārds)",
          <input name="parent_name" className={adminInput} />,
        )}
        {f(
          "Telefons",
          <input name="phone" type="tel" className={adminInput} />,
        )}
        {f(
          "E-pasts",
          <input name="email" type="email" className={adminInput} />,
          true,
        )}
        {business &&
          f(
            "Pakalpojums",
            <select name="program" defaultValue="" className={adminInput}>
              <option value="">— nav norādīts —</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.title}
                </option>
              ))}
            </select>,
            true,
          )}
        {f(
          "Datums",
          <input
            type="date"
            name="event_date"
            required
            className={adminInput}
          />,
        )}
        {f(
          "Laiks",
          <TimeSelect
            name="event_time"
            defaultValue=""
            className={adminInput}
          />,
        )}
        {business
          ? f("Pilsēta", <input name="event_city" className={adminInput} />)
          : f(
              "Norises vieta",
              <select
                name="location"
                defaultValue="Smaidu Darbnīcā"
                className={adminInput}
              >
                {[
                  "Smaidu Darbnīcā",
                  "Izbraukums",
                  ...Object.values(FIXED_VENUES).map((v) => v.name),
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>,
            )}
        {f(
          "Adrese (izbraukumam)",
          <input name="address" className={adminInput} />,
        )}
        {f(
          business ? "Dalībnieku skaits" : "Bērnu skaits",
          <input
            type="number"
            name="children_count"
            min={1}
            max={1000}
            className={adminInput}
          />,
        )}
        {!business &&
          f("Vecums", <input name="child_age" className={adminInput} />)}
        {f(
          <textarea name="message" rows={3} className={adminInput} />,
          true,
        )}
        {f(
          "Iekšējās piezīmes (tikai komandai)",
          <textarea name="admin_notes" rows={2} className={adminInput} />,
          true,
        )}

        <fieldset className="sm:col-span-2">
          <legend className="text-sm text-ink-soft">
            Kas piedalās (atzīmētās saņems jautājumu “Vai vari piedalīties?”;
            telpu nomā Keita — automātiski)
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CALENDAR_HOSTS.map((h) => (
              <label
                key={h.email}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-line has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink"
              >
                <input
                  type="checkbox"
                  name="hosts"
                  value={h.email}
                  className="size-4 accent-brand"
                />
                {h.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sm:col-span-2">
          <legend className="text-sm text-ink-soft">Statuss</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-line has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink">
              <input
                type="radio"
                name="approve"
                value="0"
                defaultChecked
                className="size-4 accent-brand"
              />
              Gaida apstiprinājumu
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-line has-[:checked]:bg-ink has-[:checked]:text-white has-[:checked]:ring-ink">
              <input
                type="radio"
                name="approve"
                value="1"
                className="size-4 accent-brand"
              />
              Jau apstiprināta (klientam e-pastu nesūta)
            </label>
          </div>
        </fieldset>

        <div className="sm:col-span-2">
          <SubmitOnce
            className={adminPrimary}
            pendingText="Saglabā… (nespiediet vēlreiz)"
          >
            Saglabāt rezervāciju
          </SubmitOnce>
        </div>
      </form>
    </div>
  );
}
