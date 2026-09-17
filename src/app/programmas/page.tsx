import Image from "next/image";
import Link from "next/link";
import Programs from "@/components/home/Programs";

export default function ProgrammasPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative flex h-[520px] items-center overflow-hidden">
        <Image
          src="/images/programs/hero-programmas.jpg"
          alt="Mūsu programmas"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 text-white">
          <h1 className="text-5xl font-bold md:text-6xl">
            Mūsu programmas
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-8 text-white/90">
            Izvēlies piemērotāko programmu bērnu ballītei,
            ģimenes svētkiem vai citam pasākumam.
          </p>

          <div className="mt-12 grid gap-6 rounded-3xl bg-white/95 p-8 text-gray-800 shadow-2xl backdrop-blur md:grid-cols-3">
            <div>
              <p className="text-3xl">😊</p>
              <h3 className="mt-3 font-semibold">
                Pieredzējuši animatori
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Ar mīlestību pret bērniem.
              </p>
            </div>

            <div>
              <p className="text-3xl">⭐</p>
              <h3 className="mt-3 font-semibold">
                Pārbaudītas programmas
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Dažādiem vecumiem un pasākumiem.
              </p>
            </div>

            <div>
              <p className="text-3xl">❤️</p>
              <h3 className="mt-3 font-semibold">
                Neaizmirstami svētki
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Prieks, smiekli un skaistas atmiņas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programmas */}
<section className="mx-auto w-full max-w-screen-2xl px-8 py-24">     
     <div className="text-center">
          <h2 className="text-5xl font-bold">
            Atrodi piemērotāko programmu
          </h2>

          <p className="mt-5 text-lg text-gray-600">
            Visas mūsu programmas vienuviet.
          </p>
        </div>

        <div className="mt-16">
          <Programs />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[40px] bg-gradient-to-r from-pink-500 to-pink-600 px-8 py-16 text-center text-white">
          <h2 className="text-4xl font-bold">
            Radīsim smaidus kopā
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/90">
            Ja neesi pārliecināts, kura programma būs piemērotākā,
            sazinies ar mums – palīdzēsim izvēlēties.
          </p>

          <Link
            href="/pieteikt"
            className="mt-10 inline-flex rounded-full bg-yellow-400 px-8 py-4 text-lg font-semibold text-black transition hover:scale-105 hover:bg-yellow-300"
          >
            Rezervēt programmu
          </Link>
        </div>
      </section>
    </main>
  );
}