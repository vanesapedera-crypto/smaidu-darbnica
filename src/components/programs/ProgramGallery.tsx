"use client";

import Image from "next/image";

type Props = {
  image: string;
};

export default function ProgramGallery({ image }: Props) {
  // No "/images/programs/frozen.jpg" iegūst "frozen"
  const folder = image.split("/").pop()?.replace(".jpg", "");

  if (!folder) return null;

  // Izveido 8 attēlu sarakstu
  const images = Array.from(
    { length: 8 },
    (_, i) => `/images/programs/${folder}/${i + 1}.webp`
  );

  return (
    <section className="mt-24">
      <h2 className="mb-10 text-center text-4xl font-bold">
        Foto galerija
      </h2>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {images.map((src, index) => (
          <div
            key={index}
            className="group relative aspect-square overflow-hidden rounded-3xl"
          >
            <Image
              src={src}
              alt=""
              fill
              className="object-cover transition duration-500 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </section>
  );
}