import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HERO_HD, HERO_MOBILE, HERO_POSITION } from "@/lib/content/defaults/service-media";
import { breadcrumbSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import JsonLd from "./JsonLd";
import Photo from "./Photo";
import { Container } from "./ui";

/*
 * "Skatuves" dizaina pamatelementi: logo smaida grafika, lapas galvene ar fotogrāfiju
 * un sekcijas virsraksts.
 */

/** Logo smaids (divas acis + trīsstūris) kā liela dekoratīva grafika. */
export function Smile({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("pointer-events-none", className)} style={style}>
      <circle cx="34" cy="16" r="9" fill="currentColor" />
      <circle cx="66" cy="16" r="9" fill="currentColor" />
      <path d="M20 36h60L50 94z" fill="currentColor" />
    </svg>
  );
}

export type StackPhoto = { src: string; caption?: string };

type Crumb = { name: string; path: string };

/**
 * Galvenes fotogrāfijas izkārtojums lielos ekrānos:
 *  "full"  — bilde pa visu platumu (vajag lielas bildes, vismaz ~2400 px platas, citādi tā ir miglaina);
 *  "split" — bilde labajā pusē (ap 60 % platuma), kreisajā pusē tumšs fons ar tekstu — bilde ir asāka.
 * Telefonā abos gadījumos bilde ir pa visu platumu. Stili: globals.css (.hero-split).
 */
export const HERO_LAYOUT = "split" as "full" | "split";
export const heroLayoutClass = HERO_LAYOUT === "split" ? "hero-split" : "";

/**
 * Lapas galvene: dzeltens bloks ar lielu virsrakstu (viens vārds tumšā "uzlīmē")
 * un fotokartītēm labajā pusē. Apakšlapās — arī "maizes drupatas" (+ Schema.org).
 */
export function StageHero({
  eyebrow,
  title,
  highlight,
  after,
  text,
  photos,
  crumbs,
  children,
  video,
  as: Tag = "h1",
}: {
  /** YouTube video ID — fonā aiz teksta (bez skaņas, cilpā), visās ierīcēs */
  video?: string;
  eyebrow?: string;
  /** Virsraksta sākums */
  title: string;
  /** Izceltais vārds (tumšā uzlīmē) */
  highlight?: string;
  /** Virsraksta turpinājums pēc izceltā vārda */
  after?: string;
  text?: string;
  photos: StackPhoto[];
  crumbs?: Crumb[];
  children?: React.ReactNode;
  as?: "h1" | "h2";
}) {
  const trail = crumbs ? [{ name: "Sākums", path: "/" }, ...crumbs] : null;

  const photo = photos[0];
  // Galvenes fonam — lielā bildes versija, ja tāda ir (sk. defaults/service-media.ts)
  const photoSrc = photo ? (HERO_HD[photo.src] ?? photo.src) : "";
  // Ja ir atsevišķa bilde telefonam — lielos ekrānos rāda platā, telefonā vertikālo
  const mobileSrc = HERO_MOBILE[photoSrc];

  return (
    // Galvene ar vienu lielu fotogrāfiju pa visu platumu (bez rāmja), teksts virs tās.
    // Augstums ir minimālais: ja teksts neietilpst (zems logs), galvene izstiepjas, nevis nogriež virsrakstu.
    <section data-scroll className={cn("relative isolate flex min-h-[520px] items-end overflow-hidden bg-ink text-white md:min-h-[600px] lg:min-h-[max(600px,min(calc(85svh-5rem),780px))]", !video && heroLayoutClass)}>
      {photo && (
        // Bilde iet tikai 30 px pāri malām (parallaksei) — jo mazāk to palielina, jo asāka tā ir
        <div className="hero-photo parallax absolute inset-x-0 -z-20" style={{ top: -30, bottom: -30, ...({ "--speed": "60px" } as React.CSSProperties) }}>
          {mobileSrc ? (
            <>
              <Photo src={mobileSrc} alt="" fill sizes="100vw" quality={85} className="animate-hero-zoom object-cover lg:hidden" />
              <Photo
                src={photoSrc}
                alt=""
                fill
                sizes="60vw"
                quality={85}
                className="hidden animate-hero-zoom object-cover lg:block"
                style={{ objectPosition: HERO_POSITION[photoSrc] }}
              />
            </>
          ) : (
            <Photo
              src={photoSrc}
              alt=""
              fill
              preload
              sizes={HERO_LAYOUT === "split" && !video ? "(min-width: 1024px) 60vw, 100vw" : "100vw"}
              quality={85}
              className="animate-hero-zoom object-cover"
              style={{ objectPosition: HERO_POSITION[photoSrc] }}
            />
          )}
        </div>
      )}
      {video && (
        // Fona video: iframe vienmēr nosedz visu galveni (16:9 "cover"), nedaudz palielināts, lai nav redzamas YouTube malas.
        // Fotogrāfija paliek zem tā, kamēr video ielādējas. Izmēri — ar style (nevis klasēm), lai nav atkarīgi no CSS kešatmiņas.
        <div
          aria-hidden
          style={{ position: "absolute", inset: 0, zIndex: -20, overflow: "hidden", pointerEvents: "none", containerType: "size" }}
        >
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&mute=1&loop=1&playlist=${video}&controls=0&playsinline=1&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&fs=0`}
            title=""
            tabIndex={-1}
            loading="lazy"
            allow="autoplay; encrypted-media"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "max(100cqw, 177.78cqh)",
              height: "max(100cqh, 56.25cqw)",
              transform: "translate(-50%, -50%) scale(1.18)",
              border: 0,
            }}
          />
        </div>
      )}
      <div aria-hidden className="hero-shade absolute inset-0 -z-10 bg-linear-to-r from-ink/90 via-ink/55 to-ink/10" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-linear-to-t from-ink/85 to-transparent" />

      <Container className="w-full pt-16 pb-14 md:pb-20">
        <div className="max-w-3xl">
          {trail && (
            <nav aria-label="Atrašanās vieta" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-white/70">
                {trail.map((c, i) => (
                  <li key={c.path} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="size-3.5" aria-hidden />}
                    {i < trail.length - 1 ? (
                      <Link href={c.path} className="hover:text-white">
                        {c.name}
                      </Link>
                    ) : (
                      <span aria-current="page" className="text-white">
                        {c.name}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {eyebrow && <p className="mb-5 text-sm font-extrabold tracking-[0.14em] text-brand uppercase">{eyebrow}</p>}
          <Tag className="display text-[2.35rem] sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
            {title}
            {highlight && (
              <>
                {" "}
                <span className="sticker-light">{highlight}</span>
              </>
            )}
            {after && <> {after}</>}
          </Tag>
          {text && <p className="mt-6 max-w-xl text-lg leading-8 text-white/85 md:text-xl md:leading-9">{text}</p>}
          {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
        </div>
      </Container>
      {trail && <JsonLd data={breadcrumbSchema(trail)} />}
    </section>
  );
}

/** Sekcijas virsraksts skatuves stilā. */
export function StageHeading({
  eyebrow,
  title,
  highlight,
  text,
  className,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  text?: string;
  className?: string;
}) {
  return (
    <div data-reveal className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className="mb-4 text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="display text-3xl sm:text-4xl md:text-5xl">
        {title}
        {highlight && (
          <>
            {" "}
            <span className="sticker">{highlight}</span>
          </>
        )}
      </h2>
      {text && <p className="mt-5 text-lg leading-8 text-ink-soft">{text}</p>}
    </div>
  );
}

