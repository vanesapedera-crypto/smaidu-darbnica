/** Ievieto Schema.org JSON-LD. `<` tiek aizstāts, lai saturs nevarētu aizvērt <script> tagu. */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
