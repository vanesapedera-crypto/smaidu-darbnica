import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HERO_HD, HERO_MOBILE, HERO_POSITION } from "@/lib/content/defaults/service-media";
import { breadcrumbSchema } from "@/lib/schema";
import { cn } from "@/lib/utils";
import JsonLd from "./JsonLd";
import Photo from "./Photo";
import { Container } from "./ui";

/*
 * "Skatuves" dizaina pamatelementi: dzeltenā galvene, logo smaida grafika,
 * "pielīmētās" fotokartītes un slīdošā josla.
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

/** 1–3 nedaudz pagrieztas fotokartītes ar parakstu (kā pielīmētas pie sienas). */
export function PhotoStack({ photos, priority = false }: { photos: StackPhoto[]; priority?: boolean }) {
  const layouts = [
    "left-0 top-[6%] w-[58%] -rotate-6",
    "right-0 top-0 z-10 w-[58%] rotate-[5deg]",
    "left-[22%] -bottom-[4%] z-20 w-[52%] -rotate-1",
  ];
  const single = photos.length === 1;

  return (
    // data-scroll: ritinot kartītes pārvietojas dažādos ātrumos (dziļuma sajūta, sk. RevealObserver)
    <div data-scroll className={cn("relative", single ? "mx-auto w-full max-w-md" : "min-h-[380px] sm:min-h-[460px] lg:min-h-[500px]")}>
      {photos.slice(0, 3).map((p, i) => (
        <figure
          key={p.src}
          className={cn(
            "tilt-card m-0 rounded-[22px] bg-white p-2.5 pb-3.5 shadow-[0_30px_50px_-28px_rgba(31,41,55,0.6)]",
            single ? "relative rotate-3" : `absolute ${layouts[i]}`,
          )}
          style={{ translate: `0 calc((var(--p, 0.35) - 0.35) * ${-50 - i * 70}px)` }}
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-[14px] bg-surface">
            <Photo
              src={p.src}
              alt={p.caption ?? ""}
              fill
              preload={priority && i === 0}
              sizes="(min-width: 1024px) 26vw, 55vw"
              className="object-cover"
            />
          </div>
          {p.caption && (
            <figcaption className="mx-1 mt-2.5 text-xs font-extrabold tracking-[0.06em] text-ink uppercase">{p.caption}</figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

/**
 * Viena liela galvenes fotogrāfija "pielīmētas kartītes" stilā.
 * Ritinot kartīte griežas 3D telpā (--p no RevealObserver), ar peli — sagāžas pēc kursora.
 */
export function HeroPhoto({ photo, className }: { photo?: StackPhoto; className?: string }) {
  if (!photo) return null;
  return (
    <div data-scroll className={cn("relative mx-auto w-full max-w-[520px] [perspective:1400px]", className)}>
      <figure
        className="m-0"
        style={{
          rotate: "calc(3deg - (var(--p, 0.35) - 0.35) * 10deg)",
          transform:
            "rotateY(calc((var(--p, 0.35) - 0.35) * -28deg)) rotateX(calc((var(--p, 0.35) - 0.35) * 14deg)) translateY(calc((var(--p, 0.35) - 0.35) * -90px))",
        }}
      >
        <div data-tilt className="relative rounded-[26px] bg-white p-3 pb-4 shadow-[0_50px_80px_-40px_rgba(31,41,55,0.7)]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-surface">
            <Photo src={photo.src} alt={photo.caption ?? ""} fill preload sizes="(min-width: 1024px) 520px, 90vw" className="object-cover" />
          </div>
          {photo.caption && (
            <figcaption className="mx-1.5 mt-3 text-xs font-extrabold tracking-[0.08em] text-ink uppercase">{photo.caption}</figcaption>
          )}
          <span aria-hidden className="tilt-glare pointer-events-none absolute inset-0 rounded-[26px]" />
        </div>
      </figure>
    </div>
  );
}

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

/** Tumša slīdošā josla ar pakalpojumu nosaukumiem. */
export function Ticker({ items, accent = false }: { items: string[]; accent?: boolean }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items];
  return (
    <div className={cn("overflow-hidden py-4", accent ? "bg-brand text-ink" : "bg-ink text-white")} aria-hidden>
      <div className="animate-marquee flex w-max items-center">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center font-display text-lg font-bold whitespace-nowrap uppercase md:text-2xl">
            <span className="px-7">{item}</span>
            <span className={accent ? "text-ink" : "text-brand"}>✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Sekcijas virsraksts skatuves stilā. */
export function StageHeading({
  eyebrow,
  title,
  highlight,
  text,
  light = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  text?: string;
  /** Uz tumša fona */
  light?: boolean;
  className?: string;
}) {
  return (
    <div data-reveal className={cn("max-w-3xl", className)}>
      {eyebrow && (
        <p className={cn("mb-4 text-sm font-extrabold tracking-[0.14em] uppercase", light ? "text-brand" : "text-ink-soft")}>
          {eyebrow}
        </p>
      )}
      <h2 className="display text-3xl sm:text-4xl md:text-5xl">
        {title}
        {highlight && (
          <>
            {" "}
            <span className={light ? "sticker-light" : "sticker"}>{highlight}</span>
          </>
        )}
      </h2>
      {text && <p className={cn("mt-5 text-lg leading-8", light ? "text-white/75" : "text-ink-soft")}>{text}</p>}
    </div>
  );
}

/** Trīs "durvis" uz galvenajām sadaļām — lielas fotogrāfijas ar dzeltenu birku. */
export function SectionDoors({
  doors,
}: {
  doors: { href: string; tag: string; title: string; text: string; image: string }[];
}) {
  return (
    <div className={cn("grid grid-cols-1", doors.length === 4 ? "sm:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-3")}>
      {doors.map((d) => (
        <Link
          key={d.href}
          href={d.href}
          className="group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden p-7 text-white md:min-h-[440px] md:p-9"
        >
          <Photo
            src={d.image}
            alt=""
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="-z-20 object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink/95 via-ink/35 to-ink/5" aria-hidden />
          <span className="absolute top-6 left-6 rounded-full bg-brand px-3.5 py-1.5 text-xs font-extrabold tracking-[0.08em] text-ink uppercase md:top-8 md:left-8">
            {d.tag}
          </span>
          <h3 className="display text-2xl md:text-[1.75rem]">{d.title}</h3>
          <p className="mt-2 max-w-xs leading-7 text-white/85">{d.text}</p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold tracking-wide uppercase">
            Uzzināt vairāk
            <span className="grid size-8 place-items-center rounded-full bg-brand text-ink transition-transform group-hover:translate-x-1">
              →
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
