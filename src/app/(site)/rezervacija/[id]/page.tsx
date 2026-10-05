import { CircleCheck } from "lucide-react";
import { Smile } from "@/components/site/stage";
import { ButtonLink, Container, buttonClass } from "@/components/site/ui";
import { clientBooking } from "@/lib/client-booking";
import { getServices, getSettings } from "@/lib/content/queries";
import { VENUE_SLOTS } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { confirmBooking } from "./actions";

// Personīga saite no e-pasta — meklētājiem to nerāda
export const metadata = { title: "Rezervācijas apstiprināšana", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ k?: string }> };

/**
 * Lapa, ko klients atver no apstiprinājuma e-pasta (vai WhatsApp / SMS atgādinājuma).
 * Rāda rezervācijas datumu, laiku un vietu un pogu "Apstiprinu rezervāciju".
 * Apstiprināšana notiek tikai ar pogas nospiešanu — pati saites atvēršana neko neapstiprina.
 */
export default async function ConfirmPage({ params, searchParams }: Props) {
  const [{ id }, { k = "" }] = await Promise.all([params, searchParams]);
  const [b, programs, { contact }] = await Promise.all([clientBooking(id, k), getServices("private"), getSettings()]);

  const valid = Boolean(b?.found);
  const cancelled = valid && b!.status !== "Apstiprināta";
  const done = valid && Boolean(b!.confirmed_at);
  const [y, m, d] = (b?.event_date ?? "").split("-");
  const start = b?.event_time?.slice(0, 5) ?? "";
  const rows: [string, string][] = valid
    ? [
        ["Datums", b!.event_date ? `${Number(d)}.${m}.${y}.` : ""],
        ["Laiks", VENUE_SLOTS.find((t) => t.value === start)?.label ?? start],
        ["Vieta", b!.location === "Izbraukums" ? (b!.address ?? "") : `Smaidu Darbnīca, ${contact.address}, ${contact.city}`],
        ["Izklaides programma", programs.find((p) => p.slug === b!.program)?.title ?? ""],
      ]
    : [];
  const phone = contact.phonePrivate;

  return (
    <section className="relative isolate overflow-hidden bg-ink py-16 text-white md:py-24">
      <Smile className="absolute -top-10 -right-10 -z-10 w-72 text-white/[0.06] md:w-[26rem]" />
      <Container className="max-w-2xl">
        <p className="text-sm font-extrabold tracking-[0.14em] text-brand uppercase">Smaidu Darbnīca</p>
        <h1 className="display mt-5 text-4xl sm:text-5xl md:text-6xl">
          {done ? (
            <>
              Rezervācija <span className="sticker-light">apstiprināta</span>
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
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline whitespace-nowrap">
                {phone}
              </a>
              .
            </p>
          ) : (
            <>
              {b!.name && <p className="text-lg font-extrabold">Sveiki, {b!.name.trim().split(/\s+/)[0]}!</p>}
              <dl className="mt-5 divide-y divide-line border-y border-line">
                {rows
                  .filter(([, v]) => v)
                  .map(([label, v]) => (
                    <div key={label} className="flex justify-between gap-6 py-3">
                      <dt className="text-ink-soft">{label}</dt>
                      <dd className="text-right font-bold">{v}</dd>
                    </div>
                  ))}
              </dl>

              {cancelled ? (
                <p className="mt-6 leading-7">
                  Šī rezervācija vairs nav spēkā. Ja tā ir kļūda, lūdzu, zvaniet mums:{" "}
                  <a href={`tel:${phone.replace(/\s/g, "")}`} className="link-underline whitespace-nowrap">
                    {phone}
                  </a>
                  .
                </p>
              ) : done ? (
                <div role="status" className="mt-6 flex items-start gap-4 rounded-2xl bg-brand p-5">
                  <CircleCheck className="mt-0.5 size-7 shrink-0" aria-hidden />
                  <div>
                    <p className="font-extrabold">Paldies! Rezervācija ir apstiprināta.</p>
                    <p className="mt-1 leading-6">Tiekamies, lai radītu smaidu!</p>
                  </div>
                </div>
              ) : (
                <form action={confirmBooking.bind(null, id, k)} className="mt-6">
                  <button type="submit" className={cn(buttonClass("primary", "lg"), "w-full")}>
                    Apstiprinu rezervāciju
                  </button>
                </form>
              )}

              <p className="mt-6 text-sm leading-6 text-ink-soft">
                Ja kas mainās vai rezervācija jāatceļ, lūdzu, sūtiet SMS uz tālr.{" "}
                <a href={`sms:${phone.replace(/\s/g, "")}`} className="font-semibold text-ink whitespace-nowrap">
                  {phone}
                </a>
                .
              </p>
            </>
          )}
        </div>

        {done && (
          <ButtonLink href="/" variant="ghostLight" className="mt-8">
            Uz sākumlapu
          </ButtonLink>
        )}
      </Container>
    </section>
  );
}
