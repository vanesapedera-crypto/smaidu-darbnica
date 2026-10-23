import "server-only";

/**
 * Google atsauksmes mājaslapai (Google Places API (New) — Place Details).
 * Vajadzīgs vides mainīgais GOOGLE_PLACES_API_KEY (Google Cloud → APIs & Services → Credentials → API key,
 * ieslēgts "Places API (New)"; sk. docs/google-atsauksmes.md). Ja atslēgas nav — atsauksmes vienkārši nerāda.
 * Google atdod līdz 5 atsauksmēm (pēc Google izvēles) un kopējo vērtējumu. Rezultāts tiek kešots uz diennakti.
 */

export const GOOGLE_PLACE_ID = "ChIJuxUP7xj_7kYRsDlBY9z-ook";

export type GoogleReview = {
  author: string;
  photo: string;
  authorUrl: string;
  rating: number;
  text: string;
  /** piem. "pirms mēneša" */
  when: string;
};
export type GoogleReviews = { rating: number; count: number; reviews: GoogleReview[]; url: string };

type ApiReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
};

export async function getGoogleReviews(): Promise<GoogleReviews | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}?languageCode=lv`, {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri" },
      next: { revalidate: 60 * 60 * 24 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[google-reviews]", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as { rating?: number; userRatingCount?: number; reviews?: ApiReview[]; googleMapsUri?: string };
    return {
      rating: data.rating ?? 0,
      count: data.userRatingCount ?? 0,
      url: data.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${GOOGLE_PLACE_ID}`,
      reviews: (data.reviews ?? [])
        .map((r) => ({
          author: r.authorAttribution?.displayName ?? "",
          photo: r.authorAttribution?.photoUri ?? "",
          authorUrl: r.authorAttribution?.uri ?? "",
          rating: r.rating ?? 0,
          text: (r.originalText?.text ?? r.text?.text ?? "").trim(),
          when: r.relativePublishTimeDescription ?? "",
        }))
        .filter((r) => r.text),
    };
  } catch (e) {
    console.error("[google-reviews]", e);
    return null;
  }
}
