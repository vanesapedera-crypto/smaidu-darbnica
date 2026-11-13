import { UI_MESSAGES, setLocale } from "@/lib/i18n/server";
import { LOCALES, asLocale, isLocale } from "@/lib/i18n/config";
import { notFound } from "next/navigation";
import { LocaleProvider } from "@/components/site/LocaleProvider";
import { dict } from "@/lib/i18n/dict";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import RevealObserver from "@/components/site/RevealObserver";
import JsonLd from "@/components/site/JsonLd";
import { getServices, getSettings } from "@/lib/content/queries";
import { organizationSchema } from "@/lib/schema";

// Valodas: lv (bez prefiksa), en, ru — citas adreses šajā līmenī → 404
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params?: Promise<{ lang: string }> }) {
  const lang = params ? (await params).lang : undefined;
  if (lang !== undefined && !isLocale(lang)) notFound();
  const locale = asLocale(lang);
  setLocale(locale);
  const [settings, services] = await Promise.all([getSettings(), getServices("business")]);

  return (
    <LocaleProvider locale={locale} messages={UI_MESSAGES[locale]}>
      <div lang={locale} className="contents">
      <Navbar
        services={[
          // Sezonā (kamēr ieslēgta Ziemassvētku reklāma) izvēlnē pirmā ir lapa "Ziemassvētki uzņēmumiem"
          ...(settings.home.xmasEnabled ? [{ slug: "ziemassvetki", title: dict(locale).xmasForBusiness, icon: "TreePine" }] : []),
          ...services.map(({ slug, title, icon }) => ({ slug, title, icon })),
        ]}
        phone={settings.contact.phoneBusiness}
      />
      <main id="saturs">{children}</main>
      <Footer contact={settings.contact} services={services} />
      <RevealObserver />
      <JsonLd data={organizationSchema(settings)} />
      </div>
    </LocaleProvider>
  );
}
