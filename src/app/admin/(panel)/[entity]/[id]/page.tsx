import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getEntity } from "@/lib/admin/entities";
import { serialize } from "@/lib/admin/fields";
import { toRow } from "@/lib/content/mappers";
import { deleteEntity, saveEntity } from "../../../actions";
import AdminForm from "@/components/admin/AdminForm";
import DeleteButton from "@/components/admin/DeleteButton";
import PageHeader from "@/components/admin/PageHeader";
import ProgramImages from "@/components/admin/ProgramImages";
import { manifestGallery } from "@/lib/content/media";
import { adminSecondary } from "@/components/admin/styles";

type Props = { params: Promise<{ entity: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { entity, id } = await params;
  const config = getEntity(entity);
  return { title: `${id === "jauns" ? "Jauns" : "Labot"} ${config?.singular ?? "ierakstu"}` };
}

export default async function EntityEditPage({ params }: Props) {
  const { entity: key, id } = await params;
  const entity = getEntity(key);
  if (!entity) notFound();

  const { db } = await requireAdmin();
  const isNew = id === "jauns";

  let row: Record<string, unknown> = toRow(entity.empty as Record<string, unknown>);
  if (!isNew) {
    const { data } = await db.from(entity.table).select("*").eq("id", id).maybeSingle();
    if (!data) notFound();
    row = data;
  }

  // Datubāzes vērtības → formas teksts
  const values = Object.fromEntries(
    entity.fields.map((f) => {
      const v = row[f.name];
      if (f.type === "checkbox") return [f.name, v === true];
      if (f.type === "albums") return [f.name, Array.isArray(v) ? (v as string[]) : []];
      return [f.name, serialize(f.type, v)];
    }),
  );

  // Saite uz publisko lapu (pakalpojumiem)
  const publicUrl =
    key === "pakalpojumi" && !isNew
      ? `/${row.audience === "private" ? "izklaides-programmas" : "uznemumiem"}/${row.slug}`
      : null;

  // Izklaides programmām — attēlu bloks (albums ar programmas adresi; ja datubāzē nav — projekta bildes, tikai apskatei)
  let programImages: { id?: string; src: string }[] | null = null;
  if (key === "pakalpojumi" && !isNew && row.audience === "private" && row.slug) {
    const slug = String(row.slug);
    const { data: imgs } = await db.from("gallery_images").select("id, src").eq("album", slug).order("sort").order("created_at");
    programImages = imgs?.length ? imgs : manifestGallery().filter((g) => g.album === slug).map((g) => ({ src: g.src }));
  }

  return (
    <>
      <Link href={`/admin/${key}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {entity.title}
      </Link>
      <PageHeader
        title={isNew ? `Jauns ${entity.singular}` : String(row[entity.listTitle] || `Labot ${entity.singular}`)}
        actions={
          <>
            {publicUrl && (
              <Link href={publicUrl} target="_blank" className={adminSecondary}>
                Skatīt lapu <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            )}
            {!isNew && <DeleteButton action={deleteEntity.bind(null, key, id)} />}
          </>
        }
      />
      <div className="mt-6 max-w-4xl">
        <AdminForm
          fields={entity.fields}
          values={values}
          action={saveEntity.bind(null, key, isNew ? null : id)}
          folder={key}
        />
        {programImages && (
          <div className="mt-6">
            <ProgramImages slug={String(row.slug)} title={String(row.title ?? "")} images={programImages} />
          </div>
        )}
      </div>
    </>
  );
}
