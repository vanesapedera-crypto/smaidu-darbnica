import { atStudio, type Booking } from "./bookings";
import type { ContactSettings } from "./content/types";

/**
 * Atsauksmes pieprasījums klientam pēc ballītes (panelī poga "Pieprasīt atsauksmi").
 * Klients tiek aicināts atstāt atsauksmi Google. Teksts ir divos variantos:
 *  "venue"   — telpu noma bez izklaides programmas (par telpām);
 *  "program" — ar izklaides programmu (par animatoriem un programmu).
 * Tekstus var labot šeit — tie paši teksti ir e-pastā un WhatsApp / SMS ziņā.
 */
export type ReviewKind = "venue" | "program";

export const reviewKind = (b: Pick<Booking, "program" | "location">): ReviewKind =>
  b.program ? "program" : atStudio(b.location) ? "venue" : "program";

/** Smaidu Darbnīcas Google atsauksmes logs (Place ID ChIJuxUP7xj_7kYRsDlBY9z-ook) */
export const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJuxUP7xj_7kYRsDlBY9z-ook";

/**
 * Saite, kur atstāt atsauksmi: panelī "Iestatījumi → Kontakti → Google atsauksmju saite".
 * Ja tā nav ievadīta — GOOGLE_REVIEW_URL (tiešais Google atsauksmes logs).
 */
export function reviewUrl(contact: Pick<ContactSettings, "googleReviewUrl" | "city">): string {
  if (contact.googleReviewUrl?.trim()) return contact.googleReviewUrl.trim();
  return GOOGLE_REVIEW_URL;
}

/** Par ko lūdz atsauksmi */
const about = (kind: ReviewKind) => (kind === "venue" ? "mūsu telpām" : "mūsu animatoriem un programmu");

/** E-pasta teksts: tēma un rindkopas (aiz tām — poga "Atstāt atsauksmi") */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- programmas nosaukums pagaidām tekstā netiek lietots
export function reviewEmailText(kind: ReviewKind, programTitle?: string) {
  return {
    subject: "Paldies, ka izvēlējāties Smaidu Darbnīcu! 🌿",
    paragraphs: [
      "Paldies, ka izvēlējāties Smaidu Darbnīcu!",
      `Ceram, ka pasākums izdevās un bērniem tas sagādāja daudz prieka. Būsim ļoti pateicīgi, ja veltīsiet minūti un atstāsiet atsauksmi par ${about(kind)}:`,
    ],
  };
}

/** Īsā ziņa WhatsApp / SMS ar saiti */
export function reviewMessageText(kind: ReviewKind, url: string): string {
  return [
    "Sveiki! 🌿",
    "Paldies, ka izvēlējāties Smaidu Darbnīcu!",
    `Ceram, ka pasākums izdevās un bērniem tas sagādāja daudz prieka. Būsim ļoti pateicīgi, ja veltīsiet minūti un atstāsiet atsauksmi par ${about(kind)}:`,
    url,
    "Paldies par Jūsu laiku!",
    "Smaidu Darbnīca ✨",
  ].join("\n");
}
