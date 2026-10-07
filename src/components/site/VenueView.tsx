import { Baby, Clock, Coffee, Disc3, Gamepad2, MapPin, Mountain, ScrollText, Sparkles } from "lucide-react";
import OpenOnHash from "./OpenOnHash";
import PhotoReel from "./PhotoReel";
import RichText from "./RichText";
import { StageHeading, StageHero } from "./stage";
import { ButtonLink, Container } from "./ui";
import { toReel } from "@/lib/content/media";
import { getCategoryImages, getSettings } from "@/lib/content/queries";
import type { GalleryImage, VenueSettings } from "@/lib/content/types";
import { VENUE_SLOTS } from "@/lib/pricing";

/**
 * Sadaļa "Telpu noma": galvene, apraksts ar aprīkojumu, cenu kartīte ar noteikumiem un foto lente.
 * Teksti un cenas — panelī "Telpu noma".
 */

// Ikonas aprīkojumam (pēc kārtas)
const ICONS = [Sparkles, Gamepad2, Baby, Disc3, Mountain, Coffee];

/** Cenu rindas — cenas rediģē panelī (Telpu noma → Cenas) */
const prices = (venue: VenueSettings) => [
  { title: "Pirmdiena–ceturtdiena", note: "3 stundas", price: `${venue.priceWeekday} €` },
  { title: "Piektdiena–svētdiena", note: "3 stundas", price: `${venue.priceWeekend} €` },
  { title: "Papildu stunda", note: "Iepriekš vienojoties", price: `${venue.priceExtraHour} €` },
];

const BOOK = "/izklaides-programmas/pieteikt";

export default async function VenueView() {
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
        photos={[{ src: venue.heroImage, caption: "Smaidu Darbnīcas telpas" }]}
      >
        <ButtonLink href={BOOK} size="lg" arrow>
          Rezervēt telpas
        </ButtonLink>
        <ButtonLink href="#cenas" size="lg" variant="ghostLight">
          Cenas
        </ButtonLink>
      </StageHero>

      <Content venue={venue} address={address} />
      {/* Galerija — foto lente ar visām telpu bildēm (albums "Mūsu telpas") */}
      <Gallery photos={photos} />
    </>
  );
}

/* ── Elementi ──────────────────────────────────────────────────────── */

/** Aprīkojums kompaktā sarakstā ar ikonām */
function Features({ venue }: { venue: VenueSettings }) {
  return (
    <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
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

/** Noteikumi — atveramā sadaļā */
function Rules({ venue }: { venue: VenueSettings }) {
  if (!venue.rules.trim()) return null;
  return (
    <details id="noteikumi" className="group scroll-mt-24 rounded-2xl bg-white ring-1 ring-line">
      <OpenOnHash id="noteikumi" />
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

/* ── Apraksts un cenas ─────────────────────────────────────────────── */
function Content({ venue, address }: { venue: VenueSettings; address: string }) {
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
                {prices(venue).map((p) => (
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
      </Container>
    </section>
  );
}

/** Foto lente */
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
