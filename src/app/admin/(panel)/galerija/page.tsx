import Image from "next/image";
import Link from "next/link";
import { isOptimizable } from "@/lib/images";
import { EyeOff } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { galleryCategories } from "@/lib/content/media";
import GalleryUploader from "@/components/admin/GalleryUploader";
import PageHeader from "@/components/admin/PageHeader";
import { cn } from "@/lib/utils";

export const metadata = { title: "Foto" };

type Props = { searchParams: Promise<{ albums?: string; saglabats?: string; dzests?: string }> };

type Row = { id: string; src: string; alt: string; album: string; category: string; published: boolean };

export default async function AdminGalleryPage({ searchParams }: Props) {
  const { albums: selected = "", saglabats, dzests } = await searchParams;
  const { db } = await requireAdmin();

  const { data, error } = await db
    .from("gallery_images")
    .select("id, src, alt, album, category, published")
    .order("album")
    .order("sort");
  const rows = (data ?? []) as Row[];

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.album, (counts.get(r.album) ?? 0) + 1);
  const albums = [...counts.keys()];
  const shown = selected ? rows.filter((r) => r.album === selected) : rows;

  return (
    <>
      <PageHeader
        title="Foto"
        description="Attēli sadaļu fotolentēm (pēc kategorijas) un pakalpojumu lapām (pēc albuma). Noklikšķiniet uz attēla, lai redzētu tā adresi, mainītu aprakstu, kategoriju vai to paslēptu."
        notice={saglabats ? "Attēls saglabāts." : dzests ? "Attēls izdzēsts." : undefined}
      />

      <div className="mt-6">
        <GalleryUploader
          categories={Object.entries(galleryCategories).map(([value, label]) => ({ value, label }))}
          albums={albums}
        />
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
          Neizdevās nolasīt galeriju: {error.message}
        </p>
      )}

      <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
        {[["", `Visi (${rows.length})`], ...albums.map((a) => [a, `${a} (${counts.get(a)})`])].map(([value, label]) => (
          <Link
            key={value || "all"}
            href={value ? `/admin/galerija?albums=${encodeURIComponent(value)}` : "/admin/galerija"}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap",
              selected === value ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:ring-ink",
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {shown.map((r) => (
          <li key={r.id}>
            <Link href={`/admin/galerija/${r.id}`} className="group relative block aspect-square overflow-hidden rounded-xl bg-white ring-1 ring-line">
              <Image
                src={r.src}
                alt={r.alt}
                fill
                sizes="160px"
                quality={60}
                unoptimized={!isOptimizable(r.src)}
                className="object-cover transition group-hover:scale-105"
              />
              {!r.published && (
                <span className="absolute inset-0 grid place-items-center bg-white/70">
                  <EyeOff className="size-5" aria-label="Paslēpts" />
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
