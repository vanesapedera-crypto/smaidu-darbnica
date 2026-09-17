"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, MessageCircle } from "lucide-react";

export default function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-[#111111]">

      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(255,191,0,.18),transparent_40%)]" />

      <div className="mx-auto grid min-h-[760px] max-w-[1600px] items-center lg:grid-cols-2">

        {/* LEFT */}

        <div className="relative z-20 px-8 py-24 lg:px-20">

          <p className="mb-8 text-sm font-bold uppercase tracking-[0.35em] text-yellow-400">
            Kontakti
          </p>

          <h1 className="max-w-xl text-6xl font-black leading-tight text-white lg:text-7xl">
            Sazinies ar mums
            <span className="text-yellow-400">♡</span>
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-9 text-neutral-300">
            Ar prieku atbildēsim uz jūsu jautājumiem,
            palīdzēsim ar rezervāciju un ieteiksim
            piemērotāko programmu jūsu svētkiem.
          </p>

          <div className="mt-10 flex flex-wrap gap-8">

            <div className="flex items-center gap-3 text-white">
              <Clock3 className="text-yellow-400" size={22} />
              <span>Atbildam 24h laikā</span>
            </div>

            <div className="flex items-center gap-3 text-white">
              <MessageCircle className="text-yellow-400" size={22} />
              <span>Zvani vai raksti WhatsApp</span>
            </div>

          </div>

          <div className="mt-12 flex flex-wrap gap-5">

            <Link
              href="#privatpersonam"
              className="rounded-full bg-yellow-400 px-9 py-4 font-semibold text-black transition hover:bg-yellow-300"
            >
              Privātpersonām
            </Link>

            <Link
              href="#juridiskam"
              className="rounded-full border border-white/25 px-9 py-4 font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Juridiskām personām
            </Link>

          </div>

        </div>

        {/* RIGHT */}

        <div className="relative h-[760px]">

          <Image
            src="/images/about/team/team.jpg"
            alt="Smaidu Darbnīca"
            fill
            priority
            className="object-cover object-center"
          />

          {/* Left fade */}

          <div className="absolute inset-y-0 left-0 w-60 bg-gradient-to-r from-[#111111] via-[#111111]/90 to-transparent" />

          {/* Top */}

          <div className="absolute top-0 left-0 h-24 w-full bg-gradient-to-b from-[#111111] to-transparent" />

          {/* Bottom */}

          <div className="absolute bottom-0 left-0 h-44 w-full bg-gradient-to-t from-[#111111] to-transparent" />

          {/* Right vignette */}

          <div className="absolute inset-0 bg-black/15" />

        </div>

      </div>

      {/* White fade */}

      <div className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-b from-transparent to-white" />

    </section>
  );
}