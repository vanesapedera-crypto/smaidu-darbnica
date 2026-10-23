import { atStudio, isInstitutionProgram, programPlusVat, sameVariant } from "@/lib/bookings";
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

/**
 * Programmas varianti — vairākas cenu grupas, no kurām klients izvēlas vienu
 * (piem. "Sejas apgleznošana" un "Sejas apgleznošana + glittera tetovējumi").
 * Ja programmai ir atsevišķs izbraukuma cenrādis, grupas nav varianti (tās izvēlas pēc norises vietas).
 */
export function priceVariants(pricing: PriceGroup[]): PriceGroup[] {
  return pricing.length > 1 && !pricing.some((g) => /izbrauk/i.test(g.title)) ? pricing : [];
}

/**
 * Izvēlas cenrāža grupu: klienta izvēlēto variantu (pēc nosaukuma) vai — ja programmai ir atsevišķs
 * izbraukuma cenrādis — pēc norises vietas.
 */
function pickGroup(pricing: PriceGroup[], travelling: boolean, variant?: string): PriceGroup | undefined {
  const chosen = variant ? priceVariants(pricing).find((g) => g.title === variant) : undefined;
  if (chosen) return chosen;
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

/**
 * Papildu pakalpojumi, ko administrators pievieno rezervācijai panelī (piem. "Sejas apgleznošana — 50 €").
 * Glabājas ziņojuma rindā "Papildu pakalpojumi: Nosaukums — 50 €; Cits — 30 €" un tiek iekļauti izmaksās
 * (klienta e-pastā, kalendārā un panelī).
 */
export type CustomService = { label: string; price: number };
const CUSTOM_PREFIX = "Papildu pakalpojumi:";
export function parseCustomServices(message: string | null | undefined): CustomService[] {
  const line = (message ?? "").split("\n").find((l) => l.startsWith(CUSTOM_PREFIX));
  if (!line) return [];
  return line
    .slice(CUSTOM_PREFIX.length)
    .split(";")
    .map((x) => x.trim().match(/^(.+?)\s+—\s+([\d.,]+)\s*€$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ label: m[1].trim(), price: Number(m[2].replace(",", ".")) }));
}
/** Ieraksta papildu pakalpojumus ziņojumā (aizstāj iepriekšējos; tukšs saraksts — noņem rindu) */
export function withCustomServices(message: string | null | undefined, services: CustomService[]): string {
  const rest = (message ?? "")
    .split("\n")
    .filter((l) => !l.startsWith(CUSTOM_PREFIX))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!services.length) return rest;
  const line = `${CUSTOM_PREFIX} ${services.map((x) => `${x.label} — ${String(x.price).replace(".", ",")} €`).join("; ")}`;
  return [rest, line].filter(Boolean).join("\n\n");
}

/**
 * Administratora labotās izmaksas — aizstāj automātisko aprēķinu pilnībā.
 * Glabājas ziņojuma rindā "Izmaksas: Rūķis un Ziemassvētku vecītis — 195 € + PVN; Ceļa izdevumi — 18 €".
 * Panelī tās raksta rindās "Nosaukums | 195 | +PVN" (trešā kolonna — nav obligāta).
 */
const OVERRIDE_PREFIX = "Izmaksas:";
export function parseCostOverride(message: string | null | undefined): CostLine[] | null {
  const line = (message ?? "").split("\n").find((l) => l.startsWith(OVERRIDE_PREFIX));
  if (!line) return null;
  return line
    .slice(OVERRIDE_PREFIX.length)
    .split(";")
    .map((x) => x.trim().match(/^(.+?)\s+—\s+([\d.,]+)\s*€(\s*\+\s*PVN)?$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ kind: "extra" as const, label: m[1].trim(), amount: Number(m[2].replace(",", ".")), ...(m[3] ? { plusVat: true } : {}) }));
}
/** Izmaksas paneļa teksta laukam: "Nosaukums | 195 | +PVN" rindā (tikai rindas ar zināmu cenu) */
export const costsToText = (lines: CostLine[]) =>
  lines
    .filter((l) => l.amount !== null)
    .map((l) => `${l.kind === "program" ? l.label : l.label} | ${String(l.amount).replace(".", ",")}${l.plusVat ? " | +PVN" : ""}`)
    .join("\n");
/** No paneļa teksta ("Nosaukums | cena | +PVN" rindā) → rindas */
export function costsFromText(text: string): CostLine[] {
  return text
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter(([label, price]) => label && price && Number.isFinite(Number(price.replace(",", ".").replace("€", "").trim())))
    .map(([label, price, vat]) => ({
      kind: "extra" as const,
      label: label.replace(/[;—]/g, "-"),
      amount: Number(price.replace(",", ".").replace("€", "").trim()),
      ...(/pvn/i.test(vat ?? "") ? { plusVat: true } : {}),
    }));
}
/** Ieraksta labotās izmaksas ziņojumā (null — noņem, atgriežas automātiskais aprēķins) */
export function withCostOverride(message: string | null | undefined, lines: CostLine[] | null): string {
  const rest = (message ?? "")
    .split("\n")
    .filter((l) => !l.startsWith(OVERRIDE_PREFIX) && !l.startsWith(CUSTOM_PREFIX))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (!lines?.length) return rest;
  const line = `${OVERRIDE_PREFIX} ${lines.map((l) => `${l.label} — ${String(l.amount).replace(".", ",")} €${l.plusVat ? " + PVN" : ""}`).join("; ")}`;
  return [rest, line].filter(Boolean).join("\n\n");
}

/** Rezervāciju ar programmas cenu "pēc vienošanās" nepieņem — teksts formai un serverim */
export const PRICE_UNKNOWN_TEXT = "Šai izvēlei cenu tiešsaistē aprēķināt nevar — lūdzu, sazinieties ar mums pa telefonu.";

/** Atgriež aptuveno programmas cenu vai null, ja to nevar aprēķināt (pēc vienošanās). */
export function estimateProgramPrice(pricing: PriceGroup[], children: number, travelling: boolean, variant?: string): number | null {
  const group = pickGroup(pricing, travelling, variant);
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
 *   "**Mazā grupa (1–6 bērni):**" + "- Saldējuma eksperiments — 30 €"
 *   "**Lielā grupa (7–15 bērni):**" + "- Saldējuma eksperiments — 40 €"   (cena pēc grupas lieluma)
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
    const inline = item.match(new RegExp(`mazā grupa[^€]*?${PRICE}.*lielā grupa[^€]*?${PRICE}`, "i"));
    const perChild = item.match(new RegExp(`${PRICE}\\s*\\/\\s*bērn`, "i"));
    const price = item.match(new RegExp(`${PRICE}(?:\\s*\\([^)]*\\))?\\s*$`));
    if (inline) Object.assign(byLabel(label), { small: num(inline[1]), large: num(inline[2]) });
    else if (perChild) Object.assign(byLabel(label), { perChild: num(perChild[1]) });
    else if (price && group) Object.assign(byLabel(label), { [group.key]: num(price[1]), [`${group.key}Label`]: group.label });
    else if (price) Object.assign(byLabel(label), { flat: num(price[1]) });
  }
  return extras;
}

/**
 * Svarīgs brīdinājums klientam no programmas apraksta sadaļas "## Svarīgi" (piem. par kavēšanos) —
 * rāda programmas lapā pie rezervācijas formas un apstiprinājuma e-pastā. Labojams panelī kopā ar aprakstu.
 */
export function parseNotice(body: string): string {
  return body.match(/(?:^|\n)##\s*Svarīgi[^\n]*\n([\s\S]*?)(?=\n##\s|$)/)?.[1]?.trim() ?? "";
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

/**
 * Rezervācijas izmaksu kopsavilkums — tas pats aprēķins, ko klients redz rezervācijas formā.
 * Izmanto administrēšanas panelī un apstiprinājuma e-pastā klientam (cenas — pēc pašreizējā cenrāža).
 */
export type CostLine = {
  label: string;
  amount: number | null;
  /** Rindas veids — lai e-pastā programmu var noformēt citādi nekā pārējās rindas */
  kind: "program" | "extra" | "room" | "surcharge" | "travel";
  /** Programmas cenas grupa, piem. "līdz 6 bērniem" */
  note?: string;
  /** Cena ir bez PVN — rāda kā "150 € + PVN" (programmas iestādēm) */
  plusVat?: boolean;
};
export type BookingCosts = {
  lines: CostLine[];
  total: number;
  /** false, ja kāda no cenām ir "pēc vienošanās" — tad kopsummu nerāda */
  exact: boolean;
  /** true, ja kopsummā nav iekļauts PVN (kāda rinda ir "+ PVN") — zem kopsummas rāda VAT_NOTE */
  plusVat: boolean;
};

/** Piezīme zem kopsummas, ja cenas ir bez PVN */
export const VAT_NOTE = "Kopsummā nav iekļauts PVN.";

/** Rindas summa tekstā: "pēc vienošanās", "185 €" vai "150 € + PVN" */
export const amountText = (l: Pick<CostLine, "amount" | "plusVat"> & { kind?: CostLine["kind"] }) =>
  l.amount === null
    ? l.kind === "travel"
      ? "aprēķināsim, apstiprinot rezervāciju"
      : "pēc vienošanās"
    : `${eur(l.amount)}${l.plusVat ? " + PVN" : ""}`;

/** Cenas formāts: 12,6 → "12,60 €", 185 → "185 €" */
export const eur = (n: number) =>
  `${n.toLocaleString("lv-LV", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })} €`;

type CostBooking = {
  location: string | null;
  event_date: string | null;
  children_count: number | null;
  travel_km: number | null;
  travel_cost: number | null;
  message: string | null;
};
type CostProgram = { slug?: string; title: string; pricing: PriceGroup[]; body: string };

/** Cenas grupa, kurā ietilpst bērnu skaits: "līdz 6 bērniem"; lielākai grupai — "18 bērniem" */
function tierNote(pricing: PriceGroup[], children: number, travelling: boolean, variant?: string): string | undefined {
  const group = pickGroup(pricing, travelling, variant);
  if (!group || !children) return undefined;
  const { tiers } = parseGroup(group);
  if (tiers.length === 0) return undefined;
  const tier = tiers.find((t) => children <= t.max);
  const n = tier ? tier.max : children;
  const word = n % 10 === 1 && n % 100 !== 11 ? "bērnam" : "bērniem";
  return tier ? `līdz ${n} ${word}` : `${n} ${word}`;
}

export function bookingCosts(b: CostBooking, program: CostProgram | undefined, prices: BookingPrices): BookingCosts | null {
  // Administrators izmaksas labojis panelī — tās aizstāj automātisko aprēķinu
  const override = parseCostOverride(b.message);
  if (override?.length) {
    return {
      lines: override,
      total: Math.round(override.reduce((sum, l) => sum + (l.amount ?? 0), 0) * 100) / 100,
      exact: true,
      plusVat: override.some((l) => l.plusVat),
    };
  }
  return autoCosts(b, program, prices);
}

/** Automātiskais izmaksu aprēķins (programma, papildu iespējas, telpas, izbraukums) */
export function autoCosts(b: CostBooking, program: CostProgram | undefined, prices: BookingPrices): BookingCosts | null {
  const travelling = b.location === "Izbraukums";
  const children = b.children_count ?? 0;
  const lines: CostLine[] = [];
  // Programmas iestādēm (bērnudārziem): cena bez PVN un bez izbraukuma piemaksas
  const institution = isInstitutionProgram(program?.slug);

  if (program) {
    // Programmas variants (ja tādi ir) — forma to pieraksta ziņojuma rindā "Izvēle: …"
    const picked = b.message?.match(/Izvēle:\s*(.+)/)?.[1]?.trim();
    const variant = priceVariants(program.pricing).find((g) => sameVariant(g.title, picked))?.title;
    lines.push({
      kind: "program",
      label: variant ?? program.title,
      amount: estimateProgramPrice(program.pricing, children, travelling, variant),
      note: tierNote(program.pricing, children, travelling, variant),
      // Izklaides programmu cenas ir bez PVN — rāda "+ PVN" (PVN netiek pieskaitīts); izņēmumi — NO_VAT_PROGRAMS
      ...(programPlusVat(program.slug) ? { plusVat: true } : {}),
    });
    // Papildu iespējas forma pieraksta ziņojuma rindā "Papildu iespējas: …" — atrodam tās pēc nosaukuma
    const chosen = b.message?.match(/Papildu iespējas:\s*(.+)/)?.[1] ?? "";
    if (chosen) {
      const smallMax = smallGroupMax(program.pricing);
      for (const x of parseExtras(program.body)) {
        if (chosen.includes(x.label)) lines.push({ kind: "extra", label: x.label, amount: extraPrice(x, children, smallMax) });
      }
    }
  }

  // Administratora pievienotie papildu pakalpojumi (sk. parseCustomServices)
  for (const x of parseCustomServices(b.message)) lines.push({ kind: "extra", label: x.label, amount: x.price });

  if (atStudio(b.location)) {
    const room = b.event_date ? venuePrice(b.event_date, prices) : null;
    if (room !== null) lines.push({ kind: "room", label: "Telpu noma", amount: room });
  } else if (travelling) {
    // Izbraukuma piemaksa un ceļa izdevumi — adresēm tālāk par freeTravelKm (vienā virzienā), tāpat kā formā.
    // Ja attālums nav zināms (adresi neizdevās aprēķināt), ceļa izdevumi ir "pēc vienošanās".
    // Ja attālums nav zināms — izbraukuma piemaksu skaita vienmēr, ceļa izdevumus aprēķina, apstiprinot rezervāciju
    if (b.travel_km == null) {
      if (prices.travelSurcharge > 0 && !institution) lines.push({ kind: "surcharge", label: "Izbraukuma piemaksa", amount: prices.travelSurcharge });
      lines.push({ kind: "travel", label: "Ceļa izdevumi", amount: null });
    }
    else if (b.travel_km / 2 > prices.freeTravelKm) {
      if (prices.travelSurcharge > 0 && !institution) lines.push({ kind: "surcharge", label: "Izbraukuma piemaksa", amount: prices.travelSurcharge });
      if (b.travel_cost) lines.push({ kind: "travel", label: `Ceļa izdevumi (${b.travel_km.toLocaleString("lv-LV")} km)`, amount: b.travel_cost });
    }
  }

  if (lines.length === 0) return null;
  return {
    lines,
    total: Math.round(lines.reduce((sum, l) => sum + (l.amount ?? 0), 0) * 100) / 100,
    exact: lines.every((l) => l.amount !== null),
    plusVat: lines.some((l) => l.plusVat && l.amount !== null),
  };
}

/**
 * Izmaksas teksta rindās — tādā pašā secībā un formulējumā kā apstiprinājuma e-pastā klientam
 * (vispirms telpu noma, tad programma un pārējais). Izmanto kalendāra notikuma aprakstā.
 */
export function costLinesText(costs: BookingCosts): string[] {
  const order = ["room", "program", "extra", "surcharge", "travel"];
  const lines = [...costs.lines]
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
    .map(
      (l) =>
        `${l.kind === "program" ? `Izklaides programma “${l.label}”${l.note ? ` (${l.note})` : ""}` : l.label} – ${amountText(l)}`,
    );
  if (lines.length > 1 && costs.exact) lines.push(`Kopā – ${eur(costs.total)}`);
  if (costs.plusVat) lines.push(VAT_NOTE);
  return lines;
}
