import { Building2, Mail, CreditCard } from "lucide-react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";

export default function CompanyInfoSection() {
  return (
    <section className="bg-[#111111] py-24 text-white">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-12 lg:grid-cols-2">

          {/* Sociālie tīkli */}

          <div>
            <p className="font-semibold uppercase tracking-[0.3em] text-yellow-400">
              Sociālie tīkli
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Seko Smaidu Darbnīcai
            </h2>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              Ikdienas aizkulises, bērnu smaidi, jaunākās programmas un
              iedvesma nākamajiem svētkiem.
            </p>

            <div className="mt-10 flex gap-5">

              <a
                href="https://www.facebook.com/smaidudarbnica"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-4 transition hover:bg-[#1877F2]"
              >
<FaFacebookF size={22} />                Facebook
              </a>

              <a
                href="https://www.instagram.com/smaidu_darbnica/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-full bg-white/10 px-6 py-4 transition hover:bg-pink-500"
              >
<FaInstagram size={22} />               
 Instagram
              </a>

            </div>

          </div>

          {/* Rekvizīti */}

          <div className="rounded-[32px] bg-white/5 p-10 backdrop-blur">

            <div className="flex items-center gap-3">
              <Building2 className="text-yellow-400" />
              <h3 className="text-3xl font-bold">
                Rekvizīti
              </h3>
            </div>

            <div className="mt-8 space-y-6 text-gray-300">

              <div>
                <p className="text-sm uppercase tracking-widest text-yellow-400">
                  Uzņēmums
                </p>
                <p className="mt-1">SIA JUALEKS</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-widest text-yellow-400">
                  Reģistrācijas Nr.
                </p>
                <p className="mt-1">LV40002054493</p>
              </div>

              <div>
                <p className="text-sm uppercase tracking-widest text-yellow-400">
                  Juridiskā adrese
                </p>
                <p className="mt-1">
                  Zemgales iela 8<br />
                  Tukums, LV-3101
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="mt-1 text-yellow-400" size={20} />

                <div>
                  <p className="text-sm uppercase tracking-widest text-yellow-400">
                    Swedbank
                  </p>

                  <p className="mt-1 break-all">
                    LV66HABA0551041184447
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-1 text-yellow-400" size={20} />

                <a
                  href="mailto:smaidudarbnica@gmail.com"
                  className="hover:text-yellow-400"
                >
                  smaidudarbnica@gmail.com
                </a>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}