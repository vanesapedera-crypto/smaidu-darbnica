import VenueView from "@/components/site/VenueView";
import { VENUE_PRICE } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateMetadata() {
  return pageMetadata({
    path: "/telpu-noma",
    title: "Telpu noma svētkiem Tukumā",
    description: `Telpu noma bērnu dzimšanas dienām un ģimenes svētkiem Tukumā: bumbu baseins, rotaļu istaba, disko zāle un virtuve. No ${VENUE_PRICE.weekday} € par 3 stundām.`,
  });
}

/**
 * Izkārtojums (sk. VenueView):
 *  "kartite" — apraksts + tumša cenu kartīte blakus;
 *  "bento"   — foto režģis + cenu josla;
 *  "cilnes"  — viss cilnēs (Telpas · Cenas · Noteikumi · Foto).
 */
const LAYOUT = "bento" as const;

export default async function VenuePage() {
  return <VenueView variant={LAYOUT} />;
}
