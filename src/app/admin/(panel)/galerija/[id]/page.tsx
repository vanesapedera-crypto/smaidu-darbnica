import EntityEditPage from "../../[entity]/[id]/page";

export const metadata = { title: "Labot attēlu" };

// Galerijas attēla rediģēšana izmanto universālo satura formu
export default async function GalleryImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EntityEditPage params={Promise.resolve({ entity: "galerija", id })} />;
}
