import { notFound } from "next/navigation";
import type { ConfiguratorPrices } from "@/components/site/OfferConfigurator";
import { Container, Section } from "@/components/site/ui";
import { fallbackImage } from "@/lib/salikt-images";
import { supabase } from "@/lib/supabase";
import { getSettings } from "@/lib/content/queries";

export const revalidate = 300;
export const metadata = { title: "Vairāk informācijas", robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ spele?: string }> };

/**
 * Lapas "Salikt piedāvājumu" informācijas lapa: radošās darbnīcas vai aktivitātes apraksts un bilde
 * (tie paši, kas prezentācijā; panelī — 💰 Cenas). Atveras jaunā cilnē, tāpēc klienta izvēle nepazūd.
 */
export default async function ConfiguratorInfoPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { spele } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase.rpc("configurator_prices");
  const prices = data as ConfiguratorPrices | null;
  const item = [...(prices?.workshops ?? []), ...(prices?.activities ?? [])].find((x) => x.id === id);
  if (!item) notFound();
  // Lielformāta spēle: nosaukums un bilde — konkrētās spēles, apraksts — kopīgais ("Lielformāta spēles")
  const game = spele ? (await getSettings()).business.games.find((g) => g.name === spele) : undefined;
  const title = game ? game.name : item.title;
  const image = game?.image || item.image || fallbackImage(item.title);
  const isWorkshop = prices?.workshops.some((w) => w.id === id);

  return (
    <Section>
      <Container className="max-w-3xl">
        <p className="text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase">{game ? "Lielformāta spēle" : isWorkshop ? "Radošā darbnīca" : "Papildu aktivitāte"}</p>
        <h1 className="display mt-2 text-4xl sm:text-5xl">{title}</h1>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element -- bilde no paneļa vai public/media
          <img src={image} alt={title} className={`mt-8 aspect-[4/3] w-full rounded-3xl ${game ? "bg-white object-contain p-6" : "object-cover"}`} />
        )}
        {item.description ? (
          <p className="mt-8 text-lg leading-8 whitespace-pre-line">{item.description}</p>
        ) : (
          <p className="mt-8 text-ink-soft">Apraksts vēl tiek gatavots — sīkāku informāciju sniegsim prezentācijā.</p>
        )}
        <p className="mt-10 text-sm text-ink-soft">Lai turpinātu salikt piedāvājumu, aizveriet šo cilni.</p>
      </Container>
    </Section>
  );
}
