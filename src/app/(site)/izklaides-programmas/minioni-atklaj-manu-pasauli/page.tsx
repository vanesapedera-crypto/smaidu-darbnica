import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import InquiryForm from "@/components/site/InquiryForm";
import Photo from "@/components/site/Photo";
import ProgramPhotos from "@/components/site/ProgramPhotos";
import { StageHeading } from "@/components/site/stage";
import { ButtonLink, Container, Section } from "@/components/site/ui";
import { getService } from "@/lib/content/queries";
import { eur } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

const SLUG = "minioni-atklaj-manu-pasauli";
const PATH = `/izklaides-programmas/${SLUG}`;
/** Minioni bez fona (lapas galvenē uz dzeltena apļa) */
const CUTOUT = "/media/minioni/minioni-01.webp";

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
 * Lapa "Minioni atklāj maņu pasauli!" — izrāde bērnudārziem: piedāvājums un pieprasījuma forma vienā lapā.
 * Saturs nāk no programmas ieraksta (panelī "Pakalpojumi" vai defaults/private-services.ts):
 *  - `title` — virsraksts (pēdējie divi vārdi — dzeltenā krāsā), `excerpt` — uzlīme virs tā, `intro` — jautājums zem tā;
 *  - `body` — ievada teksts, `highlights` — maņas ("Redze — apraksts"), `suitableFor` — noslēguma teikumi;
 *  - `duration` un `pricing` — ilgums un cena par bērnu.
 * Pieteikšanās — pieprasījuma forma (InquiryForm `kindergarten`), pieprasījumi nonāk panelī un e-pastā.
 */
export default async function MinionsShowPage() {
  const program = await getService("private", SLUG);
  if (!program) notFound();

  const words = program.title.trim().split(/\s+/);
  const price = program.pricing[0]?.options[0]?.price ?? null;
  const senses = program.highlights.map((h) => {
    const [name, ...rest] = h.split(/\s+[—–-]\s+/);
    return { name, text: rest.join(" — ") };
  });
  const [quote, ...closing] = program.suitableFor;
  const facts = [
    { label: "Izrādes ilgums", value: program.duration },
    price !== null && { label: "Samaksa", value: `${eur(price)} no bērna` },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      {/* Galvene: tumšs fons, minioni uz dzeltena apļa (kā piedāvājumā) */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1.6px)] [background-size:28px_28px]"
        />
        <Container className="grid items-center gap-10 pt-10 pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pt-14">
          <div className="pb-6 lg:pb-20">
            <nav aria-label="Navigācija" className="mb-8 flex flex-wrap items-center gap-1 text-sm text-white/60">
              <Link href="/" className="hover:text-white">Sākums</Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <Link href="/izklaides-programmas" className="hover:text-white">Izklaides programmas</Link>
              <ChevronRight className="size-3.5" aria-hidden />
              <span className="text-white">{program.title}</span>
            </nav>
            <span className="inline-block -rotate-2 rounded-lg bg-brand px-3.5 py-2 font-display text-xs leading-snug font-extrabold text-ink uppercase sm:text-sm">{program.excerpt}</span>
            <h1 className="display mt-6 text-[length:min(2.6rem,10vw)] leading-[1.05] sm:text-5xl lg:text-6xl">
              {words.slice(0, -2).join(" ")} <span className="text-brand">{words.slice(-2).join(" ")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-xl leading-8 font-bold italic">{program.intro}</p>
            <dl className="mt-8 flex flex-wrap gap-3">
              {facts.map((f) => (
                <div key={f.label} className="rounded-2xl bg-brand px-5 py-3 text-ink">
                  <dt className="text-xs font-extrabold tracking-[0.12em] uppercase opacity-70">{f.label}</dt>
                  <dd className="font-display text-xl font-extrabold">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#pieteikt" size="lg" arrow>
                Pieteikt izrādi
              </ButtonLink>
              <ButtonLink href="#par-izradi" size="lg" variant="ghostLight">
                Par izrādi
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px] self-end">
            <div aria-hidden className="absolute inset-x-[6%] top-[8%] aspect-square rounded-full bg-[radial-gradient(circle_at_40%_35%,#ffe27a,#ffd54a_55%,#f5c518)]" />
            <Photo
              src={CUTOUT}
              alt="Minioni — Smaidu Darbnīcas izrāde"
              width={1062}
              height={1235}
              priority
              sizes="(min-width: 1024px) 520px, 90vw"
              className="relative h-auto w-full drop-shadow-[0_18px_22px_rgba(0,0,0,0.35)]"
            />
          </div>
        </Container>
      </section>

      {/* Par izrādi: ievads un četras maņas */}
      <Section id="par-izradi" className="scroll-mt-20">
        <Container>
          <p className="max-w-3xl text-xl leading-9">{program.body}</p>
          <h2 className="mt-12 font-display text-sm font-extrabold tracking-[0.12em] uppercase">Ko bērni iepazīs izrādes laikā?</h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {senses.map((s, i) => (
              <li
                key={s.name}
                data-reveal
                style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}
                className="rounded-3xl border-t-8 border-brand bg-white p-6 ring-1 ring-line"
              >
                <p className="display text-xl">{s.name}</p>
                <p className="mt-2 leading-7 text-ink-soft">{s.text}</p>
              </li>
            ))}
          </ul>
          {quote && (
            <p className="mt-10 rounded-3xl bg-ink p-7 text-xl leading-8 font-bold text-white sm:p-9 sm:text-2xl">
              {quote}
            </p>
          )}
          {closing.map((c) => (
            <p key={c} className="mt-6 text-lg font-extrabold">
              {c}
            </p>
          ))}
        </Container>
      </Section>

      {/* Pieprasījums */}
      <ProgramPhotos slug={SLUG} className="bg-white" />

      <Section id="pieteikt" className="scroll-mt-20 bg-surface">
        <Container className="max-w-4xl">
          <StageHeading title="Pieteikt izrādi" highlight="bērnudārzā" text="Aicinām pieteikt izrādi savā bērnudārzā! Sazināsimies, lai vienotos par Jums ērtāko laiku." className="mb-10" />
          <InquiryForm kindergarten defaultService={SLUG} services={[{ slug: SLUG, title: program.title }]} />
        </Container>
      </Section>
    </>
  );
}
