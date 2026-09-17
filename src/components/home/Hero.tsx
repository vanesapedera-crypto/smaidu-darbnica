import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative h-[80vh] overflow-hidden">
      <Image
        src="/images/hero.jpg"
        alt="Smaidu Darbnīca"
        fill
        priority
        className="object-cover"
      />

      {/* Tumšs pārklājums */}
      <div className="absolute inset-0 bg-black/35" />

      {/* Apakšējā pāreja uz balto sadaļu */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />

      {/* Saturs */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
        <div className="max-w-3xl text-white">

          <h1 className="mt-8 text-5xl font-bold leading-tight md:text-7xl">
            RADĪT <span className="text-yellow-400">SMAIDU</span>
            <br />
            — tā ir mūsu misija.
          </h1>

          <p className="mt-8 max-w-2xl text-xl leading-8 text-white/90">
            Rūpējamies par bērnu izklaidi privātos, korporatīvos un publiskos
            pasākumos visā Latvijā.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/pieteikt"
              className="rounded-xl bg-yellow-400 px-8 py-4 font-semibold text-black transition hover:bg-yellow-500"
            >
              Pieteikt pasākumu
            </Link>

            <Link
              href="/programmas"
              className="rounded-xl border border-white px-8 py-4 font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Skatīt programmas
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}