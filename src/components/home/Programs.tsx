import Image from "next/image";
import Link from "next/link";
import { programs } from "@/data/programs";

export default function Programs() {
  return (
    <section>
<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">        {programs.map((program) => (
          <div
            key={program.id}
            className="group overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
           <img
  src={program.image}
  alt={program.title}
  className="h-full w-full object-cover"
/>

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
                  👧 {program.age}
                </span>

                <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-black">
                  ⏱ {program.duration}
                </span>
              </div>
            </div>

            <div className="flex h-[220px] flex-col p-5">
              <h3 className="text-xl font-bold leading-tight">
                {program.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-gray-600">
                {program.shortDescription}
              </p>

              <Link
                href={`/programmas/${program.slug}`}
                className="mt-5 inline-flex items-center justify-center rounded-full bg-yellow-400 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-500"
              >
                Lasīt vairāk →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}