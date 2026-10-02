import { Baby, Check, Clock, Coffee, Disc3, Gamepad2, MapPin, Mountain, ScrollText, Sparkles } from "lucide-react";
import Photo from "./Photo";
import PhotoReel from "./PhotoReel";
import RichText from "./RichText";
import Tabs from "./Tabs";
import { StageHeading, StageHero } from "./stage";
import { ButtonLink, Container } from "./ui";
import { toReel } from "@/lib/content/media";
import { getCategoryImages, getSettings } from "@/lib/content/queries";
import type { GalleryImage, VenueSettings } from "@/lib/content/types";
import { VENUE_PRICE, VENUE_SLOTS } from "@/lib/pricing";

/**
 * Sadaļa "Telpu noma". Trīs kompakti izkārtojumi:
 *  - "kartite"  — viena sekcija: kreisajā pusē apraksts, aprīkojums un "Cenā iekļauts", labajā — tumša cenu kartīte;
 *  - "bento"    — foto režģis + īss apraksts, zem tā viena cenu josla;
 *  - "cilnes"   — viss vienā blokā cilnēs: Telpas · Cenas · Noteikumi · Foto.
 * Teksti — panelī "Telpu noma"; cenas — src/lib/pricing.ts.
 */
export type VenueVariant = "kartite" | "bento" | "cilnes";

// Ikonas aprīkojumam (pēc kārtas)
const ICONS = [Sparkles, Gamepad2, Baby, Disc3, Mountain, Coffee];

const PRICES = [
  { title: "Pirmdiena–ceturtdiena", note: "3 stundas", price: `${VENUE_PRICE.weekday} €` },
  { title: "Piektdiena–svētdiena", note: "3 stundas", price: `${VENUE_PRICE.weekend} €` },
  { title: "Papildu stunda", note: "Iepriekš vienojoties", price: "20 €" },
];

const BOOK = "/izklaides-programmas/pieteikt";

export default async function VenueView({ variant }: { variant: VenueVariant }) {
  const [photos, { venue, contact }] = await Promise.all([getCategoryImages(["telpas"], 24), getSettings()]);
  const address = `${contact.address}, ${contact.city}, ${contact.postalCode}`;

  return (
    <>
      <StageHero
        eyebrow="Telpu noma · Tukums"
        title={venue.heroTitle}
        highlight={venue.heroHighlight}
        after={venue.heroAfter}
        text={venue.heroText}
        crumbs={[{ name: "Telpu noma", path: "/telpu-noma" }]}
        photos={[{ src: "/media/telpas/telpas-26.webp", caption: "Bumbu baseins" }]}
      >
        <ButtonLink href={BOOK} size="lg" arrow>
          Rezervēt telpas
        </ButtonLink>
        <ButtonLink href="#cenas" size="lg" variant="ghostLight">
          Cenas
        </ButtonLink>
      </StageHero>

      {variant === "kartite" && <CardLayout venue={venue} photos={photos} />}
      {variant === "bento" && <BentoLayout venue={venue} photos={photos} address={address} />}
      {variant === "cilnes" && <TabsLayout venue={venue} photos={photos} />}
    </>
  );
}

type LayoutProps = { venue: VenueSettings; photos: GalleryImage[] };

/* ── Kopīgie elementi ──────────────────────────────────────────────── */

/** Aprīkojums kompaktā sarakstā ar ikonām */
function Features({ venue, cols = 2 }: { venue: VenueSettings; cols?: 2 | 3 }) {
  return (
    <ul className={`grid gap-x-8 gap-y-5 sm:grid-cols-2 ${cols === 3 ? "lg:grid-cols-3" : ""}`}>
      {venue.features.map(({ title, description }, i) => {
        const Icon = ICONS[i % ICONS.length];
        return (
          <li key={title} className="flex gap-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand">
              <Icon className="size-4.5" aria-hidden />
            </span>
            <span>
              <span className="block font-extrabold">{title}</span>
              <span className="mt-0.5 block text-sm leading-6 text-ink-soft">{description}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function Included({ venue, light = false }: { venue: VenueSettings; light?: boolean }) {
  if (venue.included.length === 0) return null;
  return (
    <ul className="space-y-2.5">
      {venue.included.map((item) => (
        <li key={item} className={`flex items-start gap-3 text-sm leading-6 ${light ? "text-white/80" : ""}`}>
          <Check className={`mt-0.5 size-4 shrink-0 ${light ? "text-brand" : "text-ink"}`} strokeWidth={3} aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Cenu rindas (tumšai kartītei) */
function PriceRows() {
  return (
    <dl className="divide-y divide-white/10">
      {PRICES.map((p) => (
        <div key={p.title} className="flex items-baseline justify-between gap-4 py-3.5">
          <dt>
            <span className="block font-bold">{p.title}</span>
            <span className="text-sm text-white/55">{p.note}</span>
          </dt>
          <dd className="font-display text-3xl font-extrabold text-brand">{p.price}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Noteikumi — atveramā sadaļā */
function Rules({ venue }: { venue: VenueSettings }) {
  if (!venue.rules.trim()) return null;
  return (
    <details id="noteikumi" className="group scroll-mt-24 rounded-2xl bg-white ring-1 ring-line">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5 font-extrabold [&::-webkit-details-marker]:hidden">
        <ScrollText className="size-5 shrink-0" aria-hidden />
        <span className="flex-1">Telpu lietošanas noteikumi</span>
        <span className="grid size-8 place-items-center rounded-full bg-brand text-lg transition-transform group-open:rotate-45" aria-hidden>
          +
        </span>
      </summary>
      <div className="px-5 pb-6 sm:px-8">
        <RichText text={venue.rules} className="prose-sd prose-compact" />
      </div>
    </details>
  );
}

/* ── A: "Kartīte" ──────────────────────────────────────────────────── */
function CardLayout({ venue, photos }: LayoutProps) {
  return (
    <>
      <section id="cenas" className="scroll-mt-20 py-16 md:py-24">
        <Container className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <StageHeading eyebrow="Par telpām" title={venue.aboutTitle} />
            <RichText text={venue.about} className="prose-sd mt-6" />
            <div className="mt-10">
              <Features venue={venue} />
            </div>
            <div className="mt-10">
              <Rules venue={venue} />
            </div>
          </div>

          <aside className="md:sticky md:top-28 md:self-start">
            <div className="rounded-[1.75rem] bg-ink p-7 text-white md:p-8">
              <p className="text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Cenrādis</p>
              <div className="mt-3">
                <PriceRows />
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <Clock className="size-4" aria-hidden />
                Iespējamie laiki: {VENUE_SLOTS.map((t) => t.label).join(", ")}
              </p>
              <div className="mt-7 border-t border-white/10 pt-6">
                <p className="mb-4 text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Cenā iekļauts</p>
                <Included venue={venue} light />
              </div>
              <ButtonLink href={BOOK} size="lg" arrow className="mt-8 w-full justify-center">
                Rezervēt telpas
              </ButtonLink>
            </div>
          </aside>
        </Container>
      </section>
      <Gallery photos={photos} />
    </>
  );
}

/* ── B: "Bento" ────────────────────────────────────────────────────── */
function BentoLayout({ venue, photos, address }: LayoutProps & { address: string }) {
  const pick = photos.slice(0, 6); // neliela galerija — 6 bildes vienā rindā
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
          {/* Kreisajā pusē: apraksts, adrese, aprīkojums, noteikumi */}
          <div>
            <StageHeading eyebrow="Svinību telpas" title={venue.aboutTitle} />
            <RichText text={venue.about} className="prose-sd mt-5" />
            {/* Adrese — mazā rindā zem apraksta */}
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink-soft">
              <MapPin className="size-4 shrink-0 text-ink" aria-hidden />
              {address}
            </p>
            <div className="mt-10">
              <Features venue={venue} />
            </div>
          </div>

          {/* Labajā pusē: kompakta cenu kartīte (ritinot paliek redzama) */}
          <aside id="cenas" className="scroll-mt-24 md:sticky md:top-28 md:self-start">
            <div className="rounded-[1.5rem] bg-ink p-6 text-white md:p-7">
              <p className="text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Cenas</p>
              <dl className="mt-2 divide-y divide-white/10">
                {PRICES.map((p) => (
                  <div key={p.title} className="flex items-center justify-between gap-4 py-3">
                    <dt>
                      <span className="block font-bold">{p.title}</span>
                      <span className="text-sm text-white/55">{p.note}</span>
                    </dt>
                    <dd className="font-display text-2xl font-extrabold whitespace-nowrap text-brand">{p.price}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/65">
                <Clock className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                <span>Iespējamie laiki: {VENUE_SLOTS.map((t) => t.label).join(", ")}</span>
              </p>
              <ButtonLink href={BOOK} size="lg" arrow className="mt-6 w-full justify-center">
                Rezervēt telpas
              </ButtonLink>
            </div>
            <div className="mt-4">
              <Rules venue={venue} />
            </div>
          </aside>
        </div>

        {/* Neliela galerija */}
        {pick.length > 0 && (
          <ul className="mt-14 grid grid-cols-3 gap-3 md:grid-cols-6">
            {pick.map((p) => (
              <li key={p.src} className="relative aspect-square overflow-hidden rounded-xl bg-surface">
                <Photo src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover" />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}

/* ── C: "Cilnes" ───────────────────────────────────────────────────── */
function TabsLayout({ venue, photos }: LayoutProps) {
  const tabs = [
    {
      id: "telpas",
      label: "Telpas",
      content: (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <RichText text={venue.about} className="prose-sd" />
          <Features venue={venue} />
        </div>
      ),
    },
    {
      id: "cenas",
      label: "Cenas",
      content: (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-[1.5rem] bg-ink p-7 text-white">
            <PriceRows />
            <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
              <Clock className="size-4" aria-hidden />
              Iespējamie laiki: {VENUE_SLOTS.map((t) => t.label).join(", ")}
            </p>
          </div>
          <div>
            <p className="mb-4 font-display text-lg font-bold uppercase">Cenā iekļauts</p>
            <Included venue={venue} />
            <ButtonLink href={BOOK} size="lg" arrow className="mt-8">
              Rezervēt telpas
            </ButtonLink>
          </div>
        </div>
      ),
    },
    ...(venue.rules.trim()
      ? [{ id: "noteikumi", label: "Noteikumi", content: <RichText text={venue.rules} className="prose-sd prose-compact max-w-3xl" /> }]
      : []),
    ...(photos.length > 0
      ? [
          {
            id: "foto",
            label: "Foto",
            content: (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {photos.slice(0, 8).map((p) => (
                  <div key={p.src} className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
                    <Photo src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover" />
                  </div>
                ))}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <section className="py-16 md:py-24">
      <Container>
        <StageHeading eyebrow="Telpu noma" title={venue.aboutTitle} className="mb-10" />
        <Tabs tabs={tabs} defaultTab="telpas" />
      </Container>
    </section>
  );
}

/** Foto lente (A variantā) */
function Gallery({ photos }: { photos: GalleryImage[] }) {
  if (photos.length === 0) return null;
  return (
    <section className="overflow-hidden bg-surface pt-16 pb-10 md:pt-20">
      <Container>
        <StageHeading eyebrow="Foto" title="Ieskaties" highlight="telpās" />
      </Container>
      <PhotoReel images={toReel(photos)} />
    </section>
  );
}
