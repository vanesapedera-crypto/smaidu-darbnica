import { requireSection } from "@/lib/auth";
import OfferEditor from "@/components/admin/team/OfferEditor";

export const metadata = { title: "Piedāvājums" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ klients?: string; no?: string; saglabats?: string }> };

export default async function OfferPage({ params, searchParams }: Props) {
  const member = await requireSection("piedavajumi");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <OfferEditor member={member} kind="client" id={id} query={query} />;
}
