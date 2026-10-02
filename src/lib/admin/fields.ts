/**
 * Administrēšanas paneļa formu lauku apraksti un pārveidošana starp
 * formas tekstu un datubāzes vērtībām.
 *
 * Sarežģītākus laukus (sarakstus, cenrāžus, BUJ) rediģē kā vienkāršu tekstu
 * ar skaidru formātu — tas ir ātrāk nekā daudzas atsevišķas ievades rindas
 * un nav vajadzīgs papildu JavaScript.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "checkbox"
  | "select"
  | "image"
  | "lines" //    viena vērtība rindā → string[]
  | "pairs" //    "Virsraksts | apraksts" rindā → { title, description }[]
  | "stats" //    "10+ | gadu pieredze" rindā → { value, label }[]
  | "faq" //      "Jautājums | Atbilde" rindā → { question, answer }[]
  | "pricing" //  "## Grupa" + "Etiķete | 135" → PriceGroup[]
  | "albums" //  izvēles rūtiņas → string[]
  | "videos" //  "Nosaukums | adrese | vāciņa attēls | ilgums | auditorija" rindā → Video[]
  | "photos" //  "adrese | paraksts" rindā → { src, caption }[]
  | "table" //   "a | b | c" rindā → objekti ar `columns` norādītajiem laukiem (piem. { name, image }[])
  | "heading"; // tikai virsraksts formā (sadala garu formu daļās) — neko nesaglabā

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  required?: boolean;
  wide?: boolean;
  rows?: number;
  options?: { value: string; label: string }[];
  /** Laukam "table": objekta lauku nosaukumi kolonnu secībā, piem. ["name", "image"] */
  columns?: string[];
};

/** Vērtība pēc ceļa ar punktiem, piem. "servicePhotos.mazulu-zona" */
export function getPath(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), obj);
}

/** Ieraksta vērtību pēc ceļa ar punktiem (izveido starpobjektus) */
export function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split(".");
  let o = obj;
  for (const k of keys.slice(0, -1)) o = (o[k] ??= {}) as Record<string, unknown>;
  o[keys[keys.length - 1]] = value;
}

const SEP = " | ";

const splitLines = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

const splitPair = (line: string): [string, string] => {
  const i = line.indexOf("|");
  return i === -1 ? [line.trim(), ""] : [line.slice(0, i).trim(), line.slice(i + 1).trim()];
};

/** Datubāzes vērtība → teksts formas laukā */
export function serialize(type: FieldType, value: unknown, columns: string[] = []): string {
  switch (type) {
    case "heading":
      return "";
    case "table":
      return ((value as Record<string, unknown>[]) ?? [])
        .map((row) => {
          const cols = columns.map((c) => String(row[c] ?? ""));
          while (cols.length > 1 && !cols[cols.length - 1]) cols.pop(); // tukšās beigu kolonnas nerāda
          return cols.join(SEP);
        })
        .join("\n");
    case "lines":
      return ((value as string[]) ?? []).join("\n");
    case "pairs":
      return ((value as { title: string; description: string }[]) ?? [])
        .map((p) => (p.description ? `${p.title}${SEP}${p.description}` : p.title))
        .join("\n");
    case "stats":
      return ((value as { value: string; label: string }[]) ?? []).map((s) => `${s.value}${SEP}${s.label}`).join("\n");
    case "faq":
      return ((value as { question: string; answer: string }[]) ?? [])
        .map((f) => `${f.question}${SEP}${f.answer}`)
        .join("\n");
    case "photos":
      return ((value as { src: string; caption: string }[]) ?? [])
        .map((p) => (p.caption ? `${p.src}${SEP}${p.caption}` : p.src))
        .join("\n");
    case "videos":
      return ((value as { title: string; src: string; poster: string; duration?: string; audience?: string; description?: string }[]) ?? [])
        .map((v) => {
          // Aprakstā rindu pārnesumus panelī rāda kā " ¶ " (viens video = viena rinda)
          const cols = [v.title, v.src, v.poster, v.duration ?? "", v.audience ?? "", (v.description ?? "").replace(/\n/g, " ¶ ")];
          while (cols.length > 2 && !cols[cols.length - 1]) cols.pop(); // tukšās beigu kolonnas nerāda
          return cols.join(SEP);
        })
        .join("\n");
    case "pricing":
      return ((value as { title: string; options: { label: string; price: number | null }[] }[]) ?? [])
        .map((g) => [`## ${g.title}`, ...g.options.map((o) => `${o.label}${SEP}${o.price ?? ""}`)].join("\n"))
        .join("\n\n");
    default:
      return value === null || value === undefined ? "" : String(value);
  }
}

/** Formas vērtība → datubāzes vērtība */
export function parse(field: FieldDef, form: FormData): unknown {
  const raw = form.get(field.name);
  const text = typeof raw === "string" ? raw.trim() : "";

  switch (field.type) {
    case "heading":
      return undefined;
    case "table": {
      const columns = field.columns ?? [];
      return splitLines(text)
        .map((l) => {
          const cells = l.split("|").map((x) => x.trim());
          return Object.fromEntries(columns.map((c, i) => [c, cells[i] ?? ""]));
        })
        .filter((row) => row[columns[0]]);
    }
    case "checkbox":
      return raw === "on";
    case "number":
      // Tukšs lauks → undefined: vērtība netiek sūtīta, un datubāze izmanto noklusējumu
      return text === "" || Number.isNaN(Number(text)) ? undefined : Number(text);
    case "albums":
      return form.getAll(field.name).filter((v): v is string => typeof v === "string");
    case "lines":
      return splitLines(text);
    case "pairs":
      return splitLines(text).map((l) => {
        const [title, description] = splitPair(l);
        return { title, description };
      });
    case "stats":
      return splitLines(text).map((l) => {
        const [value, label] = splitPair(l);
        return { value, label };
      });
    case "faq":
      return splitLines(text)
        .map((l) => {
          const [question, answer] = splitPair(l);
          return { question, answer };
        })
        .filter((f) => f.question && f.answer);
    case "photos":
      return splitLines(text)
        .map((l) => {
          const [src, caption] = splitPair(l);
          return { src, caption };
        })
        .filter((p) => p.src)
        .slice(0, 3);
    case "videos":
      return splitLines(text)
        .map((l) => {
          const [title, src = "", poster = "", duration = "", audience = "", ...rest] = l.split("|").map((x) => x.trim());
          return { title, src, poster, duration, audience, description: rest.join(" ").replace(/\s*¶\s*/g, "\n") };
        })
        .filter((v) => v.src);
    case "pricing": {
      const groups: { title: string; options: { label: string; price: number | null }[] }[] = [];
      for (const line of splitLines(text)) {
        if (line.startsWith("##")) {
          groups.push({ title: line.replace(/^#+\s*/, ""), options: [] });
          continue;
        }
        if (groups.length === 0) groups.push({ title: "Cena", options: [] });
        const [label, price] = splitPair(line);
        const n = Number(price.replace(",", ".").replace(/[^\d.]/g, ""));
        groups[groups.length - 1].options.push({ label, price: price && !Number.isNaN(n) ? n : null });
      }
      return groups.filter((g) => g.options.length);
    }
    default:
      return text;
  }
}

/** Nosaukums → URL draudzīgs slug (latviešu burti tiek pārveidoti) */
export function slugify(text: string): string {
  const map: Record<string, string> = { ā: "a", č: "c", ē: "e", ģ: "g", ī: "i", ķ: "k", ļ: "l", ņ: "n", š: "s", ū: "u", ž: "z" };
  return text
    .toLowerCase()
    .replace(/[āčēģīķļņšūž]/g, (c) => map[c])
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
