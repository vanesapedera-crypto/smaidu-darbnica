"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { businessHref, cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { ServiceIcon } from "./icons";

type NavService = { slug: string; title: string; icon: string };



export default function Navbar({ services, phone }: { services: NavService[]; phone: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);

  // Aizver mobilo izvēlni pēc navigācijas (stāvokļa atjaunošana renderēšanas laikā, bez efekta)
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));
  const tel = `tel:${phone.replace(/\s/g, "")}`;
  // Lapas augšā izvēlne saplūst ar galveni: sākumlapā tā ir tumša, pārējās lapās — gaiša
  const dark = pathname === "/" && !scrolled && !open;

  return (
    // Ritinot izvēlne kļūst balta ar ēnu
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,color] duration-300",
        scrolled || open
          ? "bg-white shadow-[0_1px_0_rgba(26,24,22,0.08),0_10px_30px_-18px_rgba(26,24,22,0.35)]"
          : dark
            ? "bg-ink text-white"
            : "bg-surface",
      )}
    >
      <a href="#saturs" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:font-bold focus:text-white">
        Pāriet uz saturu
      </a>

      <nav aria-label="Galvenā navigācija" className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link href="/" className="shrink-0" aria-label="Smaidu Darbnīca — sākumlapa">
          <Image
            src={dark ? "/brand/logo-light.svg" : "/brand/logo-dark.svg"}
            alt="Smaidu Darbnīca"
            width={489}
            height={291}
            loading="eager"
            className="h-11 w-auto lg:h-12"
          />
        </Link>

        <ul className="hidden items-center gap-0.5 xl:flex">
          {NAV.map((l) =>
            l.href === "/uznemumiem" ? (
              <li key={l.href} className="group relative">
                <Link href={l.href} aria-haspopup="true" className={cn(linkClass, isActive(l.href) && activeClass)}>
                  {l.label}
                  <ChevronDown className="size-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180" aria-hidden />
                </Link>
                {/* Uzņēmumu pakalpojumi (atveras ar peli vai tastatūru) */}
                <div className="invisible absolute top-full left-1/2 w-[640px] -translate-x-1/2 translate-y-2 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <ul className="grid grid-cols-2 gap-1 rounded-3xl bg-white p-3 text-ink shadow-2xl ring-1 shadow-ink/15 ring-line">
                    {services.map((s) => (
                      <li key={s.slug}>
                        <Link href={businessHref(s.slug)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors hover:bg-brand">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink text-brand">
                            <ServiceIcon name={s.icon} className="size-4" />
                          </span>
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ) : (
              <li key={l.href}>
                <Link href={l.href} className={cn(linkClass, isActive(l.href) && activeClass)}>
                  {l.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            href="/kontakti#pieprasijums"
            className={cn(
              "inline-flex h-12 items-center rounded-full px-5 text-sm font-extrabold whitespace-nowrap transition-colors",
              dark ? "bg-brand text-ink hover:bg-brand-strong" : "bg-ink text-white hover:bg-black",
            )}
          >
            Pieprasīt piedāvājumu
          </Link>
        </div>

        <button
          type="button"
          className={cn("grid size-12 place-items-center rounded-full xl:hidden", dark ? "bg-white/10 text-white" : "bg-ink text-white")}
          aria-expanded={open}
          aria-controls="mobila-izvelne"
          aria-label={open ? "Aizvērt izvēlni" : "Atvērt izvēlni"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobilā izvēlne */}
      <div id="mobila-izvelne" hidden={!open} className="fixed inset-x-0 top-18 bottom-0 overflow-y-auto bg-paper px-4 pt-6 pb-10 sm:px-6 lg:top-20 xl:hidden">
        <ul className="space-y-1">
          {NAV.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className="flex items-center justify-between rounded-2xl px-3 py-3 font-display text-2xl font-extrabold uppercase aria-[current=page]:bg-ink aria-[current=page]:text-brand"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 mb-2 px-3 text-xs font-extrabold tracking-[0.14em] uppercase">Pakalpojumi uzņēmumiem</p>
        <ul className="grid gap-1 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug}>
              <Link href={businessHref(s.slug)} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold">
                <ServiceIcon name={s.icon} className="size-4.5 shrink-0" />
                {s.title}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 grid gap-3">
          <Link href="/kontakti#pieprasijums" className="flex h-14 items-center justify-center rounded-full bg-ink font-extrabold text-white">
            Pieprasīt piedāvājumu
          </Link>
          <a href={tel} className="flex h-14 items-center justify-center gap-2 rounded-full border-2 border-ink font-extrabold">
            <Phone className="size-4" aria-hidden /> {phone}
          </a>
        </div>
      </div>
    </header>
  );
}

const linkClass =
  "relative flex items-center gap-1 rounded-full px-2.5 py-2 text-[12.5px] font-extrabold tracking-[0.04em] uppercase whitespace-nowrap transition-colors hover:bg-current/[0.08] 2xl:px-3.5 2xl:text-[13px]";
const activeClass = "after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-[3px] after:rounded-full after:bg-current";
