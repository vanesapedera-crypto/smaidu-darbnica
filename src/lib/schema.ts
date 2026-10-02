import { SITE_URL, absoluteUrl } from "@/lib/seo";
import type { Faq, Service, SiteSettings } from "@/lib/content/types";

/** Schema.org strukturētie dati (JSON-LD). */

export function organizationSchema({ contact, seo }: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#organization`,
    name: seo.siteName,
    legalName: (contact.legalName || contact.company).replace(/"/g, ""),
    ...(contact.regNr ? { taxID: contact.regNr } : {}),
    description: seo.defaultDescription,
    url: SITE_URL,
    logo: absoluteUrl("/brand/logo-dark.png"),
    image: absoluteUrl(seo.ogImage),
    telephone: contact.phoneBusiness.replace(/\s/g, ""),
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressLocality: contact.city,
      postalCode: contact.postalCode,
      addressCountry: "LV",
    },
    areaServed: { "@type": "Country", name: "Latvija" },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "16:00",
    },
    sameAs: [contact.facebook, contact.instagram, contact.tiktok].filter(Boolean),
  };
}

export function serviceSchema(service: Service, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.excerpt,
    url: absoluteUrl(path),
    image: service.heroImage ? absoluteUrl(service.heroImage) : undefined,
    serviceType: service.title,
    areaServed: { "@type": "Country", name: "Latvija" },
    provider: { "@id": `${SITE_URL}/#organization` },
    audience: {
      "@type": "Audience",
      audienceType: service.audience === "business" ? "Uzņēmumi, pašvaldības, izglītības iestādes" : "Ģimenes",
    },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqSchema(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
