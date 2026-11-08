import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSection } from "@/lib/auth";
import { getSettings } from "@/lib/content/queries";
import type { PresentationRow } from "@/lib/team/presentations";
import { lvDate } from "@/components/admin/team/offer-utils";
import PrintButton from "@/components/admin/team/PrintButton";
import PresentationPages, { type Slide } from "@/components/admin/team/PresentationPages";

type Props = { params: Promise<{ id: string }> };

async function load(id: string) {
  const { db } = await requireSection("piedavajumi");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await db.from("presentations").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return { db, p: data as PresentationRow };
}

export async function generateMetadata({ params }: Props) {
  const { p } = await load((await params).id);
  return { title: { absolute: `Prezentācija – ${p.client_name} – Smaidu Darbnīca` } };
}

/** Atsevišķā prezentācija (bez cenām) — "Lejupielādēt PDF" → pārlūka "Saglabāt kā PDF". */
export default async function PresentationPdfPage({ params }: Props) {
  const { id } = await params;
  const { db, p } = await load(id);
  const [{ data: ws }, { data: acts }, site] = await Promise.all([
    p.workshop_ids.length ? db.from("workshops").select("id, title, description, image").in("id", p.workshop_ids) : Promise.resolve({ data: [] }),
    p.activity_ids.length ? db.from("cost_items").select("id, title, description, image").in("id", p.activity_ids) : Promise.resolve({ data: [] }),
    getSettings(),
  ]);
  type Row = Omit<Slide, "tag">;
  const order = (ids: string[], rows: Row[], tag: string): Slide[] =>
    ids.map((x) => rows.find((r) => r.id === x)).filter((r): r is Row => Boolean(r)).map((r) => ({ ...r, tag }));
  const slides = [...order(p.workshop_ids, (ws ?? []) as Row[], "Radošā darbnīca"), ...order(p.activity_ids, (acts ?? []) as Row[], "Aktivitāte")];
  const contact = site.contact;
  const contactLine = [contact.phoneBusiness && `${contact.phoneBusinessPerson ? `${contact.phoneBusinessPerson}: ` : ""}${contact.phoneBusiness}`, contact.email, "www.smaidudarbnica.lv"]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="doc min-h-screen bg-neutral-200 py-8 print:bg-white print:py-0">
      <style>{`
        @page { size: A4 landscape; margin: 0; }
        @media print { .no-print { display: none !important; } html, body { background: #fff !important; } }
        .page { width: 297mm; height: 210mm; }
        @media print { .page { box-shadow: none !important; margin: 0 !important; break-after: page; } .page:last-child { break-after: auto; } }
        .doc * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `}</style>
      <div className="no-print mx-auto mb-6 flex max-w-[297mm] flex-wrap items-center justify-between gap-3 px-4">
        <Link href={`/admin/prezentacijas-izveide?id=${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> Atpakaļ uz prezentāciju
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-ink-soft">Drukas logā izvēlieties “Saglabāt kā PDF”.</span>
          <PrintButton />
        </div>
      </div>
      <PresentationPages
        kicker="Piedāvājums"
        client={p.client_name}
        title={p.title || "Piedāvājums jūsu pasākumam"}
        meta={[lvDate(p.event_date), p.place, p.children ? `${p.children} bērni` : "", p.hours ? `${String(p.hours).replace(".", ",")} h` : ""].filter(Boolean).join("  ·  ")}
        slides={slides}
        extras={[]}
        note={p.intro ?? ""}
        contact={contact}
        contactLine={contactLine}
      />
    </div>
  );
}
