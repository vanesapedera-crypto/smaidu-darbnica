import { Baby, Check, Clock, Gift, Phone, Users } from "lucide-react";
import type { GalleryImage, Service, SiteSettings } from "@/lib/content/types";
import { SERVICE_HERO_VIDEO, SERVICE_PHOTOS_PORTRAIT, SERVICE_PHOTOS_SQUARE } from "@/lib/content/defaults/service-media";
import { toReel } from "@/lib/content/media";
import { serviceSchema } from "@/lib/schema";
import JsonLd from "./JsonLd";
import CharactersGrid from "./CharactersGrid";
import GamesGrid from "./GamesGrid";
import Photo from "./Photo";
import PhotoReel from "./PhotoReel";
import { CtaBand } from "./sections";
import RichText from "./RichText";
import { StageHeading, StageHero } from "./stage";
import { ButtonLink, Container, Section } from "./ui";

/** Pakalpojumi, kuru lapas galvenē lielais virsraksts ir programmas nosaukums (piem. "Party Trip") */
const HERO_BRAND: Record<string, string> = { "lielformata-speles": "Party Trip" };

/**
 * Pakalpojuma / programmas lapa. Viena veidne gan uzņēmumu pakalpojumiem,
 * gan izklaides programmām — atšķiras adrese un aicinājums uz darbību.
 */
export default function ServiceDetail({
  service,
  images,
  settings,
}: {
  service: Service;
  images: GalleryImage[];
  /** Vietnes iestatījumi: kontakti, spēļu un tēlu saraksti, pakalpojumu bildes, izbraukuma cenas */
  settings: SiteSettings;
}) {
  const { contact, business, programs } = settings;
  const isBusiness = service.audience === "business";
  const base = isBusiness ? "/uznemumiem" : "/izklaides-programmas";
  const path = `${base}/${service.slug}`;
  const ctaHref = isBusiness
    ? `/kontakti?pakalpojums=${service.slug}#pieprasijums`
    : `/izklaides-programmas/pieteikt?program=${service.slug}`;
  const ctaLabel = isBusiness ? "Saņemt piedāvājumu" : "Rezervēt ballīti";
  const phone = isBusiness ? contact.phoneBusiness : contact.phonePrivate;

  // Pilnais bloks (apraksts + sānu kartīte) — tikai, ja ir apraksts, galvenie punkti vai cenas.
  // Ja ir tikai norises soļi, tos rāda kā kompaktu joslu (piem. "Lielformāta spēles").
  const hasMain = Boolean(service.intro || service.body) || service.highlights.length > 0 || service.pricing.length > 0;
  const compactSteps = !hasMain && service.activities.length > 0;

  const facts = [
    { icon: Clock, label: "Ilgums", value: service.duration },
    { icon: Users, label: "Dalībnieki", value: service.participants },
    { icon: Baby, label: "Vecums", value: service.age },
  ].filter((f) => f.value);
  // Uzņēmumu pakalpojumiem ilgumu un apjomu saskaņo ar katru klientu individuāli
  if (service.audience === "business" && !service.duration && !service.participants) {
    facts.unshift({ icon: Clock, label: "Ilgums un apjoms", value: "Saskaņojam ar jums" });
  }

  // Galvenē: pakalpojuma bilde + divas no tā galerijas
  const heroPhotos = [
    { src: service.heroImage || images[0]?.src, caption: service.title },
    ...images.filter((i) => i.src !== service.heroImage).slice(0, 2).map((i) => ({ src: i.src })),
  ].filter((p): p is { src: string; caption?: string } => Boolean(p.src));

  const photos = isBusiness ? (business.servicePhotos[service.slug] ?? []) : [];
  // Piezīme par izbraukuma izmaksām (ballītēm) — no paneļa cenām; rāda, ja programmai nav savas piezīmes
  const money = (n: number) => `${n.toLocaleString("lv-LV", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;
  const pricingNote =
    service.pricingNote ||
    (isBusiness
      ? ""
      : `Izbraukuma ballītēm tālāk par ${programs.freeTravelKm} km no Smaidu Darbnīcas tiek pieskaitīta izbraukuma piemaksa ${money(programs.travelSurcharge)} un ceļa izdevumi ${money(programs.travelRate)}/km.`);
  const portrait = SERVICE_PHOTOS_PORTRAIT.has(service.slug);
  const square = SERVICE_PHOTOS_SQUARE.has(service.slug);

  // Programma "Pārsteiguma tēls": galerijas vietā — tēlu režģis ar nosaukumiem
  const hasCharacters = !isBusiness && service.slug === "parsteiguma-tels";

  // Programmas zīmols lielajā virsrakstā (pakalpojuma nosaukums tad ir mazajā uzrakstā virs tā)
  const brand = HERO_BRAND[service.slug];

  // Bilžu režģis (ja pakalpojumam ir bildes, sk. defaults/service-media.ts)
  const photoGrid = photos.length > 0 && (
    <section className="py-12 md:py-16">
      <Container>
        <ul className={`grid grid-cols-2 gap-3 ${
            portrait
              ? `sm:grid-cols-3 md:grid-cols-4 ${photos.length % 5 === 0 ? "lg:grid-cols-5" : "lg:grid-cols-6"}`
              : photos.length % 5 !== 0 && photos.length % 4 === 0
                ? "md:grid-cols-4" // 4, 8, 12 bildes — pilnas rindas pa četrām
                : "md:grid-cols-4 lg:grid-cols-5"
          }`}>
          {photos.map((src) => (
            <li
              key={src}
              data-reveal
              className={`relative overflow-hidden rounded-2xl bg-surface ${portrait ? "aspect-[3/4]" : square ? "aspect-square" : "aspect-[4/3]"}`}
            >
              <Photo src={src} alt={service.title} fill sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, 50vw" className="object-cover" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );

  return (
    <>
      <StageHero
        eyebrow={brand ? service.title : isBusiness ? "Uzņēmumiem" : "Izklaides programma"}
        title={brand ?? service.title}
        text={service.excerpt}
        video={SERVICE_HERO_VIDEO[service.slug]}
        photos={heroPhotos.length ? heroPhotos : [{ src: "/media/smaidu-darbnica/smaidu-darbnica-09.webp" }]}
        crumbs={[
          isBusiness ? { name: "Uzņēmumiem", path: "/uznemumiem" } : { name: "Izklaides programmas", path: "/izklaides-programmas" },
          { name: service.title, path },
        ]}
      >
        <ButtonLink href={ctaHref} size="lg" arrow>
          {ctaLabel}
        </ButtonLink>
      </StageHero>

      {/* Kompakta josla: ko mēs nodrošinām (soļi vienā rindā) */}
      {compactSteps && (
        <section className="border-b border-line py-10 md:py-12">
          <Container>
            <ol
              className={`grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 ${
                { 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 5: "lg:grid-cols-5" }[service.activities.length] ?? "lg:grid-cols-4"
              }`}
            >
              {service.activities.map((a, i) => (
                <li key={a.title} className="flex gap-3.5">
                  <span className="font-display text-xl leading-7 font-extrabold text-brand-strong">{String(i + 1).padStart(2, "0")}</span>
                  <span>
                    <span className="block font-extrabold">{a.title}</span>
                    {a.description && <span className="mt-1 block text-sm leading-6 text-ink-soft">{a.description}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* Bilžu režģis: lapās bez pilnā bloka — uzreiz zem joslas; ar pilno bloku (piem. cenām) — zem tā */}
      {!hasMain && photoGrid}

      {/* Apraksts + galvenie fakti (pilnais bloks) */}
      {hasMain && (
      <Section>
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-20">
          <div>
            {service.intro && (
              <p data-reveal className="text-xl leading-9 font-semibold md:text-2xl md:leading-10">
                {service.intro}
              </p>
            )}
            {/* Programmas gaita — tajā pašā sadaļā, numurēts saraksts */}
            {service.activities.length > 0 && (
              <div data-reveal className="mt-10">
                <h2 className="text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase">
                  {isBusiness ? "Kā tas notiek" : "Ballītes gaita"}
                </h2>
                <ol className="mt-5 divide-y divide-line border-y border-line">
                  {service.activities.map((a, i) => (
                    <li key={a.title} className="flex gap-5 py-4">
                      <span className="w-8 shrink-0 font-display text-xl font-extrabold text-brand-strong">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <p className="leading-7">
                        <span className="font-extrabold">{a.title}</span>
                        {a.description && <span className="text-ink-soft"> — {a.description}</span>}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {service.body.trim() && (
              <div data-reveal className="mt-8">
                <RichText text={service.body} />
              </div>
            )}

            {service.highlights.length > 0 && (
              <ul data-reveal className="mt-12 grid gap-3 sm:grid-cols-2">
                {service.highlights.map((h) =>
                  // "🎁 …" — dāvana dalībniekiem, izcelta atsevišķā kartītē
                  h.startsWith("🎁") ? (
                    <li key={h} className="flex items-center gap-4 rounded-2xl bg-brand p-5 sm:col-span-2">
                      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-brand">
                        <Gift className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-xs font-extrabold tracking-[0.12em] uppercase">Dāvanā</span>
                        <span className="text-lg font-extrabold">{h.replace(/^🎁\s*/, "").replace(/^Dāvanā\s*/i, "").replace(/^—\s*/, "")}</span>
                      </span>
                    </li>
                  ) : (
                    <li key={h} className="flex items-start gap-3 rounded-2xl bg-brand-soft p-4 font-semibold">
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ink text-brand">
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      {h}
                    </li>
                  ),
                )}
              </ul>
            )}
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rotate-1 rounded-[1.75rem] bg-ink p-7 text-white md:p-8">
              {facts.length > 0 && (
                <dl className="space-y-5">
                  {facts.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-ink">
                        <Icon className="size-4.5" aria-hidden />
                      </span>
                      <div>
                        <dt className="text-sm text-white/60">{label}</dt>
                        <dd className="font-bold">{value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
              {/* Cenas (izklaides programmām) — kartītē, lai nebūtu atsevišķas sadaļas */}
              {service.pricing.length > 0 && (
                <div className="mt-7 space-y-5 border-t border-white/10 pt-6">
                  {service.pricing.map((group) => (
                    <div key={group.title}>
                      <p className="text-xs font-extrabold tracking-[0.1em] text-brand uppercase">{group.title}</p>
                      <dl className="mt-2 divide-y divide-white/10">
                        {group.options.map((o) => (
                          <div key={o.label} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                            <dt className="text-white/80">{o.label}</dt>
                            <dd className="font-extrabold whitespace-nowrap">{o.price === null
                              ? "Pēc vienošanās"
                              : `${Number.isInteger(o.price) ? o.price : o.price.toFixed(2).replace(".", ",")} €`}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              )}
              {pricingNote && <p className="mt-5 text-sm leading-6 text-white/60">{pricingNote}</p>}

              {isBusiness && service.suitableFor.length > 0 && (
                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-sm text-white/60">Piemērots</p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {service.suitableFor.map((s) => (
                      <li key={s} className="rounded-full bg-white/10 px-3 py-1.5 text-sm">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ButtonLink href={ctaHref} className="mt-8 w-full" arrow>
                {ctaLabel}
              </ButtonLink>
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-white/80 hover:text-brand"
              >
                <Phone className="size-4" aria-hidden /> {phone}
              </a>
            </div>
          </aside>
        </Container>
      </Section>
      )}

      {hasMain && photoGrid}

      {/* Lielformāta spēles — visu spēļu režģis */}
      {isBusiness && service.slug === "lielformata-speles" && <GamesGrid games={business.games} />}

      {/* Pārsteiguma tēls — pieejamie tēli ar bildēm (galerijas vietā: mapē ir tieši šīs bildes) */}
      {hasCharacters && <CharactersGrid characters={programs.characters} />}

      {/* Izklaides programmām — fotogrāfijas no ballītēm */}
      {!isBusiness && !hasCharacters && images.length > 0 && (
        <section className="overflow-hidden bg-surface pt-20 pb-12 md:pt-28">
          <Container>
            <StageHeading eyebrow="Foto" title="No mūsu" highlight="ballītēm" />
          </Container>
          <PhotoReel images={toReel(images)} />
        </section>
      )}

      {/* Uzņēmumiem — īss bloks ar pogu; pati forma ir lapā "Kontakti" (ar priekšatlasītu pakalpojumu) */}
      {isBusiness && (
        <CtaBand
          title="Plānojat pasākumu?"
          text={`Pastāstiet par savu pasākumu — sagatavosim programmu un cenu piedāvājumu: ${service.title.toLowerCase()}.`}
          contact={contact}
          href={ctaHref}
          label={ctaLabel}
        />
      )}

      <JsonLd data={serviceSchema(service, path)} />
    </>
  );
}
