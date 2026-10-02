import Link from "next/link";
import { Baby, Clock, Euro } from "lucide-react";
import type { Service } from "@/lib/content/types";
import { fromPrice } from "@/lib/pricing";
import Photo from "./Photo";

/**
 * Izklaides programmas kartīte: bilde augšā, zem tās — nosaukums, īss apraksts
 * un uzreiz redzama cena, ilgums un vecums.
 */
export default function ProgramCard({ program, index = 0 }: { program: Service; index?: number }) {
  const price = fromPrice(program.pricing);
  const facts = [
    { icon: Euro, label: "Cena", value: price !== null ? `no ${price} €` : "pēc vienošanās" },
    { icon: Clock, label: "Ilgums", value: program.duration.replace(/\s*\(.*\)/, "") }, // bez piezīmes iekavās
    { icon: Baby, label: "Vecums", value: program.age },
  ].filter((f) => f.value);

  return (
    <div data-reveal style={{ "--reveal-delay": `${(index % 3) * 90}ms` } as React.CSSProperties} className="h-full">
      <Link
        href={`/izklaides-programmas/${program.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white ring-1 ring-line transition-shadow hover:shadow-[0_30px_50px_-30px_rgba(26,24,22,0.45)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface">
          {program.heroImage && (
            <Photo
              src={program.heroImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
            />
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="display text-xl sm:text-2xl">{program.title}</h3>
          <p className="mt-2 line-clamp-2 leading-7 text-ink-soft">{program.excerpt}</p>

          <dl className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="min-w-0">
                <dt className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-ink-soft uppercase">
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {label}
                </dt>
                <dd className={`mt-1 text-[15px] leading-5 font-extrabold ${label === "Cena" ? "text-ink" : ""}`}>{value}</dd>
              </div>
            ))}
          </dl>

          <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-extrabold tracking-wide uppercase">
            Skatīt programmu
            <span className="grid size-8 place-items-center rounded-full bg-brand transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </div>
  );
}
