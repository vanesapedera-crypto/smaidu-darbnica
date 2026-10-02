import { Mail, MapPin, Phone } from "lucide-react";
import InquiryForm from "@/components/site/InquiryForm";
import { StageHero } from "@/components/site/stage";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "@/components/site/icons";
import { Container, Section } from "@/components/site/ui";
import { getServices, getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

/**
 * Piedāvājumi, kas nav atsevišķs pakalpojums panelī, bet ko var izvēlēties pieprasījuma formā
 * (sk. Ziemassvētku bloku lapā "Uzņēmumiem"). Panelī pieteikumā redzams šeit norādītais `slug`.
 */
const EXTRA_OPTIONS = [
  { slug: "ziemassvetku-piedavajums", title: "Ziemassvētku piedāvājums" },
  { slug: "egles-iedegsana", title: "Egles iedegšana" },
];

export function generateMetadata() {
  return pageMetadata({
    path: "/kontakti",
    title: "Kontakti un piedāvājuma pieprasījums",
    description:
      "Sazinieties ar Smaidu Darbnīcu: pieprasiet piedāvājumu uzņēmuma vai pašvaldības pasākumam. Pasta iela 25, Tukums. Tālr. +371 26 705 817.",
  });
}

export default async function ContactPage() {
  const [{ contact }, services] = await Promise.all([getSettings(), getServices("business")]);
  const tel = (p: string) => `tel:${p.replace(/\s/g, "")}`;
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(contact.mapQuery)}&z=16&output=embed`;

  const socials = [
    { href: contact.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: contact.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: contact.tiktok, label: "TikTok", Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <>
      <StageHero
        eyebrow="Kontakti"
        title="Parunāsim par"
        highlight="jūsu"
        after="pasākumu"
        text="Aizpildiet pieprasījumu vai zvaniet — sagatavosim programmu un cenu piedāvājumu."
        crumbs={[{ name: "Kontakti", path: "/kontakti" }]}
        photos={[{ src: "/media/smaidu-darbnica/smaidu-darbnica-01.webp", caption: "Smaidu Darbnīcas komanda" }]}
      />

      <Section id="pieprasijums" tone="surface" className="scroll-mt-20">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-16">
          <aside className="space-y-4">
            <ContactCard icon={Phone} title="Uzņēmumiem un pašvaldībām" text={contact.phoneBusinessPerson}>
              <a href={tel(contact.phoneBusiness)} className="text-xl font-extrabold hover:underline">
                {contact.phoneBusiness}
              </a>
              {/* Katrai kontaktpersonai savs e-pasts — zem telefona */}
              <a
                href={`mailto:${contact.email}`}
                className="mt-1.5 flex items-center gap-2 font-bold break-all text-ink-soft hover:text-ink hover:underline"
              >
                <Mail className="size-4 shrink-0" aria-hidden />
                {contact.email}
              </a>
            </ContactCard>
            <ContactCard icon={Phone} title="Privātpersonām" text={contact.phonePrivatePerson}>
              <a href={tel(contact.phonePrivate)} className="text-xl font-extrabold hover:underline">
                {contact.phonePrivate}
              </a>
              {contact.emailPrivate && (
                <a
                  href={`mailto:${contact.emailPrivate}`}
                  className="mt-1.5 flex items-center gap-2 font-bold break-all text-ink-soft hover:text-ink hover:underline"
                >
                  <Mail className="size-4 shrink-0" aria-hidden />
                  {contact.emailPrivate}
                </a>
              )}
            </ContactCard>
            <ContactCard icon={MapPin} title="Telpu nomas adrese">
              <address className="font-bold not-italic">
                {contact.address}, {contact.city}, {contact.postalCode}
              </address>
            </ContactCard>

            <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
              <p className="text-sm font-bold">Sekojiet mums</p>
              <ul className="mt-4 flex gap-3">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="grid size-12 place-items-center rounded-full bg-surface transition-colors hover:bg-brand"
                    >
                      <Icon className="size-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rekvizīti — rāda tikai aizpildītos laukus (panelī: Kontakti) */}
            <div className="rounded-3xl bg-white p-6 ring-1 ring-line">
              <p className="text-sm font-bold">Rekvizīti</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                {[
                  ["Nosaukums", contact.legalName || contact.company],
                  ["Reģ. nr.", contact.regNr],
                  ["PVN nr.", contact.vatNr],
                  ["Juridiskā adrese", contact.legalAddress],
                  ["Banka", contact.bank],
                  ["Konts", contact.iban],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="w-32 shrink-0 text-ink-soft">{k}</dt>
                      <dd className="min-w-0 font-semibold break-words">{v}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          </aside>

          <div>
            <h2 className="display text-3xl md:text-4xl">Pieprasīt <span className="sticker">piedāvājumu</span></h2>
            <p className="mt-3 mb-8 text-lg leading-8 text-ink-soft">
              Jo vairāk pastāstīsiet par pasākumu, jo precīzāku piedāvājumu sagatavosim.
            </p>
            <InquiryForm services={[...services.map(({ slug, title }) => ({ slug, title })), ...EXTRA_OPTIONS]} />
          </div>
        </Container>
      </Section>

      <section aria-label="Karte" className="h-[420px] bg-surface">
        <iframe
          src={mapSrc}
          title={`Smaidu Darbnīca karte — ${contact.address}, ${contact.city}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="size-full border-0 grayscale-[30%]"
        />
      </section>
    </>
  );
}

function ContactCard({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 rounded-3xl bg-white p-6 ring-1 ring-line">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink-soft">
          {title}
          {text && ` · ${text}`}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </div>
  );
}
