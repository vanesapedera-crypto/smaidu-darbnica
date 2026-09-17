import Link from "next/link";
import GalleryCarousel from "@/components/gallery/GalleryCarousel";

const images = [
  "/images/programs/telpu-noma/1.jpg",
  "/images/programs/telpu-noma/2.jpg",
  "/images/programs/telpu-noma/3.jpg",
  "/images/programs/telpu-noma/4.jpg",
  "/images/programs/telpu-noma/5.jpg",
  "/images/programs/telpu-noma/6.jpg",
  "/images/programs/telpu-noma/7.jpg",
  "/images/programs/telpu-noma/8.jpg",
  "/images/programs/telpu-noma/9.jpg",
  "/images/programs/telpu-noma/10.jpg",
  "/images/programs/telpu-noma/11.jpg",
  "/images/programs/telpu-noma/12.jpg",
  "/images/programs/telpu-noma/13.jpg",
  "/images/programs/telpu-noma/15.jpg",
  "/images/programs/telpu-noma/16.jpg",
  "/images/programs/telpu-noma/17.jpg",
  "/images/programs/telpu-noma/18.jpg",
];

export default function TelpuNomaPage() {
  return (
    <main>

  {/* Hero */}
<section className="bg-gradient-to-r from-pink-500 to-pink-600 py-28">
  <div className="mx-auto max-w-7xl px-6 text-center text-white">
    <h1 className="text-5xl font-bold md:text-6xl">
      Telpu noma bērnu ballītēm
    </h1>

    <p className="mx-auto mt-6 max-w-3xl text-xl leading-8 text-white/90">
      Mājīga, gaiša un pilnībā aprīkota vieta bērnu dzimšanas dienām,
      ģimenes svētkiem un citiem pasākumiem.
    </p>

    <Link
      href="/pieteikt"
      className="mt-10 inline-flex rounded-full bg-yellow-400 px-8 py-4 text-lg font-semibold text-black transition hover:bg-yellow-300"
    >
      Rezervēt telpu
    </Link>
  </div>
</section>

      {/* CENRĀDIS */}
      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="text-center">
          <h2 className="text-5xl font-bold">
            Cenrādis
          </h2>

          <p className="mt-4 text-lg text-gray-600">
            Izvēlies sev piemērotāko rezervācijas laiku.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">

          <div className="rounded-3xl bg-white p-10 shadow-lg">
            <h3 className="text-2xl font-bold">
              Telpu noma (3h)
            </h3>

            <p className="mt-4 text-gray-600">
              Pirmdiena – Ceturtdiena
            </p>

            <p className="mt-8 text-5xl font-bold text-pink-500">
              90€
            </p>
          </div>

          <div className="rounded-3xl bg-pink-500 p-10 text-white shadow-xl">
            <h3 className="text-2xl font-bold">
              Telpu noma (3h)
            </h3>

            <p className="mt-4 text-pink-100">
              Piektdiena – Svētdiena
            </p>

            <p className="mt-8 text-5xl font-bold">
              110€
            </p>
          </div>

          <div className="rounded-3xl bg-white p-10 shadow-lg">
            <h3 className="text-2xl font-bold">
              Papildus stunda
            </h3>

            <p className="mt-4 text-gray-600">
              Iepriekšēja vienošanās
            </p>

            <p className="mt-8 text-5xl font-bold text-pink-500">
              20€
            </p>
          </div>

        </div>
      </section>

      {/* IESPĒJAS */}

      <section className="bg-gray-50 py-24">

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">
            <h2 className="text-5xl font-bold">
              Kas atrodas telpās?
            </h2>

            <p className="mt-5 text-lg text-gray-600">
              Viss nepieciešamais bērnu svētkiem.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            <Feature emoji="🎈" title="Bumbu baseins">
              Tūkstošiem krāsainu bumbiņu.
            </Feature>

            <Feature emoji="🧸" title="Rotaļu istaba">
              Virtuvīte, leļļu māja, Montessori rotaļlietas un mašīnu trase.
            </Feature>

            <Feature emoji="👶" title="Mazulīšu zona">
              Droša vieta mazākajiem bērniem.
            </Feature>

            <Feature emoji="🪩" title="Disco zāle">
              Gaismas un JBL skaļrunis.
            </Feature>

            <Feature emoji="🧗" title="Aktivitātes">
              Bolderinga siena un veiklības trase.
            </Feature>

            <Feature emoji="🏒" title="Gaisa hokejs">
              Izklaide bērniem un pieaugušajiem.
            </Feature>

          </div>

        </div>

      </section>

      {/* GALERIJA */}

      <GalleryCarousel
        title="Ieskaties mūsu telpās"
        images={images}
      />

      {/* VIRTUVE */}

      <section className="mx-auto max-w-7xl px-6 py-24">

        <div className="rounded-[40px] bg-pink-50 p-12">

          <h2 className="text-4xl font-bold">
            Virtuves zona
          </h2>

          <p className="mt-6 leading-8 text-gray-700">
            Kafijas automāts, tējkanna, kafija, tējas, piens, cukurs,
            sīrupi, krūzītes, glāzes, galda piederumi un servēšanas trauki.
          </p>

          <p className="mt-4 leading-8 text-gray-700">
            Pie galdiem ērti var apsēsties līdz 18 pieaugušajiem.
          </p>

        </div>

      </section>

      {/* CTA */}

      <section className="pb-24">

        <div className="mx-auto max-w-4xl rounded-[40px] bg-gradient-to-r from-pink-500 to-pink-600 px-10 py-16 text-center text-white">

          <h2 className="text-4xl font-bold">
            Gatavi rezervēt?
          </h2>

          <p className="mt-6 text-lg">
            Rezervē telpas jau šodien.
          </p>

          <Link
            href="/pieteikt"
            className="mt-10 inline-flex rounded-full bg-yellow-400 px-8 py-4 text-lg font-semibold text-black"
          >
            Rezervēt telpu
          </Link>

        </div>

      </section>

    </main>
  );
}

function Feature({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-md transition hover:-translate-y-2 hover:shadow-xl">
      <div className="text-5xl">{emoji}</div>

      <h3 className="mt-5 text-2xl font-bold">
        {title}
      </h3>

      <p className="mt-3 leading-7 text-gray-600">
        {children}
      </p>
    </div>
  );
}