export default function Features() {
  const features = [
    {
      title: "Profesionāli animatori",
      text: "Pieredzējusi komanda, kas rada neaizmirstamus svētkus bērniem.",
      icon: "🎭",
    },
    {
      title: "Programmas visiem vecumiem",
      text: "Pielāgotas aktivitātes dažādiem vecumiem un interesēm.",
      icon: "🎈",
    },
    {
      title: "Pasākumi visā Latvijā",
      text: "Dodamies pie klientiem jebkur Latvijā.",
      icon: "🚗",
    },
  ];

  return (
    <section id="programmas" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="mb-4 text-center text-4xl font-bold">
          Kāpēc izvēlēties Smaidu Darbnīcu?
        </h2>

        <p className="mx-auto mb-16 max-w-2xl text-center text-gray-600">
          Mūsu mērķis ir radīt bērniem svētkus, kurus viņi atcerēsies vēl ilgi.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-4 text-5xl">{item.icon}</div>

              <h3 className="mb-3 text-2xl font-semibold">
                {item.title}
              </h3>

              <p className="text-gray-600">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}