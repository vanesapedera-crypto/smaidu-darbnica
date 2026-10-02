/**
 * Lielformāta spēles (programma "Party Trip", avots: turies.lv/aktivitates/party-trip).
 * `image` — bildes adrese, piem. "/media/speles/jenga.webp" (ja tukšs, kartītē rāda tikai nosaukumu).
 */
export type Game = { name: string; image: string };

export const GAMES: Game[] = [
  { name: "Garās kājas", image: "/media/speles/garas-kajas.jpg" },
  { name: "Jenga", image: "/media/speles/jenga.webp" },
  { name: "Katapulta", image: "/media/speles/katapulta.webp" },
  { name: "Līdzsvara dēlis", image: "/media/speles/lidzsvarudelis.webp" },
  { name: "Limbo", image: "/media/speles/limbo.webp" },
  { name: "Melnais caurums", image: "/media/speles/melnaiscaurums.webp" },
  { name: "Slēpes", image: "/media/speles/slepes.webp" },
  { name: "Smaidiņu cope", image: "/media/speles/smaidinucope.webp" },
  { name: "Veiksmīgais loms", image: "/media/speles/veiksmigaisloms.webp" },
  { name: "Pīļuks pa dambi", image: "/media/speles/pilukspadambi.webp" },
  { name: "Desas", image: "/media/speles/desas.webp" },
  { name: "Tornis", image: "/media/speles/tornis.webp" },
  { name: "Saldumu zeme", image: "/media/speles/saldumuzeme.webp" },
  { name: "Peļu slazds", image: "/media/speles/peuslazds.webp" },
  { name: "Slinkais šoferītis", image: "/media/speles/slinkaissoferitis.webp" },
  { name: "Lielformāta smaidiņš", image: "/media/speles/lielformatasmaidins.webp" },
  { name: "Dambrete", image: "/media/speles/dambrete.webp" },
  { name: "Acenes", image: "/media/speles/acenes.webp" },
  { name: "Bišu šūniņas", image: "/media/speles/bisusuninas.webp" },
  { name: "Bungas", image: "/media/speles/bungas.webp" },
];
