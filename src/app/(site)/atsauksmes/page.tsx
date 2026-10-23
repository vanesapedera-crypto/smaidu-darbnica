import { Quote, Star } from "lucide-react";
import GoogleReviewsSection from "@/components/site/GoogleReviewsSection";
import TestimonialForm from "@/components/site/TestimonialForm";
import { StageHeading, StageHero } from "@/components/site/stage";
import { Container, Section } from "@/components/site/ui";
import { getSettings, getTestimonials } from "@/lib/content/queries";
import { reviewUrl } from "@/lib/review";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    path: "/atsauksmes",
    title: "Atsauksmes",
    description: "Ko par Smaidu Darbnīcas ballītēm, animatoriem un telpām saka mūsu klienti. Uzrakstiet arī savu atsauksmi!",
  });
}

/**
 * Lapa "Atsauksmes": publicētās klientu atsauksmes un forma jaunai atsauksmei (#rakstit).
 * Jaunās atsauksmes pienāk panelī paslēptas (Atsauksmes) — tur tās pārskata un publicē.
 * Uz šo lapu ved atsauksmes pieprasījums klientam (e-pasts / WhatsApp / SMS).
 */
export default async function TestimonialsPage() {
  const [settings, items] = await Promise.all([getSettings(), getTestimonials()]);

  return (
    <>
      <StageHero
        eyebrow="Atsauksmes"
        title="Ko saka mūsu"
        highlight="klienti"
        text="Paldies par katru labo vārdu! Ja svinējāt kopā ar mums, pastāstiet, kā Jums patika."
        crumbs={[{ name: "Atsauksmes", path: "/atsauksmes" }]}
        photos={[{ src: settings.programs.heroImage, caption: "Smaidu Darbnīca" }]}
      />

      {/* Google atsauksmes (ja ir GOOGLE_PLACES_API_KEY) */}
      <GoogleReviewsSection writeUrl={reviewUrl(settings.contact)} />

      <Section id="rakstit" tone="surface" className="scroll-mt-20">
        <Container className="max-w-3xl">
          <StageHeading title="Uzrakstiet" highlight="atsauksmi" text="Tas aizņems tikai minūti. Paldies, ka dalāties!" className="mb-10" />
          <TestimonialForm googleUrl={reviewUrl(settings.contact)} />
        </Container>
      </Section>

      {items.length > 0 && (
        <Section>
          <Container>
            <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {items.map((t, i) => (
                <li key={t.id ?? i} className="flex flex-col rounded-3xl bg-white p-8 shadow-sm ring-1 ring-line">
                  {t.rating > 0 ? (
                    <p className="flex gap-0.5" aria-label={`${t.rating} no 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={n <= t.rating ? "size-5 fill-brand text-brand-strong" : "size-5 text-ink/20"} aria-hidden />
                      ))}
                    </p>
                  ) : (
                    <Quote className="size-9 fill-brand text-brand" aria-hidden />
                  )}
                  <blockquote className="mt-5 flex-1 text-lg leading-8">“{t.text}”</blockquote>
                  <div className="mt-8 border-t border-line pt-6">
                    <p className="font-bold">{t.author}</p>
                    {(t.role || t.company) && <p className="text-sm text-ink-soft">{[t.role, t.company].filter(Boolean).join(", ")}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      )}
    </>
  );
}
