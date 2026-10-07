import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import RevealObserver from "@/components/site/RevealObserver";
import JsonLd from "@/components/site/JsonLd";
import { getServices, getSettings } from "@/lib/content/queries";
import { organizationSchema } from "@/lib/schema";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices("business")]);

  return (
    <>
      <Navbar
        services={[
          // Sezonā (kamēr ieslēgta Ziemassvētku reklāma) izvēlnē pirmā ir lapa "Ziemassvētki uzņēmumiem"
          ...(settings.home.xmasEnabled ? [{ slug: "ziemassvetki", title: "Ziemassvētki uzņēmumiem", icon: "TreePine" }] : []),
          ...services.map(({ slug, title, icon }) => ({ slug, title, icon })),
        ]}
        phone={settings.contact.phoneBusiness}
      />
      <main id="saturs">{children}</main>
      <Footer contact={settings.contact} services={services} />
      <RevealObserver />
      <JsonLd data={organizationSchema(settings)} />
    </>
  );
}
