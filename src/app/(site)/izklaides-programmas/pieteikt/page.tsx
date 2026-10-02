import BookingForm from "@/components/site/BookingForm";
import { Smile } from "@/components/site/stage";
import { Container, Section } from "@/components/site/ui";
import { getServices, getSettings } from "@/lib/content/queries";
import { parseExtras, smallGroupMax } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export function generateMetadata() {
  return pageMetadata({
    path: "/izklaides-programmas/pieteikt",
    title: "Rezervēt ballīti vai telpas",
    description: "Pieteikums bērnu ballītei vai telpu nomai Smaidu Darbnīcā Tukumā vai izbraukumā.",
  });
}

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  const [{ program }, programs, settings] = await Promise.all([searchParams, getServices("private"), getSettings()]);
  const selected = programs.some((p) => p.slug === program) ? program : "";

  return (
    <>
      <section className="relative isolate overflow-hidden bg-surface pt-10 pb-28 md:pt-14">
        <Smile className="absolute -top-10 -right-10 -z-10 w-72 text-ink/[0.07] md:w-96" />
        <Container className="max-w-3xl">
          <p className="text-sm font-extrabold tracking-[0.14em] uppercase">Izklaides programmas · Telpu noma</p>
          <h1 className="display mt-5 text-4xl md:text-6xl">
            Rezervēt <span className="sticker">ballīti</span>
          </h1>
          <p className="mt-5 text-lg leading-8 font-medium">
            Aizpildiet formu, un mēs sazināsimies, lai apstiprinātu datumu. Jautājumi? Zvaniet{" "}
            <a href={`tel:${settings.contact.phonePrivate.replace(/\s/g, "")}`} className="font-extrabold underline decoration-2 underline-offset-4">
              {settings.contact.phonePrivate}
            </a>
            .
          </p>
        </Container>
      </section>
      <Section className="-mt-20 pt-0 md:pt-0">
        <Container className="max-w-3xl">
          <BookingForm
            key={selected}
            defaultProgram={selected}
            programs={programs.map(({ slug, title, pricing, pricingNote, body }) => ({
              slug,
              title,
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
