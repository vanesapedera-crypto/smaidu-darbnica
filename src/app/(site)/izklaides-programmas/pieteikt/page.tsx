import BookingForm from "@/components/site/BookingForm";
import { Smile } from "@/components/site/stage";
import { Container, Section } from "@/components/site/ui";
import { isGroupProgram } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingPrices, parseExtras, smallGroupMax } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return pageMetadata({
    path: "/izklaides-programmas/pieteikt",
    title: "Rezervēt ballīti vai telpas",
    description: "Pieteikums bērnu ballītei vai telpu nomai Smaidu Darbnīcā Tukumā vai izbraukumā.",
  });
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const [{ program }, all, settings] = await Promise.all([searchParams, getServices("private"), getSettings()]);
  // Programmām iestādēm (piem. "Ziemassvētki bērnudārzā") ir sava lapa ar savu formu — šeit tās neparādās
  const programs = all.filter((p) => !isGroupProgram(p.slug));
  const selected = programs.some((p) => p.slug === program) ? program : "";

  return (
    <>
      {/* Tumša "skatuves" galvene; forma zemāk daļēji uzbrauc tai virsū */}
      <section className="relative isolate overflow-hidden bg-ink pt-12 pb-32 text-white md:pt-16 md:pb-36">
        <Smile className="absolute -top-10 -right-10 -z-10 w-72 text-white/[0.06] md:w-[26rem]" />
        <Container className="max-w-6xl">
          <p className="text-sm font-extrabold tracking-[0.14em] text-brand uppercase">Izklaides programmas · Telpu noma</p>
          <h1 className="display mt-5 text-4xl sm:text-5xl md:text-7xl">
            Rezervēt <span className="sticker-light">ballīti</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/85">
            Aizpildiet formu, un mēs sazināsimies, lai apstiprinātu datumu. Jautājumi? Zvaniet{" "}
            <a
              href={`tel:${settings.contact.phonePrivate.replace(/\s/g, "")}`}
              className="font-extrabold whitespace-nowrap text-white underline decoration-brand decoration-2 underline-offset-4"
            >
              {settings.contact.phonePrivate}
            </a>
            .
          </p>
        </Container>
      </section>
      <Section className="-mt-24 pt-0 md:pt-0">
        <Container className="max-w-6xl">
          <BookingForm
            key={selected}
            defaultProgram={selected}
            prices={bookingPrices(settings)}
            programs={programs.map(({ slug, title, heroImage, pricing, pricingNote, body }) => ({
              slug,
              title,
              image: heroImage,
              pricing,
              note: pricingNote,
              // Papildu iespējas nolasa no programmas apraksta sadaļas "Papildu iespējas"
              extras: parseExtras(body),
              smallMax: smallGroupMax(pricing),
            }))}
          />
        </Container>
      </Section>
    </>
  );
}
