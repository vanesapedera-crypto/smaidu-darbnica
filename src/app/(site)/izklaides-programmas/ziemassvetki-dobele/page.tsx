import { notFound } from "next/navigation";
import { Check, Clock, MapPin, Sparkles } from "lucide-react";
import BookingForm from "@/components/site/BookingForm";
import ProgramPhotos from "@/components/site/ProgramPhotos";
import { StageHeading, StageHero } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { FIXED_VENUES, PROGRAM_SLOTS } from "@/lib/bookings";
import { getService, getSettings } from "@/lib/content/queries";
import { bookingPrices, eur } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const SLUG = "ziemassvetki-dobele";
const PATH = `/izklaides-programmas/${SLUG}`;
const VENUE = FIXED_VENUES[SLUG];
/** Rezervācijas formā obligātā izvēle — nosaukums pieteikumā (ziņojuma rindā "Gardā aktivitāte: …") */
const CHOICE_LABEL = "Gardā aktivitāte";

export async function generateMetadata() {
  const program = await getService("private", SLUG);
  if (!program) return {};
  return pageMetadata({
    path: PATH,
    title: program.seoTitle || program.title,
    description: program.seoDescription || program.excerpt,
    image: program.heroImage,
  });
}

/**
 * Lapa "Ziemassvētki “Pilsētas mājā” Dobelē": piedāvājums un rezervācijas forma vienā lapā.
 * Saturs nāk no programmas ieraksta (panelī "Pakalpojumi" vai defaults/private-services.ts):
 *  - `excerpt` — lielais virsraksts (pēdējais vārds — izcelts), `intro` — teksts zem tā;
 *  - `highlights` — programmā iekļauts, `suitableFor` — piezīmes (piem. "Programmu vada 2 rūķi"), `duration` — ilgums;
 *  - `activities` — gardās aktivitātes, no kurām jāizvēlas viena (formā obligāta izvēle);
 *  - `pricing` — cena līdz 15 bērniem un par katru nākamo bērnu.
 * Norises vieta — FIXED_VENUES, rezervēt var tikai pirmdienas–ceturtdienas — ALLOWED_WEEKDAYS (lib/bookings.ts).
 */
export default async function DobeleXmasPage() {
  const [program, settings] = await Promise.all([getService("private", SLUG), getSettings()]);
  if (!program) notFound();

  const words = program.excerpt.trim().split(/\s+/);
  // Pieejamās dienas virs formas, piem. "Pieejamie laiki: 14., 15. un 16. decembris, plkst. 9.00–10.00, 11.00–12.00 un 13.00–14.00."
  const slots = PROGRAM_SLOTS[SLUG] ?? [];
  const days = slots.map((d) => new Date(`${d.date}T12:00:00`));
  const month = days[0]?.toLocaleDateString("lv-LV", { month: "long" }) ?? "";
  const join = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} un ${xs.at(-1)}` : (xs[0] ?? ""));
  const sameTimes = slots.every((d) => d.times.join() === slots[0]?.times.join());
  const range = (t: string) => `${Number(t.slice(0, 2))}.${t.slice(3)}–${Number(t.slice(0, 2)) + VENUE.hours}.${t.slice(3)}`;
  const slotsText = slots.length
    ? `Pieejamie laiki: ${join(days.map((d) => `${d.getDate()}.`))} ${month}${sameTimes ? `, plkst. ${join(slots[0].times.map(range))}` : ""}.`
    : undefined;
  const options = program.pricing[0]?.options ?? [];
  const base = options.find((o) => !/nākam/i.test(o.label));
  const extra = options.find((o) => /nākam/i.test(o.label));
  const choices = program.activities.map((a) => a.title);

  const facts = [
    { icon: MapPin, label: "Norises vieta", value: VENUE.name },
    { icon: Clock, label: "Ilgums", value: program.duration },
    ...program.suitableFor.map((s) => ({ icon: Sparkles, label: "", value: s })),
  ];

  return (
    <>
      <StageHero
        eyebrow={settings.home.xmasEyebrow}
        title={words.slice(0, -1).join(" ")}
        highlight={words.slice(-1)[0]}
        text={program.intro}
        crumbs={[
          { name: "Izklaides programmas", path: "/izklaides-programmas" },
          { name: program.title, path: PATH },
        ]}
        photos={[{ src: program.heroImage, caption: program.title }]}
      >
        <ButtonLink href="#rezervacija" size="lg" arrow>
          Rezervēt
        </ButtonLink>
        <ButtonLink href="#programma" size="lg" variant="ghostLight">
          Programma un cena
        </ButtonLink>
      </StageHero>

      <Section id="programma" className="scroll-mt-20">
        <Container>
          {/* Norises vieta, ilgums un kas vada */}
          <ul className="mb-8 grid gap-3 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <li key={value} className="flex items-center gap-4 rounded-2xl bg-surface p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  {label && <span className="block text-xs font-extrabold tracking-[0.14em] text-ink-soft uppercase">{label}</span>}
                  <span className="block font-extrabold">{value}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            {/* Programmā iekļauts + izvēle */}
            <article data-reveal className="rounded-[1.75rem] bg-ink p-7 text-white sm:p-9">
              <h2 className="display text-2xl sm:text-3xl">
                Programmā <span className="text-brand">iekļauts</span>
              </h2>
              <ul className="mt-6 space-y-3">
                {program.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-lg font-semibold">
                    <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-brand text-ink">
                      <Check className="size-4" strokeWidth={3} aria-hidden />
                    </span>
                    {h}
                  </li>
                ))}
              </ul>
              {choices.length > 0 && (
                <div className="mt-8 border-t border-white/15 pt-6">
                  <p className="text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Izvēle</p>
                  <p className="mt-2 text-white/75">Izvēlieties vienu gardo aktivitāti:</p>
                  <p className="mt-3 font-display text-lg leading-snug font-extrabold uppercase">
                    {choices.map((c, i) => (
                      <span key={c}>
                        {i > 0 && <span className="mx-2 font-sans text-base font-bold text-brand normal-case">vai</span>}
                        {c}
                      </span>
                    ))}
                  </p>
                </div>
              )}
            </article>

            {/* Cena */}
            {base?.price != null && (
              <article
                data-reveal
                style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
                className="flex flex-col items-center justify-center rounded-[1.75rem] bg-brand p-9 text-center text-ink"
              >
                <p className="text-xs font-extrabold tracking-[0.14em] uppercase">Cena</p>
                <p className="mt-3 font-display text-6xl font-extrabold">{eur(base.price)}</p>
                <p className="mt-3 text-lg font-extrabold">{base.label}</p>
                {extra?.price != null && <p className="mt-2 font-semibold">+{eur(extra.price)} par katru nākamo bērnu</p>}
              </article>
            )}
          </div>
        </Container>
      </Section>

      <ProgramPhotos slug={SLUG} exclude={[program.heroImage]} className="mb-16 bg-surface md:mb-24" />

      <Section id="rezervacija" className="scroll-mt-20 pt-0 md:pt-0">
        <Container>
          <StageHeading title="Rezervēt" highlight="laiku" text={slotsText} className="mb-10 md:mb-12" />
          <BookingForm
            defaultProgram={SLUG}
            institution={{ nameLabel: "Grupa (bērnudārzs, skola u. c.)", addressLabel: "", plusVat: false }}
            venue={VENUE}
            choice={choices.length > 0 ? { label: CHOICE_LABEL, title: "Izvēlieties vienu gardo aktivitāti", options: choices } : undefined}
            prices={bookingPrices(settings)}
            programs={[{ slug: program.slug, title: program.title, image: program.heroImage, pricing: program.pricing }]}
          />
        </Container>
      </Section>
    </>
  );
}
