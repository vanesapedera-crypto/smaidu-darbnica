import { galleryCategories } from "@/lib/content/media";
import manifest from "@/data/media.json";
import {
  emptyClient,
  emptyGalleryImage,
  emptyPageSeo,
  emptyService,
  emptyTeamMember,
  emptyTestimonial,
} from "@/lib/content/empty";
import type { FieldDef } from "./fields";

/**
 * Administrējamo satura veidu apraksts. Viena konfigurācija nosaka
 * tabulu, saraksta kolonnas un rediģēšanas formu — jaunu satura veidu
 * var pievienot, neveidojot jaunas lapas.
 */

export type EntityKey = "pakalpojumi" | "galerija" | "atsauksmes" | "klienti" | "komanda" | "seo";

export type EntityConfig = {
  key: EntityKey;
  table: string;
  title: string;
  singular: string;
  description: string;
  empty: object;
  fields: FieldDef[];
  /** Kolonna saraksta virsrakstam un apakšvirsrakstam */
  listTitle: string;
  listSubtitle?: string;
  listImage?: string;
  order: { column: string; ascending?: boolean }[];
  /** Lauks, no kura automātiski veidot slug, ja tas nav norādīts */
  slugFrom?: string;
};

const categoryOptions = Object.entries(galleryCategories).map(([value, label]) => ({ value, label }));
export const albumOptions = manifest.albums.map((a) => ({ value: a.slug, label: a.title }));

const published: FieldDef = { name: "published", label: "Publicēts (redzams mājaslapā)", type: "checkbox" };
const sort: FieldDef = { name: "sort", label: "Secība", type: "number", help: "Mazāks skaitlis — augstāk sarakstā" };

export const entities: Record<EntityKey, EntityConfig> = {
  pakalpojumi: {
    key: "pakalpojumi",
    table: "services",
    title: "Pakalpojumi",
    singular: "pakalpojums",
    description: "Uzņēmumu pakalpojumi un bērnu ballīšu programmas. Katram ir sava lapa mājaslapā.",
    empty: emptyService,
    listTitle: "title",
    listSubtitle: "audience",
    listImage: "hero_image",
    order: [{ column: "audience" }, { column: "sort" }],
    slugFrom: "title",
    fields: [
      { name: "title", label: "Nosaukums", type: "text", required: true },
      { name: "slug", label: "URL adrese (slug)", type: "text", help: "Piem. komandas-saliedesana. Ja tukšs — izveidosies no nosaukuma." },
      {
        name: "audience",
        label: "Sadaļa",
        type: "select",
        options: [
          { value: "business", label: "Uzņēmumiem (/uznemumiem)" },
          { value: "private", label: "Izklaides programmas (/izklaides-programmas)" },
        ],
      },
      {
        name: "icon",
        label: "Ikona",
        type: "select",
        options: ["Users", "Trophy", "Building2", "Sun", "TreePine", "Palette", "Dices", "Sparkles", "Brush", "Baby", "Drama", "PartyPopper"].map(
          (v) => ({ value: v, label: v }),
        ),
      },
      { name: "hero_image", label: "Galvenā fotogrāfija", type: "image", wide: true },
      { name: "excerpt", label: "Īss apraksts", type: "textarea", rows: 3, wide: true, help: "Kartītēm un meta aprakstam (~150 rakstzīmes)" },
      { name: "intro", label: "Ievads", type: "textarea", rows: 3, wide: true },
      {
        name: "body",
        label: "Apraksts",
        type: "textarea",
        rows: 10,
        wide: true,
        help: "Tukša rinda = jauna rindkopa. “## Virsraksts”, “- saraksta punkts”, **treknraksts**.",
      },
      { name: "highlights", label: "Priekšrocības / kas iekļauts", type: "lines", rows: 5, help: "Viens punkts rindā" },
      { name: "suitable_for", label: "Kam piemērots", type: "lines", rows: 5, help: "Viens punkts rindā" },
      { name: "activities", label: "Programmas gaita", type: "pairs", rows: 7, wide: true, help: "Katrā rindā: Virsraksts | apraksts" },
      { name: "duration", label: "Ilgums", type: "text" },
      { name: "participants", label: "Dalībnieku skaits", type: "text" },
      { name: "age", label: "Vecums", type: "text" },
      {
        name: "pricing",
        label: "Cenrādis",
        type: "pricing",
        rows: 7,
        wide: true,
        help: "“## Grupas nosaukums”, zem tās rindas: Etiķete | 135. Bērnu ballītēm no šī tiek rēķināta aptuvenā cena formā.",
      },
      { name: "pricing_note", label: "Piezīme par cenu", type: "textarea", rows: 2, wide: true },
      { name: "faq", label: "Biežāk uzdotie jautājumi", type: "faq", rows: 5, wide: true, help: "Katrā rindā: Jautājums | Atbilde" },
      { name: "albums", label: "Galerijas albumi šai lapai", type: "albums", wide: true, options: albumOptions },
      {
        name: "seasons",
        label: "Sezona lapā “Uzņēmumiem”",
        type: "albums",
        options: [
          { value: "ziema", label: "Ziemassvētku piedāvājumi" },
          { value: "vasara", label: "Vasaras piedāvājumi" },
          { value: "visu-gadu", label: "Visu gadu" },
        ],
        help: "Tikai uzņēmumu pakalpojumiem. Var atzīmēt vairākas.",
      },
      { name: "seo_title", label: "SEO virsraksts", type: "text", help: "Ja tukšs — tiek izmantots nosaukums" },
      { name: "seo_description", label: "SEO apraksts", type: "textarea", rows: 2, help: "Ja tukšs — tiek izmantots īsais apraksts" },
      sort,
      published,
    ],
  },

  galerija: {
    key: "galerija",
    table: "gallery_images",
    title: "Foto",
    singular: "attēls",
    description: "Fotogrāfijas katras sadaļas fotolentēm (pēc kategorijas) un pakalpojumu lapām (pēc albuma). Attēli tiek automātiski optimizēti.",
    empty: emptyGalleryImage,
    listTitle: "alt",
    listSubtitle: "album",
    listImage: "src",
    order: [{ column: "album" }, { column: "sort" }],
    fields: [
      { name: "src", label: "Attēls", type: "image", required: true, wide: true },
      { name: "alt", label: "Apraksts (alt teksts)", type: "text", wide: true, help: "Īss apraksts, ko redz meklētāji un ekrāna lasītāji" },
      { name: "category", label: "Kategorija", type: "select", options: categoryOptions },
      { name: "album", label: "Albums", type: "text", help: "Piem. ziemassvetki-2025. Pēc albuma attēli tiek piesaistīti pakalpojumiem." },
      sort,
      published,
    ],
  },

  atsauksmes: {
    key: "atsauksmes",
    table: "testimonials",
    title: "Atsauksmes",
    singular: "atsauksme",
    description: "Klientu atsauksmes sākumlapā. Publicējiet tikai ar klienta atļauju.",
    empty: emptyTestimonial,
    listTitle: "author",
    listSubtitle: "company",
    order: [{ column: "sort" }],
    fields: [
      { name: "text", label: "Atsauksme", type: "textarea", rows: 5, required: true, wide: true },
      { name: "author", label: "Vārds, uzvārds", type: "text", required: true },
      { name: "role", label: "Amats", type: "text" },
      { name: "company", label: "Uzņēmums / iestāde", type: "text" },
      { name: "logo", label: "Logo (nav obligāts)", type: "image" },
      sort,
      published,
    ],
  },

  klienti: {
    key: "klienti",
    table: "clients",
    title: "Klienti",
    singular: "klients",
    description: "Uzņēmumu logotipi slīdošajā joslā. Bez logo tiek rādīts nosaukums.",
    empty: emptyClient,
    listTitle: "name",
    listImage: "logo",
    order: [{ column: "sort" }],
    fields: [
      { name: "name", label: "Nosaukums", type: "text", required: true },
      { name: "url", label: "Mājaslapa", type: "text" },
      { name: "logo", label: "Logo (PNG vai SVG ar caurspīdīgu fonu)", type: "image", wide: true },
      sort,
      published,
    ],
  },

  komanda: {
    key: "komanda",
    table: "team_members",
    title: "Komanda",
    singular: "komandas biedrs",
    description: "Komanda lapā “Par mums”.",
    empty: emptyTeamMember,
    listTitle: "name",
    listSubtitle: "role",
    listImage: "photo",
    order: [{ column: "sort" }],
    fields: [
      { name: "name", label: "Vārds", type: "text", required: true },
      { name: "role", label: "Loma", type: "text" },
      { name: "photo", label: "Fotogrāfija", type: "image", wide: true },
      { name: "bio", label: "Apraksts", type: "textarea", rows: 3, wide: true },
      sort,
      published,
    ],
  },

  seo: {
    key: "seo",
    table: "page_seo",
    title: "SEO lapām",
    singular: "SEO ieraksts",
    description:
      "Pēc noklusējuma virsraksti un apraksti tiek ģenerēti automātiski. Šeit tos var pārrakstīt konkrētai lapai.",
    empty: emptyPageSeo,
    listTitle: "path",
    listSubtitle: "title",
    order: [{ column: "path" }],
    fields: [
      { name: "path", label: "Lapas adrese", type: "text", required: true, help: "Piem. / vai /pakalpojumi/komandas-saliedesana" },
      { name: "title", label: "Virsraksts (title)", type: "text", wide: true, help: "~50–60 rakstzīmes. Zīmola nosaukums tiek pievienots automātiski." },
      { name: "description", label: "Apraksts (meta description)", type: "textarea", rows: 3, wide: true, help: "~150–160 rakstzīmes" },
      { name: "og_image", label: "Attēls sociālajiem tīkliem", type: "image", wide: true },
      { name: "noindex", label: "Neindeksēt meklētājos", type: "checkbox" },
    ],
  },
};

export function getEntity(key: string): EntityConfig | undefined {
  return entities[key as EntityKey];
}
