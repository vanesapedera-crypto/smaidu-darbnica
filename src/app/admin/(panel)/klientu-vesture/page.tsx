import Link from "next/link";
import { Building2, CalendarCheck, FileText, Plus, Search, User } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { phoneDigits, type Booking } from "@/lib/bookings";
import { getServices, getSettings } from "@/lib/content/queries";
import { bookingCosts, bookingPrices, eur } from "@/lib/pricing";
import { clientKey, type OfferRow } from "@/lib/team/types";
import { isVenue, stateOf } from "@/components/admin/team/BookingCard";
import { lvDate, statusTone } from "@/components/admin/team/offer-utils";
import PageHeader from "@/components/admin/PageHeader";
import { adminInput, adminSecondary } from "@/components/admin/styles";
import { cn } from "@/lib/utils";

export const metadata = { title: "Klientu vēsture" };

type Kind = "visi" | "uznemumi" | "privati";
type Props = { searchParams: Promise<{ q?: string; v?: string }> };

type Entry = {
  date: string; // YYYY-MM-DD (kārtošanai)
  type: "event" | "offer";
  title: string;
  status: string;
  tone: string;
  amount: string | null;
  href?: string;
};

type Client = {
  key: string;
  name: string;
  business: boolean;
  contact: string | null;
  phone: string | null;
  email: string | null;
  entries: Entry[];
  events: number;
  offers: number;
  spent: number;
  plusVat: boolean;
  last: string;
};

/**
 * Klientu vēsture: katram klientam — visi pasākumi (no pieteikumiem) un visi piedāvājumi vienā laika līnijā.
 * Uzņēmumus un iestādes apvieno pēc nosaukuma, privātpersonas — pēc e-pasta vai telefona.
 */
export default async function ClientHistoryPage({ searchParams }: Props) {
  const { db } = await requireMember(["owner", "manager"]);
  const { q = "", v = "" } = await searchParams;
  const kind: Kind = v === "uznemumi" || v === "privati" ? v : "visi";

  const [{ data: bookingRows }, { data: offerRows }, business, programs, settings] = await Promise.all([
    db.from("bookings").select("*"),
    db.from("offers").select("*").eq("kind", "client"),
    getServices("business"),
    getServices("private"),
    getSettings(),
  ]);
  const prices = bookingPrices(settings);
  const titles = new Map([...business, ...programs].map((s) => [s.slug, s.title]));

  const clients = new Map<string, Client>();
  const get = (key: string, init: Omit<Client, "entries" | "events" | "offers" | "spent" | "plusVat" | "last">) => {
    let c = clients.get(key);
    if (!c) {
      c = { ...init, entries: [], events: 0, offers: 0, spent: 0, plusVat: false, last: "" };
      clients.set(key, c);
    }
    // Jaunākie kontakti aizpilda tukšos laukus
    c.contact ??= init.contact;
    c.phone ??= init.phone;
    c.email ??= init.email;
    return c;
  };

  for (const b of (bookingRows ?? []) as Booking[]) {
    const isCompany = Boolean(b.company_name?.trim());
    const email = b.email?.trim().toLowerCase();
    const phone = phoneDigits(b.phone);
    const key = isCompany
      ? `c:${clientKey(b.company_name)}`
      : email ? `e:${email}` : phone ? `p:${phone}` : `n:${clientKey(b.parent_name) || b.id}`;
    const c = get(key, {
      key,
      name: (isCompany ? b.company_name : b.parent_name)?.trim() || "—",
      business: isCompany || b.inquiry_type === "business",
      contact: isCompany ? b.parent_name : null,
      phone: b.phone,
      email: b.email,
    });
    const slug = b.service_slug || b.program;
    const program = slug ? (titles.get(slug) ?? slug) : null;
    const costs = b.inquiry_type === "business" ? null : bookingCosts(b, programs.find((p) => p.slug === slug), prices);
    const s = stateOf(b);
    const date = (b.event_date ?? b.created_at ?? "").slice(0, 10);
    c.entries.push({
      date,
      type: "event",
      title: program ? (isVenue(b) ? `Telpu noma + ${program}` : program) : isVenue(b) ? "Telpu noma" : "Pieteikums",
      status: s.label,
      tone: s.tone,
      amount: costs?.exact ? `${eur(costs.total)}${costs.plusVat ? " + PVN" : ""}` : null,
    });
    c.events++;
    if (b.status !== "Atcelta" && costs?.exact) {
      c.spent += costs.total;
      c.plusVat ||= costs.plusVat;
    }
    if (date > c.last) c.last = date;
  }

  for (const o of (offerRows ?? []) as OfferRow[]) {
    const key = `c:${clientKey(o.client_name)}`;
    const c = get(key, {
      key,
      name: o.client_name?.trim() || "—",
      business: true,
      contact: o.contact_person,
      phone: null,
      email: o.contact_email,
    });
    const date = (o.offer_date ?? o.created_at ?? "").slice(0, 10);
    c.entries.push({
      date,
      type: "offer",
      title: o.title + (o.services ? ` — ${o.services.split("\n").filter(Boolean).join(", ")}` : ""),
      status: o.status ?? "Piedāvājums",
      tone: statusTone(o.status),
      amount: o.price,
      href: `/admin/piedavajumi/${o.id}`,
    });
    c.offers++;
    if (date > c.last) c.last = date;
  }

  const term = q.trim().toLowerCase();
  const list = [...clients.values()]
    .filter((c) => (kind === "visi" ? true : kind === "uznemumi" ? c.business : !c.business))
    .filter((c) => !term || [c.name, c.contact, c.email, c.phone].some((x) => x?.toLowerCase().includes(term)))
    .sort((a, b) => b.last.localeCompare(a.last));
  for (const c of list) c.entries.sort((a, b) => b.date.localeCompare(a.date));

  const href = (k: Kind) => `/admin/klientu-vesture?${new URLSearchParams({ ...(q ? { q } : {}), v: k })}`;

  return (
    <>
      <PageHeader
        title="Klientu vēsture"
        description="Katram klientam — visi pasākumi un piedāvājumi. Pirms jauna piedāvājuma pārbaudiet, kas jau ir bijis."
        actions={
          <Link href="/admin/piedavajumi" className={adminSecondary}>
            Piedāvājumi
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <form className="flex min-w-60 flex-1 gap-2">
          {kind !== "visi" && <input type="hidden" name="v" value={kind} />}
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input name="q" defaultValue={q} placeholder="Meklēt klientu, kontaktpersonu, e-pastu vai telefonu" className={`${adminInput} pl-9`} />
          </label>
          <button className={adminSecondary}>Meklēt</button>
        </form>
        <div className="flex gap-1.5">
          {([["visi", "Visi"], ["uznemumi", "Uzņēmumi un iestādes"], ["privati", "Privātpersonas"]] as [Kind, string][]).map(([k, l]) => (
            <Link
              key={k}
              href={href(k)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-semibold ring-1",
                k === kind ? "bg-ink text-white ring-ink" : "bg-white text-ink-soft ring-line hover:text-ink",
              )}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-soft">{list.length} klienti</p>

      <ul className="mt-3 space-y-3">
        {list.length === 0 && <li className="rounded-2xl bg-white p-6 text-sm text-ink-soft ring-1 ring-line">Nekas netika atrasts.</li>}
        {list.map((c) => (
          <li key={c.key} className="rounded-2xl bg-white ring-1 ring-line">
            <details className="group">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", c.business ? "bg-ink text-brand" : "bg-brand-soft")}>
                  {c.business ? <Building2 className="size-4" aria-hidden /> : <User className="size-4" aria-hidden />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{c.name}</span>
                  <span className="block truncate text-sm text-ink-soft">
                    {[c.contact, c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>
                    <span className="text-ink-soft">Pasākumi </span>
                    <b>{c.events}</b>
                  </span>
                  <span>
                    <span className="text-ink-soft">Piedāvājumi </span>
                    <b>{c.offers}</b>
                  </span>
                  {c.spent > 0 && (
                    <span>
                      <span className="text-ink-soft">Kopā </span>
                      <b>{eur(c.spent)}{c.plusVat ? " + PVN" : ""}</b>
                    </span>
                  )}
                  <span>
                    <span className="text-ink-soft">Pēdējais </span>
                    <b>{lvDate(c.last) || "—"}</b>
                  </span>
                </span>
              </summary>
              <div className="border-t border-line p-4 sm:p-5">
                <ul className="space-y-2">
                  {c.entries.map((e, i) => {
                    const body = (
                      <>
                        <span className="text-sm text-ink-soft">{lvDate(e.date) || "—"}</span>
                        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                          {e.type === "event" ? (
                            <CalendarCheck className="size-4 shrink-0 text-ink-soft" aria-label="Pasākums" />
                          ) : (
                            <FileText className="size-4 shrink-0 text-ink-soft" aria-label="Piedāvājums" />
                          )}
                          <span className="min-w-0">{e.title}</span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-sm">
                          {e.amount && <b>{e.amount}</b>}
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-transparent", e.tone)}>{e.status}</span>
                        </span>
                      </>
                    );
                    const cls = "grid gap-x-4 gap-y-1 rounded-xl bg-surface p-3 md:grid-cols-[100px_minmax(0,1fr)_auto]";
                    return (
                      <li key={i}>
                        {e.href ? (
                          <Link href={e.href} className={cn(cls, "hover:ring-1 hover:ring-ink")}>{body}</Link>
                        ) : (
                          <div className={cls}>{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {c.business && (
                  <Link
                    href={`/admin/piedavajumi/jauns?klients=${encodeURIComponent(c.name)}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-brand decoration-2 underline-offset-4"
                  >
                    <Plus className="size-3.5" aria-hidden /> Jauns piedāvājums šim klientam
                  </Link>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
