/**
 * Ceļa izdevumu aprēķins izbraukuma ballītēm (tikai serverī).
 *
 * Attālums tiek rēķināts pa ceļiem no Smaidu Darbnīcas (Pasta iela 25, Tukums) līdz ballītes adresei.
 * Maksa = attālums turp un atpakaļ × ceļa likme (€/km). Likmi un attālumu, līdz kuram ceļa izdevumu nav,
 * rediģē panelī (Izklaides programmas → Izbraukuma ballītes).
 *
 * Pakalpojumi:
 *  - ja ir iestatīts ORS_API_KEY — OpenRouteService (bezmaksas atslēga: openrouteservice.org,
 *    2000 pieprasījumi dienā). Ieteicams produkcijai.
 *  - citādi — OpenStreetMap Nominatim (adreses meklēšana) + OSRM publiskais maršrutētājs.
 *    Der mazam pieprasījumu skaitam; to lietošanas noteikumi prasa kešot rezultātus
 *    un neveikt meklēšanu katram nospiestajam taustiņam (tāpēc forma rēķina tikai pēc adreses ievadīšanas).
 *
 * Rezultāti tiek kešoti (Next.js datu kešs + atmiņa), tāpēc viena adrese netiek meklēta atkārtoti.
 */

import { getSettings } from "./content/queries";

export const TRAVEL_ORIGIN = "Pasta iela 25, Tukums, LV-3101";

// Aptuvenas Pasta ielas 25 koordinātas — izmanto tikai tad, ja sākumpunkta adresi neizdodas atrast
const ORIGIN_FALLBACK = { lat: 56.9674, lon: 23.1553 };

const USER_AGENT = "SmaiduDarbnica/1.0 (smaidu.darbnica@gmail.com)";
const DAY = 60 * 60 * 24;

type Point = { lat: number; lon: number; label: string };

export type TravelQuote = {
  /** Atrastā adrese (lai lietotājs var pārliecināties, ka tā ir pareizā) */
  address: string;
  /** Attālums vienā virzienā, km */
  oneWayKm: number;
  /** Attālums turp un atpakaļ, km */
  roundTripKm: number;
  /** Ceļa izdevumi, € */
  cost: number;
  /** Ceļa likme, € par km */
  rate: number;
};

/** Atrastais maršruts (bez cenas) — to var kešot, jo attālums nemainās */
type Route = Pick<TravelQuote, "address" | "oneWayKm" | "roundTripKm">;

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "lv", ...init?.headers },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: DAY }, // viena un tā pati adrese / maršruts tiek kešots uz diennakti
  });
  if (!res.ok) throw new Error(`${new URL(url).host}: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ---------------- OpenRouteService ---------------- */

async function orsGeocode(text: string, key: string): Promise<Point | null> {
  const url = `https://api.openrouteservice.org/geocode/search?${new URLSearchParams({
    api_key: key,
    text,
    "boundary.country": "LV",
    size: "1",
  })}`;
  const data = await getJson<{ features: { geometry: { coordinates: [number, number] }; properties: { label: string } }[] }>(url);
  const f = data.features?.[0];
  return f ? { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], label: f.properties.label } : null;
}

async function orsDistance(a: Point, b: Point, key: string): Promise<number> {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?${new URLSearchParams({
    api_key: key,
    start: `${a.lon},${a.lat}`,
    end: `${b.lon},${b.lat}`,
  })}`;
  const data = await getJson<{ features: { properties: { summary: { distance: number } } }[] }>(url);
  return data.features[0].properties.summary.distance; // metros
}

/* ---------------- Nominatim + OSRM ---------------- */

async function osmGeocode(text: string): Promise<Point | null> {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
    q: text,
    countrycodes: "lv",
    format: "jsonv2",
    limit: "1",
  })}`;
  const data = await getJson<{ lat: string; lon: string; display_name: string }[]>(url);
  const r = data[0];
  return r ? { lat: Number(r.lat), lon: Number(r.lon), label: r.display_name } : null;
}

/** Rezerves adrešu meklētājs (Photon, arī no OpenStreetMap datiem), ja Nominatim neatbild */
async function photonGeocode(text: string): Promise<Point | null> {
  const url = `https://photon.komoot.io/api/?${new URLSearchParams({ q: text, limit: "1", lat: "56.95", lon: "24.1" })}`;
  const data = await getJson<{ features: { geometry: { coordinates: [number, number] }; properties: Record<string, string> }[] }>(url);
  const f = data.features?.find((x) => x.properties.countrycode === "LV") ?? null;
  if (!f) return null;
  const p = f.properties;
  const label = [p.name, p.street && `${p.street} ${p.housenumber ?? ""}`.trim(), p.city ?? p.county, p.postcode].filter(Boolean).join(", ");
  return { lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], label };
}

async function osmFind(text: string): Promise<Point | null> {
  try {
    return await osmGeocode(text);
  } catch (e) {
    console.warn("[travel] nominatim", (e as Error).message);
    return photonGeocode(text);
  }
}

/** Maršruts pa ceļiem: OSRM publiskais serveris, ja tas neatbild — routing.openstreetmap.de */
async function osrmDistance(a: Point, b: Point): Promise<number> {
  const path = `${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  let lastError: unknown;
  for (const base of ["https://router.project-osrm.org/route/v1/driving/", "https://routing.openstreetmap.de/routed-car/route/v1/driving/"]) {
    try {
      const data = await getJson<{ code: string; routes: { distance: number }[] }>(base + path);
      if (data.code === "Ok" && data.routes?.[0]) return data.routes[0].distance; // metros
      lastError = new Error("OSRM: maršruts nav atrasts");
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/**
 * Adreses varianti meklēšanai: lauku adresēm ("Dreijeri", Krimuldas pag., Siguldas nov., LV-2145) meklētājs bieži
 * neatrod pilnu tekstu — tad mēģina bez pēdiņām, ar pilniem vārdiem (pagasts, novads), pēc pagasta un pēc pasta indeksa.
 */
export function addressVariants(address: string): string[] {
  const clean = address.replace(/["“”„«»]/g, "").replace(/\s+/g, " ").trim().replace(/[.,;\s]+$/, "");
  const full = clean
    .replace(/\bpag\.?(?=[\s,]|$)/gi, "pagasts")
    .replace(/\bnov\.?(?=[\s,]|$)/gi, "novads")
    .replace(/\bpils\.?(?=[\s,]|$)/gi, "pilsēta");
  const parts = full.split(",").map((x) => x.trim()).filter(Boolean);
  const postcode = full.match(/LV-?\s?(\d{4})/i)?.[1];
  const area = parts.filter((x) => /pagasts|novads|pilsēta/i.test(x)).join(", ");
  const lv = (t: string) => (/latvij/i.test(t) ? t : `${t}, Latvija`);
  return [...new Set([address, clean, full, parts.slice(0, 2).join(", "), area, postcode && `LV-${postcode}`].filter((x): x is string => Boolean(x)).map(lv))];
}

/* ---------------- Kopējā funkcija ---------------- */

const memo = new Map<string, Route | null>();
let origin: Point | null = null;

/**
 * Aprēķina ceļa izdevumus līdz adresei. Atgriež null, ja adresi neizdodas atrast.
 * Izmet kļūdu, ja kartes pakalpojums nav pieejams.
 */
export async function quoteTravel(rawAddress: string): Promise<TravelQuote | null> {
  const route = await routeTo(rawAddress);
  if (!route) return null;
  const { programs } = await getSettings();
  return {
    ...route,
    rate: programs.travelRate,
    // Adresēm līdz programs.freeTravelKm (vienā virzienā) ceļa izdevumu nav.
    // Pārējām — noapaļo uz leju līdz veselam eiro, lai klientam nav jāmaksā centi
    // (+1e-9 pasargā no datora aprēķina kļūdas, piem. 60 km × 0,30 = 17,999999… → 18).
    cost: route.oneWayKm <= programs.freeTravelKm ? 0 : Math.floor(route.roundTripKm * programs.travelRate + 1e-9),
  };
}

/** Atrod adresi un attālumu pa ceļiem no Smaidu Darbnīcas. Rezultāts tiek kešots. */
async function routeTo(rawAddress: string): Promise<Route | null> {
  const address = rawAddress.trim().replace(/\s+/g, " ");
  if (address.length < 4) return null;
  const cacheKey = address.toLowerCase();
  if (memo.has(cacheKey)) return memo.get(cacheKey)!;

  const key = process.env.ORS_API_KEY;
  const geocode = (t: string) => (key ? orsGeocode(t, key) : osmFind(t));
  const distance = (a: Point, b: Point) => (key ? orsDistance(a, b, key) : osrmDistance(a, b));

  if (!origin) origin = (await geocode(TRAVEL_ORIGIN).catch(() => null)) ?? { ...ORIGIN_FALLBACK, label: TRAVEL_ORIGIN };

  // Meklē adresi; ja pilnu tekstu neatrod — vienkāršākus variantus (sk. addressVariants). Valsts — Latvija.
  let target: Point | null = null;
  for (const variant of addressVariants(address)) {
    target = await geocode(variant);
    if (target) break;
  }
  if (!target) {
    memo.set(cacheKey, null);
    return null;
  }

  const meters = await distance(origin, target);
  const oneWayKm = Math.round(meters / 100) / 10; // 0,1 km precizitāte
  const roundTripKm = Math.round(oneWayKm * 2 * 10) / 10;
  const route: Route = { address: target.label, oneWayKm, roundTripKm };

  if (memo.size > 500) memo.clear(); // vienkāršs atmiņas ierobežojums
  memo.set(cacheKey, route);
  return route;
}
