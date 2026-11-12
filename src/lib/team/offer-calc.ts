/**
 * Piedāvājuma kalkulators: pašizmaksa → uzcenojums % → cena bez PVN → PVN → kopā.
 * Aprēķina dati (CalcInput) glabājas offers.calc — ar cenām tā brīža vērtībās,
 * lai vēlākas izmaiņas katalogā nemainītu jau nosūtītus piedāvājumus.
 */

export type Unit = "hour" | "person" | "piece" | "fixed";

export const UNIT_LABEL: Record<Unit, string> = {
  hour: "par stundu",
  person: "par personu",
  piece: "par gabalu",
  fixed: "fiksēta summa",
};
export const UNIT_SHORT: Record<Unit, string> = { hour: "h", person: "pers.", piece: "gab.", fixed: "" };

export type CostItemRow = {
  id: string;
  kind: "activity" | "expense";
  title: string;
  unit: Unit;
  cost: number;
  notes: string | null;
  sort: number;
};

export type CalcSettings = {
  /** Animatora/vadītāja pašizmaksa par stundu, € */
  animatorHour: number;
  /** Animatora/vadītāja fiksēta pašizmaksa par pasākumu, € */
  animatorFixed: number;
  /** Noklusējuma uzcenojums, % */
  markup: number;
  /** PVN, % */
  vat: number;
  /** Lapā "Salikt piedāvājumu": cik dalībniekiem radošajās darbnīcās vajag 1 animatoru */
  perAnimator: number;
};

export const DEFAULT_CALC_SETTINGS: CalcSettings = { animatorHour: 0, animatorFixed: 0, markup: 0, vat: 21, perAnimator: 15 };

export type CalcWorkshop = { id: string; title: string; costPerPerson: number; persons: number };
/** Viena personāla rinda: loma (vadītājs, animators, aktieris…), skaits, aprēķins un likme */
export type StaffRow = { role: string; count: number; mode: "hour" | "fixed"; hours: number; rate: number; duties: string };

export type CalcItem = { id?: string; kind: "activity" | "expense"; title: string; unit: Unit; unitCost: number; qty: number };

export type CalcInput = {
  client: string;
  contactPerson: string;
  contactEmail: string;
  title: string;
  date: string;
  place: string;
  children: number;
  hours: number;
  workshops: CalcWorkshop[];
  items: CalcItem[];
  staff: StaffRow[];
  travel: { km: number; rate: number };
  markup: number;
  vat: number;
  showLinePrices: boolean;
  /** Teksts klientam PDF (piem. kas iekļauts, nosacījumi) */
  note: string;
};

export type CalcLine = { group: "workshop" | "activity" | "expense" | "animators" | "travel"; label: string; detail: string; cost: number };

export type CalcResult = {
  lines: CalcLine[];
  cost: number;
  markupAmount: number;
  net: number;
  vatAmount: number;
  total: number;
  perChild: number | null;
};

const n = (v: unknown) => {
  const x = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
};
const round2 = (x: number) => Math.round(x * 100) / 100;

export function computeOffer(c: CalcInput): CalcResult {
  const lines: CalcLine[] = [];
  for (const w of c.workshops) {
    lines.push({ group: "workshop", label: `Radošā darbnīca “${w.title}”`, detail: `${w.persons} pers.`, cost: w.costPerPerson * w.persons });
  }
  for (const i of c.items) {
    const qty = i.unit === "fixed" ? 1 : i.qty;
    lines.push({
      group: i.kind === "expense" ? "expense" : "activity",
      label: i.title,
      detail: i.unit === "fixed" ? "" : `${qty} ${UNIT_SHORT[i.unit]}`,
      cost: i.unitCost * qty,
    });
  }
  for (const a of c.staff) {
    if (a.count <= 0) continue;
    lines.push({
      group: "animators",
      label: a.role.trim() || "Animators",
      detail: a.mode === "hour" ? `${a.count} × ${String(a.hours).replace(".", ",")} h` : `${a.count}`,
      cost: a.mode === "hour" ? a.count * a.hours * a.rate : a.count * a.rate,
    });
  }
  if (c.travel.km > 0) {
    lines.push({ group: "travel", label: "Ceļa izdevumi", detail: `${c.travel.km} km`, cost: c.travel.km * c.travel.rate });
  }

  const cost = lines.reduce((s, l) => s + l.cost, 0);
  const markupAmount = (cost * c.markup) / 100;
  const net = round2(cost + markupAmount);
  const vatAmount = round2((net * c.vat) / 100);
  return { lines, cost, markupAmount, net, vatAmount, total: round2(net + vatAmount), perChild: c.children > 0 ? (net + vatAmount) / c.children : null };
}

/** Pozīcijas cena klientam (ar uzcenojumu, bez PVN) */
export const clientPrice = (l: CalcLine, markup: number) => round2(l.cost * (1 + markup / 100));

export function emptyCalc(settings: CalcSettings, travelRate: number): CalcInput {
  return {
    client: "",
    contactPerson: "",
    contactEmail: "",
    title: "",
    date: "",
    place: "",
    children: 20,
    hours: 2,
    workshops: [],
    items: [],
    staff: [{ role: "Animators", count: 1, mode: "hour", hours: 2, rate: settings.animatorHour, duties: "" }],
    travel: { km: 0, rate: travelRate },
    markup: settings.markup,
    vat: settings.vat,
    showLinePrices: true,
    note: "",
  };
}

/** Datubāzes JSON → droši aprēķina dati */
export function parseCalc(raw: unknown, settings: CalcSettings, travelRate: number): CalcInput {
  const base = emptyCalc(settings, travelRate);
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Record<string, unknown>;
  const str = (v: unknown, max = 300) => String(v ?? "").slice(0, max);
  const arr = (v: unknown) => (Array.isArray(v) ? v.slice(0, 100) : []);
  const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});
  const unit = (v: unknown): Unit => (v === "person" || v === "piece" || v === "fixed" ? v : "hour");
  const tr = obj(r.travel);
  const staffRow = (o: Record<string, unknown>, role: string): StaffRow => ({
    role: str(o.role ?? role, 100),
    count: Math.max(0, Math.round(n(o.count))),
    mode: o.mode === "fixed" ? "fixed" : "hour",
    hours: Math.max(0, n(o.hours)),
    rate: n(o.rate),
    duties: str(o.duties, 500),
  });
  // Vecie piedāvājumi: viena rinda "animators"
  const staff = Array.isArray(r.staff)
    ? arr(r.staff).map((x) => staffRow(obj(x), "Animators"))
    : r.animators
      ? [staffRow(obj(r.animators), "Animatori / vadītāji")]
      : base.staff;
  return {
    client: str(r.client),
    contactPerson: str(r.contactPerson),
    contactEmail: str(r.contactEmail),
    title: str(r.title),
    date: /^\d{4}-\d{2}-\d{2}$/.test(str(r.date)) ? str(r.date) : "",
    place: str(r.place),
    children: Math.max(0, Math.round(n(r.children))),
    hours: Math.max(0, n(r.hours)),
    workshops: arr(r.workshops).map((w) => {
      const o = obj(w);
      return { id: str(o.id, 40), title: str(o.title), costPerPerson: n(o.costPerPerson), persons: Math.max(0, Math.round(n(o.persons))) };
    }),
    items: arr(r.items).map((i) => {
      const o = obj(i);
      return {
        id: o.id ? str(o.id, 40) : undefined,
        kind: o.kind === "expense" ? ("expense" as const) : ("activity" as const),
        title: str(o.title),
        unit: unit(o.unit),
        unitCost: n(o.unitCost),
        qty: Math.max(0, n(o.qty)),
      };
    }),
    staff,
    travel: { km: Math.max(0, n(tr.km)), rate: n(tr.rate) },
    markup: n(r.markup),
    vat: r.vat === undefined ? base.vat : n(r.vat),
    showLinePrices: r.showLinePrices !== false,
    note: str(r.note, 5000),
  };
}

export const parseSettings = (raw: unknown): CalcSettings => {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    animatorHour: n(o.animatorHour ?? DEFAULT_CALC_SETTINGS.animatorHour),
    animatorFixed: n(o.animatorFixed ?? DEFAULT_CALC_SETTINGS.animatorFixed),
    markup: n(o.markup ?? DEFAULT_CALC_SETTINGS.markup),
    vat: n(o.vat ?? DEFAULT_CALC_SETTINGS.vat),
    perAnimator: n(o.perAnimator ?? DEFAULT_CALC_SETTINGS.perAnimator) || DEFAULT_CALC_SETTINGS.perAnimator,
  };
};
