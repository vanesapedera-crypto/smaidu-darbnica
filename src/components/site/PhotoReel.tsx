"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { isOptimizable } from "@/lib/images";
import { cn } from "@/lib/utils";

const Lightbox = dynamic(() => import("./Lightbox"), { ssr: false });

export type ReelImage = {
  src: string;
  alt: string;
  caption?: string;
  width: number | null;
  height: number | null;
  blur: string | null;
};

// Katrai kartītei savs neliels pagrieziens — kā bildes, kas pielīmētas pie sienas
const ROTATIONS = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2", "rotate-0", "-rotate-[1.5deg]"];

/**
 * Fotogrāfiju lente: horizontāli ritināmas fotokartītes (ar pirkstu vai bultām).
 * Klikšķis atver pilnekrāna skatu. Attēli ielādējas tikai tad, kad tuvojas ekrānam.
 */
export default function PhotoReel({
  images,
  plain = false,
}: {
  images: ReelImage[];
  /** Tīrs karuselis: bildes bez baltā rāmja, pagrieziena un paraksta, vienā augstumā (platums pēc bildes proporcijas) */
  plain?: boolean;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(-1);

  const scroll = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  if (images.length === 0) return null;

  return (
    <div className="relative">
      <ul
        ref={track}
        className={cn(
          "flex snap-x snap-mandatory overflow-x-auto px-4 [scrollbar-width:none] scroll-px-4 sm:px-6 sm:scroll-px-6 lg:px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] lg:scroll-px-[max(2rem,calc((100vw_-_80rem)/2_+_2rem))] [&::-webkit-scrollbar]:hidden",
          plain ? "gap-3 pt-2 pb-8" : "gap-5 pt-6 pb-10",
        )}
      >
        {images.map((img, i) =>
          plain ? (
            <li key={`${img.src}-${i}`} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Atvērt attēlu: ${img.alt}`}
                className="group relative block h-[240px] overflow-hidden rounded-2xl bg-surface sm:h-[300px] md:h-[360px]"
                style={{ aspectRatio: `${img.width ?? 4} / ${img.height ?? 3}` }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 540px, 360px"
                  placeholder={img.blur ? "blur" : "empty"}
                  blurDataURL={img.blur ?? undefined}
                  unoptimized={!isOptimizable(img.src)}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </button>
            </li>
          ) : (
            <li key={`${img.src}-${i}`} className="shrink-0 snap-start">
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={`Atvērt attēlu: ${img.caption ?? img.alt}`}
                className={cn(
                  "tilt-card block w-[64vw] max-w-[300px] rounded-[20px] bg-white p-2.5 pb-3 text-left shadow-[0_24px_40px_-26px_rgba(31,41,55,0.55)] sm:w-[280px]",
                  ROTATIONS[i % ROTATIONS.length],
                )}
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-[13px] bg-surface">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="300px"
                    placeholder={img.blur ? "blur" : "empty"}
                    blurDataURL={img.blur ?? undefined}
                    unoptimized={!isOptimizable(img.src)}
                    className="object-cover"
                  />
                </span>
                {img.caption && (
                  <span className="mx-1 mt-2.5 block truncate text-xs font-extrabold tracking-[0.06em] uppercase">
                    {img.caption}
                  </span>
                )}
              </button>
            </li>
          ),
        )}
      </ul>

      {images.length > 3 && (
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-4 sm:px-6 lg:px-8">
          <button type="button" onClick={() => scroll(-1)} aria-label="Iepriekšējās bildes" className="grid size-12 place-items-center rounded-full border-2 border-ink transition-colors hover:bg-ink hover:text-white">
            <ArrowLeft className="size-5" />
          </button>
          <button type="button" onClick={() => scroll(1)} aria-label="Nākamās bildes" className="grid size-12 place-items-center rounded-full bg-ink text-white transition-colors hover:bg-black">
            <ArrowRight className="size-5" />
          </button>
        </div>
      )}

      {open >= 0 && (
        <Lightbox
          slides={images.map((img) => ({ src: img.src, alt: img.alt, width: img.width ?? undefined, height: img.height ?? undefined }))}
          index={open}
          onClose={() => setOpen(-1)}
        />
      )}
    </div>
  );
}
