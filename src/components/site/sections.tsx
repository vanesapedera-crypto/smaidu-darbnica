import { Mail, Phone, Plus, Quote } from "lucide-react";
import type { Client, ContactSettings, Faq, Testimonial } from "@/lib/content/types";
import { faqSchema } from "@/lib/schema";
import JsonLd from "./JsonLd";
import { ButtonLink, Container, Section } from "./ui";
import { Smile, StageHeading } from "./stage";

/* ------------------------------------------------------------------ */
/* Aicinājuma josla (CTA) lapu beigās                                 */
/* ------------------------------------------------------------------ */
export function CtaBand({
  title,
  text,
  contact,
  href = "/kontakti#pieprasijums",
  label = "Pieprasīt piedāvājumu",
}: {
  title: string;
  text: string;
  contact: ContactSettings;
  href?: string;
  label?: string;
}) {
  return (
    <Section className="py-16 md:py-20">
      <Container>
        <div data-reveal className="relative isolate overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-white sm:px-12 md:py-20 lg:px-16">
          <Smile className="absolute -right-10 -bottom-20 -z-10 w-72 text-white/[0.04] md:w-96" />
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <h2 className="display text-3xl sm:text-4xl md:text-5xl">{title}</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/75">{text}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <ButtonLink href={href} size="lg" arrow>
                  {label}
                </ButtonLink>
              </div>
            </div>
            <ul className="space-y-3">
              <li>
                <a href={`tel:${contact.phoneBusiness.replace(/\s/g, "")}`} className="flex items-center gap-4 rounded-2xl border border-white/12 p-4 transition-colors hover:border-brand/60">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-ink">
                    <Phone className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-white/60">Zvaniet — {contact.phoneBusinessPerson}</span>
                    <span className="text-lg font-bold">{contact.phoneBusiness}</span>
                  </span>
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-4 rounded-2xl border border-white/12 p-4 transition-colors hover:border-brand/60">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-ink">
                    <Mail className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm text-white/60">Rakstiet</span>
                    <span className="block truncate text-lg font-bold">{contact.email}</span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Biežāk uzdotie jautājumi (ar FAQPage strukturētajiem datiem)       */
/* ------------------------------------------------------------------ */
export function FaqList({ items, title = "Biežāk uzdotie jautājumi" }: { items: Faq[]; title?: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h2 className="display text-2xl md:text-4xl">{title}</h2>
      <div className="mt-8 divide-y divide-line border-y border-line">
        {items.map((f) => (
          <details key={f.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-lg font-bold [&::-webkit-details-marker]:hidden">
              {f.question}
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface transition-all group-open:rotate-45 group-open:bg-brand">
                <Plus className="size-4" aria-hidden />
              </span>
            </summary>
            <p className="mt-4 max-w-3xl leading-7 text-ink-soft">{f.answer}</p>
          </details>
        ))}
      </div>
      <JsonLd data={faqSchema(items)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Klientu atsauksmes                                                 */
/* ------------------------------------------------------------------ */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <Section tone="surface">
      <Container>
        <StageHeading eyebrow="Atsauksmes" title="Ko saka mūsu" highlight="klienti" />
        <ul className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <li
              key={t.id ?? i}
              data-reveal
              style={{ "--reveal-delay": `${(i % 3) * 90}ms` } as React.CSSProperties}
              className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-line"
            >
              <Quote className="size-9 fill-brand text-brand" aria-hidden />
              <blockquote className="mt-5 flex-1 text-lg leading-8">“{t.text}”</blockquote>
              <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
                {t.logo && (
                  // eslint-disable-next-line @next/next/no-img-element -- logo var būt SVG
                  <img src={t.logo} alt="" className="h-10 w-auto max-w-24 object-contain" loading="lazy" />
                )}
                <div>
                  <p className="font-bold">{t.author}</p>
                  <p className="text-sm text-ink-soft">{[t.role, t.company].filter(Boolean).join(", ")}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Klienti / pasākumi — logo vai nosaukumi slīdošā joslā               */
/* ------------------------------------------------------------------ */
export function ClientsStrip({ items, title = "Mums uzticas" }: { items: Client[]; title?: string }) {
  if (items.length === 0) return null;
  // Saraksts tiek dublēts, lai animācija būtu nepārtraukta
  const loop = [...items, ...items];
  return (
    <section id="klienti" aria-label={title} className="border-y border-line bg-white py-10">
      <Container className="flex flex-col items-center gap-6 md:flex-row md:gap-10">
        <p className="shrink-0 text-xs font-bold tracking-[0.18em] text-ink-soft uppercase">{title}</p>
        <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <ul className="animate-marquee flex w-max items-center gap-12 pr-12">
            {loop.map((c, i) => (
              <li key={`${c.name}-${i}`} aria-hidden={i >= items.length} className="shrink-0">
                {c.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo var būt SVG
                  <img
                    src={c.logo}
                    alt={c.name}
                    loading="lazy"
                    className="h-10 w-auto max-w-36 object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0"
                  />
                ) : (
                  <span className="font-display text-base font-bold whitespace-nowrap text-ink/45 uppercase md:text-lg">{c.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Klienti un partneri — logo režģis ar pateicības citātu              */
/* ------------------------------------------------------------------ */
export function Partners({
  items,
  quote = "Katrs mūsu pasākums ir īpašs, jo to radām kopā ar Jums! Paldies mūsu klientiem un partneriem par uzticību un iespēju būt daļai no Jūsu svētkiem.",
}: {
  items: Client[];
  quote?: string;
}) {
  const logos = items.filter((c) => c.logo);
  if (logos.length === 0) return null;
  return (
    <section aria-labelledby="partneri" className="py-20 md:py-28">
      <Container>
        <div data-reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-extrabold tracking-[0.14em] text-ink-soft uppercase" id="partneri">
            Mums uzticas
          </p>
          <blockquote className="mt-5 text-2xl leading-snug font-semibold text-balance md:text-3xl md:leading-snug">
            <span aria-hidden className="text-brand-strong">“</span>
            {quote}
            <span aria-hidden className="text-brand-strong">”</span>
          </blockquote>
        </div>
        {/* Logo melnbalti; uzbraucot ar peli — krāsās */}
        <ul className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mt-16 lg:grid-cols-5">
          {logos.map((c, i) => (
            <li
              key={c.name}
              data-reveal
              style={{ "--reveal-delay": `${(i % 5) * 60}ms` } as React.CSSProperties}
              className="group flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-line md:h-32"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- logo var būt SVG vai augšupielādēts */}
              <img
                src={c.logo}
                alt={c.name}
                loading="lazy"
                className="h-16 w-auto max-w-full object-contain opacity-70 grayscale md:h-[4.5rem] transition duration-300 group-hover:opacity-100 group-hover:grayscale-0"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
