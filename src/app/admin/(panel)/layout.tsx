import Image from "next/image";
import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";
import AdminNav from "@/components/admin/AdminNav";

/**
 * Administrēšanas paneļa izkārtojums. requireAdmin() šeit aizsargā visas
 * paneļa lapas; katra servera darbība pārbauda tiesības atkārtoti.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[250px_1fr]">
      {/* Lielā ekrānā sānjosla ir kolonna: logo augšā, izvēlne pa vidu (ritināma, ja neietilpst), lietotājs apakšā */}
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:block lg:shrink-0 lg:px-5 lg:py-5">
          <Link href="/admin" aria-label="Paneļa sākums">
            <Image src="/brand/logo-dark.svg" alt="Smaidu Darbnīca" width={489} height={291} className="h-10 w-auto lg:h-12" />
          </Link>
          <Link href="/" target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink lg:mt-4">
            Skatīt mājaslapu <ExternalLink className="size-3.5" aria-hidden />
          </Link>
        </div>
        <AdminNav />
        <div className="hidden shrink-0 border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-xs text-ink-soft">{admin.email}</p>
          <form action={logout}>
            <button type="submit" className="mt-2 inline-flex items-center gap-2 text-sm font-semibold hover:text-destructive">
              <LogOut className="size-4" aria-hidden /> Iziet
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        {children}
        <form action={logout} className="mt-10 lg:hidden">
          <button type="submit" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
            <LogOut className="size-4" aria-hidden /> Iziet ({admin.email})
          </button>
        </form>
      </main>
    </div>
  );
}
