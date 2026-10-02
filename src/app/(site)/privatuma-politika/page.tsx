import RichText from "@/components/site/RichText";
import { Container, Section } from "@/components/site/ui";
import { getSettings } from "@/lib/content/queries";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 86400;

export function generateMetadata() {
  return pageMetadata({
    path: "/privatuma-politika",
    title: "Privātuma politika",
    description: "Kā Smaidu Darbnīca apstrādā un aizsargā pieteikuma formās iesniegtos personas datus.",
  });
}

/*
 * Pamata privātuma politikas teksts. Pirms publicēšanas ieteicams to pārskatīt
 * ar juristu vai datu aizsardzības speciālistu.
 */
export default async function PrivacyPage() {
  const { contact } = await getSettings();
  const legal = [contact.legalName || contact.company, contact.regNr && `reģ. nr. ${contact.regNr}`, contact.legalAddress && `juridiskā adrese: ${contact.legalAddress}`]
    .filter(Boolean)
    .join(", ");
  const text = `Šī politika apraksta, kā ${legal} (Smaidu Darbnīca, ${contact.address}, ${contact.city}), apstrādā personas datus, ko iesniedzat mājaslapas formās.

## Kādus datus apstrādājam
- Vārdu, uzvārdu, amatu un uzņēmuma nosaukumu
- Telefona numuru un e-pasta adresi
- Informāciju par pasākumu: datumu, vietu, dalībnieku skaitu un jūsu komentārus

## Kādam nolūkam
Datus izmantojam tikai, lai atbildētu uz jūsu pieprasījumu, sagatavotu piedāvājumu, noslēgtu līgumu un organizētu pasākumu. Datus neizmantojam reklāmai bez jūsu atsevišķas piekrišanas un nenododam trešajām personām, izņemot pakalpojumu sniedzējus, kas nodrošina mājaslapas un datubāzes darbību.

## Tiesiskais pamats
Datu apstrāde notiek, pamatojoties uz jūsu piekrišanu un pasākumiem pirms līguma noslēgšanas (VDAR 6. panta 1. punkta a) un b) apakšpunkts).

## Cik ilgi glabājam datus
Pieteikumu datus glabājam ne ilgāk kā 3 gadus pēc pēdējās saziņas vai tik ilgi, cik to nosaka normatīvie akti grāmatvedības dokumentiem.

## Jūsu tiesības
Jums ir tiesības pieprasīt piekļuvi saviem datiem, to labošanu vai dzēšanu, kā arī atsaukt piekrišanu. Rakstiet mums uz **${contact.email}**. Ja uzskatāt, ka jūsu tiesības ir pārkāptas, varat vērsties Datu valsts inspekcijā.

## Sīkdatnes
Mājaslapa izmanto tikai tehniski nepieciešamās sīkdatnes. Karte kontaktu lapā tiek ielādēta no Google Maps, kas var izmantot savas sīkdatnes.`;

  return (
    <Section className="pt-14 md:pt-20">
      <Container className="max-w-3xl">
        <p className="eyebrow">Dokumenti</p>
        <h1 className="display mt-5 text-4xl md:text-5xl">Privātuma politika</h1>
        <div className="mt-10">
          <RichText text={text} />
        </div>
      </Container>
    </Section>
  );
}
