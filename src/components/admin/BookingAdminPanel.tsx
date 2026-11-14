import { CalendarPlus, ChevronDown, Pencil, Star, StickyNote, Users, XCircle } from "lucide-react";
import RejectActions from "@/components/admin/RejectActions";
import StaffPanel from "@/components/admin/StaffPanel";
import type { StaffRow } from "@/lib/staff";
import { FIXED_VENUES, atStudio, editableMessage, hostsOf, phoneDigits, type Booking } from "@/lib/bookings";
import { CALENDAR_HOSTS, calendarEvent, hostNames, withVenueStaff } from "@/lib/calendar";
import type { Service, SiteSettings } from "@/lib/content/types";
import { VAT_NOTE, amountText, costsToText, eur, parseCostOverride, priceVariants, type BookingCosts } from "@/lib/pricing";
import CalendarLink from "@/components/admin/CalendarLink";
import RemoveFromCalendar from "@/components/admin/RemoveFromCalendar";
import ClientConfirmation from "@/components/admin/ClientConfirmation";
import ReviewRequest from "@/components/admin/ReviewRequest";
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
 * kas piedalās, visa informācija, izmaksas, labošana, piezīmes, dzēšana.
 */
export default function BookingAdminPanel({
  b,
  labelText,
  costs,
  ctx,
  staff = [],
}: {
  b: Booking;
  labelText: string;
  costs: BookingCosts | null;
  ctx: BookingAdminContext;
  /** Kas piedalās un ko atbildēja (booking_staff) */
  staff?: StaffRow[];
}) {
  const { programs, settings, googleConnected } = ctx;
  // Kas piedalās: atzīmētās + telpu nomā vienmēr Keita
  const hostEmails = withVenueStaff(b, CALENDAR_HOSTS.filter((h) => hostsOf(b.message).split(/,\s*/).includes(h.name)).map((h) => h.email));
  return (
    <div className="mt-2 rounded-2xl bg-white ring-1 ring-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="text-sm font-extrabold">Statuss</span>
        <StatusSelect
          id={b.id}
          status={b.status}
          withHost
          guests={calendarEvent(b, labelText)?.guests ?? null}
          clientEmail={b.email}
        />
      </div>
      {/* 1. Ko klients iesniedza */}
      <div className="space-y-4 p-4 sm:p-5">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              ["Kontaktpersona", b.parent_name],
              ["Uzņēmums / iestāde", b.company_name],
              ["Amats", b.contact_role],
              ["Telefons", b.phone && <a href={`tel:${b.phone}`} className="font-semibold underline decoration-brand decoration-2 underline-offset-4">{b.phone}</a>],
              ["E-pasts", b.email && <a href={`mailto:${b.email}`} className="font-semibold underline decoration-brand decoration-2 underline-offset-4">{b.email}</a>],
              ["Programma", labelText !== "—" ? labelText : null],
              ["Vieta", [b.location, b.event_city, b.address].filter(Boolean).join(", ")],
              ["Bērnu skaits", b.children_count],
              ["Vecums", b.child_age],
              ["Dalībnieki", b.participants],
              ["Ceļa izdevumi", b.travel_cost != null && `${b.travel_cost} € (${b.travel_km} km turp un atpakaļ)`],
              ["Budžets", b.budget_range],
              ["Piedalās", hostNames(hostEmails) || null],
              ["Saņemts", b.created_at && new Date(b.created_at).toLocaleString("lv-LV", { dateStyle: "short", timeStyle: "short" })],
            ] as [string, React.ReactNode][]
          )
            .filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false)
            .map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-ink-soft">{k}</dt>
                <dd className="font-semibold break-words">{v}</dd>
              </div>
            ))}
        </dl>

        {editableMessage(b.message).trim() && (
          <div className="rounded-xl bg-surface p-3 text-sm">
            <p className="text-xs text-ink-soft">Ziņojums</p>
            <p className="mt-0.5 whitespace-pre-line">{editableMessage(b.message).trim()}</p>
          </div>
        )}

        {costs && (
          <div className="rounded-xl bg-surface p-3 text-sm">
            <p className="text-xs text-ink-soft">Izmaksas (tās pašas klients saņem apstiprinājuma e-pastā)</p>
            <dl className="mt-1 space-y-0.5">
              {costs.lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-4">
                  <dt>{l.label}</dt>
                  <dd className="font-semibold whitespace-nowrap">{amountText(l)}</dd>
                </div>
              ))}
              {costs.exact && (
                <div className="flex justify-between gap-4 border-t border-line pt-1">
                  <dt className="font-extrabold">Kopā</dt>
                  <dd className="font-extrabold whitespace-nowrap">{eur(costs.total)}</dd>
                </div>
              )}
              {costs.plusVat && <p className="text-ink-soft">{VAT_NOTE}</p>}
            </dl>
          </div>
        )}

        <ClientConfirmation booking={b} />
      </div>

      {/* 2. Darbības — katra atveras, uzspiežot */}
      <div className="space-y-2 border-t border-line p-4 sm:p-5">
        {/* Kas piedalās: vispirms jautā komandai, tikai tad apstiprina klientam */}
        {b.status !== "Atcelta" && (
          <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink" open={b.status === "Jauns" || staff.some((r) => r.status === "nevar") || undefined}>
            <Summary icon={<Users className="size-4" aria-hidden />}>
              Kas piedalās
              {staff.some((r) => r.status === "nevar") && <span className="ml-2 text-red-700">— kāda nevar!</span>}
            </Summary>
            <div className="border-t border-line p-4">
              <StaffPanel
                id={b.id}
                rows={staff.map((r) => ({ email: r.email, name: r.name, status: r.status }))}
                status={b.status}
                initial={hostEmails}
              />
            </div>
          </details>
        )}

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
              <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink" open={costs?.exact === false || undefined}>
                <Summary icon={<Pencil className="size-4" aria-hidden />}>Labot informāciju</Summary>
                <div className="border-t border-line p-4">
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
                    {field(
                        "Piedalās",
                        <>
                          <input type="hidden" name="hosts_shown" value="1" />
                          <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            {CALENDAR_HOSTS.map((h) => (
                              <label key={h.email} className="inline-flex items-center gap-1.5 text-sm text-ink">
                                <input
                                  type="checkbox"
                                  name="hosts"
                                  value={h.email}
                                  defaultChecked={hostEmails.includes(h.email)}
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
                        Var izlabot vai pierakstīt klāt (piem. klienta vēlmes). Izmaksas un “Piedalās” labo atsevišķi — tās šeit nav redzamas, bet saglabājas.
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
                </div>
              </details>
            );
          })()}

        {/* Nevaram uzņemt vai nodrošināt programmu — tikai vēl neatceltiem pieteikumiem */}
        {b.status !== "Atcelta" && (
          <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink">
            <Summary icon={<XCircle className="size-4" aria-hidden />}>Nevaram uzņemt vai nodrošināt programmu</Summary>
            <div className="border-t border-line p-4">
              <RejectActions
                id={b.id}
                venueWithProgram={b.inquiry_type !== "business" && atStudio(b.location) && Boolean(b.program || b.service_slug)}
                programTitle={b.program || b.service_slug ? labelText.replace(/^Telpu noma \+ /, "") : ""}
                hasEmail={Boolean(b.email)}
              />
            </div>
          </details>
        )}

        {/* Google kalendārs: kas piedalās + ielikt/atjaunot notikumu */}
        {(() => {
          const event = calendarEvent(b, labelText, costs);
          if (!event) return null;
          return (
            <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink">
              <Summary icon={<CalendarPlus className="size-4" aria-hidden />}>
                {b.status === "Atcelta" ? "Izņemt no Google kalendāra" : "Google kalendārs — kas piedalās"}
              </Summary>
              <div className="border-t border-line p-4">
                {b.status === "Atcelta" ? (
                  <RemoveFromCalendar id={b.id} />
                ) : (
                  <CalendarLink
                    event={event}
                    withHost
                    initialHosts={hostEmails}
                    googleBookingId={googleConnected && b.status === "Apstiprināta" ? b.id : undefined}
                  />
                )}
              </div>
            </details>
          );
        })()}

        {/* Pēc ballītes: aicinājums atstāt atsauksmi Google (tikai apstiprinātām privātajām rezervācijām) */}
        {b.inquiry_type !== "business" && b.status === "Apstiprināta" && (
          <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink">
            <Summary icon={<Star className="size-4" aria-hidden />}>Pieprasīt atsauksmi</Summary>
            <div className="border-t border-line p-4">
              <ReviewRequest
                id={b.id}
                hasEmail={Boolean(b.email)}
                phoneDigits={phoneDigits(b.phone)}
                message={reviewMessageText(reviewKind(b), reviewUrl(settings.contact))}
                about={reviewKind(b) === "venue" ? "par telpām" : "par animatoriem un programmu"}
                requestedAt={b.review_requested_at ?? null}
                fallbackUrl={!settings.contact.googleReviewUrl?.trim()}
              />
            </div>
          </details>
        )}

        <details className="group/s rounded-2xl ring-1 ring-line open:ring-ink" open={Boolean(b.admin_notes) || undefined}>
          <Summary icon={<StickyNote className="size-4" aria-hidden />}>Iekšējās piezīmes</Summary>
          <form action={saveBookingNotes.bind(null, b.id)} className="space-y-2 border-t border-line p-4">
            <textarea name="admin_notes" defaultValue={b.admin_notes ?? ""} rows={3} className={adminInput} aria-label="Iekšējās piezīmes" />
            <button type="submit" className={adminSecondary}>
              Saglabāt piezīmes
            </button>
          </form>
        </details>

        {/* Pieteikumus nedzēš: nevajadzīgu — statuss "Atcelta" (pāriet uz atceltajiem); notikušie paši pāriet uz arhīvu */}
        <p className="pt-2 text-xs text-ink-soft">
          Pieteikumi netiek dzēsti. Ja pasākums nenotiks, nomainiet statusu uz “Atcelta” — tas pāries uz atceltajiem pieteikumiem. Notikušie pasākumi paši pāriet uz arhīvu.
        </p>
      </div>
    </div>
  );
}

/** Sakļaujamas sadaļas virsraksts ar bultiņu */
function Summary({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-extrabold [&::-webkit-details-marker]:hidden">
      {icon}
      <span className="flex-1">{children}</span>
      <ChevronDown className="size-4 text-ink-soft transition-transform group-open/s:rotate-180" aria-hidden />
    </summary>
  );
}
