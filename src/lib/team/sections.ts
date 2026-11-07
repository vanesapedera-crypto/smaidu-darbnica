/** Paneļa sadaļas, kuras komandas loceklim var ieslēgt ar ķeksīti (sk. migrāciju 20261107120000). */

export const SECTIONS = [
  { key: "rezervacijas", label: "Pieteikumi", hint: "visi pieteikumi — tikai skatīt", href: "/admin/rezervacijas" },
  { key: "kalendars", label: "Kalendārs", hint: "rezervācijas pa dienām, arī telpu noma — tikai skatīt", href: "/admin/kalendars" },
  { key: "piedavajumi", label: "Piedāvājumi", hint: "piedāvājumi klientiem", href: "/admin/piedavajumi" },
  { key: "klientu_vesture", label: "Klientu vēsture", hint: "katra klienta pasākumi un piedāvājumi", href: "/admin/klientu-vesture" },
  { key: "standarta", label: "Standarta piedāvājumi", hint: "gatavu piedāvājumu veidnes", href: "/admin/standarta-piedavajumi" },
  { key: "scenariji", label: "Izrāžu scenāriji", hint: "skatīt un pievienot jaunus", href: "/admin/scenariji" },
  { key: "piekluve", label: "Komandas piekļuve", hint: "var mainīt, kurš ko redz", href: "/admin/komandas-piekluve" },
] as const;

export type Section = (typeof SECTIONS)[number]["key"];
export const ALL_SECTIONS: Section[] = SECTIONS.map((s) => s.key);
export const isSection = (v: unknown): v is Section => ALL_SECTIONS.includes(v as Section);
