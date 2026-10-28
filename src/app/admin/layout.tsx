import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s · Administrēšana", default: "Administrēšana" },
  robots: { index: false, follow: false },
  // Admin panelis kā lietotne telefonā: "Pievienot sākuma ekrānam" — atveras bez pārlūka joslām (sk. public/admin-app)
  manifest: "/admin-app/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SD Admin", statusBarStyle: "default" },
  icons: { apple: "/admin-app/icon-192.png" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface text-ink">{children}</div>;
}
