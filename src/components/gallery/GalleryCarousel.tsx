"use client";

import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

type Props = {
  images: string[];
  title?: string;
};

export default function GalleryCarousel({
  images,
  title = "Galerija",
}: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    dragFree: true,
    skipSnaps: false,
  });

  return (
    <section className="py-24">
      <div className="mx-auto max-w-screen-2xl px-6">

        <div className="mb-12 text-center">
          <h2 className="text-5xl font-bold">
            {title}
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Ieskaties mūsu telpās
          </p>
        </div>

        <div className="relative">

          {/* Kreisā bultiņa */}
          <button
            onClick={() => emblaApi?.scrollPrev()}
            aria-label="Iepriekšējā bilde"
            className="absolute left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:bg-pink-500 hover:text-white md:flex"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Karuselis */}
          <div
            ref={emblaRef}
            className="overflow-hidden"
          >
            <div className="flex -ml-6">

              {images.map((image, index) => (
                <div
                  key={index}
                  className="
                    flex-[0_0_85%]
                    pl-6

                    sm:flex-[0_0_48%]

                    lg:flex-[0_0_32%]

                    xl:flex-[0_0_24%]
                  "
                >
                  <div className="group relative aspect-[4/5] overflow-hidden rounded-[32px] shadow-lg">

                    <Image
                      src={image}
                      alt={`${title} ${index + 1}`}
                      fill
                      sizes="
                        (max-width:640px) 85vw,
                        (max-width:1024px) 48vw,
                        (max-width:1280px) 32vw,
                        24vw
                      "
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

                  </div>
                </div>
              ))}

            </div>
          </div>

          {/* Labā bultiņa */}
          <button
            onClick={() => emblaApi?.scrollNext()}
            aria-label="Nākamā bilde"
            className="absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:bg-pink-500 hover:text-white md:flex"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

        </div>
      </div>
    </section>
  );
}