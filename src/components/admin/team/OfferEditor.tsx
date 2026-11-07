import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CopyPlus, Download, History } from "lucide-react";
import { isManagerRole, type MemberContext } from "@/lib/auth";
import { deleteOffer, saveOffer } from "@/app/admin/team-actions";
import { OFFER_SEASONS, OFFER_STATUSES, clientKey, type OfferKind, type OfferRow } from "@/lib/team/types";
import { missingTable, signedUrls } from "@/lib/team/files";
import PageHeader from "../PageHeader";
import DeleteButton from "../DeleteButton";
import { adminInput, adminSecondary } from "../styles";
import TeamForm from "./TeamForm";
import FileField from "./FileField";
import CopyButton from "./CopyButton";
import MigrationNotice from "./MigrationNotice";
import { lvDate, statusTone } from "./offer-utils";
import { cn } from "@/lib/utils";

const isUuid = (v: string) => /^[0-9a-f-]{36}$/i.test(v);

/**
 * Piedāvājuma rediģēšana — kopīga klientu piedāvājumiem un standarta piedāvājumiem.
 * Klienta piedāvājumam sānā redzams, kas šim klientam piedāvāts iepriekš.
 */
export default async function OfferEditor({
  member,
  kind,
  id,
  query,
}: {
  member: MemberContext;
  kind: OfferKind;
  id: string;
  query: { klients?: string; no?: string; saglabats?: string };
}) {
  const { db } = member;
  const base = kind === "template" ? "/admin/standarta-piedavajumi" : "/admin/piedavajumi";
  const isNew = id === "jauns";
  if (!isNew && !isUuid(id)) notFound();
  const canEdit = isManagerRole(member.role);
  // Bez tiesībām labot — tikai skatīšana (jaunu izveidot nevar)
  if (!canEdit && isNew) redirect(base);

  let offer: Partial<OfferRow> | null = null;
  if (!isNew) {
    const { data, error } = await db.from("offers").select("*").eq("id", id).eq("kind", kind).maybeSingle();
    if (missingTable(error)) return <MigrationNotice title="Piedāvājumi" />;
    if (!data) notFound();
    offer = data as OfferRow;
  } else {
    // Jauns: no standarta piedāvājuma (?no=…) un/vai konkrētam klientam (?klients=…)
    offer = { client_name: query.klients ?? null };
    if (query.no && isUuid(query.no)) {
      const { data: t } = await db.from("offers").select("*").eq("id", query.no).maybeSingle();
      if (t) {
        const tpl = t as OfferRow;
        offer = {
          ...offer,
          title: tpl.title,
          season: tpl.season,
          services: tpl.services,
          price: tpl.price,
          body: tpl.body,
          template_id: tpl.kind === "template" ? tpl.id : tpl.template_id,
        };
      }
    }
    if (kind === "client") offer = { status: "Melnraksts", offer_date: new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Riga" }), ...offer };
  }

  // Iepriekšējie piedāvājumi šim klientam, visu klientu nosaukumi (ieteikumiem) un standarta piedāvājumi
  const [{ data: all }, { data: templates }] = await Promise.all([
    kind === "client" ? db.from("offers").select("id, client_name, title, offer_date, services, price, status").eq("kind", "client") : Promise.resolve({ data: [] }),
    db.from("offers").select("id, title").eq("kind", "template").order("title"),
  ]);
  const clientOffers = (all ?? []) as Pick<OfferRow, "id" | "client_name" | "title" | "offer_date" | "services" | "price" | "status">[];
  const clientNames = [...new Set(clientOffers.map((o) => o.client_name).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, "lv"));
  const key = clientKey(offer?.client_name);
  const history = key
    ? clientOffers.filter((o) => o.id !== id && clientKey(o.client_name) === key).sort((a, b) => (b.offer_date ?? "").localeCompare(a.offer_date ?? ""))
    : [];
  const urls = await signedUrls(db, [offer?.file_path]);
  const fileUrl = offer?.file_path ? (urls.get(offer.file_path) ?? null) : null;
  const usedTemplate = (templates ?? []).find((t) => t.id === offer?.template_id);

  if (!canEdit && offer) return <OfferView offer={offer as OfferRow} fileUrl={fileUrl} base={base} />;

  const title = isNew
    ? kind === "template" ? "Jauns standarta piedāvājums" : "Jauns piedāvājums"
    : (offer?.title ?? "Piedāvājums");

  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {kind === "template" ? "Standarta piedāvājumi" : "Piedāvājumi klientiem"}
      </Link>
      <div className="mt-3">
        <PageHeader
          title={title}
          description={!isNew && offer?.client_name ? offer.client_name : undefined}
          notice={query.saglabats ? "Saglabāts." : undefined}
          actions={
            !isNew && (
              <>
                {(offer as { calc?: unknown } | null)?.calc ? (
                  <>
                    <Link href={`/admin/piedavajuma-izveide?id=${id}`} className={adminSecondary}>
                      Atvērt aprēķinu
                    </Link>
                    <Link href={`/admin/dokuments/${id}?veids=prezentacija`} target="_blank" className={adminSecondary}>
                      Prezentācija (PDF)
                    </Link>
                    <Link href={`/admin/dokuments/${id}?veids=piedavajums`} target="_blank" className={adminSecondary}>
                      Piedāvājums (PDF)
                    </Link>
                  </>
                ) : null}
                {offer?.body && <CopyButton text={offer.body} />}
                {kind === "template" ? (
                  <Link href={`/admin/piedavajumi/jauns?no=${id}`} className={adminSecondary}>
                    <CopyPlus className="size-4" aria-hidden /> Izmantot klientam
                  </Link>
                ) : (
                  <Link href={`/admin/piedavajumi/jauns?no=${id}`} className={adminSecondary}>
                    <CopyPlus className="size-4" aria-hidden /> Kopēt citam klientam
                  </Link>
                )}
              </>
            )
          }
        />
      </div>

      {isNew && kind === "client" && (templates ?? []).length > 0 && (
        <form className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 ring-1 ring-line">
          <span className="text-sm font-bold">Sākt no standarta piedāvājuma:</span>
          {offer?.client_name && <input type="hidden" name="klients" value={offer.client_name} />}
          <select name="no" defaultValue={query.no ?? ""} className={`${adminInput} w-auto min-w-56`}>
            <option value="">— nav —</option>
            {(templates ?? []).map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <button className={adminSecondary}>Ielādēt</button>
        </form>
      )}

      <div className={cn("mt-6 grid gap-6", kind === "client" && "xl:grid-cols-[minmax(0,1fr)_320px]")}>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
          <TeamForm action={saveOffer.bind(null, kind, isNew ? null : id)} submitLabel={isNew ? "Saglabāt piedāvājumu" : "Saglabāt"}>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {kind === "client" && (
                <>
                  <Field label="Klients (uzņēmums, pašvaldība…)" required wide>
                    <input name="client_name" required list="client-names" defaultValue={offer?.client_name ?? ""} className={adminInput} />
                    <datalist id="client-names">
                      {clientNames.map((n) => (
                        <option key={n} value={n} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="Kontaktpersona">
                    <input name="contact_person" defaultValue={offer?.contact_person ?? ""} className={adminInput} />
                  </Field>
                  <Field label="Kontaktpersonas e-pasts">
                    <input name="contact_email" type="email" defaultValue={offer?.contact_email ?? ""} className={adminInput} />
                  </Field>
                </>
              )}
              <Field label="Piedāvājuma nosaukums" required wide>
                <input name="title" required defaultValue={offer?.title ?? ""} placeholder="piem. Ziemassvētku pasākums darbiniekiem un bērniem" className={adminInput} />
              </Field>
              {kind === "client" && (
                <>
                  <Field label="Datums">
                    <input name="offer_date" type="date" defaultValue={offer?.offer_date ?? ""} className={adminInput} />
                  </Field>
                  <Field label="Statuss">
                    <select name="status" defaultValue={offer?.status ?? "Melnraksts"} className={adminInput}>
                      {OFFER_STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </>
              )}
              <Field label="Sezona">
                <select name="season" defaultValue={offer?.season ?? ""} className={adminInput}>
                  <option value="">—</option>
                  {OFFER_SEASONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Cena">
                <input name="price" defaultValue={offer?.price ?? ""} placeholder="piem. 1200 € + PVN" className={adminInput} />
              </Field>
              <Field label="Kas piedāvāts (izrāde, aktivitātes)" wide help="Īsi, pa rindām — pēc tā nākamgad redzēsiet, ko šim klientam vairs nepiedāvāt.">
                <textarea name="services" rows={4} defaultValue={offer?.services ?? ""} className={adminInput} />
              </Field>
              <Field label="Piedāvājuma teksts" wide help="Teksts, ko sūtāt klientam. Pēc saglabāšanas to var nokopēt ar pogu “Kopēt tekstu”.">
                <textarea name="body" rows={12} defaultValue={offer?.body ?? ""} className={adminInput} />
              </Field>
              <Field label="Iekšējās piezīmes" wide>
                <textarea name="notes" rows={3} defaultValue={offer?.notes ?? ""} placeholder="Klientam neredzamas" className={adminInput} />
              </Field>
              <div className="md:col-span-2">
                <FileField folder={kind === "template" ? "standarta" : "piedavajumi"} current={offer?.file_name ? { name: offer.file_name, url: fileUrl, size: offer.file_size ?? null } : null} label="Piedāvājuma fails (PDF, prezentācija…)" />
              </div>
              <input type="hidden" name="template_id" value={offer?.template_id ?? ""} />
            </div>
          </TeamForm>
          {usedTemplate && (
            <p className="mt-4 text-xs text-ink-soft">
              Veidots no standarta piedāvājuma:{" "}
              <Link href={`/admin/standarta-piedavajumi/${usedTemplate.id}`} className="font-semibold underline">{usedTemplate.title}</Link>
            </p>
          )}
          {!isNew && member.role === "owner" && (
            <div className="mt-6 border-t border-line pt-5">
              <DeleteButton action={deleteOffer.bind(null, kind, id)} label="Dzēst piedāvājumu" />
            </div>
          )}
        </div>

        {kind === "client" && (
          <aside className="h-fit rounded-2xl bg-white p-5 ring-1 ring-line">
            <h2 className="flex items-center gap-2 text-sm font-extrabold">
              <History className="size-4" aria-hidden /> Šim klientam iepriekš
            </h2>
            {!key && <p className="mt-2 text-sm text-ink-soft">Ievadiet klientu un saglabājiet — šeit parādīsies iepriekšējie piedāvājumi.</p>}
            {key && history.length === 0 && <p className="mt-2 text-sm text-ink-soft">Citu piedāvājumu šim klientam nav.</p>}
            <ul className="mt-3 space-y-3">
              {history.map((h) => (
                <li key={h.id} className="rounded-xl bg-surface p-3 text-sm">
                  <Link href={`/admin/piedavajumi/${h.id}`} className="font-bold hover:underline">{h.title}</Link>
                  <p className="text-xs text-ink-soft">
                    {lvDate(h.offer_date)} {h.price && `· ${h.price}`}{" "}
                    {h.status && <span className={cn("ml-1 rounded-full px-1.5 py-0.5 font-semibold", statusTone(h.status))}>{h.status}</span>}
                  </p>
                  {h.services && <p className="mt-1 whitespace-pre-line">{h.services}</p>}
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
      {fileUrl && (
        <a href={fileUrl} target="_blank" rel="noreferrer" className={`${adminSecondary} mt-4`}>
          <Download className="size-4" aria-hidden /> Atvērt pievienoto failu
        </a>
      )}
    </>
  );
}

/** Piedāvājums tikai skatīšanai (tiem, kam nav tiesību labot) */
function OfferView({ offer, fileUrl, base }: { offer: OfferRow; fileUrl: string | null; base: string }) {
  return (
    <>
      <Link href={base} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {offer.kind === "template" ? "Standarta piedāvājumi" : "Piedāvājumi"}
      </Link>
      <div className="mt-3">
        <PageHeader
          title={offer.title}
          description={[offer.client_name, lvDate(offer.offer_date), offer.season, offer.price, offer.status].filter(Boolean).join(" · ") || undefined}
          actions={offer.body ? <CopyButton text={offer.body} /> : undefined}
        />
      </div>
      <div className="mt-6 space-y-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7">
        {offer.services && (
          <div>
            <h2 className="text-sm font-extrabold">Kas iekļauts</h2>
            <p className="mt-1 text-sm whitespace-pre-line">{offer.services}</p>
          </div>
        )}
        {offer.body && (
          <div>
            <h2 className="text-sm font-extrabold">Piedāvājuma teksts</h2>
            <p className="mt-1 text-sm leading-6 whitespace-pre-line">{offer.body}</p>
          </div>
        )}
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer" className={adminSecondary}>
            <Download className="size-4" aria-hidden /> {offer.file_name ?? "Atvērt failu"}
          </a>
        )}
      </div>
    </>
  );
}

function Field({ label, required, wide, help, children }: { label: string; required?: boolean; wide?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <label className={cn("space-y-1.5", wide && "md:col-span-2")}>
      <span className="block text-sm font-bold">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      {children}
      {help && <span className="block text-xs leading-5 text-ink-soft">{help}</span>}
    </label>
  );
}
