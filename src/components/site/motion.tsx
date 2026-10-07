import Link from "next/link";
import { cn } from "@/lib/utils";
import Photo from "./Photo";

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
