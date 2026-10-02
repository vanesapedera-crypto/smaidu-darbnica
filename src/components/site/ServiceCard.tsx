import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/lib/content/types";
import { fromPrice } from "@/lib/pricing";
import Photo from "./Photo";
import { ServiceIcon } from "./icons";

/** Pakalpojuma kartīte ar lielu fotogrāfiju. */
export default function ServiceCard({
  service,
  href,
  index = 0,
}: {
  service: Service;
  href: string;
  index?: number;
}) {
  // Izklaides programmām rāda sākuma cenu; uzņēmumu pakalpojumiem cena ir pēc pieprasījuma
  const price = service.audience === "private" ? fromPrice(service.pricing) : null;
  return (
    // Ārējais bloks parādās ritinot, iekšējā saite sagāžas 3D pēc kursora (data-tilt)
    <div data-reveal style={{ "--reveal-delay": `${(index % 3) * 90}ms` } as React.CSSProperties}>
      <Link
        href={href}
        data-tilt
        className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-ink p-6 text-white sm:p-7"
      >
        {service.heroImage && (
          <Photo
            src={service.heroImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="-z-20 object-cover transition-transform duration-700 ease-out-soft group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-ink via-ink/55 to-ink/0 transition-opacity duration-500 group-hover:via-ink/70" aria-hidden />

        <span className="absolute top-6 left-6 grid size-12 place-items-center rounded-full bg-brand text-ink shadow-lg sm:top-7 sm:left-7">
          <ServiceIcon name={service.icon} className="size-5" />
        </span>
        <span className="absolute top-6 right-6 grid size-11 place-items-center rounded-full border border-white/30 opacity-0 transition-all duration-300 group-hover:opacity-100 sm:top-7 sm:right-7">
          <ArrowUpRight className="size-5" aria-hidden />
        </span>

        <h3 className="display text-xl sm:text-2xl">{service.title}</h3>
        <p className="mt-3 line-clamp-3 leading-7 text-white/80">{service.excerpt}</p>
        {price !== null && (
          <p className="mt-4 inline-flex w-fit rounded-full bg-brand px-3.5 py-1.5 text-sm font-extrabold text-ink">
            no {price} €
          </p>
        )}
        <span aria-hidden className="tilt-glare pointer-events-none absolute inset-0" />
      </Link>
    </div>
  );
}
