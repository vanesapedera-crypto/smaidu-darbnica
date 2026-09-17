"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const transparentPages = ["/", "/par-mums"];

  const transparentNavbar =
    transparentPages.includes(pathname) && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparentNavbar
          ? "bg-transparent"
          : "bg-white/95 backdrop-blur-xl shadow-lg"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        {/* Logo */}

        <Link href="/">
          <Image
            src="/images/programs/logo.jpg"
            alt="Smaidu Darbnīca"
            width={220}
            height={80}
            priority
            className="h-16 w-auto"
          />
        </Link>

        {/* Menu */}

        <nav
          className={`hidden md:flex items-center gap-8 font-medium ${
            transparentNavbar ? "text-white" : "text-gray-900"
          }`}
        >
          <Link href="/" className="transition hover:text-yellow-400">
            Sākums
          </Link>

          <Link
            href="/programmas"
            className="transition hover:text-yellow-400"
          >
            Programmas
          </Link>

          <Link
            href="/uznemumiem"
            className="transition hover:text-yellow-400"
          >
            Pasākumiem
          </Link>

          <Link
            href="/telpu-noma"
            className="transition hover:text-yellow-400"
          >
            Telpu noma
          </Link>

          <Link
            href="/par-mums"
            className="transition hover:text-yellow-400"
          >
            Par mums
          </Link>

          <Link
            href="/kontakti"
            className="transition hover:text-yellow-400"
          >
            Kontakti
          </Link>
        </nav>

        {/* CTA */}

        <Link
          href="/pieteikt"
          className="rounded-full bg-yellow-400 px-6 py-3 font-semibold text-black shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-yellow-300"
        >
          Rezervēt
        </Link>
      </div>
    </header>
  );
}