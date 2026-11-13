import { getT, setLocale } from "@/lib/i18n/server";
import { asLocale } from "@/lib/i18n/config";
import ShowsView from "@/components/site/ShowsView";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  return pageMetadata({
    path: "/izrades",
    title: t("Izrādes bērniem un ģimenēm"),
    description:
      t("Interaktīvas Ziemassvētku un tematiskās izrādes uzņēmumu pasākumiem, pašvaldību svētkiem, skolām un bērnudārziem visā Latvijā. Noskatieties video."),
  });
}

export default async function ShowsPage({ params }: { params: Promise<{ lang: string }> }) {
  setLocale(asLocale((await params).lang));
  return <ShowsView />;
}
