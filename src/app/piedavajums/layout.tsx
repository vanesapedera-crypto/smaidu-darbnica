import Image from "next/image";
import { getSettings } from "@/lib/content/queries";

export const metadata = { robots: { index: false, follow: false } };

/**
 * Individuālā piedāvājuma lapa (saite, ko sūta konkrētam klientam) — bez mājaslapas izvēlnes un kājenes:
 * augšā tikai logo, apakšā — kontakti.
 */
export default async function OfferLayout({ children }: { children: React.ReactNode }) {
  const { contact } = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-[#121110] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Image src="/brand/logo-light.svg" alt="Smaidu Darbnīca" width={489} height={291} className="h-10 w-auto" priority />
          <a href={`tel:${contact.phoneBusiness.replace(/\s/g, "")}`} className="text-sm font-bold whitespace-nowrap text-brand">
            {contact.phoneBusiness}
          </a>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-white/10 pb-20 lg:pb-0">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-white/50 sm:px-6">
          <span>Smaidu Darbnīca · {contact.address}, {contact.city}</span>
          <span>
            <a href={`mailto:${contact.email}`} className="font-semibold text-white">
              {contact.email}
            </a>{" "}
            · {contact.phoneBusiness}
          </span>
        </div>
      </footer>
    </div>
  );
}
