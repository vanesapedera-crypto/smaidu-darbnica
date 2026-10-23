import { Star } from "lucide-react";
import { getGoogleReviews } from "@/lib/google-reviews";
import { StageHeading } from "./stage";
import { Container, Section } from "./ui";

const Stars = ({ value, className = "size-5" }: { value: number; className?: string }) => (
  <span className="flex gap-0.5" aria-label={`${value} no 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star key={n} className={`${className} ${n <= Math.round(value) ? "fill-brand text-brand-strong" : "text-ink/20"}`} aria-hidden />
    ))}
  </span>
);

/** Google "G" logo (krāsains) — atsauksmju avota norādei */
const GoogleG = ({ className = "size-5" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden>
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

/**
 * Google atsauksmes (līdz 5, pēc Google izvēles) ar kopējo vērtējumu un saitēm uz Google.
 * Ja nav GOOGLE_PLACES_API_KEY vai Google neatbild — sadaļu nerāda.
 */
export default async function GoogleReviewsSection({ writeUrl, tone = "white" }: { writeUrl: string; tone?: "white" | "surface" }) {
  const data = await getGoogleReviews();
  if (!data || data.reviews.length === 0) return null;
  const count = data.count;
  const word = count % 10 === 1 && count % 100 !== 11 ? "atsauksme" : "atsauksmes";

  return (
    <Section tone={tone}>
      <Container>
        <StageHeading eyebrow="Google atsauksmes" title="Ko saka mūsu" highlight="klienti" />
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <p className="flex items-center gap-3">
            <GoogleG className="size-7" />
            <span className="font-display text-4xl font-extrabold">{data.rating.toLocaleString("lv-LV", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
            <Stars value={data.rating} className="size-6" />
          </p>
          <a href={data.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline decoration-brand decoration-2 underline-offset-4">
            {count} {word} Google
          </a>
        </div>

        <ul className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.reviews.map((r, i) => (
            <li key={`${r.author}-${i}`} className="flex flex-col rounded-3xl bg-white p-7 shadow-sm ring-1 ring-line">
              <div className="flex items-center gap-3">
                {r.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Google profila bilde
                  <img src={r.photo} alt="" width={40} height={40} referrerPolicy="no-referrer" className="size-10 rounded-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid size-10 place-items-center rounded-full bg-brand font-bold">{r.author.charAt(0)}</span>
                )}
                <div className="min-w-0 flex-1">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="block truncate font-bold hover:underline">
                      {r.author}
                    </a>
                  ) : (
                    <p className="truncate font-bold">{r.author}</p>
                  )}
                  <p className="text-sm text-ink-soft">{r.when}</p>
                </div>
                <GoogleG className="size-5 shrink-0" />
              </div>
              <div className="mt-4">
                <Stars value={r.rating} />
              </div>
              <blockquote className="mt-3 line-clamp-[10] flex-1 leading-7">{r.text}</blockquote>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap gap-3">
          <a
            href={writeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-extrabold transition-colors hover:bg-brand-strong"
          >
            <Star className="size-5" aria-hidden />
            Uzrakstīt atsauksmi Google
          </a>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 font-extrabold ring-1 ring-line transition-colors hover:ring-ink"
          >
            Visas atsauksmes Google
          </a>
        </div>
      </Container>
    </Section>
  );
}
