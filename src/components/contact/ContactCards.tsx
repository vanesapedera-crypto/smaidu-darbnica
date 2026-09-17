import Link from "next/link";
import {
  User,
  Building2,
  FileText,
  Phone,
  Mail,
  Download,
} from "lucide-react";

export default function ContactCards() {
  return (
    <section className="relative -mt-24 z-30 pb-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr_0.85fr]">

          {/* Privātpersonām */}

          <div
            id="privatpersonam"
            className="self-start rounded-[34px] bg-white px-10 py-8 shadow-xl"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100">
              <User className="h-7 w-7 text-yellow-500" />
            </div>

            <h2 className="text-3xl font-bold">
              Privātpersonām
            </h2>

            <p className="mt-3 text-gray-600 leading-7">
              Ballītes, rezervācijas,
              animatori un jautājumi par
              bērnu svētkiem.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center gap-3">
                <Phone className="text-yellow-500" size={20}/>
                +371 28 193 386
              </div>

              <div className="flex items-center gap-3">
                <Mail className="text-yellow-500" size={20}/>
                smaidudarbnica@gmail.com
              </div>

            </div>

            <Link
              href="/pieteikt"
              className="mt-8 inline-flex rounded-full bg-yellow-400 px-7 py-3 font-semibold hover:bg-yellow-300"
            >
              Rezervēt →
            </Link>

          </div>

          {/* Juridiskām */}

          <div
            id="juridiskam"
            className="self-start rounded-[34px] bg-[#111111] px-10 py-8 text-white shadow-xl"
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400">
              <Building2 className="h-7 w-7 text-black"/>
            </div>

            <h2 className="text-3xl font-bold">
              Juridiskām personām
            </h2>

            <p className="mt-3 leading-7 text-gray-300">
              Uzņēmumu pasākumi,
              telpu noma, sadarbība,
              rēķini un līgumi.
            </p>

            <div className="mt-6 space-y-4">

              <div className="flex items-center gap-3">
                <Phone className="text-yellow-400" size={20}/>
                +371 26 705 817
              </div>

              <div className="flex items-center gap-3">
                <Mail className="text-yellow-400" size={20}/>
                smaidudarbnica@gmail.com
              </div>

            </div>

            <Link
              href="mailto:smaidudarbnica@gmail.com"
              className="mt-8 inline-flex rounded-full bg-yellow-400 px-7 py-3 font-semibold text-black hover:bg-yellow-300"
            >
              Sazināties →
            </Link>

          </div>

          {/* Rekvizīti */}

          <div className="rounded-[34px] bg-white p-9 shadow-xl">

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-100">
              <FileText className="h-7 w-7 text-yellow-500"/>
            </div>

            <h2 className="text-3xl font-bold">
              Rekvizīti
            </h2>

            <div className="mt-8 divide-y text-[15px]">

              <div className="flex justify-between py-4">
                <span className="text-gray-500">Uzņēmums</span>
                <span>SIA "Smaidu Darbnīca"</span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-gray-500">Reģ. Nr.</span>
                <span>40203012345</span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-gray-500">PVN</span>
                <span>LV40203012345</span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-gray-500">Adrese</span>

                <span className="text-right">
                  Pasta iela 25<br/>
                  Tukums
                </span>

              </div>

              <div className="flex justify-between py-4">
                <span className="text-gray-500">Banka</span>
                <span>Swedbank</span>
              </div>

              <div className="flex justify-between py-4">
                <span className="text-gray-500">Konts</span>

                <span className="text-right">
                  LV12HABA0551031234567
                </span>

              </div>

            </div>

            <button className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-yellow-100 py-4 font-semibold hover:bg-yellow-200">

              <Download size={18}/>

              PDF rekvizīti

            </button>

          </div>

        </div>

      </div>
    </section>
  );
}