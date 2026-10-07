import ShowsView from "@/components/site/ShowsView";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    path: "/izrades",
    title: "Izrādes bērniem un ģimenēm",
    description:
      "Interaktīvas Ziemassvētku un tematiskās izrādes uzņēmumu pasākumiem, pašvaldību svētkiem, skolām un bērnudārziem visā Latvijā. Noskatieties video.",
  });
}

export default async function ShowsPage() {
  return <ShowsView />;
}
