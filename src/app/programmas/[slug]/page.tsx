import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { programs } from "@/data/programs";
import { galleries } from "@/data/galleries";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProgramPage({ params }: Props) {
  const { slug } = await params;

  const program = programs.find((p) => p.slug === slug);

if (!program) {
  notFound();
}

const images =
  galleries[program.slug as keyof typeof galleries] ?? [];
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[500px]">
        <Image
          src={program.image}
          alt={program.title}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-6 text-white">
          <Link
  href="/programmas"
  className="mb-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-yellow-300 backdrop-blur transition hover:bg-white/20 hover:text-white"
>
  ← Atpakaļ uz programmu katalogu
</Link>

            <h1 className="text-5xl font-bold">{program.title}</h1>

            <p className="mt-4 max-w-2xl text-lg">
              {program.shortDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Saturs */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-pink-50 p-6">
            <h3 className="text-xl font-bold">👧 Vecums</h3>
            <p className="mt-3">{program.age}</p>
          </div>

          <div className="rounded-3xl bg-pink-50 p-6">
            <h3 className="text-xl font-bold">⏱ Ilgums</h3>
            <p className="mt-3">{program.duration}</p>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold">
            Programmas apraksts
          </h2>

          <p className="mt-6 max-w-4xl leading-8 text-gray-700">
            {program.description}
          </p>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold">
            💶 Cena
          </h2>

          <div className="mt-8 space-y-6">
            {program.pricing.map((group) => (
              <div
                key={group.title}
                className="rounded-3xl border border-pink-200 bg-pink-50 p-8"
              >
                <h3 className="mb-6 text-2xl font-bold">
                  {group.title}
                </h3>

                {group.options.map((option) => (
                  <div
                    key={option.label}
                    className="flex justify-between border-b py-4 last:border-none"
                  >
                    <span>{option.label}</span>
                    <strong>{option.price} €</strong>
                  </div>
                ))}

                <p className="mt-6 text-sm text-gray-600">
                  * Izbraukuma ballītēm +10%. Ceļa izdevumi tiek aprēķināti
                  atkarībā no pasākuma norises vietas.
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-3xl font-bold">
            🎉 Ballītes gaita
          </h2>

          <div className="mt-8 space-y-5">
            {program.activities.map((activity) => (
              <div
                key={activity.title}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-semibold">
                  {activity.title}
                </h3>

                {activity.description && (
                  <p className="mt-2 leading-7 text-gray-600">
                    {activity.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 text-center">
          {images.length > 0 && (
  <div className="mt-20">
    <h2 className="mb-8 text-3xl font-bold">
      📸 Galerija
    </h2>

    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {images.map((image) => (
        <div
          key={image}
           className="group relative aspect-square overflow-hidden rounded-3xl"        >
          <Image
            src={image}
            alt={program.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
          />
        </div>
      ))}
    </div>
  </div>
)}
          <Link
            href={`/pieteikt?program=${program.slug}`}
            className="inline-flex rounded-full bg-pink-500 px-10 py-5 text-lg font-semibold text-white transition hover:bg-pink-600"
          >
            Rezervēt programmu
          </Link>
        </div>
      </section>
    </main>
  );
}