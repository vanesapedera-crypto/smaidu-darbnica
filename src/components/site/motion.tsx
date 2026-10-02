import Link from "next/link";
import { cn } from "@/lib/utils";
import Photo from "./Photo";
import { Smile } from "./stage";

/*
 * Ritināšanas un 3D efektu bloki "Skatuves" dizainā. Visi ir servera komponentes —
 * kustību vada RevealObserver (iestata CSS mainīgo --p, 0…1) un globals.css.
 * Formulas ir inline stilos, jo tās ir specifiskas katram blokam.
 *
 * Ātrdarbībai animē tikai transform / opacity (un individuālās rotate/translate īpašības).
 */

/** Virsraksts, kura rindas lapas ielādē izslīd no maskas. `lines` — katra rinda atsevišķi. */
export function LineTitle({
  lines,
  as: Tag = "h1",
  className,
}: {
  lines: React.ReactNode[];
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <Tag className={cn("display", className)}>
      {lines.map((line, i) => (
        <span key={i} className="line-mask">
          <span style={{ "--l": i } as React.CSSProperties}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Teksts, kura vārdi "iedegas" pa vienam, ritinot lapu (sadaļa piesprausta ekrānā).
 * Katra vārda necaurspīdīgums = f(--p, vārda numurs). `highlight` vārdi ir dzelteni.
 */
export function WordReveal({ text, highlight = [], kicker }: { text: string; highlight?: string[]; kicker?: string }) {
  const words = text.split(/\s+/);
  const n = words.length;
  return (
    <section data-scene className="relative h-[220vh] bg-ink text-white">
      <div className="sticky top-0 flex h-svh items-center overflow-hidden">
        <Smile className="absolute -right-[8%] -bottom-[12%] w-[40%] max-w-[560px] text-white/[0.03]" />
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {kicker && <p className="mb-8 text-sm font-extrabold tracking-[0.14em] text-brand uppercase">{kicker}</p>}
          <p className="display text-[1.9rem] leading-[1.15] sm:text-5xl md:text-6xl lg:text-[4.2rem]">
            {words.map((w, i) => (
              <span
                key={i}
                className={highlight.includes(w.replace(/[.,—]/g, "")) ? "text-brand" : undefined}
                style={{
                  // Vārds sāk iedegties, kad progress sasniedz tā vietu tekstā
                  opacity: `clamp(0.12, calc(var(--p, 0) * ${(n * 1.3).toFixed(1)} - ${i} + 1), 1)`,
                }}
              >
                {w}{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * 3D fotogrāfiju gredzens: fotokartītes izvietotas pa cilindru, kas griežas, ritinot lapu.
 * Sadaļa ir piesprausta, kamēr gredzens apgriežas.
 */
export function PhotoRing({
  photos,
  kicker,
  title,
  highlight,
  children,
}: {
  photos: string[];
  kicker?: string;
  title: string;
  highlight?: string;
  children?: React.ReactNode;
}) {
  const n = photos.length;
  return (
    <section data-scene className="relative h-[300vh] bg-surface">
      <div className="sticky top-0 h-svh overflow-hidden [perspective:1600px]">
        <Smile className="absolute -top-[10%] -left-[6%] w-[40%] max-w-[560px] text-ink/[0.06]" />
        {/* Gredzens — rādiuss (--r) aprēķināts no kartīšu platuma un skaita */}
        <div
          aria-hidden
          className="absolute top-[62%] left-1/2 z-0 [--card:160px] [transform-style:preserve-3d] sm:[--card:220px] lg:[--card:260px]"
          style={
            {
              "--r": `calc(var(--card) * ${((n * 1.2) / (2 * Math.PI)).toFixed(3)})`,
              transform: "translateZ(calc(var(--r) * -1)) rotateX(-7deg) rotateY(calc(var(--p, 0) * -300deg - 20deg))",
            } as React.CSSProperties
          }
        >
          {photos.map((src, i) => (
            <div
              key={src}
              className="absolute top-0 left-0 w-(--card) rounded-[20px] bg-white p-2 shadow-[0_30px_50px_-24px_rgba(31,41,55,0.55)] [backface-visibility:hidden]"
              style={{
                // Centrē kartīti uz gredzena ass (augstums ≈ platums × 4/3)
                marginLeft: "calc(var(--card) / -2)",
                marginTop: "calc(var(--card) * -2 / 3)",
                transform: `rotateY(${((360 / n) * i).toFixed(2)}deg) translateZ(var(--r))`,
              }}
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-surface">
                <Photo src={src} alt="" fill sizes="260px" className="object-cover" />
              </div>
            </div>
          ))}
        </div>

        {/* Virsraksts virs gredzena */}
        <div className="pointer-events-none absolute inset-x-0 top-[11%] z-20 px-4 text-center md:top-[12%]">
          {kicker && <p className="text-sm font-extrabold tracking-[0.14em] uppercase">{kicker}</p>}
          <h2 className="display mt-4 text-3xl sm:text-5xl lg:text-6xl">
            {title}
            {highlight && (
              <>
                {" "}
                <span className="sticker">{highlight}</span>
              </>
            )}
          </h2>
          {children}
        </div>
      </div>
    </section>
  );
}

/** Liela sadaļas kartīte: 3D pagrieziens pēc kursora, atspīdums un parallakse bildē. */
export function DoorCard({
  href,
  tag,
  title,
  text,
  image,
  index = 0,
  className,
}: {
  href: string;
  tag: string;
  title: string;
  text: string;
  image: string;
  index?: number;
  className?: string;
}) {
  return (
    <div data-reveal style={{ "--reveal-delay": `${(index % 4) * 100}ms` } as React.CSSProperties} className={className}>
      <Link href={href} data-tilt className="group relative block overflow-hidden rounded-[1.75rem] bg-ink text-white">
        <div data-scroll className="relative aspect-[3/4] overflow-hidden">
          <div className="parallax absolute inset-x-0 -inset-y-[12%] [--speed:-90px]">
            <Photo
              src={image}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-1000 ease-out-soft group-hover:scale-[1.06]"
            />
          </div>
          <div className="absolute inset-0 bg-linear-to-t from-ink/95 via-ink/30 to-transparent" />
        </div>
        <span className="absolute top-5 left-5 rounded-full bg-brand px-3 py-1.5 text-xs font-extrabold tracking-[0.08em] text-ink uppercase">
          {tag}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6 [transform:translateZ(40px)]">
          <h3 className="display text-2xl xl:text-[1.7rem]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/80">{text}</p>
          <span className="mt-4 inline-flex items-center gap-3 text-xs font-extrabold tracking-wide uppercase">
            Uzzināt vairāk
            <span className="grid size-10 place-items-center rounded-full bg-brand text-ink transition-transform duration-500 group-hover:translate-x-1">
              →
            </span>
          </span>
        </div>
        <span aria-hidden className="tilt-glare pointer-events-none absolute inset-0" />
      </Link>
    </div>
  );
}
