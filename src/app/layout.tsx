import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/seo";

// Viens mainīga svara fonts ar latīņu paplašināto kopu (ā, č, ē, ģ, ī, ķ, ļ, ņ, š, ū, ž)
const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
});

// Virsrakstu fonts — plats, skatuves plakāta noskaņa
const unbounded = Unbounded({
  subsets: ["latin", "latin-ext"],
  variable: "--font-unbounded",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Smaidu Darbnīca",
    default: "Smaidu Darbnīca — pasākumi uzņēmumiem un pašvaldībām",
  },
  applicationName: "Smaidu Darbnīca",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1a1816",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="lv" className={`${manrope.variable} ${unbounded.variable}`} suppressHydrationWarning>
      <head>
        {/* Ieslēdz parādīšanās animācijas tikai tad, ja darbojas JS (bez tā saturs ir redzams uzreiz) */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-screen bg-paper text-ink">{children}</body>
    </html>
  );
}
