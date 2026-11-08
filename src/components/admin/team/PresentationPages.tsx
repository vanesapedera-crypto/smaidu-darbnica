import type { ContactSettings } from "@/lib/content/types";

export type Slide = { id: string; title: string; description: string | null; image: string | null; tag: string };

/**
 * Prezentācijas lapas (A4 ainavā): titullapa, programmas saraksts, lapa katrai darbnīcai/aktivitātei
 * ar foto un aprakstu, kontakti. Lieto piedāvājuma dokuments un atsevišķās prezentācijas.
 */
export default function PresentationPages({
  kicker,
  client,
  title,
  meta,
  slides,
  extras,
  note,
  contact,
  contactLine,
}: {
  kicker: string;
  client: string;
  title: string;
  meta: string;
  slides: Slide[];
  extras: string[];
  note: string;
  contact: ContactSettings;
  contactLine: string;
}) {
  return (
    <>
          {/* Titullapa */}
          <section className="page relative mx-auto mb-8 flex flex-col justify-between overflow-hidden bg-ink p-[18mm] text-white shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-light.svg" alt="Smaidu Darbnīca" className="h-[26mm] w-auto self-start" />
            <div>
              <p className="text-sm font-bold tracking-[0.2em] text-brand uppercase">{kicker} · {client}</p>
              <h1 className="mt-4 max-w-[220mm] font-display text-[34pt] leading-[1.05] font-extrabold uppercase">{title}</h1>
              <p className="mt-6 text-lg text-white/80">
                {meta}
              </p>
            </div>
            <p className="text-sm text-white/70">{contactLine}</p>
            <div className="absolute -right-[30mm] -bottom-[30mm] size-[110mm] rounded-full bg-brand/90" aria-hidden />
          </section>

          {/* Programma */}
          <section className="page mx-auto mb-8 flex flex-col bg-white p-[18mm] shadow-xl">
            <p className="text-sm font-bold tracking-[0.2em] text-ink-soft uppercase">Programmā</p>
            <h2 className="mt-2 font-display text-[24pt] font-extrabold uppercase">Ko mēs piedāvājam</h2>
            <ol className="mt-8 grid grid-cols-2 gap-x-10 gap-y-4">
              {slides.map((s, i) => (
                <li key={s.id} className="flex items-baseline gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-sm font-extrabold">{i + 1}</span>
                  <span>
                    <span className="block text-lg font-extrabold">{s.title}</span>
                    <span className="block text-sm text-ink-soft">{s.tag}</span>
                  </span>
                </li>
              ))}
              {extras.map((x, i) => (
                <li key={`extra-${i}`} className="flex items-baseline gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink font-display text-sm font-extrabold text-brand">+</span>
                  <span className="block text-lg font-extrabold">{x}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Pa vienai lapai katrai darbnīcai / aktivitātei */}
          {slides.map((s) => (
            <section key={s.id} className="page mx-auto mb-8 grid grid-cols-2 overflow-hidden bg-white shadow-xl">
              <div className="relative bg-surface">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-brand">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/logo-dark.svg" alt="" className="w-1/2 opacity-90" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-[16mm]">
                <p className="text-sm font-bold tracking-[0.2em] text-ink-soft uppercase">{s.tag}</p>
                <h2 className="mt-3 font-display text-[24pt] leading-tight font-extrabold uppercase">{s.title}</h2>
                <div className="mt-4 h-1.5 w-16 rounded-full bg-brand" />
                <p className="mt-6 text-[12.5pt] leading-relaxed whitespace-pre-line">{s.description || ""}</p>
              </div>
            </section>
          ))}

          {/* Kontakti */}
          <section className="page mx-auto mb-8 flex flex-col items-start justify-center bg-brand p-[18mm] shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-dark.svg" alt="Smaidu Darbnīca" className="h-[30mm] w-auto" />
            <h2 className="mt-10 font-display text-[28pt] font-extrabold uppercase">Sazināsimies!</h2>
            <p className="mt-4 text-xl font-bold">
              {contact.phoneBusinessPerson} · {contact.phoneBusiness}
            </p>
            <p className="text-xl font-bold">{contact.email}</p>
            <p className="mt-2 text-lg">www.smaidudarbnica.lv</p>
            {note && <p className="mt-8 max-w-[200mm] text-base whitespace-pre-line">{note}</p>}
          </section>
    </>
  );
}
