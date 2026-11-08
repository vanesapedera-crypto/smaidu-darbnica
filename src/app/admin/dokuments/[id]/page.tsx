import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { getSettings } from "@/lib/content/queries";
import { clientPrice, computeOffer, parseCalc, parseSettings } from "@/lib/team/offer-calc";
import { money } from "@/lib/team/workshops";
import { lvDate } from "@/components/admin/team/offer-utils";
import PrintButton from "@/components/admin/team/PrintButton";
import PresentationPages, { type Slide } from "@/components/admin/team/PresentationPages";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ veids?: string }> };

async function load(id: string) {
  const { db } = await requireSection("piedavajumi");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: offer }, { data: s }, site] = await Promise.all([
    db.from("offers").select("*").eq("id", id).maybeSingle(),
    db.from("calc_settings").select("data").eq("id", 1).maybeSingle(),
    getSettings(),
  ]);
  if (!offer?.calc) notFound();
  const calc = parseCalc(offer.calc, parseSettings(s?.data), site.programs.travelRate);
  return { db, offer, calc, site };
}

export async function generateMetadata({ params, searchParams }: Props) {
  const [{ id }, { veids }] = await Promise.all([params, searchParams]);
  const { calc } = await load(id);
  // Nosaukums = PDF faila nosaukums, saglabājot no drukas loga
  return { title: { absolute: `${veids === "prezentacija" ? "Prezentācija" : "Piedāvājums"} – ${calc.client} – Smaidu Darbnīca` } };
}

/**
 * Dokuments klientam (atveras jaunā cilnē, "Lejupielādēt PDF" → pārlūka "Saglabāt kā PDF"):
 *  - prezentācija: titullapa, katrai darbnīcai/aktivitātei sava lapa ar foto un aprakstu, kontakti;
 *  - piedāvājums: pozīcijas (ar cenām vai bez — kā atzīmēts), summa bez PVN, PVN, kopā.
 * Pašizmaksa un uzcenojums nekad netiek rādīti.
 */
export default async function DocumentPage({ params, searchParams }: Props) {
  const [{ id }, { veids }] = await Promise.all([params, searchParams]);
  const { db, offer, calc, site } = await load(id);
  const presentation = veids === "prezentacija";
  const contact = site.contact;
  const result = computeOffer(calc);

  // Prezentācijas lapas: darbnīcas un aktivitātes ar aprakstu un foto
  const wIds = calc.workshops.map((w) => w.id).filter(Boolean);
  const aIds = calc.items.filter((i) => i.id && i.kind === "activity").map((i) => i.id!) ;
  const [{ data: wRows }, { data: aRows }] = await Promise.all([
    wIds.length ? db.from("workshops").select("id, title, description, image").in("id", wIds) : Promise.resolve({ data: [] }),
    aIds.length ? db.from("cost_items").select("id, title, description, image").in("id", aIds) : Promise.resolve({ data: [] }),
  ]);
  const byId = new Map([...(wRows ?? []), ...(aRows ?? [])].map((r) => [r.id as string, r as Omit<Slide, "tag">]));
  const slides: Slide[] = [
    ...calc.workshops.map((w) => ({ ...(byId.get(w.id) ?? { id: w.id, title: w.title, description: null, image: null }), tag: "Radošā darbnīca" })),
    ...calc.items
      .filter((i) => i.id && i.kind === "activity")
      .map((i) => ({ ...(byId.get(i.id!) ?? { id: i.id!, title: i.title, description: null, image: null }), tag: "Aktivitāte" })),
  ];

  const date = calc.date ? lvDate(calc.date) : "";
  const title = calc.title || offer.title;
  const contactLine = [contact.phoneBusiness && `${contact.phoneBusinessPerson ? `${contact.phoneBusinessPerson}: ` : ""}${contact.phoneBusiness}`, contact.email, "www.smaidudarbnica.lv"]
    .filter(Boolean)
    .join("  ·  ");
  const visibleLines = result.lines.filter((l) => l.group !== "expense" || calc.showLinePrices);

  return (
    <div className="doc min-h-screen bg-neutral-200 py-8 print:bg-white print:py-0">
      <style>{`
        @page { size: A4 ${presentation ? "landscape" : "portrait"}; margin: 0; }
        @media print { .no-print { display: none !important; } html, body { background: #fff !important; } }
        .page { width: ${presentation ? "297mm" : "210mm"}; min-height: ${presentation ? "210mm" : "297mm"}; height: ${presentation ? "210mm" : "auto"}; }
        @media print { .page { box-shadow: none !important; margin: 0 !important; break-after: page; } .page:last-child { break-after: auto; } }
        .doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>

      <div className="no-print mx-auto mb-6 flex max-w-[297mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link href={`/admin/piedavajuma-izveide?id=${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Atpakaļ uz piedāvājumu
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-soft">Drukas logā izvēlieties “Saglabāt kā PDF”.</span>
          <Link href={`/admin/dokuments/${id}?veids=${presentation ? "piedavajums" : "prezentacija"}`} className="text-sm font-semibold underline">
            {presentation ? "Piedāvājums ar cenu" : "Prezentācija"}
          </Link>
          <PrintButton />
        </div>
      </div>

      {presentation ? (
        <>
          <PresentationPages
            kicker="Piedāvājums"
            client={calc.client}
            title={title}
            meta={[date, calc.place, calc.children ? `${calc.children} bērni` : "", calc.hours ? `${String(calc.hours).replace(".", ",")} h` : ""].filter(Boolean).join("  ·  ")}
            slides={slides}
            extras={calc.staff.filter((a) => a.count > 0).map((a) => `${a.role || "Animators"}${a.count > 1 ? ` × ${a.count}` : ""}`)}
            note={calc.note}
            contact={contact}
            contactLine={contactLine}
          />
        </>
      ) : (
        <section className="page mx-auto mb-8 flex flex-col bg-white p-[16mm] text-[10.5pt] shadow-xl">
          <header className="flex items-start justify-between gap-6 border-b-4 border-brand pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-dark.svg" alt="Smaidu Darbnīca" className="h-[22mm] w-auto" />
            <div className="text-right text-[9pt] leading-5 text-ink-soft">
              <p className="font-bold text-ink">{contact.company}</p>
              {contact.regNr && <p>Reģ. Nr. {contact.regNr}</p>}
              {contact.vatNr && <p>PVN Nr. {contact.vatNr}</p>}
              {contact.legalAddress && <p>{contact.legalAddress}</p>}
              <p>{contact.email}</p>
            </div>
          </header>

          <div className="mt-8 flex justify-between gap-6">
            <div>
              <p className="text-[9pt] font-bold tracking-[0.15em] text-ink-soft uppercase">Piedāvājums</p>
              <h1 className="mt-1 font-display text-[20pt] leading-tight font-extrabold uppercase">{title}</h1>
            </div>
            <div className="text-right text-[9.5pt] leading-5">
              <p className="font-bold">{calc.client}</p>
              {calc.contactPerson && <p>{calc.contactPerson}</p>}
              {calc.contactEmail && <p>{calc.contactEmail}</p>}
              <p className="mt-2 text-ink-soft">Datums: {lvDate(offer.offer_date) || lvDate(new Date().toISOString())}</p>
            </div>
          </div>

          <dl className="mt-6 grid grid-cols-4 gap-3 rounded-xl bg-surface p-4 text-[9.5pt]">
            {[
              ["Pasākuma datums", date || "—"],
              ["Vieta", calc.place || "—"],
              ["Bērni", calc.children ? String(calc.children) : "—"],
              ["Ilgums", calc.hours ? `${String(calc.hours).replace(".", ",")} h` : "—"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-ink-soft">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>

          <table className="mt-6 w-full">
            <thead>
              <tr className="border-b-2 border-ink text-left text-[9pt] tracking-wide uppercase">
                <th className="py-2">Pozīcija</th>
                <th className="py-2">Daudzums</th>
                {calc.showLinePrices && <th className="py-2 text-right">Cena bez PVN</th>}
              </tr>
            </thead>
            <tbody>
              {visibleLines.map((l, i) => (
                <tr key={i} className="border-b border-line">
                  <td className="py-2.5 pr-4 font-semibold">{l.label}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{l.detail}</td>
                  {calc.showLinePrices && <td className="py-2.5 text-right font-semibold whitespace-nowrap">{money(clientPrice(l, calc.markup))}</td>}
                </tr>
              ))}
              {!calc.showLinePrices && result.lines.some((l) => l.group === "expense") && (
                <tr className="border-b border-line">
                  <td className="py-2.5 pr-4 text-ink-soft" colSpan={2}>
                    Organizatoriskie izdevumi
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="mt-6 ml-auto w-[85mm] space-y-1.5 text-[10.5pt]">
            <div className="flex justify-between">
              <span>Summa bez PVN</span>
              <b>{money(result.net)}</b>
            </div>
            <div className="flex justify-between">
              <span>PVN {String(calc.vat).replace(".", ",")}%</span>
              <b>{money(result.vatAmount)}</b>
            </div>
            <div className="flex justify-between rounded-lg bg-brand px-3 py-2 text-[13pt] font-extrabold">
              <span>Kopā</span>
              <span>{money(result.total)}</span>
            </div>
            {result.perChild !== null && <p className="text-right text-[9pt] text-ink-soft">{money(result.perChild)} par vienu bērnu (ar PVN)</p>}
          </div>

          {calc.note && <p className="mt-8 text-[10pt] leading-relaxed whitespace-pre-line">{calc.note}</p>}

          <footer className="mt-auto border-t border-line pt-4 text-[9pt] text-ink-soft">
            Piedāvājums derīgs 30 dienas. {contactLine}
          </footer>
        </section>
      )}
    </div>
  );
}
