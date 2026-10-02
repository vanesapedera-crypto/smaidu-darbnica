import type { PriceGroup, SiteSettings } from "@/lib/content/types";

/**
 * Aptuvenās cenas aprēķins privātajām ballītēm.
 *
 * Iepriekš cenas bija ierakstītas kodā atsevišķi no programmu datiem un vairākās
 * vietās nesakrita. Tagad tās tiek nolasītas no programmas cenrāža (ko var labot
 * administrēšanas panelī), atpazīstot tipiskos formulējumus:
 *   "Līdz 15 bērniem" · "Mazā grupa (1–6 bērni)" · "No 10 līdz 15 bērniem" · "Katrs nākamais bērns"
 */

/**
 * Cenas, ko rediģē panelī (Telpu noma → Cenas; Izklaides programmas → Izbraukuma ballītes).
 * Rezervācijas forma tās saņem no lapas (sk. bookingPrices), serveris — no iestatījumiem.
 */
export type BookingPrices = {
  /** Telpu noma (3 h): pirmdiena–ceturtdiena / piektdiena–svētdiena, € */
  venueWeekday: number;
  venueWeekend: number;
  /** Izbraukuma piemaksa (€) ballītēm tālāk par freeTravelKm no Smaidu Darbnīcas */
  travelSurcharge: number;
  /** Ceļa izdevumi, € par km (turp un atpakaļ) */
  travelRate: number;
  /** Līdz šim attālumam (km vienā virzienā) nav ne piemaksas, ne ceļa izdevumu */
  freeTravelKm: number;
};

export function bookingPrices(settings: Pick<SiteSettings, "venue" | "programs">): BookingPrices {
  return {
    venueWeekday: settings.venue.priceWeekday,
    venueWeekend: settings.venue.priceWeekend,
    travelSurcharge: settings.programs.travelSurcharge,
    travelRate: settings.programs.travelRate,
    freeTravelKm: settings.programs.freeTravelKm,
  };
}

export const VENUE_TIMES = ["10:00", "14:00", "18:00"] as const;

/** Telpu nomas laika posmi (3 stundas) rādīšanai lapā un formā; vērtība saglabājas kā sākuma laiks */
export const VENUE_SLOTS = VENUE_TIMES.map((t) => {
  const end = `${String(Number(t.slice(0, 2)) + 3).padStart(2, "0")}${t.slice(2)}`;
  return { value: t, label: `${t}–${end}` };
});

/** Telpu nomas cena izvēlētajā datumā (piektdiena–svētdiena ir dārgāka) */
export function venuePrice(date: string, prices: BookingPrices): number | null {
  if (!date) return null;
  const day = new Date(`${date}T12:00:00`).getDay();
  return day === 0 || day === 5 || day === 6 ? prices.venueWeekend : prices.venueWeekday;
}

type Tier = { max: number; price: number };

function parseGroup(group: PriceGroup) {
  const tiers: Tier[] = [];
  let extra: number | null = null;
  let flat: number | null = null;

  for (const { label, price } of group.options) {
    if (price === null) continue;
    const l = label.toLowerCase();
    if (l.includes("nākam")) {
      extra = price;
      continue;
    }
    if (l.includes("€/km") || l.includes("ceļa")) continue;
    // Lielākais skaitlis etiķetē ir grupas augšējā robeža
    const numbers = (label.match(/\d+/g) ?? []).map(Number).filter((n) => n < 1000);
    if (numbers.length && /bērn/.test(l)) tiers.push({ max: Math.max(...numbers), price });
    else if (flat === null) flat = price;
  }
  tiers.sort((a, b) => a.max - b.max);
  return { tiers, extra, flat };
}

/** Izvēlas cenrāža grupu pēc norises vietas (ja programmai ir atsevišķs izbraukuma cenrādis). */
function pickGroup(pricing: PriceGroup[], travelling: boolean): PriceGroup | undefined {
  if (pricing.length <= 1) return pricing[0];
  const travelGroup = pricing.find((g) => /izbrauk/i.test(g.title));
  if (travelGroup) return travelling ? travelGroup : pricing.find((g) => g !== travelGroup);
  return pricing[0];
}

/**
 * Zemākā programmas cena ("no X €") kartītēm un izvēlnēm.
 * Neņem vērā piemaksas par katru nākamo bērnu un ceļa izdevumus.
 */
export function fromPrice(pricing: PriceGroup[]): number | null {
  const prices = pricing
    .flatMap((g) => g.options)
    .filter((o) => o.price !== null && !/nākam|€\/km|ceļa/i.test(o.label))
    .map((o) => o.price as number);
  return prices.length ? Math.min(...prices) : null;
}

/** Atgriež aptuveno programmas cenu vai null, ja to nevar aprēķināt (pēc vienošanās). */
export function estimateProgramPrice(pricing: PriceGroup[], children: number, travelling: boolean): number | null {
  const group = pickGroup(pricing, travelling);
  if (!group) return null;
  const { tiers, extra, flat } = parseGroup(group);

  if (tiers.length === 0) return flat;
  if (!children) return null;

  const tier = tiers.find((t) => children <= t.max);
  if (tier) return tier.price;

  const largest = tiers[tiers.length - 1];
  return extra === null ? null : largest.price + (children - largest.max) * extra;
}

/**
 * Programmas papildu iespējas (par atsevišķu samaksu), ko var atzīmēt rezervācijas formā.
 * Nolasa no programmas apraksta sadaļas "## Papildu iespējas" — tāpēc tās var labot administrēšanas
 * panelī kopā ar aprakstu. Atpazīst formulējumus:
 *   "- Virtuļu dekorēšana — 30 €"                    (viena cena)
 *   "- Piekariņš — 1 € / bērnam"                      (cena par bērnu)
 *   "**Mazā grupa (1–6 bērni):**" + "- Saldējuma eksperiments — ~30 € (grupai)"
 *   "**Lielā grupa (7–15 bērni):**" + "- Saldējuma eksperiments — ~40 € (grupai)"   (cena pēc grupas lieluma)
 * Saraksta punkti bez cenas (tikai apraksts) formā netiek rādīti.
 */
export type Extra = {
  label: string;
  flat?: number;
  perChild?: number;
  small?: number;
  large?: number;
  /** Grupu nosaukumi no apraksta, piem. "Mazā grupa (1–6 bērni)" */
  smallLabel?: string;
  largeLabel?: string;
  /** Cena aprakstā norādīta kā aptuvena ("~30 €") */
  approx?: boolean;
};

const num = (s: string) => Number(s.replace(",", "."));
const PRICE = String.raw`(\d+(?:[.,]\d+)?)\s*€`;

export function parseExtras(body: string): Extra[] {
  // Sadaļa no virsraksta "## Papildu iespējas" līdz nākamajam virsrakstam (vai teksta beigām)
  const section = body.match(/(?:^|\n)##\s*Papildu iespējas[^\n]*\n([\s\S]*?)(?=\n##\s|$)/)?.[1] ?? "";
  const extras: Extra[] = [];
  const byLabel = (label: string) => {
    let x = extras.find((e) => e.label.toLowerCase() === label.toLowerCase());
    if (!x) extras.push((x = { label }));
    return x;
  };
  let group: { key: "small" | "large"; label: string } | null = null;

  for (const raw of section.split("\n")) {
    const line = raw.trim();
    const item = line.match(/^[-*]\s+(.+)$/)?.[1];
    if (!item) {
      // Grupas virsraksts, piem. "**Mazā grupa (1–6 bērni):**" — tam sekojošie punkti ir šīs grupas cenas
      const title = line.replace(/\*\*/g, "").replace(/:$/, "").trim();
      if (/^mazā grupa/i.test(title)) group = { key: "small", label: title };
      else if (/^lielā grupa/i.test(title)) group = { key: "large", label: title };
      continue;
    }
    const label = (item.match(/\*\*(.+?)\*\*/)?.[1] ?? item.split(/\s+[—–-]\s+/)[0]).trim();
    const approx = item.includes("~") || undefined;
    const inline = item.match(new RegExp(`mazā grupa[^€]*?${PRICE}.*lielā grupa[^€]*?${PRICE}`, "i"));
    const perChild = item.match(new RegExp(`${PRICE}\\s*\\/\\s*bērn`, "i"));
    const price = item.match(new RegExp(`${PRICE}(?:\\s*\\([^)]*\\))?\\s*$`));
    if (inline) Object.assign(byLabel(label), { small: num(inline[1]), large: num(inline[2]), approx });
    else if (perChild) Object.assign(byLabel(label), { perChild: num(perChild[1]), approx });
    else if (price && group) Object.assign(byLabel(label), { [group.key]: num(price[1]), [`${group.key}Label`]: group.label, approx });
    else if (price) Object.assign(byLabel(label), { flat: num(price[1]), approx });
  }
  return extras;
}

/** Mazās grupas lielākais bērnu skaits pēc programmas cenrāža (piem. "Mazā grupa (1–6 bērni)" → 6) */
export function smallGroupMax(pricing: PriceGroup[]): number {
  const tiers = pricing.flatMap((g) => parseGroup(g).tiers);
  return tiers.length > 1 ? Math.min(...tiers.map((t) => t.max)) : 6;
}

/** Papildu iespējas cena; null, ja to nevar aprēķināt bez bērnu skaita */
export function extraPrice(extra: Extra, children: number, smallMax: number): number | null {
  if (extra.flat !== undefined) return extra.flat;
  if (!children) return null;
  if (extra.perChild !== undefined) return Math.round(extra.perChild * children * 100) / 100;
  if (extra.small !== undefined && extra.large !== undefined) return children <= smallMax ? extra.small : extra.large;
  return null;
}
