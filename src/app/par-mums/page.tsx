import Image from "next/image";
import GalleryCarousel from "@/components/gallery/GalleryCarousel";
import TeamMemberCard from "@/components/about/TeamMemberCard";

const galleryImages = [
  "/images/programs/about/gallery/1.jpg",
  "/images/programs/about/gallery/2.jpg",
  "/images/programs/about/gallery/3.jpg",
  "/images/programs/about/gallery/4.jpg",
  "/images/programs/about/gallery/5.jpg",
  "/images/programs/about/gallery/7.jpg",
  "/images/programs/about/gallery/8.jpg",
];

export default function ParMumsPage() {
  return (
    <main>
    {/* HERO */}

<section className="relative overflow-hidden bg-[#0F1115] text-white">

  {/* Glow */}
  <div className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/10 blur-[180px]" />

  <div className="relative mx-auto grid min-h-screen max-w-7xl items-center gap-20 px-6 py-24 lg:grid-cols-2">

    {/* Kreisā puse */}

    <div className="z-10">

      <span className="inline-block rounded-full border border-yellow-400/30 bg-yellow-400/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-300">
        Par mums
      </span>

      <h1 className="mt-10 text-6xl font-black leading-[1.05] md:text-7xl">
        Mēs radām
        <br />
        <span className="text-yellow-400">
          bērnības
        </span>
        <br />
        skaistākās
        <br />
        atmiņas.
      </h1>

      <p className="mt-10 max-w-xl text-xl leading-9 text-gray-300">
        Smaidu darbnīca nav tikai bērnu ballītes.
        Tā ir vieta, kur katrs bērns jūtas īpašs,
        vecāki var atpūsties un ģimenes iegūst
        atmiņas, kas paliek uz mūžu.
      </p>

    </div>

    {/* Labā puse */}

    <div className="relative flex justify-center">

      {/* Glow aiz bildes */}
      <div className="absolute h-[650px] w-[650px] rounded-full bg-yellow-400/20 blur-[120px]" />

      <div className="relative overflow-hidden rounded-[40px] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,.5)]">

        <Image
          src="/images/programs/about/hero.jpg"
          alt="Smaidu darbnīcas komanda"
          width={700}
          height={900}
          className="object-cover"
        />

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      </div>

    </div>

  </div>

</section>
      {/* KOMANDA */}

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center">
          <h2 className="text-5xl font-bold">
            Mūsu komanda
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            Katrs mūsu komandas cilvēks ienes Smaidu darbnīcā savu
            personību, talantus un lielu mīlestību pret bērniem.
          </p>
        </div>

        <div className="mt-20 grid gap-10 sm:grid-cols-2 xl:grid-cols-3">

          <TeamMemberCard
            name="Kristīne"
            role="Dibinātāja"
            image="/images/programs/about/team/kristine.jpg"
            description="Smaidu darbnīcas sirds un dzinējspēks. Kristīne spēj atrast risinājumu jebkurā situācijā, iedvesmot komandu un radīt vidi, kur bērnu smaids vienmēr ir pirmajā vietā."
          />

          <TeamMemberCard
            name="Agija"
            role="Animatore"
            image="/images/programs/about/team/agija.jpg"
            description="Mūsu komandas dzirkstelīte. Agija katru pasākumu piepilda ar siltumu, zināšanām un pozitīvu enerģiju."
          />

          <TeamMemberCard
            name="Madara"
            role="Radošā projektu vadītāja"
            image="/images/programs/about/team/madara-radosa.jpg"
            description="Ideju ģenerators un kvalitātes perfekcioniste. Viņai nav neiespējamu projektu."
          />

          <TeamMemberCard
            name="Madara"
            role="Animatore"
            image="/images/programs/about/team/madara-animatore.jpg"
            description="Enerģiska animatore, kura bērnus aizrauj ar spēlēm, dejām un piedzīvojumiem."
          />

          <TeamMemberCard
            name="Vanesa"
            role="Administratore & Web izstrāde"
            image="/images/programs/about/team/vanesa.jpg"
            description="Parūpējas, lai viss ritētu gludi – no rezervācijām līdz mājaslapas tehniskajai pusei."
          />

          <TeamMemberCard
            name="Gunta"
            role="Animatore"
            image="/images/programs/about/team/gunta.jpg"
            description="Pieredzējusi animatore ar vairāk nekā 10 gadu pieredzi un desmitiem iemīļotu tēlu."
          />

          <TeamMemberCard
            name="Keita"
            role="Klientu uzņemšana"
            image="/images/programs/about/team/keita.jpg"
            description="Pirmais smaids, kas sagaida viesus. Keita rūpējas par sirsnīgu uzņemšanu un kārtību."
          />

        </div>
      </section>

      {/* GALERIJA */}

      <section className="bg-pink-50 py-24">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-semibold uppercase tracking-[0.3em] text-pink-500">
            Aizkulises
          </p>

          <h2 className="mt-5 text-5xl font-bold">
            Mūsu ikdiena
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-gray-600">
            Aiz katras bērnu ballītes ir daudz sagatavošanās, smieklu,
            radošu ideju un komandas darba.
          </p>
        </div>

        <div className="mt-16">
          <GalleryCarousel
            title=""
            images={galleryImages}
          />
        </div>
      </section>
    </main>
  );
}