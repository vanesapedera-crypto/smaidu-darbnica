import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s · Administrēšana", default: "Administrēšana" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface text-ink">{children}</div>;
}
