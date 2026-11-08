/** Paneļa sadaļas, kuras komandas loceklim var ieslēgt ar ķeksīti (sk. migrāciju 20261107120000). */

export const SECTIONS = [
  { key: "rezervacijas", label: "Pieteikumi", hint: "visi pieteikumi — tikai skatīt", href: "/admin/rezervacijas", hidden: false },
  { key: "kalendars", label: "Kalendārs", hint: "rezervācijas pa dienām, arī telpu noma — tikai skatīt", href: "/admin/kalendars", hidden: false },
  { key: "piedavajumi", label: "Piedāvājumi", hint: "piedāvājumi klientiem", href: "/admin/piedavajumi", hidden: false },
  { key: "klientu_vesture", label: "Klientu vēsture", hint: "uzņēmumi: gads, kas ņemts, samaksa", href: "/admin/klientu-vesture", hidden: false },
  { key: "standarta", label: "Standarta piedāvājumi", hint: "gatavu piedāvājumu veidnes", href: "/admin/standarta-piedavajumi", hidden: true },
  { key: "scenariji", label: "Izrāžu scenāriji", hint: "skatīt un pievienot jaunus", href: "/admin/scenariji", hidden: false },
  { key: "darbnicas", label: "Radošās darbnīcas", hint: "materiālu pašizmaksa vienai personai", href: "/admin/darbnicas", hidden: false },
  { key: "piekluve", label: "Komandas piekļuve", hint: "var mainīt, kurš ko redz", href: "/admin/komandas-piekluve", hidden: false },
] as const;

/** Ķeksīšos rādāmās sadaļas (hidden — pagaidām nelieto) */
export const VISIBLE_SECTIONS = SECTIONS.filter((s) => !s.hidden);

export type Section = (typeof SECTIONS)[number]["key"];
export const ALL_SECTIONS: Section[] = SECTIONS.map((s) => s.key);
export const isSection = (v: unknown): v is Section => ALL_SECTIONS.includes(v as Section);
