import { getT, setLocale } from "@/lib/i18n/server";
import { asLocale } from "@/lib/i18n/config";
import RichText from "@/components/site/RichText";
import { Container, Section } from "@/components/site/ui";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  return pageMetadata({
    path: "/privatuma-politika",
    title: t("Privātuma politika"),
    description: t("Kā Smaidu Darbnīca apstrādā un aizsargā pieteikuma formās iesniegtos personas datus."),
  });
}

/*
 * Pamata privātuma politikas teksts. Pirms publicēšanas ieteicams to pārskatīt
 * ar juristu vai datu aizsardzības speciālistu.
 */
export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const t = getT();
  setLocale(asLocale((await params).lang));
  const { contact } = await getSettings();
  const legal = [contact.legalName || contact.company, contact.regNr && `${t("reģ. nr.")} ${contact.regNr}`, contact.legalAddress && `${t("juridiskā adrese:")} ${contact.legalAddress}`]
    .filter(Boolean)
    .join(", ");
  const text = t(
    "Šī politika apraksta, kā {legal} (Smaidu Darbnīca, {address}, {city}), apstrādā personas datus, ko iesniedzat mājaslapas formās.\n\n## Kādus datus apstrādājam\n- Vārdu, uzvārdu, amatu un uzņēmuma nosaukumu\n- Telefona numuru un e-pasta adresi\n- Informāciju par pasākumu: datumu, vietu, dalībnieku skaitu un jūsu komentārus\n\n## Kādam nolūkam\nDatus izmantojam tikai, lai atbildētu uz jūsu pieprasījumu, sagatavotu piedāvājumu, noslēgtu līgumu un organizētu pasākumu. Datus neizmantojam reklāmai bez jūsu atsevišķas piekrišanas un nenododam trešajām personām, izņemot pakalpojumu sniedzējus, kas nodrošina mājaslapas un datubāzes darbību.\n\n## Tiesiskais pamats\nDatu apstrāde notiek, pamatojoties uz jūsu piekrišanu un pasākumiem pirms līguma noslēgšanas (VDAR 6. panta 1. punkta a) un b) apakšpunkts).\n\n## Cik ilgi glabājam datus\nPieteikumu datus glabājam ne ilgāk kā 3 gadus pēc pēdējās saziņas vai tik ilgi, cik to nosaka normatīvie akti grāmatvedības dokumentiem.\n\n## Jūsu tiesības\nJums ir tiesības pieprasīt piekļuvi saviem datiem, to labošanu vai dzēšanu, kā arī atsaukt piekrišanu. Rakstiet mums uz **{email}**. Ja uzskatāt, ka jūsu tiesības ir pārkāptas, varat vērsties Datu valsts inspekcijā.\n\n## Sīkdatnes\nMājaslapa izmanto tikai tehniski nepieciešamās sīkdatnes. Karte kontaktu lapā tiek ielādēta no Google Maps, kas var izmantot savas sīkdatnes.",
    { legal, address: contact.address, city: contact.city, email: contact.email },
  );

  return (
    <Section className="pt-14 md:pt-20">
      <Container className="max-w-3xl">
        <p className="eyebrow">{t("Dokumenti")}</p>
        <h1 className="display mt-5 text-4xl md:text-5xl">{t("Privātuma politika")}</h1>
        <div className="mt-10">
          <RichText text={text} />
        </div>
      </Container>
    </Section>
  );
}
