"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Handshake, History, Inbox, KeyRound, Palette, UserCog, Calculator, Package } from "lucide-react";
import type { TeamRole } from "@/lib/auth";
import type { Section } from "@/lib/team/sections";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Inbox; exact?: boolean; ownerOnly?: boolean; section?: Section; edit?: boolean };
type Group = { title: string; items: Item[] };

// "Standarta piedāvājumi" pagaidām izvēlnē nav (2026-11-08, lapa /admin/standarta-piedavajumi paliek).
// Sadaļas "Lapas", "Saturs" un "Meklētājiem" izvēlnē nav (2026-11-07): saturu Vanesa maina kodā.
// Pašas lapas paliek (/admin/iestatijumi/*, /admin/programmas u.c.) — tās var atvērt pēc adreses.
// `section` — komandas loceklis punktu redz tikai ar atbilstošo ķeksīti (sk. "Komandas piekļuve").
const groups: Group[] = [
  {
    title: "Pieteikumi",
    items: [
      { href: "/admin", label: "Pieteikumi", icon: Inbox, exact: true, ownerOnly: true },
      { href: "/admin/rezervacijas", label: "Pieteikumi", icon: Inbox, section: "rezervacijas" },
      { href: "/admin/kalendars", label: "Kalendārs", icon: CalendarDays, section: "kalendars" },
    ],
  },
  {
    title: "Komanda",
    items: [
      { href: "/admin/scenariji", label: "Scenāriji", icon: FileText, section: "scenariji" },
      { href: "/admin/piedavajuma-izveide", label: "Piedāvājuma izveide", icon: Calculator, section: "piedavajumi", edit: true },
      { href: "/admin/piedavajumi", label: "Piedāvājumi", icon: Handshake, section: "piedavajumi" },
      { href: "/admin/klientu-vesture", label: "Klientu vēsture", icon: History, section: "klientu_vesture" },
      { href: "/admin/darbnicas", label: "Radošās darbnīcas", icon: Palette, section: "darbnicas" },
      { href: "/admin/izejmateriali", label: "Izejmateriāli", icon: Package, section: "darbnicas" },
      { href: "/admin/komandas-piekluve", label: "Komandas piekļuve", icon: UserCog, section: "piekluve" },
      { href: "/admin/parole", label: "Mainīt paroli", icon: KeyRound },
    ],
  },
];

export default function AdminNav({ role, sections }: { role: TeamRole; sections: Section[] }) {
  const owner = role === "owner";
  const visible = (i: Item) =>
    i.ownerOnly
      ? owner
      : i.href === "/admin/rezervacijas" && owner
        ? false
        : owner || ((!i.section || sections.includes(i.section)) && (!i.edit || role === "manager"));
  const pathname = usePathname();

  return (
    <nav aria-label="Paneļa navigācija" className="overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-4">
      <div className="flex gap-1 lg:block lg:space-y-5">
        {groups
          .map((g) => ({ ...g, items: g.items.filter(visible) }))
          .filter((g) => g.items.length > 0)
          .map((g) => (
          <div key={g.title} className="contents lg:block">
            <p className="hidden px-3 pb-2 text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase lg:block">{g.title}</p>
            <ul className="contents lg:block lg:space-y-0.5">
              {g.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href} className="shrink-0">
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                        active ? "bg-brand text-ink" : "text-ink-soft hover:bg-surface hover:text-ink",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
