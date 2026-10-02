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

/**
 * Izrāžu bloka izkārtojums (sk. VideoShowcase):
 *  "kino" — tumšs fons, liels video + apraksts zem tā;
 *  "kartites" — trīs kartītes blakus;
 *  "atskanotajs" — viens liels atskaņotājs + izrāžu saraksts.
 */
const LAYOUT = "atskanotajs" as const;

export default async function ShowsPage() {
  return <ShowsView variant={LAYOUT} />;
}
