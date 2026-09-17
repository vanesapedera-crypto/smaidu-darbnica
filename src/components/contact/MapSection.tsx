import {
  MapPin,
  Car,
  ParkingCircle,
} from "lucide-react";

import SocialSection from "./SocialSection";

export default function MapSection() {
  return (
    <section className="bg-[#FCF8EE] py-20">
      <div className="mx-auto max-w-7xl px-6">

        <div className="grid gap-8 lg:grid-cols-[360px_1fr_320px]">

          {/* Atrašanās vieta */}

          <div className="rounded-[30px] bg-white p-8 shadow-lg">

            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
              <MapPin className="text-yellow-500" />
            </div>

            <h2 className="text-3xl font-bold">
              Mūsu atrašanās vieta
            </h2>

            <p className="mt-5 leading-8 text-gray-600">
              Smaidu Darbnīca atrodas pašā Tukuma centrā.
              Šeit notiek bērnu ballītes,
              radošās darbnīcas un citi
              neaizmirstami notikumi.
            </p>

            <div className="mt-10 space-y-6">

              <div className="flex gap-4">
                <MapPin className="mt-1 text-yellow-500" />

                <p>
                  Pasta iela 25,
                  <br />
                  Tukums, LV-3101
                </p>

              </div>

              <div className="flex gap-4">
                <Car className="mt-1 text-yellow-500" />

                <p>
                  Viegli pieejams ar auto
                  un sabiedrisko transportu
                </p>

              </div>

              <div className="flex gap-4">
                <ParkingCircle className="mt-1 text-yellow-500" />

                <p>
                  Bezmaksas autostāvvieta
                  blakus ēkai
                </p>

              </div>

            </div>

          </div>

          {/* Google Maps */}

          <div className="overflow-hidden rounded-[30px] shadow-lg">

            <iframe
              src="https://www.google.com/maps/embed?pb="
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              className="min-h-[420px] border-0"
            />

          </div>

          {/* Sociālie */}

          <SocialSection />

        </div>

      </div>
    </section>
  );
}