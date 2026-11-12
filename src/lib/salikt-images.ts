/**
 * Bildes no public/media/salikt — ja darbnīcai, aktivitātei vai izrādei panelī nav savas bildes,
 * to izvēlas pēc nosaukuma (piem. "Sejas apgleznošana" → sejas-apgleznosana.webp).
 * Lieto lapā "Salikt piedāvājumu" un tās informācijas lapās.
 */
const KEYWORD_IMAGES: [RegExp, string][] = [
  [/piparkūk/i, "piparkukas"],
  [/sejas|sejiņ/i, "sejas-apgleznosana"],
  [/glit/i, "glitera-tetovejumi"],
  [/mirdz/i, "mirdzumins"],
  [/burbu/i, "burbuli"],
  [/putu/i, "putu-ballite"],
  [/slaim/i, "slaims"],
  [/eksperiment|pētniek/i, "eksperimenti"],
  [/virtu|donut/i, "virtuli"],
  [/cepum/i, "cepumu-apgleznosana"],
  [/keks|kēks|kūciņ/i, "keksini"],
  [/zobeni/i, "kroni-zils"],
  [/kroņ|kroni/i, "kroni"],
  [/piesprau/i, "piespraudes"],
  [/olaf/i, "olafs"],
  [/balon/i, "tels-baloni"],
  [/tēl/i, "tels-suns"],
  [/vadīt|vadītāj|organiz/i, "pasakuma-vaditaja"],
  [/lent|deju|kustīb/i, "lentes"],
  [/apglezno|krāso|tekstil|maisiņ|krekl|nospied/i, "apgleznosana"],
  [/egl|ziemassvētk/i, "egles-iedegsana"],
];
export const fallbackImage = (title: string) => {
  const hit = KEYWORD_IMAGES.find(([re]) => re.test(title));
  return hit ? `/media/salikt/${hit[1]}.webp` : null;
};
