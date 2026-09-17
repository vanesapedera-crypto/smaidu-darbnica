import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Tent,
  PartyPopper,
  School,
  CalendarDays,
  Users,
} from "lucide-react";

const eventTypes = [
  { icon: Building2, title: "Ģimeņu dienas" },
  { icon: Tent, title: "Bērnu zonas" },
  { icon: PartyPopper, title: "Pilsētu un novadu svētki" },
  { icon: CalendarDays, title: "Festivāli" },
  { icon: Users, title: "Uzņēmumu pasākumi" },
  { icon: School, title: "Skolu un bērnudārzu pasākumi" },
];

const services = [
  {
    title: "Sejas apgleznošana",
    description:
      "Kā mazajiem, tā lielajiem – no tauriņiem un lauvām līdz festivālu dizainiem.",
    image: "/images/corporate/facepaint.jpg",
  },
  {
    title: "Maskoti",
    description:
      "Iecienītākie tēli bērnu pasākumiem un svētkiem.",
    image: "/images/corporate/mascots.jpg",
  },
  {
    title: "Mobilā virvju trase",
    description:
      "Droša un aizraujoša aktivitāte dažāda vecuma bērniem.",
    image: "/images/corporate/rope-course.jpg",
  },
  {
    title: "Vertikālā kāpšanas siena",
    description:
      "Aktīva atrakcija bērniem un jauniešiem.",
    image: "/images/corporate/climbing-wall.jpg",
  },
  {
    title: "Futbola atrakcija",
    description:
      "Sportiskas aktivitātes mazajiem un lielajiem.",
    image: "/images/corporate/football.jpg",
  },
  {
    title: "Lielformāta spēles",
    description:
      "Dažādas aktivitātes un spēles visas dienas garumā.",
    image: "/images/corporate/games.jpg",
  },
];
const logos = [
  "stiga-rm.png",
  "dobeles-pilsetas-maja.png",
  "abavas-vini.png",
  "csk-steel.png",
  "tavi-draugi.png",
  "tukuma-kulturas-nams.png",
  "vizium.png",
  "jaunmoku-pils.png",
  "brabantia.png",
  "upb.png",
  "elyndi.png",
];

export default function CorporateEvents() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-6">

        {/* Virsraksts */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="rounded-full bg-pink-100 px-5 py-2 text-sm font-semibold text-pink-600">
            Uzņēmumiem un pašvaldībām
          </span>

          <h2 className="mt-6 text-5xl font-bold">
            Pasākumi uzņēmumiem un pašvaldībām
          </h2>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            Organizējam bērnu izklaidi dažāda mēroga pasākumos visā Latvijā –
            no ģimeņu dienām un bērnu zonām līdz festivāliem un pilsētu svētkiem.
          </p>
        </div>

        {/* Kur organizējam */}
        <div className="mt-20">
          <h3 className="mb-10 text-center text-3xl font-bold">
            Organizējam bērnu izklaidi
          </h3>

          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {eventTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-pink-200 hover:shadow-xl"
              >
                <item.icon className="mx-auto mb-5 h-12 w-12 text-pink-500" />

                <h3 className="text-lg font-semibold">
                  {item.title}
                </h3>
              </div>
            ))}
          </div>
        </div>

        {/* Pakalpojumi */}
        <div className="mt-24">
          <h3 className="mb-10 text-center text-3xl font-bold">
            Ko nodrošinām?
          </h3>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="group overflow-hidden rounded-[30px] shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative h-52">

                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  <div className="absolute bottom-0 p-5 text-white">
                    <h3 className="text-x1 font-bold">
                      {service.title}
                    </h3>

<p className="mt-2 text-sm leading-6 text-white/90">          
            {service.description}
                    </p>
                  </div>

                </div>
              </div>
             ))}
          </div>
        </div>

        {/* CTA */}
<div className="mt-24 overflow-hidden rounded-[36px] bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-600 p-12 text-white">
  <div className="mx-auto max-w-6xl">
    <div className="grid items-center gap-12 lg:grid-cols-2">

      <div>
        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold">
          Sadarbība
        </span>

        <h3 className="mt-6 text-4xl font-bold leading-tight">
          Meklē uzticamu partneri savam pasākumam?
        </h3>

        <p className="mt-6 text-lg leading-8 text-white/90">
          Mēs parūpēsimies par bērnu izklaidi, aktivitātēm un pasākuma
          norisi, lai Tu vari koncentrēties uz pārējo.
          Sagatavosim individuālu piedāvājumu tieši Tavam pasākumam.
        </p>

        <Link
          href="/pieteikt"
          className="mt-10 inline-flex rounded-full bg-white px-8 py-4 text-lg font-semibold text-pink-600 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-pink-50 hover:shadow-xl"
        >
          Saņemt individuālu piedāvājumu
        </Link>
      </div>

      <div className="grid gap-5">
        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          ✓ Pasākumu organizēšana un vadīšana no A–Z
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          ✓ Individuāli risinājumi katram pasākumam
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          ✓ Pieredzējusi animatoru komanda
        </div>

        <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
          ✓ Izbraucam visā Latvijā
        </div>
      </div>

    </div>
  </div>
</div>

{/* Mums uzticas */}
<div className="mt-32 border-t border-gray-200 pt-20">
  <div className="mx-auto max-w-6xl">

    <div className="text-center">
      <h3 className="text-4xl font-bold">
        Mums uzticas
      </h3>

      <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">
        Paldies uzņēmumiem, pašvaldībām un sadarbības partneriem par uzticību
        un iespēju būt daļai no viņu pasākumiem.
      </p>
    </div>

    <div className="mt-16 grid grid-cols-2 items-center gap-10 md:grid-cols-4 lg:grid-cols-6">
      {logos.map((logo) => (
        <div
          key={logo}
          className="flex justify-center"
        >
          <Image
            src={`/images/logos/${logo}`}
            alt={logo.replace(".png", "")}
            width={170}
            height={80}
            className="h-16 w-auto object-contain grayscale opacity-70 transition-all duration-300 hover:scale-110 hover:grayscale-0 hover:opacity-100"
          />
        </div>
      ))}
    </div>

    <p className="mt-16 text-center text-lg italic text-gray-500">
      Paldies mūsu klientiem un partneriem par uzticību!
    </p>
     </div> {/* max-w-6xl */}
</div> {/* Mums uzticas */}

</div> {/* max-w-7xl */}
</section>
  );
}