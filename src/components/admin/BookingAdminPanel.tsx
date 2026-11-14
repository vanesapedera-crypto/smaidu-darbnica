import { FIXED_VENUES, editableMessage, hostsOf, phoneDigits, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS, calendarEvent } from "@/lib/calendar";
import type { Service, SiteSettings } from "@/lib/content/types";
import { VAT_NOTE, amountText, costsToText, eur, parseCostOverride, priceVariants, type BookingCosts } from "@/lib/pricing";
import CalendarLink from "@/components/admin/CalendarLink";
import RemoveFromCalendar from "@/components/admin/RemoveFromCalendar";
import ClientConfirmation from "@/components/admin/ClientConfirmation";
import ReviewRequest from "@/components/admin/ReviewRequest";
import DeleteBooking from "@/components/admin/DeleteBooking";
import StatusSelect from "@/components/admin/StatusSelect";
import TimeSelect from "@/components/site/TimeSelect";
import { reviewKind, reviewMessageText, reviewUrl } from "@/lib/review";
import { adminInput, adminSecondary } from "@/components/admin/styles";
import { saveBookingDetails, saveBookingNotes } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export type BookingAdminContext = {
  programs: Service[];
  settings: SiteSettings;
  googleConnected: boolean;
};

/**
 * Pieteikuma pārvaldība administratorei (kalendārā, atverot pasākumu): statuss un apstiprināšana,
 * kas piedalās ("Programmu vada"), visa informācija, izmaksas, labošana, piezīmes, dzēšana.
 */
export default function BookingAdminPanel({
  b,
  labelText,
  costs,
  ctx,
}: {
  b: Booking;
  labelText: string;
  costs: BookingCosts | null;
  ctx: BookingAdminContext;
}) {
  const { programs, settings, googleConnected } = ctx;
  return (
    <div className="mt-2 rounded-2xl bg-white ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="text-sm font-extrabold">Statuss</span>
        <StatusSelect
          id={b.id}
          status={b.status}
          withHost={b.inquiry_type !== "business"}
          guests={calendarEvent(b, labelText)?.guests ?? null}
          clientEmail={b.email}
        />
      </div>
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
          {/* Pēc ballītes: aicinājums atstāt atsauksmi Google (tikai apstiprinātām privātajām rezervācijām) */}
          {b.inquiry_type !== "business" && b.status === "Apstiprināta" && (
            <ReviewRequest
              id={b.id}
              hasEmail={Boolean(b.email)}
              phoneDigits={phoneDigits(b.phone)}
              message={reviewMessageText(reviewKind(b), reviewUrl(settings.contact))}
              about={reviewKind(b) === "venue" ? "par telpām" : "par animatoriem un programmu"}
              requestedAt={b.review_requested_at ?? null}
              fallbackUrl={!settings.contact.googleReviewUrl?.trim()}
            />
          )}
          {b.message && (
            <div>
              <p className="text-sm text-ink-soft">Ziņojums</p>
              <p className="mt-1 text-sm whitespace-pre-line">
                {/* Labotās izmaksas redzamas sadaļā "Izmaksas" — ziņojumā tās nerāda */}
                {b.message
                  .split("\n")
                  .filter((l) => !l.startsWith("Izmaksas:"))
                  .join("\n")
                  .trim()}
              </p>
            </div>
          )}
          {(() => {

            return (
              costs && (
                <div>
                  <p className="text-sm text-ink-soft">Izmaksas (tās pašas klients saņem apstiprinājuma e-pastā)</p>
                  <dl className="mt-1 space-y-1 text-sm">
                    {costs.lines.map((l) => (
                      <div key={l.label} className="flex justify-between gap-4">
                        <dt>{l.label}</dt>
                        <dd className="font-semibold whitespace-nowrap">
                          {amountText(l)}
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
                    {costs.plusVat && <p className="text-ink-soft">{VAT_NOTE}</p>}
                  </dl>
                </div>
              )
            );
          })()}
          {/* Google kalendārs: aizpildīts notikums ar viesiem (tikai pieteikumiem ar datumu) */}
          {(() => {
            const event = calendarEvent(b, labelText, costs);
            if (event && b.status === "Atcelta") return <RemoveFromCalendar id={b.id} />;
            return (
              event && (
                <CalendarLink
                  event={event}
                  withHost={b.inquiry_type !== "business"}
                  googleBookingId={googleConnected && b.status === "Apstiprināta" ? b.id : undefined}
                />
              )
            );
          })()}
          {/* Rezervācijas labošana — visa informācija un izmaksas */}
          {(() => {
            const isPrivate = b.inquiry_type !== "business";
            const p = programs.find((x) => x.slug === (b.program || b.service_slug));
            const vs = p ? priceVariants(p.pricing).map((g) => g.title) : [];
            const currentVariant = b.message?.match(/Izvēle:\s*([^\n]+)/)?.[1]?.trim() ?? "";

            const costsText = costs ? costsToText(costs.lines) : "";
            const overridden = Boolean(parseCostOverride(b.message)?.length);
            const field = (label: string, el: React.ReactNode, wide = false) => (
              <label className={cn("text-sm text-ink-soft", wide && "sm:col-span-3")}>
                {label}
                {el}
              </label>
            );
            return (
              <details className="rounded-2xl bg-surface p-4" open={costs?.exact === false || undefined}>
                <summary className="cursor-pointer text-sm font-extrabold">Labot rezervāciju</summary>
                <form action={saveBookingDetails.bind(null, b.id)} className="mt-3 space-y-3">
                  {costs?.exact === false && (
                    <p className="text-sm font-semibold text-destructive">
                      Cena nav zināma (“pēc vienošanās”). Izlabojiet datus vai ierakstiet izmaksas zemāk un saglabājiet — tad var apstiprināt.
                    </p>
                  )}
                  {b.status === "Apstiprināta" && (
                    <p className="text-sm text-ink-soft">
                      Rezervācija jau apstiprināta — klientam izmaiņas automātiski netiek sūtītas. Google kalendārā tās atjauno poga “Ielikt Google kalendārā”.
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-3">
                    {field("Kontaktpersona", <input name="parent_name" defaultValue={b.parent_name ?? ""} className={adminInput} />)}
                    {field("Telefons", <input name="phone" defaultValue={b.phone ?? ""} className={adminInput} />)}
                    {field("E-pasts", <input type="email" name="email" defaultValue={b.email ?? ""} className={adminInput} />)}
                    {field(isPrivate ? "Iestāde / grupa" : "Uzņēmums", <input name="company_name" defaultValue={b.company_name ?? ""} className={adminInput} />, true)}
                    {isPrivate &&
                      field(
                        "Izklaides programma",
                        <>
                          <select name="program" defaultValue={b.program ?? ""} className={adminInput}>
                            <option value="">— bez programmas (telpu noma) —</option>
                            {programs.map((x) => (
                              <option key={x.slug} value={x.slug}>
                                {x.title}
                              </option>
                            ))}
                            {/* Ar roku ierakstīts nosaukums (nav sarakstā) */}
                            {b.program && !programs.some((x) => x.slug === b.program) && <option value={b.program}>{b.program}</option>}
                          </select>
                          <input
                            name="program_custom"
                            placeholder="vai ierakstiet citu nosaukumu, piem. izrādes nosaukumu"
                            className={cn(adminInput, "mt-1")}
                          />
                        </>,
                        true,
                      )}
                    {isPrivate &&
                      field(
                        "Programmu vada",
                        <>
                          <input type="hidden" name="hosts_shown" value="1" />
                          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {CALENDAR_HOSTS.map((h) => (
                              <label key={h.email} className="inline-flex items-center gap-1.5 text-sm text-ink">
                                <input
                                  type="checkbox"
                                  name="hosts"
                                  value={h.email}
                                  defaultChecked={hostsOf(b.message).split(/,\s*/).includes(h.name)}
                                  className="size-4 accent-ink"
                                />
                                {h.name}
                              </label>
                            ))}
                          </span>
                        </>,
                        true,
                      )}
                    {vs.length > 0 &&
                      field(
                        "Variants",
                        <select name="variant" defaultValue={vs.find((v) => v.toLowerCase() === currentVariant.toLowerCase()) ?? ""} className={adminInput}>
                          <option value="">— izvēlieties —</option>
                          {vs.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>,
                        true,
                      )}
                    {field("Datums", <input type="date" name="event_date" defaultValue={b.event_date?.slice(0, 10) ?? ""} className={adminInput} />)}
                    {field("Laiks", <TimeSelect name="event_time" defaultValue={b.event_time?.slice(0, 5) ?? ""} className={adminInput} />)}
                    {field("Bērnu skaits", <input type="number" name="children_count" min={1} max={1000} defaultValue={b.children_count ?? ""} className={adminInput} />)}
                    {isPrivate && field("Vecums", <input name="child_age" defaultValue={b.child_age ?? ""} className={adminInput} />)}
                    {isPrivate
                      ? field(
                          "Norises vieta",
                          <select name="location" defaultValue={b.location ?? "Smaidu Darbnīcā"} className={adminInput}>
                            {["Smaidu Darbnīcā", "Izbraukums", ...Object.values(FIXED_VENUES).map((v) => v.name)].map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                            {b.location && !["Smaidu Darbnīcā", "Izbraukums", ...Object.values(FIXED_VENUES).map((v) => v.name)].includes(b.location) && (
                              <option value={b.location}>{b.location}</option>
                            )}
                          </select>,
                        )
                      : field("Pilsēta", <input name="event_city" defaultValue={b.event_city ?? ""} className={adminInput} />)}
                    {field("Adrese", <input name="address" defaultValue={b.address ?? ""} className={adminInput} />, !isPrivate)}
                    {isPrivate && (
                      <>
                        {field("Ceļš turp un atpakaļ (km)", <input type="number" step="any" min={0} name="travel_km" defaultValue={b.travel_km ?? ""} className={adminInput} />)}
                        {field("Ceļa izdevumi (€)", <input type="number" step="any" min={0} name="travel_cost" defaultValue={b.travel_cost ?? ""} className={adminInput} />)}
                      </>
                    )}
                    <label className="text-sm text-ink-soft sm:col-span-3">
                      Ziņojums
                      <textarea
                        name="message_text"
                        rows={Math.min(14, Math.max(4, editableMessage(b.message).split("\n").length + 1))}
                        defaultValue={editableMessage(b.message)}
                        className={adminInput}
                      />
                      <span className="mt-1 block text-xs">
                        Var izlabot vai pierakstīt klāt (piem. klienta vēlmes). Izmaksas un “Programmu vada” labo atsevišķi — tās šeit nav redzamas, bet saglabājas.
                      </span>
                    </label>
                    {(
                      <label className="text-sm text-ink-soft sm:col-span-3">
                        Izmaksas {isPrivate && overridden && <span className="font-semibold text-ink">(labotas ar roku)</span>}
                        <textarea name="costs" rows={Math.max(3, costsText.split("\n").length + 1)} defaultValue={costsText} className={`${adminInput} font-mono text-[13px]`} />
                        <input type="hidden" name="costs_shown" value={costsText} />
                        <span className="mt-1 block text-xs">
                          {isPrivate ? (
                            <>
                              Katrā rindā: nosaukums | cena | +PVN (pēdējais — tikai, ja cena bez PVN). Šīs izmaksas klients saņem apstiprinājuma e-pastā.
                              Var mainīt, dzēst vai pievienot rindas (piem. “Sejas apgleznošana | 50”). Lai atkal rēķinātu automātiski — izdzēsiet visu tekstu.
                            </>
                          ) : (
                            <>
                              Katrā rindā: nosaukums | cena | +PVN (pēdējais — ja cena bez PVN), piem. “Lielformāta spēles | 450 | +PVN”.
                              Izmaksas redzamas panelī un kalendārā (klientam e-pastā netiek sūtītas). Lai noņemtu — izdzēsiet visu tekstu.
                            </>
                          )}
                        </span>
                      </label>
                    )}
                  </div>
                  <button type="submit" className={adminSecondary}>
                    Saglabāt izmaiņas
                  </button>
                </form>
              </details>
            );
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
          <DeleteBooking id={b.id} />
        </div>
      </div>
    </div>
  );
}
