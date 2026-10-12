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

/**
 * Saite, kur atstāt atsauksmi: panelī "Iestatījumi → Kontakti → Google atsauksmju saite".
 * Ja tā nav ievadīta — Smaidu Darbnīcas meklēšana Google kartēs (tur ir poga "Uzrakstīt atsauksmi").
 */
export function reviewUrl(contact: Pick<ContactSettings, "googleReviewUrl" | "city">): string {
  if (contact.googleReviewUrl?.trim()) return contact.googleReviewUrl.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Smaidu Darbnīca ${contact.city}`)}`;
}

/** E-pasta teksts: virsraksts, rindkopas un pogas uzraksts */
export function reviewEmailText(kind: ReviewKind, programTitle?: string) {
  if (kind === "venue") {
    return {
      subject: "Kā Jums patika svētki Smaidu Darbnīcā?",
      paragraphs: [
        "Paldies, ka svinējāt kopā ar mums Smaidu Darbnīcā! Ceram, ka svētki izdevās tieši tādi, kā vēlējāties.",
        "Mums būtu ļoti svarīgi uzzināt, kā Jums patika mūsu telpas. Ja atradīsiet minūti, lūdzu, atstājiet mums atsauksmi Google — tā palīdz arī citām ģimenēm mūs atrast.",
      ],
    };
  }
  return {
    subject: "Kā Jums patika svētki ar Smaidu Darbnīcu?",
    paragraphs: [
      `Paldies, ka izvēlējāties Smaidu Darbnīcu! Ceram, ka${programTitle ? ` “${programTitle}”` : " mūsu programma"} sagādāja daudz prieka un smieklu.`,
      "Mums būtu ļoti svarīgi uzzināt, kā Jums patika mūsu animatori un programma. Ja atradīsiet minūti, lūdzu, atstājiet mums atsauksmi Google — tā palīdz arī citiem mūs atrast.",
    ],
  };
}

/** Īsā ziņa WhatsApp / SMS ar saiti */
export function reviewMessageText(kind: ReviewKind, url: string): string {
  const about = kind === "venue" ? "mūsu telpas" : "mūsu animatori un programma";
  return `Sveiki! Rakstām no Smaidu Darbnīcas. Paldies, ka svinējāt kopā ar mums! Mums būtu ļoti svarīgi uzzināt, kā Jums patika ${about}. Ja atradīsiet minūti, lūdzu, atstājiet mums atsauksmi Google: ${url}`;
}
