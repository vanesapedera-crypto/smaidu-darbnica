import { requireSection } from "@/lib/auth";
import OfferEditor from "@/components/admin/team/OfferEditor";

export const metadata = { title: "Standarta piedāvājums" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saglabats?: string }> };

export default async function TemplatePage({ params, searchParams }: Props) {
  const member = await requireSection("standarta");
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <OfferEditor member={member} kind="template" id={id} query={query} />;
}
