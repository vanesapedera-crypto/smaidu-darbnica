"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileStack, FileText, Handshake, History, Inbox, KeyRound, UserCog } from "lucide-react";
import type { TeamRole } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Inbox; exact?: boolean; roles?: TeamRole[] };
type Group = { title: string; items: Item[]; roles?: TeamRole[] };

const MANAGERS: TeamRole[] = ["owner", "manager"];
const OWNER: TeamRole[] = ["owner"];

// `roles` — kam grupa/sadaļa redzama (bez tā — visiem).
// Sadaļas "Lapas", "Saturs" un "Meklētājiem" izvēlnē nav (2026-11-07): saturu Vanesa maina kodā.
// Pašas lapas paliek (/admin/iestatijumi/*, /admin/programmas u.c.) — tās var atvērt pēc adreses.
const groups: Group[] = [
  {
    title: "Pieteikumi",
    items: [
      { href: "/admin", label: "Pieteikumi", icon: Inbox, exact: true, roles: OWNER },
      { href: "/admin/rezervacijas", label: "Pieteikumi", icon: Inbox, roles: ["manager"] },
      { href: "/admin/kalendars", label: "Kalendārs", icon: CalendarDays },
    ],
  },
  {
    title: "Komanda",
    items: [
      { href: "/admin/scenariji", label: "Izrāžu scenāriji", icon: FileText },
      { href: "/admin/piedavajumi", label: "Piedāvājumi", icon: Handshake, roles: MANAGERS },
      { href: "/admin/klientu-vesture", label: "Klientu vēsture", icon: History, roles: MANAGERS },
      { href: "/admin/standarta-piedavajumi", label: "Standarta piedāvājumi", icon: FileStack },
      { href: "/admin/komandas-piekluve", label: "Komandas piekļuve", icon: UserCog, roles: OWNER },
      { href: "/admin/parole", label: "Mainīt paroli", icon: KeyRound },
    ],
  },
];

export default function AdminNav({ role }: { role: TeamRole }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Paneļa navigācija" className="overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-4">
      <div className="flex gap-1 lg:block lg:space-y-5">
        {groups
          .filter((g) => !g.roles || g.roles.includes(role))
          .map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) }))
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
