"use client";

import { useState } from "react";
import { FileDown, Plus, Presentation, Trash2 } from "lucide-react";
import type { TeamActionState } from "@/app/admin/team-actions";
import { UNIT_LABEL, UNIT_SHORT, computeOffer, type CalcInput, type CalcItem, type CalcSettings, type Unit } from "@/lib/team/offer-calc";
import { money } from "@/lib/team/workshops";
import TeamForm from "./TeamForm";
import { adminInput, adminSecondary } from "../styles";
import { cn } from "@/lib/utils";

export type BuilderWorkshop = { id: string; title: string; costPerPerson: number; hasDescription: boolean };
export type BuilderCostItem = { id: string; kind: "activity" | "expense"; title: string; unit: Unit; cost: number };
type Custom = CalcItem & { key: number; save: boolean };

const num = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
const fmt = (n: number) => (n ? String(n).replace(".", ",") : "");

/**
 * Piedāvājuma izveide: ķeksīši darbnīcām un aktivitātēm, bērnu skaits, ilgums, animatori, ceļš, citi izdevumi.
 * Visu summē uzreiz; saglabājot — piedāvājums (ar aprēķinu) sadaļā "Piedāvājumi", no kura veido PDF.
 */
export default function OfferBuilder({
  initial,
  workshops,
  catalog,
  settings,
  clientNames,
  offerId,
  action,
}: {
  initial: CalcInput;
  workshops: BuilderWorkshop[];
  catalog: BuilderCostItem[];
  settings: CalcSettings;
  clientNames: string[];
  offerId: string | null;
  action: (state: TeamActionState, form: FormData) => Promise<TeamActionState>;
}) {
  const [c, setC] = useState<CalcInput>(initial);
  // Ar roku pievienotie izdevumi (nav katalogā)
  const [custom, setCustom] = useState<Custom[]>(() =>
    initial.items.filter((i) => !i.id).map((i, n) => ({ ...i, key: n, save: false })),
  );
  const [dirty, setDirty] = useState(false);

  const update = (patch: Partial<CalcInput>) => {
    setDirty(true);
    setC((x) => ({ ...x, ...patch }));
  };

  const catalogItems = c.items.filter((i) => i.id);
  const calc: CalcInput = {
    ...c,
    items: [...catalogItems, ...custom.map((x) => ({ kind: x.kind, title: x.title, unit: x.unit, unitCost: x.unitCost, qty: x.qty }))],
  };
  const result = computeOffer(calc);

  const setChildren = (v: number) => {
    setDirty(true);
    setC((x) => ({
      ...x,
      children: v,
      // Darbnīcas un "par personu" aktivitātes, kurām bija tāds pats skaits, sekos līdzi
      workshops: x.workshops.map((w) => (w.persons === x.children ? { ...w, persons: v } : w)),
      items: x.items.map((i) => (i.unit === "person" && i.qty === x.children ? { ...i, qty: v } : i)),
    }));
  };
  const setHours = (v: number) => {
    setDirty(true);
    setC((x) => ({
      ...x,
      hours: v,
      items: x.items.map((i) => (i.unit === "hour" && i.qty === x.hours ? { ...i, qty: v } : i)),
      animators: x.animators.hours === x.hours ? { ...x.animators, hours: v } : x.animators,
    }));
  };

  const toggleWorkshop = (w: BuilderWorkshop, on: boolean) =>
    update({
      workshops: on
        ? [...c.workshops, { id: w.id, title: w.title, costPerPerson: w.costPerPerson, persons: c.children }]
        : c.workshops.filter((x) => x.id !== w.id),
    });
  const toggleItem = (i: BuilderCostItem, on: boolean) =>
    update({
      items: on
        ? [...c.items, { id: i.id, kind: i.kind, title: i.title, unit: i.unit, unitCost: i.cost, qty: i.unit === "hour" ? c.hours : i.unit === "person" ? c.children : 1 }]
        : c.items.filter((x) => x.id !== i.id),
    });
  const setItemQty = (id: string, qty: number) => update({ items: c.items.map((x) => (x.id === id ? { ...x, qty } : x)) });

  const field = (label: string, el: React.ReactNode, className?: string) => (
    <label className={cn("block space-y-1.5", className)}>
      <span className="block text-sm font-bold">{label}</span>
      {el}
    </label>
  );

  const activities = catalog.filter((i) => i.kind === "activity");
  const expenses = catalog.filter((i) => i.kind === "expense");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        {/* Klients */}
        <Card title="1. Klients">
          <div className="grid gap-4 md:grid-cols-2">
            {field(
              "Klients (uzņēmums, pašvaldība, bērnudārzs…)",
              <>
                <input value={c.client} onChange={(e) => update({ client: e.target.value })} list="builder-clients" className={adminInput} />
                <datalist id="builder-clients">
                  {clientNames.map((n) => (
                    <option key={n} value={n} />
                  ))}
                </datalist>
              </>,
            )}
            {field("Piedāvājuma nosaukums", <input value={c.title} onChange={(e) => update({ title: e.target.value })} placeholder="piem. Ziemassvētku pasākums bērniem" className={adminInput} />)}
            {field("Kontaktpersona", <input value={c.contactPerson} onChange={(e) => update({ contactPerson: e.target.value })} className={adminInput} />)}
            {field("E-pasts", <input type="email" value={c.contactEmail} onChange={(e) => update({ contactEmail: e.target.value })} className={adminInput} />)}
            {field("Pasākuma datums", <input type="date" value={c.date} onChange={(e) => update({ date: e.target.value })} className={adminInput} />)}
            {field("Vieta", <input value={c.place} onChange={(e) => update({ place: e.target.value })} placeholder="piem. Tukums, kultūras nams" className={adminInput} />)}
          </div>
        </Card>

        <Card title="2. Bērni un ilgums">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Bērnu skaits", <input inputMode="numeric" value={fmt(c.children)} onChange={(e) => setChildren(Math.round(num(e.target.value)))} className={adminInput} />)}
            {field("Programmas ilgums, h", <input inputMode="decimal" value={fmt(c.hours)} onChange={(e) => setHours(num(e.target.value))} className={adminInput} />)}
          </div>
        </Card>

        <Card title="3. Radošās darbnīcas" hint="Pašizmaksa = materiāli vienai personai × dalībnieki (sk. “Radošās darbnīcas”).">
          <ul className="grid gap-2 md:grid-cols-2">
            {workshops.map((w) => {
              const sel = c.workshops.find((x) => x.id === w.id);
              return (
                <li key={w.id} className={cn("rounded-xl p-3 ring-1", sel ? "bg-brand-soft ring-ink" : "ring-line")}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={Boolean(sel)} onChange={(e) => toggleWorkshop(w, e.target.checked)} className="mt-0.5 size-4 accent-ink" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{w.title}</span>
                      <span className={cn("block text-xs", w.costPerPerson ? "text-ink-soft" : "font-semibold text-destructive")}>
                        {w.costPerPerson ? `${money(w.costPerPerson)} / pers.` : "materiāli nav ievadīti"}
                        {!w.hasDescription && " · prezentācijai nav apraksta"}
                      </span>
                    </span>
                  </label>
                  {sel && (
                    <label className="mt-2 flex items-center gap-2 pl-7 text-sm">
                      Dalībnieki
                      <input
                        inputMode="numeric"
                        value={fmt(sel.persons)}
                        onChange={(e) => update({ workshops: c.workshops.map((x) => (x.id === w.id ? { ...x, persons: Math.round(num(e.target.value)) } : x)) })}
                        className={cn(adminInput, "w-24 py-1.5")}
                      />
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="4. Papildu aktivitātes" hint="Cena atkarīga no daudzuma — stundas, personas vai gabali (cenas — lapas apakšā “Cenas un likmes”).">
          <CatalogList items={activities} selected={c.items} onToggle={toggleItem} onQty={setItemQty} />
        </Card>

        <Card title="5. Animatori / vadītāji">
          <div className="grid gap-4 sm:grid-cols-4">
            {field(
              "Skaits",
              <input inputMode="numeric" value={fmt(c.animators.count)} onChange={(e) => update({ animators: { ...c.animators, count: Math.round(num(e.target.value)) } })} className={adminInput} />,
            )}
            {field(
              "Aprēķins",
              <select
                value={c.animators.mode}
                onChange={(e) => {
                  const mode = e.target.value === "fixed" ? "fixed" : "hour";
                  update({ animators: { ...c.animators, mode, rate: mode === "fixed" ? settings.animatorFixed : settings.animatorHour } });
                }}
                className={adminInput}
              >
                <option value="hour">Pa stundām</option>
                <option value="fixed">Par pasākumu</option>
              </select>,
            )}
            {c.animators.mode === "hour" &&
              field("Stundas", <input inputMode="decimal" value={fmt(c.animators.hours)} onChange={(e) => update({ animators: { ...c.animators, hours: num(e.target.value) } })} className={adminInput} />)}
            {field(
              c.animators.mode === "hour" ? "Likme €/h" : "€ vienam",
              <input inputMode="decimal" value={fmt(c.animators.rate)} onChange={(e) => update({ animators: { ...c.animators, rate: num(e.target.value) } })} className={adminInput} />,
            )}
          </div>
        </Card>

        <Card title="6. Ceļa izdevumi">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("Kilometri turp un atpakaļ", <input inputMode="decimal" value={fmt(c.travel.km)} onChange={(e) => update({ travel: { ...c.travel, km: num(e.target.value) } })} className={adminInput} />)}
            {field("€ par km", <input inputMode="decimal" value={fmt(c.travel.rate)} onChange={(e) => update({ travel: { ...c.travel, rate: num(e.target.value) } })} className={adminInput} />)}
          </div>
        </Card>

        <Card title="7. Citi izdevumi" hint="Atzīmējiet jau aprēķinātos vai pievienojiet jaunu.">
          {expenses.length > 0 && <CatalogList items={expenses} selected={c.items} onToggle={toggleItem} onQty={setItemQty} />}
          <ul className="mt-3 space-y-2">
            {custom.map((x) => (
              <li key={x.key} className="grid items-end gap-2 rounded-xl p-3 ring-1 ring-line sm:grid-cols-[minmax(0,1fr)_120px_150px_auto]">
                {field("Nosaukums", <input value={x.title} onChange={(e) => { setDirty(true); setCustom((cs) => cs.map((y) => (y.key === x.key ? { ...y, title: e.target.value } : y))); }} className={adminInput} />)}
                {field("Summa, €", <input inputMode="decimal" value={fmt(x.unitCost)} onChange={(e) => { setDirty(true); setCustom((cs) => cs.map((y) => (y.key === x.key ? { ...y, unitCost: num(e.target.value) } : y))); }} className={adminInput} />)}
                <label className="flex items-center gap-2 pb-2.5 text-sm">
                  <input type="checkbox" checked={x.save} onChange={(e) => setCustom((cs) => cs.map((y) => (y.key === x.key ? { ...y, save: e.target.checked } : y)))} className="size-4 accent-ink" />
                  Saglabāt katalogā
                </label>
                <button type="button" onClick={() => { setDirty(true); setCustom((cs) => cs.filter((y) => y.key !== x.key)); }} className="mb-1 grid size-9 place-items-center rounded-lg text-ink-soft hover:bg-destructive/10 hover:text-destructive" aria-label="Noņemt">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => { setDirty(true); setCustom((cs) => [...cs, { key: Date.now(), kind: "expense", title: "", unit: "fixed", unitCost: 0, qty: 1, save: false }]); }}
            className={cn(adminSecondary, "mt-3")}
          >
            <Plus className="size-4" aria-hidden /> Pievienot izdevumu
          </button>
        </Card>

        <Card title="8. Teksts klientam" hint="Parādās PDF beigās — piem. kas iekļauts cenā, apmaksas nosacījumi.">
          <textarea rows={4} value={c.note} onChange={(e) => update({ note: e.target.value })} className={adminInput} />
        </Card>
      </div>

      {/* Kopsavilkums */}
      <aside className="h-fit space-y-4 xl:sticky xl:top-6">
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <h2 className="text-sm font-extrabold">Pašizmaksa</h2>
          <dl className="mt-2 space-y-1 text-sm">
            {result.lines.length === 0 && <p className="text-ink-soft">Atzīmējiet darbnīcas vai aktivitātes.</p>}
            {result.lines.map((l, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt className="min-w-0">
                  {l.label} {l.detail && <span className="text-ink-soft">({l.detail})</span>}
                </dt>
                <dd className="font-semibold whitespace-nowrap">{money(l.cost)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 border-t border-line pt-1 font-extrabold">
              <dt>Pašizmaksa kopā</dt>
              <dd>{money(result.cost)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl bg-ink p-5 text-white">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold text-white/60 uppercase">
              Uzcenojums, %
              <input inputMode="decimal" value={fmt(c.markup)} onChange={(e) => update({ markup: num(e.target.value) })} className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base font-bold text-white outline-none focus:border-brand" />
            </label>
            <label className="block text-xs font-semibold text-white/60 uppercase">
              PVN, %
              <input inputMode="decimal" value={fmt(c.vat)} onChange={(e) => update({ vat: num(e.target.value) })} className="mt-1 block w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-base font-bold text-white outline-none focus:border-brand" />
            </label>
          </div>
          <dl className="mt-4 space-y-1 text-sm">
            <Row k={`Uzcenojums ${c.markup}%`} v={money(result.markupAmount)} />
            <Row k="Cena bez PVN" v={money(result.net)} />
            <Row k={`PVN ${c.vat}%`} v={money(result.vatAmount)} />
          </dl>
          <p className="mt-3 border-t border-white/20 pt-3 text-xs font-semibold text-white/60 uppercase">Kopā klientam</p>
          <p className="text-3xl font-extrabold text-brand">{money(result.total)}</p>
          {result.perChild !== null && <p className="text-sm text-white/70">{money(result.perChild)} par bērnu ar PVN</p>}
        </div>

        <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={c.showLinePrices} onChange={(e) => update({ showLinePrices: e.target.checked })} className="mt-0.5 size-4 accent-ink" />
            <span>
              <b>PDF rādīt cenas pa pozīcijām</b>
              <span className="block text-xs text-ink-soft">Citādi klients redz, kas iekļauts, un tikai kopsummu. Pašizmaksa un uzcenojums PDF nav redzami nekad.</span>
            </span>
          </label>
          <TeamForm action={action} submitLabel={offerId ? "Saglabāt izmaiņas" : "Saglabāt piedāvājumu"} className="mt-4">
            <input type="hidden" name="calc" value={JSON.stringify(calc)} />
            <input type="hidden" name="to_catalog" value={JSON.stringify(custom.filter((x) => x.save && x.title.trim()).map(({ title, unit, unitCost, kind }) => ({ title, unit, unitCost, kind })))} />
          </TeamForm>
          {offerId && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {dirty && <p className="text-xs font-semibold text-destructive">Ir nesaglabātas izmaiņas — saglabājiet, pirms veidojat PDF.</p>}
              <a href={`/admin/dokuments/${offerId}?veids=prezentacija`} target="_blank" className={cn(adminSecondary, "w-full")}>
                <Presentation className="size-4" aria-hidden /> Prezentācija (PDF)
              </a>
              <a href={`/admin/dokuments/${offerId}?veids=piedavajums`} target="_blank" className={cn(adminSecondary, "w-full")}>
                <FileDown className="size-4" aria-hidden /> Piedāvājums ar cenu (PDF)
              </a>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-6">
      <h2 className="text-base font-extrabold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-ink-soft">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-white/70">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}

function CatalogList({
  items,
  selected,
  onToggle,
  onQty,
}: {
  items: BuilderCostItem[];
  selected: CalcItem[];
  onToggle: (i: BuilderCostItem, on: boolean) => void;
  onQty: (id: string, qty: number) => void;
}) {
  if (!items.length) return <p className="text-sm text-ink-soft">Katalogā vēl nav ierakstu.</p>;
  return (
    <ul className="grid gap-2 md:grid-cols-2">
      {items.map((i) => {
        const sel = selected.find((x) => x.id === i.id);
        return (
          <li key={i.id} className={cn("rounded-xl p-3 ring-1", sel ? "bg-brand-soft ring-ink" : "ring-line")}>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={Boolean(sel)} onChange={(e) => onToggle(i, e.target.checked)} className="mt-0.5 size-4 accent-ink" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{i.title}</span>
                <span className={cn("block text-xs", i.cost ? "text-ink-soft" : "font-semibold text-destructive")}>
                  {i.cost ? `${money(i.cost)} ${UNIT_LABEL[i.unit]}` : "cena nav ievadīta"}
                </span>
              </span>
            </label>
            {sel && i.unit !== "fixed" && (
              <label className="mt-2 flex items-center gap-2 pl-7 text-sm">
                Daudzums
                <input
                  inputMode="decimal"
                  value={fmt(sel.qty)}
                  onChange={(e) => onQty(i.id, num(e.target.value))}
                  className={cn(adminInput, "w-24 py-1.5")}
                />
                {UNIT_SHORT[i.unit]}
              </label>
            )}
          </li>
        );
      })}
    </ul>
  );
}


