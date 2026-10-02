import Image from "next/image";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import type { ContactSettings, Service } from "@/lib/content/types";
import { NAV } from "@/lib/nav";
import { businessHref } from "@/lib/utils";
import { Container } from "./ui";
import { Smile } from "./stage";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./icons";

export default function Footer({ contact, services }: { contact: ContactSettings; services: Service[] }) {
  const year = new Date().getFullYear();
  const socials = [
    { href: contact.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: contact.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: contact.tiktok, label: "TikTok", Icon: TikTokIcon },
  ].filter((s) => s.href);

  return (
    <footer className="relative isolate overflow-hidden bg-ink text-white/75">
      <Smile className="absolute -right-16 -bottom-24 -z-10 w-80 text-white/[0.04]" />
      <Container className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Image src="/brand/logo-light.svg" alt="Smaidu Darbnīca" width={489} height={291} className="h-16 w-auto" />
          <p className="mt-6 max-w-sm leading-7">
            Pasākumu aģentūra uzņēmumiem, pašvaldībām un ģimenēm. Organizējam pasākumus visā Latvijā.
          </p>
          <ul className="mt-6 flex gap-3">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid size-11 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-brand hover:bg-brand hover:text-ink"
                >
                  <Icon className="size-5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-sm font-bold tracking-[0.18em] text-white uppercase">Uzņēmumiem</h2>
          <ul className="mt-5 space-y-2.5">
            {services.slice(0, 8).map((s) => (
              <li key={s.slug}>
                <Link href={businessHref(s.slug)} className="transition-colors hover:text-brand">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold tracking-[0.18em] text-white uppercase">Sadaļas</h2>
          <ul className="mt-5 space-y-2.5">
            {NAV.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-brand">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <address className="not-italic lg:col-span-3">
          <h2 className="text-sm font-bold tracking-[0.18em] text-white uppercase">Kontakti</h2>
          <ul className="mt-5 space-y-4">
            <li className="flex gap-3">
              <Phone className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <a href={`tel:${contact.phoneBusiness.replace(/\s/g, "")}`} className="font-semibold text-white hover:text-brand">
                  {contact.phoneBusiness}
                </a>
                <span className="block text-sm">Uzņēmumiem · {contact.phoneBusinessPerson}</span>
                <a href={`mailto:${contact.email}`} className="block text-sm break-all hover:text-brand">
                  {contact.email}
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <a href={`tel:${contact.phonePrivate.replace(/\s/g, "")}`} className="font-semibold text-white hover:text-brand">
                  {contact.phonePrivate}
                </a>
                <span className="block text-sm">Privātpersonām · {contact.phonePrivatePerson}</span>
                {contact.emailPrivate && (
                  <a href={`mailto:${contact.emailPrivate}`} className="block text-sm break-all hover:text-brand">
                    {contact.emailPrivate}
                  </a>
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
              <span>
                {contact.address}, {contact.city}, {contact.postalCode}
                <span className="block text-sm">Telpu noma</span>
              </span>
            </li>
          </ul>
        </address>
      </Container>

      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {contact.company} · Smaidu Darbnīca
          </p>
          <Link href="/privatuma-politika" className="hover:text-brand">
            Privātuma politika
          </Link>
        </Container>
      </div>
    </footer>
  );
}
