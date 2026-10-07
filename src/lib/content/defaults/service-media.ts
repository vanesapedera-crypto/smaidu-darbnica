/**
 * Papildu materiāli uzņēmumu pakalpojumu lapām (pēc pakalpojuma slug):
 *  - SERVICE_PHOTOS — bilžu režģis zem apraksta (faili mapē public/media/<mape>/);
 *  - SERVICE_HERO_VIDEO — YouTube video ID fonam lapas galvenē.
 *
 * Svarīgi: nomainot bildes, failiem jādod JAUNI nosaukumi — pārlūks un Next.js attēlu
 * kešatmiņa vecās bildes ar to pašu nosaukumu rāda vēl ilgi.
 */
const range = (folder: string, prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `/media/${folder}/${prefix}-${String(i + 1).padStart(2, "0")}.webp`);

export const SERVICE_PHOTOS: Record<string, string[]> = {
  "pasakumu-organizesana": range("pasakumu-organizesana", "pasakums", 22),
  "sporta-speles": range("uznemumiem-sporta-speles", "sporta-speles", 8),
  "radosas-darbnicas": range("uznemumiem-radosas-darbnicas", "radosas-darbnicas", 10),
  "mazulu-zona": range("uznemumiem-mazulu-zona", "mazulu-zona", 10),
  "putu-ballite": range("uznemumiem-putu-ballite", "putas", 10),
  // 23 bildes (numura 11 nav)
  "sejas-apgleznosana": range("uznemumiem-sejas-apgleznosana", "sejas-apgleznosana", 24).filter((src) => !src.endsWith("-11.webp")),
};

/** Pakalpojumi, kuru bildes ir stāvas (portreta) — režģī rāda augstākas kartītes un 6 kolonnas */
export const SERVICE_PHOTOS_PORTRAIT = new Set(["sejas-apgleznosana", "putu-ballite"]);

export const SERVICE_HERO_VIDEO: Record<string, string> = {
  "pasakumu-organizesana": "HFTc7zIuO0E",
};

/** Pakalpojumi, kuriem ir gan guļus, gan stāvas bildes — režģī rāda kvadrātveida kartītes */
export const SERVICE_PHOTOS_SQUARE = new Set(["radosas-darbnicas", "mazulu-zona"]);

/**
 * Bilžu karuselis lapas "Izrādes" apakšā (mape public/media/izrades).
 * Platums un augstums vajadzīgs, lai karuselī katra bilde ieņemtu savu proporciju.
 * Jaunu bildi pievieno mapē un ieraksta šeit.
 */
export const SHOW_PHOTOS: { src: string; width: number; height: number }[] = [
  { src: "/media/izrades/izrade-02.webp", width: 700, height: 467 },
  { src: "/media/izrades/izrade-01.webp", width: 1067, height: 1600 },
  { src: "/media/izrades/izrade-13.webp", width: 1066, height: 1600 },
  { src: "/media/izrades/izrade-04.webp", width: 1066, height: 1600 },
  { src: "/media/izrades/izrade-08.webp", width: 700, height: 467 },
  { src: "/media/izrades/izrade-05.webp", width: 1067, height: 1600 },
  { src: "/media/izrades/izrade-10.webp", width: 1066, height: 1600 },
  { src: "/media/izrades/izrade-03.webp", width: 1067, height: 1600 },
  { src: "/media/izrades/izrade-09.webp", width: 843, height: 1265 },
  { src: "/media/izrades/izrade-07.webp", width: 700, height: 467 },
  { src: "/media/izrades/izrade-11.webp", width: 1201, height: 1600 },
  { src: "/media/izrades/izrade-12.webp", width: 1152, height: 1440 },
  { src: "/media/izrades/izrade-06.webp", width: 1067, height: 1600 },
];

/**
 * Lielākas (2048 px) versijas galvenes fonam — mape public/media/hero.
 * Kartītēs un galerijās paliek mazākās bildes; galvene pa visu ekrānu ņem lielo, lai fons ir asāks.
 */
export const HERO_HD: Record<string, string> = {
  // Horizontāla bilde galvenei, ja kartītes bilde ir vertikāla (kartītē paliek kartītes bilde)
  "/media/speles/jenga.webp": "/media/hero/sporta-speles-06.webp", // Party Trip — spēle "Slinkais šoferītis"
  "/media/uznemumiem-radosas-darbnicas/radosas-darbnicas-07.webp": "/media/hero/radosas-darbnicas-03.webp",
  "/media/pasakumu-organizesana/pasakums-09.webp": "/media/hero/pasakums-09.webp",
  "/media/uznemumiem-mazulu-zona/mazulu-zona-09.webp": "/media/hero/mazulu-zona-09.webp",
  "/media/uznemumiem-sporta-speles/sporta-speles-01.webp": "/media/hero/sporta-speles-01.webp",
  // Pārsteiguma tēls: galvenē — tā pati bēbīšu bilde, kas kartītē, tikai horizontāla un lielāka
  "/media/parsteiguma-tels/parsteiguma-tels-bebisi.webp": "/media/hero/parsteiguma-tels-wide-v2.webp",
};

/** Izklaides programmas, kuru kartītes bilde nav mapes pirmā bilde (…-01.webp) */
export const PROGRAM_IMAGE: Record<string, string> = {
  "parsteiguma-tels": "/media/parsteiguma-tels/parsteiguma-tels-bebisi.webp",
};

/**
 * Atsevišķa (vertikāla) bilde telefonam, ja datora galvenes bilde ir horizontāla
 * un telefonā no tās būtu redzama tikai vidusdaļa.
 */
export const HERO_MOBILE: Record<string, string> = {
  "/media/hero/parsteiguma-tels-wide-v2.webp": "/media/hero/parsteiguma-tels-v2.webp",
};

/** Kura bildes daļa paliek redzama galvenē, ja bilde neietilpst vesela (CSS object-position) */
export const HERO_POSITION: Record<string, string> = {
  "/media/hero/parsteiguma-tels-wide-v2.webp": "100% 50%",
  // Ziemassvētki bērnudārzā: stāva bilde — rāda augšdaļu ar sejām
  "/media/ziemassvetki-bernudarza/ziemassvetki-bernudarza-03.webp": "50% 22%",
};

/** Pārsteiguma tēli (programmas "Pārsteiguma tēls" lapā): nosaukums + bilde no mapes public/media/parsteiguma-tels */
const tels = (n: string) => `/media/parsteiguma-tels/parsteiguma-tels-${n}.webp`;
export const CHARACTERS: { name: string; image: string }[] = [
  { name: "Skaja", image: tels("08") },
  { name: "Čeizs", image: tels("04") },
  { name: "Soniks", image: tels("01") },
  { name: "Bings", image: tels("07") },
  { name: "Vienradzis", image: tels("02") },
  { name: "Zaķenīte", image: tels("05") },
  { name: "Rodžers", image: tels("06") },
  { name: "Bēbīši", image: tels("03") },
];
