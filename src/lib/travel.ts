/**
 * Ceļa izdevumu aprēķins izbraukuma ballītēm (tikai serverī).
 *
 * Attālums tiek rēķināts pa ceļiem no Smaidu Darbnīcas (Pasta iela 25, Tukums) līdz ballītes adresei.
 * Maksa = attālums turp un atpakaļ × TRAVEL_RATE.
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

import { FREE_TRAVEL_KM } from "./pricing";

export const TRAVEL_RATE = 0.3; // € par km
export const TRAVEL_ORIGIN = "Pasta iela 25, Tukums, LV-3101";

// Aptuvenas Pasta ielas 25 koordinātas — izmanto tikai tad, ja sākumpunkta adresi neizdodas atrast
const ORIGIN_FALLBACK = { lat: 56.9674, lon: 23.1553 };

const USER_AGENT = "SmaiduDarbnica/1.0 (smaidudarbnica@gmail.com)";
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
};

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

async function osrmDistance(a: Point, b: Point): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const data = await getJson<{ code: string; routes: { distance: number }[] }>(url);
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("OSRM: maršruts nav atrasts");
  return data.routes[0].distance; // metros
}

/* ---------------- Kopējā funkcija ---------------- */

const memo = new Map<string, TravelQuote | null>();
let origin: Point | null = null;

/**
 * Aprēķina ceļa izdevumus līdz adresei. Atgriež null, ja adresi neizdodas atrast.
 * Izmet kļūdu, ja kartes pakalpojums nav pieejams.
 */
export async function quoteTravel(rawAddress: string): Promise<TravelQuote | null> {
  const address = rawAddress.trim().replace(/\s+/g, " ");
  if (address.length < 4) return null;
  const cacheKey = address.toLowerCase();
  if (memo.has(cacheKey)) return memo.get(cacheKey)!;

  const key = process.env.ORS_API_KEY;
  const geocode = (t: string) => (key ? orsGeocode(t, key) : osmGeocode(t));
  const distance = (a: Point, b: Point) => (key ? orsDistance(a, b, key) : osrmDistance(a, b));

  if (!origin) origin = (await geocode(TRAVEL_ORIGIN).catch(() => null)) ?? { ...ORIGIN_FALLBACK, label: TRAVEL_ORIGIN };

  // Ja lietotājs nav norādījis valsti, meklējam Latvijā
  const target = await geocode(/latvij/i.test(address) ? address : `${address}, Latvija`);
  if (!target) {
    memo.set(cacheKey, null);
    return null;
  }

  const meters = await distance(origin, target);
  const oneWayKm = Math.round(meters / 100) / 10; // 0,1 km precizitāte
  const roundTripKm = Math.round(oneWayKm * 2 * 10) / 10;
  const quote: TravelQuote = {
    address: target.label,
    oneWayKm,
    roundTripKm,
    // Ceļa izdevumus noapaļo uz leju līdz veselam eiro — klientam nav jāmaksā centi
    // (+1e-9 pasargā no datora aprēķina kļūdas, piem. 60 km × 0,30 = 17,999999… → 18)
    // Adresēm līdz FREE_TRAVEL_KM (vienā virzienā) ceļa izdevumu nav.
    cost: oneWayKm <= FREE_TRAVEL_KM ? 0 : Math.floor(roundTripKm * TRAVEL_RATE + 1e-9),
  };

  if (memo.size > 500) memo.clear(); // vienkāršs atmiņas ierobežojums
  memo.set(cacheKey, quote);
  return quote;
}
