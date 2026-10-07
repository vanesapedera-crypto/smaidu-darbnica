import Link from "next/link";
import type { HomeSettings, Service } from "@/lib/content/types";
import Photo from "./Photo";
import { ServiceIcon } from "./icons";
import { ButtonLink, Container } from "./ui";

/*
 * Ziemassvētku sezonas bloki. Ieslēdz/izslēdz panelī (Sākumlapa → "Rādīt Ziemassvētku reklāmu").
 *  - XmasBanner: neliela reklāma sākumlapā
 *  - XmasFeature: pilns bloks lapā "Uzņēmumiem" ar Ziemassvētku piedāvājumiem
 */

// Sniegpārsliņu fons — viens neliels SVG raksts, kas atkārtojas (bez attēlu failiem)
const SNOW = "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22360%22 height=%22360%22 viewBox=%220 0 360 360%22><path d=%22M40.0 50.0L53.0 50.0M47.1 50.0L49.2 47.0M47.1 50.0L49.2 53.0M50.4 50.0L51.9 47.9M50.4 50.0L51.9 52.1M40.0 50.0L46.5 61.3M43.6 56.2L47.2 56.5M43.6 56.2L42.0 59.5M45.2 59.0L47.8 59.2M45.2 59.0L44.1 61.4M40.0 50.0L33.5 61.3M36.4 56.2L38.0 59.5M36.4 56.2L32.8 56.5M34.8 59.0L35.9 61.4M34.8 59.0L32.2 59.2M40.0 50.0L27.0 50.0M32.9 50.0L30.8 53.0M32.9 50.0L30.8 47.0M29.6 50.0L28.1 52.1M29.6 50.0L28.1 47.9M40.0 50.0L33.5 38.7M36.4 43.8L32.8 43.5M36.4 43.8L38.0 40.5M34.8 41.0L32.2 40.8M34.8 41.0L35.9 38.6M40.0 50.0L46.5 38.7M43.6 43.8L42.0 40.5M43.6 43.8L47.2 43.5M45.2 41.0L44.1 38.6M45.2 41.0L47.8 40.8%22 stroke=%22%23fff%22 stroke-opacity=%220.55%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M250.0 35.0L258.7 37.3M254.8 36.3L256.7 34.7M254.8 36.3L255.6 38.6M257.0 36.9L258.3 35.7M257.0 36.9L257.6 38.6M250.0 35.0L252.3 43.7M251.3 39.8L253.6 40.6M251.3 39.8L249.7 41.7M251.9 42.0L253.6 42.6M251.9 42.0L250.7 43.3M250.0 35.0L243.6 41.4M246.5 38.5L246.9 41.0M246.5 38.5L244.0 38.1M244.9 40.1L245.2 41.9M244.9 40.1L243.1 39.8M250.0 35.0L241.3 32.7M245.2 33.7L243.3 35.3M245.2 33.7L244.4 31.4M243.0 33.1L241.7 34.3M243.0 33.1L242.4 31.4M250.0 35.0L247.7 26.3M248.7 30.2L246.4 29.4M248.7 30.2L250.3 28.3M248.1 28.0L246.4 27.4M248.1 28.0L249.3 26.7M250.0 35.0L256.4 28.6M253.5 31.5L253.1 29.0M253.5 31.5L256.0 31.9M255.1 29.9L254.8 28.1M255.1 29.9L256.9 30.2%22 stroke=%22%23ff6b7d%22 stroke-opacity=%220.7%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M150.0 120.0L164.7 128.5M158.1 124.7L162.4 122.7M158.1 124.7L158.5 129.4M161.8 126.8L164.9 125.4M161.8 126.8L162.1 130.2M150.0 120.0L150.0 137.0M150.0 129.3L153.9 132.1M150.0 129.3L146.1 132.1M150.0 133.6L152.8 135.6M150.0 133.6L147.2 135.6M150.0 120.0L135.3 128.5M141.9 124.7L141.5 129.4M141.9 124.7L137.6 122.7M138.2 126.8L137.9 130.2M138.2 126.8L135.1 125.4M150.0 120.0L135.3 111.5M141.9 115.3L137.6 117.3M141.9 115.3L141.5 110.6M138.2 113.2L135.1 114.6M138.2 113.2L137.9 109.8M150.0 120.0L150.0 103.0M150.0 110.7L146.1 107.9M150.0 110.7L153.9 107.9M150.0 106.4L147.2 104.4M150.0 106.4L152.8 104.4M150.0 120.0L164.7 111.5M158.1 115.3L158.5 110.6M158.1 115.3L162.4 117.3M161.8 113.2L162.1 109.8M161.8 113.2L164.9 114.6%22 stroke=%22%23fff%22 stroke-opacity=%220.35%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M300.0 200.0L310.8 201.9M306.0 201.1L308.1 198.9M306.0 201.1L307.3 203.8M308.7 201.5L310.2 200.0M308.7 201.5L309.6 203.5M300.0 200.0L303.8 210.3M302.1 205.7L305.0 206.5M302.1 205.7L300.3 208.2M303.0 208.3L305.1 208.8M303.0 208.3L301.7 210.1M300.0 200.0L292.9 208.4M296.1 204.6L296.9 207.6M296.1 204.6L293.0 204.4M294.3 206.7L294.9 208.9M294.3 206.7L292.2 206.5M300.0 200.0L289.2 198.1M294.0 198.9L291.9 201.1M294.0 198.9L292.7 196.2M291.3 198.5L289.8 200.0M291.3 198.5L290.4 196.5M300.0 200.0L296.2 189.7M297.9 194.3L295.0 193.5M297.9 194.3L299.7 191.8M297.0 191.7L294.9 191.2M297.0 191.7L298.3 189.9M300.0 200.0L307.1 191.6M303.9 195.4L303.1 192.4M303.9 195.4L307.0 195.6M305.7 193.3L305.1 191.1M305.7 193.3L307.8 193.5%22 stroke=%22%23fff%22 stroke-opacity=%220.5%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M80.0 230.0L88.0 230.0M84.4 230.0L85.7 228.2M84.4 230.0L85.7 231.8M86.4 230.0L87.3 228.7M86.4 230.0L87.3 231.3M80.0 230.0L84.0 236.9M82.2 233.8L84.4 234.0M82.2 233.8L81.3 235.8M83.2 235.5L84.8 235.7M83.2 235.5L82.5 237.0M80.0 230.0L76.0 236.9M77.8 233.8L78.7 235.8M77.8 233.8L75.6 234.0M76.8 235.5L77.5 237.0M76.8 235.5L75.2 235.7M80.0 230.0L72.0 230.0M75.6 230.0L74.3 231.8M75.6 230.0L74.3 228.2M73.6 230.0L72.7 231.3M73.6 230.0L72.7 228.7M80.0 230.0L76.0 223.1M77.8 226.2L75.6 226.0M77.8 226.2L78.7 224.2M76.8 224.5L75.2 224.3M76.8 224.5L77.5 223.0M80.0 230.0L84.0 223.1M82.2 226.2L81.3 224.2M82.2 226.2L84.4 226.0M83.2 224.5L82.5 223.0M83.2 224.5L84.8 224.3%22 stroke=%22%23ff6b7d%22 stroke-opacity=%220.6%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M200.0 290.0L213.2 294.8M207.2 292.6L210.4 290.4M207.2 292.6L208.3 296.4M210.5 293.8L212.8 292.2M210.5 293.8L211.2 296.5M200.0 290.0L202.4 303.8M201.3 297.6L204.9 299.2M201.3 297.6L198.6 300.4M201.9 301.0L204.5 302.2M201.9 301.0L200.0 303.0M200.0 290.0L189.3 299.0M194.1 294.9L194.4 298.9M194.1 294.9L190.3 293.9M191.4 297.2L191.7 300.0M191.4 297.2L188.7 296.5M200.0 290.0L186.8 285.2M192.8 287.4L189.6 289.6M192.8 287.4L191.7 283.6M189.5 286.2L187.2 287.8M189.5 286.2L188.8 283.5M200.0 290.0L197.6 276.2M198.7 282.4L195.1 280.8M198.7 282.4L201.4 279.6M198.1 279.0L195.5 277.8M198.1 279.0L200.0 277.0M200.0 290.0L210.7 281.0M205.9 285.1L205.6 281.1M205.9 285.1L209.7 286.1M208.6 282.8L208.3 280.0M208.6 282.8L211.3 283.5%22 stroke=%22%23fff%22 stroke-opacity=%220.4%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M330.0 320.0L337.0 320.6M333.8 320.3L335.1 318.8M333.8 320.3L334.8 322.0M335.6 320.5L336.5 319.4M335.6 320.5L336.3 321.7M330.0 320.0L333.0 326.3M331.6 323.5L333.6 323.8M331.6 323.5L330.6 325.2M332.4 325.1L333.7 325.3M332.4 325.1L331.7 326.3M330.0 320.0L326.0 325.7M327.8 323.2L328.5 325.0M327.8 323.2L325.8 323.2M326.8 324.6L327.3 325.9M326.8 324.6L325.4 324.6M330.0 320.0L323.0 319.4M326.2 319.7L324.9 321.2M326.2 319.7L325.2 318.0M324.4 319.5L323.5 320.6M324.4 319.5L323.7 318.3M330.0 320.0L327.0 313.7M328.4 316.5L326.4 316.2M328.4 316.5L329.4 314.8M327.6 314.9L326.3 314.7M327.6 314.9L328.3 313.7M330.0 320.0L334.0 314.3M332.2 316.8L331.5 315.0M332.2 316.8L334.2 316.8M333.2 315.4L332.7 314.1M333.2 315.4L334.6 315.4%22 stroke=%22%23fff%22 stroke-opacity=%220.55%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/><path d=%22M20.0 330.0L29.1 334.2M25.0 332.3L27.4 330.9M25.0 332.3L25.5 335.1M27.3 333.4L29.0 332.4M27.3 333.4L27.6 335.4M20.0 330.0L20.9 340.0M20.5 335.5L22.9 336.9M20.5 335.5L18.3 337.3M20.7 338.0L22.4 339.0M20.7 338.0L19.2 339.3M20.0 330.0L11.8 335.7M15.5 333.2L15.5 336.0M15.5 333.2L12.9 332.2M13.4 334.6L13.4 336.6M13.4 334.6L11.6 333.9M20.0 330.0L10.9 325.8M15.0 327.7L12.6 329.1M15.0 327.7L14.5 324.9M12.7 326.6L11.0 327.6M12.7 326.6L12.4 324.6M20.0 330.0L19.1 320.0M19.5 324.5L17.1 323.1M19.5 324.5L21.7 322.7M19.3 322.0L17.6 321.0M19.3 322.0L20.8 320.7M20.0 330.0L28.2 324.3M24.5 326.8L24.5 324.0M24.5 326.8L27.1 327.8M26.6 325.4L26.6 323.4M26.6 325.4L28.4 326.1%22 stroke=%22%23fff%22 stroke-opacity=%220.3%22 stroke-width=%221.4%22 stroke-linecap=%22round%22 fill=%22none%22/></svg>";
/** Atsevišķā lapa "Ziemassvētki uzņēmumiem" (src/app/(site)/uznemumiem/ziemassvetki) */
export const XMAS_PAGE = "/uznemumiem/ziemassvetki";

const stars = {
  backgroundImage: `url("${SNOW}")`,
  backgroundSize: "360px 360px",
};

export function XmasBanner({ home }: { home: HomeSettings }) {
  if (!home.xmasEnabled) return null;
  const photo = home.xmasPhotos[0];

  return (
    <section aria-label={home.xmasEyebrow} className="py-12 md:py-16">
      <Container>
        <Link
          href={XMAS_PAGE}
          data-reveal
          className="group relative isolate grid grid-cols-1 items-center gap-6 overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:grid-cols-[minmax(0,1fr)_auto] sm:p-8 md:grid-cols-[180px_minmax(0,1fr)_auto] md:gap-8 md:p-10"
        >
          <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={stars} />
          {photo && (
            <div className="relative hidden aspect-square w-[180px] -rotate-3 overflow-hidden rounded-2xl border-[6px] border-white transition-transform duration-500 group-hover:rotate-0 md:block">
              <Photo src={photo.src} alt={photo.caption} fill sizes="180px" className="object-cover" />
            </div>
          )}
          <div className="min-w-0">
            <p className="inline-flex rounded-full bg-brand px-3.5 py-1 text-xs font-extrabold tracking-[0.12em] text-ink uppercase">
              ❄ {home.xmasEyebrow}
            </p>
            <h2 className="display mt-4 text-2xl sm:text-3xl md:text-4xl">
              {home.xmasTitle} {home.xmasHighlight && <span className="sticker-light">{home.xmasHighlight}</span>}
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-white/80">{home.xmasShort}</p>
          </div>
          <span className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-brand px-7 font-extrabold whitespace-nowrap text-ink transition-transform group-hover:translate-x-1">
            Ziemassvētku piedāvājumi →
          </span>
        </Link>
      </Container>
    </section>
  );
}

export type XmasVariant = "tumsais" | "foto" | "saraksts";

type FeatureProps = {
  home: HomeSettings;
  /** Uzņēmumu pakalpojumi — tikai kartīšu ikonām (pēc nosaukuma) */
  services: Service[];
  /** Izkārtojums — sk. zemāk */
  variant?: XmasVariant;
};

// Pieprasījuma formā uzreiz izvēlēts "Ziemassvētku piedāvājums" (sk. EXTRA_OPTIONS lapā "Kontakti")
export const XMAS_INQUIRY = "/kontakti?pakalpojums=ziemassvetku-piedavajums#pieprasijums";
const INQUIRY = XMAS_INQUIRY;

type XmasCard = { key: string; title: string; text: string; icon: string; photo: string };

/**
 * Kartītes — no paneļa (Sākumlapa → "Ziemassvētku bloka kartītes"): nosaukums | teksts | bilde.
 * Ikona: ja kartītes nosaukums sakrīt ar pakalpojuma nosaukumu — tā ikona, citādi eglīte.
 */
const toCards = (home: HomeSettings, services: Service[]): XmasCard[] =>
  home.xmasCards.map((c) => ({
    key: c.title,
    title: c.title,
    text: c.text,
    icon: services.find((s) => s.title === c.title)?.icon ?? "TreePine",
    photo: c.image,
  }));

/**
 * Ziemassvētku bloks lapā "Uzņēmumiem". Trīs izkārtojumi:
 *  - "tumsais"  — tumšs fons ar zvaigznēm: teksts + fotogrāfija, zem tiem piedāvājumu kartītes;
 *  - "foto"     — fotogrāfija pa visu platumu fonā, teksts centrā, kartītes zem tā;
 *  - "saraksts" — gaišs fons: kreisajā pusē teksts, labajā — piedāvājumi kā kompakts saraksts.
 */
export function XmasFeature({ home, services, variant = "tumsais" }: FeatureProps) {
  if (!home.xmasEnabled) return null;
  if (variant === "foto") return <XmasPhoto home={home} services={services} />;
  if (variant === "saraksts") return <XmasList home={home} services={services} />;
  return <XmasDark home={home} services={services} />;
}

/**
 * Piedāvājumu kartītes — tikai informācijai (nav saites).
 * Vienīgais, kas šajā blokā ved tālāk, ir poga "Pieprasīt piedāvājumu".
 */
function Cards({ home, services }: { home: HomeSettings; services: Service[] }) {
  const cards = toCards(home, services);
  if (cards.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c, i) => (
        <li
          key={c.key}
          data-reveal
          style={{ "--reveal-delay": `${(i % 4) * 90}ms` } as React.CSSProperties}
          className="relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white sm:p-7"
        >
          {c.photo && <Photo src={c.photo} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="-z-20 object-cover" />}
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/55 to-ink/0" aria-hidden />
          <span className="absolute top-6 left-6 grid size-12 place-items-center rounded-full bg-brand text-ink shadow-lg sm:top-7 sm:left-7">
            <ServiceIcon name={c.icon} className="size-5" />
          </span>
          <h3 className="display text-xl sm:text-2xl">{c.title}</h3>
          <p className="mt-3 line-clamp-3 leading-7 text-white/80">{c.text}</p>
        </li>
      ))}
    </ul>
  );
}

function Points({ home }: { home: HomeSettings }) {
  if (home.xmasPoints.length === 0) return null;
  return (
    <ul className="mt-8 grid gap-3 sm:grid-cols-2">
      {home.xmasPoints.map((p) => (
        <li key={p} className="flex items-start gap-3 font-semibold">
          <span aria-hidden className="text-brand-strong">
            ❄
          </span>
          {p}
        </li>
      ))}
    </ul>
  );
}

/* ── A: tumšais ────────────────────────────────────────────────────── */
function XmasDark({ home, services }: FeatureProps) {
  return (
    <section id="ziemassvetki" aria-labelledby="ziemassvetki-virsraksts" className="xmas-red relative isolate scroll-mt-20 overflow-hidden bg-ink py-16 text-white md:py-24">
      <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={stars} />
      <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div data-reveal>
          <p className="inline-flex rounded-full bg-brand px-4 py-1.5 text-xs font-extrabold tracking-[0.12em] text-ink uppercase">{home.xmasEyebrow}</p>
          <h2 id="ziemassvetki-virsraksts" className="display mt-6 text-4xl sm:text-5xl lg:text-6xl">
            Ziemassvētku <span className="sticker-light">piedāvājumi</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">{home.xmasText}</p>
          <Points home={home} />
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={INQUIRY} size="lg" arrow>
              Pieprasīt piedāvājumu
            </ButtonLink>
            <ButtonLink href={XMAS_PAGE} size="lg" variant="ghostLight">
              Uzzināt vairāk
            </ButtonLink>
          </div>
        </div>
        {home.xmasPhotos[0] && (
          <div data-reveal className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-white/5 lg:aspect-[5/4]">
            <Photo src={home.xmasPhotos[0].src} alt={home.xmasPhotos[0].caption} fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
        )}
      </Container>
      <Container className="mt-14 md:mt-16">
        <Cards home={home} services={services} />
      </Container>
    </section>
  );
}

/* ── B: fotogrāfija fonā ───────────────────────────────────────────── */
function XmasPhoto({ home, services }: FeatureProps) {
  const photo = home.xmasPhotos[0];
  return (
    <section id="ziemassvetki" aria-labelledby="ziemassvetki-virsraksts" className="xmas-red scroll-mt-20">
      <div className="relative isolate overflow-hidden bg-ink pt-20 pb-40 text-center text-white md:pt-28 md:pb-52">
        {photo && <Photo src={photo.src} alt="" fill sizes="100vw" className="-z-20 object-cover" />}
        <div aria-hidden className="absolute inset-0 -z-10 bg-ink/70" />
        <Container>
          <div data-reveal className="mx-auto max-w-3xl">
            <p className="inline-flex rounded-full bg-brand px-4 py-1.5 text-xs font-extrabold tracking-[0.12em] text-ink uppercase">{home.xmasEyebrow}</p>
            <h2 id="ziemassvetki-virsraksts" className="display mt-6 text-4xl sm:text-5xl lg:text-6xl">
              Ziemassvētku <span className="sticker-light">piedāvājumi</span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/85">{home.xmasText}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href={INQUIRY} size="lg" arrow>
                Pieprasīt piedāvājumu
              </ButtonLink>
              <ButtonLink href={XMAS_PAGE} size="lg" variant="ghostLight">
                Uzzināt vairāk
              </ButtonLink>
            </div>
          </div>
        </Container>
      </div>
      {/* Kartītes pārklājas ar fotogrāfijas apakšu */}
      <Container className="relative -mt-28 pb-16 md:-mt-36 md:pb-24">
        <Cards home={home} services={services} />
      </Container>
    </section>
  );
}

/* ── C: gaišais ar sarakstu ────────────────────────────────────────── */
function XmasList({ home, services }: FeatureProps) {
  return (
    <section id="ziemassvetki" aria-labelledby="ziemassvetki-virsraksts" className="xmas-red scroll-mt-20 bg-surface py-16 md:py-24">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16">
        <div data-reveal>
          <p className="inline-flex rounded-full bg-ink px-4 py-1.5 text-xs font-extrabold tracking-[0.12em] text-brand uppercase">{home.xmasEyebrow}</p>
          <h2 id="ziemassvetki-virsraksts" className="display mt-6 text-4xl sm:text-5xl">
            Ziemassvētku <span className="sticker">piedāvājumi</span>
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">{home.xmasText}</p>
          <Points home={home} />
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href={INQUIRY} size="lg" variant="dark" arrow>
              Pieprasīt piedāvājumu
            </ButtonLink>
            <ButtonLink href={XMAS_PAGE} size="lg" variant="outline">
              Uzzināt vairāk
            </ButtonLink>
          </div>
        </div>

        <ul data-reveal className="divide-y divide-line overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line">
          {toCards(home, services).map((c) => (
            <li key={c.key}>
              <div className="flex items-center gap-5 p-4 sm:p-5">
                <span className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-surface sm:size-24">
                  {c.photo && <Photo src={c.photo} alt="" fill sizes="96px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-base font-bold uppercase sm:text-lg">{c.title}</span>
                  <span className="mt-1 line-clamp-2 text-sm leading-6 text-ink-soft">{c.text}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/**
 * Piedāvājumu bloks lapai "Ziemassvētki uzņēmumiem": virsraksts, teksts un tās pašas kartītes.
 * Bez pogas un fotogrāfijas — tās jau ir lapas galvenē. Rāda arī tad, ja sezonas reklāma ir izslēgta.
 */
export function XmasOffers({ home, services }: { home: HomeSettings; services: Service[] }) {
  return (
    <section id="piedavajumi" aria-labelledby="piedavajumi-virsraksts" className="xmas-red relative isolate scroll-mt-20 overflow-hidden bg-ink py-16 text-white md:py-24">
      <div aria-hidden className="absolute inset-0 -z-10 opacity-60" style={stars} />
      <Container>
        <div data-reveal className="max-w-3xl">
          <h2 id="piedavajumi-virsraksts" className="display text-3xl sm:text-4xl md:text-5xl">
            Ziemassvētku <span className="sticker-light">piedāvājumi</span>
          </h2>
          <p className="mt-5 text-lg leading-8 text-white/80">{home.xmasText}</p>
        </div>
        <div className="mt-12 md:mt-14">
          <Cards home={home} services={services} />
        </div>
      </Container>
    </section>
  );
}
