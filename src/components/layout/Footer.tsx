import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
} from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">

      <div className="mx-auto max-w-7xl px-6 py-20">

        <div className="grid gap-14 md:grid-cols-2 lg:grid-cols-4">

          {/* Logo */}

          <div>

            <h2 className="text-3xl font-black">
              Smaidu
              <span className="text-yellow-400">
                {" "}Darbnīca
              </span>
            </h2>

            <p className="mt-6 leading-8 text-neutral-400">
              Bērnu ballītes, animatori,
              radošās darbnīcas un telpu noma
              Tukumā.
            </p>

          </div>

          {/* Izvēlne */}

          <div>

            <h3 className="text-lg font-bold">
              Izvēlne
            </h3>

            <div className="mt-6 flex flex-col gap-4 text-neutral-400">

              <Link href="/">Sākums</Link>

              <Link href="/programmas">
                Programmas
              </Link>

              <Link href="/uznemumiem">
                Pasākumiem
              </Link>

              <Link href="/telpu-noma">
                Telpu noma
              </Link>

              <Link href="/par-mums">
                Par mums
              </Link>

              <Link href="/kontakti">
                Kontakti
              </Link>

            </div>

          </div>

          {/* Kontakti */}

          <div>

            <h3 className="text-lg font-bold">
              Kontakti
            </h3>

            <div className="mt-6 space-y-5">

              <div className="flex gap-3">

                <Phone
                  size={18}
                  className="mt-1 text-yellow-400"
                />

                <span className="text-neutral-400">
                  +371 28 193 386
                </span>

              </div>

              <div className="flex gap-3">

                <Mail
                  size={18}
                  className="mt-1 text-yellow-400"
                />

                <span className="text-neutral-400">
                  smaidudarbnica@gmail.com
                </span>

              </div>

              <div className="flex gap-3">

                <MapPin
                  size={18}
                  className="mt-1 text-yellow-400"
                />

                <span className="text-neutral-400">
                  Pasta iela 25
                  <br />
                  Tukums
                </span>

              </div>

            </div>

          </div>

          {/* Sociālie */}

          <div>

            <h3 className="text-lg font-bold">
              Seko mums
            </h3>

            <p className="mt-6 text-neutral-400 leading-8">
              Ikdienā publicējam
              jaunākās ballītes,
              dekorācijas un
              aizkulišu mirkļus.
            </p>

            <div className="mt-8 flex gap-4">

              <a
                href="https://facebook.com"
                target="_blank"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black transition hover:scale-110"
              >
                <FaFacebookF />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black transition hover:scale-110"
              >
                <FaInstagram />
              </a>

              <a
                href="https://tiktok.com"
                target="_blank"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black transition hover:scale-110"
              >
                <FaTiktok />
              </a>

            </div>

          </div>

        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-center text-sm text-neutral-500">

          © {new Date().getFullYear()} Smaidu Darbnīca.
          Visas tiesības aizsargātas.

        </div>

      </div>

    </footer>
  );
}