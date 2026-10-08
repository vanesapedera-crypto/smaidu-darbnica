import Link from "next/link";
import { CircleCheck, CircleX } from "lucide-react";
import { Smile } from "@/components/site/stage";
import { ButtonLink, Container, buttonClass } from "@/components/site/ui";
import { atStudio, fixedVenueAddress, isGroupProgram, needsHeadcount } from "@/lib/bookings";
import { clientBooking } from "@/lib/client-booking";
import { getServices, getSettings } from "@/lib/content/queries";
import { dateWords, timeLabel } from "@/lib/dates";
import { VAT_NOTE, amountText, bookingCosts, bookingPrices, eur, priceVariants } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { cancelBooking, confirmBooking } from "./actions";

// Personīga saite no e-pasta — meklētājiem to nerāda
export const metadata = { title: "Jūsu rezervācija", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string; atcelt?: string }> };

/**
 * Lapa, ko klients atver no apstiprinājuma e-pasta (vai WhatsApp / SMS atgādinājuma).
 * Rāda visu rezervāciju (datums, laiks, vieta, programma, bērnu skaits, izmaksas) un divas iespējas:
 * "Apstiprinu rezervāciju" vai "Atcelt rezervāciju". Lēmumu var pieņemt tikai vienreiz —
 * pēc tam lapa tikai rāda rezultātu, un mainīt var, tikai sazinoties ar mums.
 * Nekas nenotiek, tikai atverot saiti: vajag nospiest pogu.
 */
export default async function ClientBookingPage({ params, searchParams }: Props) {
  // `atcelt=1` — klients e-pastā uzspieda "Atcelt rezervāciju": atcelšanas bloks uzreiz ir atvērts (pati saite neko neatceļ)
  const [{ id }, { k = "", atcelt }] = await Promise.all([params, searchParams]);
  const [b, programs, settings] = await Promise.all([clientBooking(id, k), getServices("private"), getSettings()]);
  const { contact } = settings;
  const phone = contact.phonePrivate;
  const tel = phone.replace(/\s/g, "");

  const valid = Boolean(b?.found);
  const confirmed = valid && b!.status === "Apstiprināta" && Boolean(b!.confirmed_at);
  const cancelledByClient = valid && Boolean(b!.cancelled_at);
  const cancelled = valid && b!.status !== "Apstiprināta";
  const open = valid && !confirmed && !cancelled;

  const program = programs.find((p) => p.slug === b?.program);
  const inVenue = atStudio(b?.location);
  // Programmas variants (piem. sejas apgleznošana ar tetovējumiem) un papildu iespējas — no ziņojuma rindām, ko pieraksta forma
  const picked = b?.message?.match(/Izvēle:\s*(.+)/)?.[1]?.trim();
  const variant = program ? priceVariants(program.pricing).find((g) => g.title === picked)?.title : undefined;
  const extras = b?.message?.match(/Papildu iespējas:\s*(.+)/)?.[1]?.trim() ?? "";
  const costs = valid
    ? bookingCosts(
        {
          location: b!.location ?? null,
          event_date: b!.event_date ?? null,
          children_count: b!.children_count ?? null,
          travel_km: b!.travel_km ?? null,
          travel_cost: b!.travel_cost ?? null,
          message: b!.message ?? null,
        },
        program,
        bookingPrices(settings),
      )
    : null;
  const order = ["room", "program", "extra", "surcharge", "travel"];
  const costLines = costs ? [...costs.lines].sort((x, y) => order.indexOf(x.kind) - order.indexOf(y.kind)) : [];

  const rows: [string, string][] = valid
    ? [
        ["Datums", dateWords(b!.event_date)],
        ["Laiks", timeLabel(b!.event_time, b!.location)],
        ["Vieta", inVenue ? `Smaidu Darbnīca, ${contact.address}, ${contact.city}` : (fixedVenueAddress(b!.location) ?? b!.address ?? "")],
        ["Izklaides programma", variant ?? program?.title ?? ""],
        ["Papildu iespējas", extras],
        ["Bērnu skaits", (needsHeadcount(b!.program) || isGroupProgram(b!.program)) && b!.children_count ? String(b!.children_count) : ""],
        ["Gaviļnieka vecums", needsHeadcount(b!.program) && !isGroupProgram(b!.program) ? (b!.child_age ?? "") : ""],
      ]
    : [];

  return (
    <section className="relative isolate overflow-hidden bg-ink py-16 text-white md:py-24">
      <Smile className="absolute -top-10 -right-10 -z-10 w-72 text-white/[0.06] md:w-[26rem]" />
      <Container className="max-w-2xl">
        <p className="text-sm font-extrabold tracking-[0.14em] text-brand uppercase">Smaidu Darbnīca</p>
        <h1 className="display mt-5 text-4xl sm:text-5xl md:text-6xl">
          {confirmed ? (
            <>
              Rezervācija <span className="sticker-light">apstiprināta</span>
            </>
          ) : cancelled ? (
            <>
              Rezervācija <span className="sticker-light">atcelta</span>
            </>
          ) : (
            <>
              Jūsu <span className="sticker-light">rezervācija</span>
            </>
          )}
        </h1>

        <div className="mt-10 rounded-3xl bg-white p-6 text-ink sm:p-8">
          {!valid ? (
            <p className="leading-7">
              Šī saite nav derīga vai ir novecojusi. Lūdzu, zvaniet mums:{" "}
              <a href={`tel:${tel}`} className="link-underline whitespace-nowrap">
                {phone}
              </a>
              .
            </p>
          ) : (
            <>
              {b!.name && <p className="text-lg font-extrabold">Sveiki, {b!.name.trim().split(/\s+/)[0]}!</p>}

              {/* Rezultāts — ja lēmums jau pieņemts */}
              {confirmed && (
                <div role="status" className="mt-5 flex items-start gap-4 rounded-2xl bg-brand p-5">
                  <CircleCheck className="mt-0.5 size-7 shrink-0" aria-hidden />
                  <div>
                    <p className="font-extrabold">Paldies! Rezervācija ir apstiprināta.</p>
                    <p className="mt-1 leading-6">Tiekamies, lai radītu smaidu!</p>
                  </div>
                </div>
              )}
              {cancelled && (
                <div role="status" className="mt-5 flex items-start gap-4 rounded-2xl bg-surface p-5">
                  <CircleX className="mt-0.5 size-7 shrink-0" aria-hidden />
                  <div>
                    <p className="font-extrabold">{cancelledByClient ? "Rezervācija ir atcelta." : "Šī rezervācija vairs nav spēkā."}</p>
                    <p className="mt-1 leading-6">
                      Ja tā ir kļūda vai vēlaties rezervēt no jauna, zvaniet mums:{" "}
                      <a href={`tel:${tel}`} className="font-bold whitespace-nowrap underline">
                        {phone}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}

              {/* Rezervācijas dati */}
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {rows
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="flex justify-between gap-6 py-3">
                      <dt className="shrink-0 text-ink-soft">{label}</dt>
                      <dd className="text-right font-bold">{v}</dd>
                    </div>
                  ))}
              </dl>

              {/* Izmaksas — tās pašas, kas apstiprinājuma e-pastā */}
              {costs && !cancelled && (
                <div className="mt-6 rounded-2xl bg-surface p-5">
                  <p className="text-xs font-extrabold tracking-[0.14em] text-ink-soft uppercase">Izmaksas</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    {costLines.map((l) => (
                      <div key={l.label} className="flex justify-between gap-4">
                        <dt>
                          {l.kind === "program" ? `Izklaides programma “${l.label}”` : l.label}
                          {l.kind === "program" && l.note && <span className="block text-xs text-ink-soft">{l.note}</span>}
                        </dt>
                        <dd className="font-bold whitespace-nowrap">{amountText(l)}</dd>
                      </div>
                    ))}
                    {costLines.length > 1 && costs.exact && (
                      <div className="flex items-end justify-between gap-4 border-t border-line pt-3">
                        <dt className="text-base font-extrabold">Kopā</dt>
                        <dd className="font-display text-2xl leading-none font-extrabold">{eur(costs.total)}</dd>
                      </div>
                    )}
                  </dl>
                  {costs.plusVat && <p className="mt-3 text-sm text-ink-soft">{VAT_NOTE}</p>}
                </div>
              )}

              {/* Lēmums — tikai vienreiz: apstiprināt vai atcelt */}
              {open && (
                <div className="mt-6">
                  <form action={confirmBooking.bind(null, id, k)}>
                    <button type="submit" className={cn(buttonClass("primary", "lg"), "w-full")}>
                      Apstiprinu rezervāciju
                    </button>
                  </form>
                  <details open={atcelt === "1"} className="group mt-4 text-center">
                    <summary className="inline-block cursor-pointer list-none text-sm font-semibold text-ink-soft underline underline-offset-4 hover:text-ink [&::-webkit-details-marker]:hidden">
                      Atcelt rezervāciju
                    </summary>
                    <div className="mt-4 rounded-2xl bg-red-50 p-5 text-left text-sm leading-6 ring-1 ring-red-200">
                      <p className="font-extrabold text-red-800">Vai tiešām atcelt rezervāciju?</p>
                      <p className="mt-1 text-red-800">Rezervētais laiks tiks atbrīvots, un to varēs aizņemt cits.</p>
                      <form action={cancelBooking.bind(null, id, k)} className="mt-4">
                        <button
                          type="submit"
                          className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-red-800"
                        >
                          Jā, atcelt rezervāciju
                        </button>
                      </form>
                    </div>
                  </details>
                </div>
              )}

              {inVenue && !cancelled && (
                <p className="mt-6 text-sm leading-6">
                  Lūdzam iepazīties ar{" "}
                  <Link href="/telpu-noma#noteikumi" target="_blank" className="link-underline">
                    telpu lietošanas noteikumiem
                  </Link>
                  .
                </p>
              )}

              {!cancelled && (
                <p className={cn("text-sm leading-6 text-ink-soft", inVenue ? "mt-2" : "mt-6")}>
                  {confirmed
                    ? "Ja kas mainās vai rezervācija jāatceļ, lūdzu, sūtiet SMS uz tālr. "
                    : "Jautājumu gadījumā zvaniet vai sūtiet SMS uz tālr. "}
                  <a href={`sms:${tel}`} className="font-semibold whitespace-nowrap text-ink">
                    {phone}
                  </a>
                  .
                </p>
              )}
            </>
          )}
        </div>

        {(confirmed || cancelled) && (
          <ButtonLink href="/" variant="ghostLight" className="mt-8">
            Uz sākumlapu
          </ButtonLink>
        )}
      </Container>
    </section>
  );
}
