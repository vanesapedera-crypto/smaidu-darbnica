import { ArrowRight, Building2, PartyPopper } from "lucide-react";
import Link from "next/link";

export default function ReservationOptions() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="text-center">
          <p className="font-semibold uppercase tracking-[0.3em] text-yellow-500">
            Rezervācija
          </p>

          <h2 className="mt-4 text-5xl font-black text-gray-900">
            Kādu pasākumu vēlies rezervēt?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Izvēlies sev piemērotāko rezervācijas veidu, un mēs ar Tevi
            sazināsimies pēc iespējas ātrāk.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">

          {/* Privātpersonām */}

          <div className="group rounded-[32px] border border-gray-200 bg-white p-10 shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-100">
              <PartyPopper
                size={30}
                className="text-yellow-600"
              />
            </div>

            <h3 className="mt-8 text-3xl font-bold text-gray-900">
              Privātpersonām
            </h3>

            <p className="mt-4 leading-7 text-gray-600">
              Bērnu ballītes, dzimšanas dienas, izbraukuma animatori un
              svinības Smaidu Darbnīcas telpās.
            </p>

            <Link
              href="/pieteikt"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-yellow-500 px-7 py-3 font-semibold text-black transition hover:bg-yellow-400"
            >
              Rezervēt

              <ArrowRight
                size={18}
              />
            </Link>

          </div>

          {/* Juridiskām personām */}

          <div className="group rounded-[32px] bg-[#111111] p-10 text-white shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500">
              <Building2
                size={30}
                className="text-black"
              />
            </div>

            <h3 className="mt-8 text-3xl font-bold">
              Juridiskām personām
            </h3>

            <p className="mt-4 leading-7 text-gray-300">
              Pasākumi uzņēmumiem, skolām, bērnudārziem,
              pašvaldībām un citiem kolektīviem.
            </p>

            <a
              href="tel:+37126705817"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-yellow-500 px-7 py-3 font-semibold text-black transition hover:bg-yellow-400"
            >
              Sazināties

              <ArrowRight
                size={18}
              />
            </a>

          </div>

        </div>

      </div>
    </section>
  );
}