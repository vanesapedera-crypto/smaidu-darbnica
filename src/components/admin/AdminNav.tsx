"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Clapperboard,
  Contact,
  DoorOpen,
  Globe,
  Handshake,
  House,
  Images,
  Inbox,
  Info,
  LayoutDashboard,
  PartyPopper,
  Search,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Secība un nosaukumi — tādi paši kā mājaslapas izvēlnē
const groups = [
  {
    title: "Pieteikumi",
    items: [{ href: "/admin", label: "Pieteikumi", icon: Inbox, exact: true }],
  },
  {
    title: "Lapas",
    items: [
      { href: "/admin/iestatijumi/home", label: "Sākums", icon: House },
      { href: "/admin/iestatijumi/about", label: "Par mums", icon: Info },
      { href: "/admin/iestatijumi/business", label: "Uzņēmumiem", icon: Building2 },
      { href: "/admin/iestatijumi/shows", label: "Izrādes", icon: Clapperboard },
      { href: "/admin/iestatijumi/programs", label: "Izklaides programmas", icon: PartyPopper },
      { href: "/admin/iestatijumi/venue", label: "Telpu noma", icon: DoorOpen },
      { href: "/admin/iestatijumi/contact", label: "Kontakti", icon: Contact },
    ],
  },
  {
    title: "Saturs",
    items: [
      { href: "/admin/pakalpojumi", label: "Pakalpojumi", icon: LayoutDashboard },
      { href: "/admin/komanda", label: "Komanda", icon: UsersRound },
      { href: "/admin/klienti", label: "Klienti", icon: Handshake },
      { href: "/admin/galerija", label: "Foto", icon: Images },
    ],
  },
  {
    title: "Meklētājiem",
    items: [
      { href: "/admin/iestatijumi/seo", label: "SEO iestatījumi", icon: Globe },
      { href: "/admin/seo", label: "SEO lapām", icon: Search },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Paneļa navigācija" className="overflow-x-auto px-3 pb-3 lg:min-h-0 lg:flex-1 lg:overflow-x-visible lg:overflow-y-auto lg:pb-4">
      <div className="flex gap-1 lg:block lg:space-y-5">
        {groups.map((g) => (
          <div key={g.title} className="contents lg:block">
            <p className="hidden px-3 pb-2 text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase lg:block">{g.title}</p>
            <ul className="contents lg:block lg:space-y-0.5">
              {g.items.map(({ href, label, icon: Icon, ...rest }) => {
                const active = "exact" in rest ? pathname === href : pathname.startsWith(href);
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
