import type { Locale } from "./config";

/**
 * Tulkošana pēc latviešu teksta: t("Pieprasīt piedāvājumu") → "Request an offer".
 * Vārdnīcas: messages/en.json, messages/ru.json (lapas teksti, pogas, formas) un
 * content/en.json, content/ru.json (saturs no datubāzes — pakalpojumi, iestatījumi u. c.).
 * Ja tulkojuma nav (vai latviešu teksts panelī ir mainīts) — rāda latvisko tekstu.
 */
export type Messages = Record<string, string>;
export type TFn = (text: string, vars?: Record<string, string | number>) => string;

/** Atslēga: lieki tukšumi un rindu pārnesumi neietekmē atrašanu */
export const normKey = (s: string) => s.replace(/\s+/g, " ").trim();

export function makeT(messages: Messages | null | undefined): TFn {
  return (text, vars) => {
    let out = text;
    if (messages && text) out = messages[text] ?? messages[normKey(text)] ?? text;
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
    return out;
  };
}

/** Lauki, kuru vērtības ir identifikatori/adreses, nevis teksts — netulko */
const SKIP_KEYS = new Set([
  "id", "slug", "href", "src", "icon", "image", "heroImage", "ogImage", "logo", "album", "albums", "category",
  "seasons", "season", "path", "url", "email", "emailPrivate", "phone", "phoneBusiness", "phonePrivate",
  "facebook", "instagram", "tiktok", "youtube", "video", "videoUrl", "poster", "mapQuery", "iban", "regNr", "vatNr",
]);

/** Iztulko visus teksta laukus objektā (dziļi) — datubāzes saturam */
/** Markdown zīmes rindas sākumā ("## ", "- ", "1. ", "> ") — tulko tikai tekstu aiz tām */
const LINE_PREFIX = /^(\s*(?:#{1,6}\s+|[-*•]\s+|\d+[.)]\s+|>\s*)?)(.*?)(\s*)$/;

/** Teksts: vispirms viss kopā, citādi pa rindām (garie apraksti panelī ir vairākās rindās) */
export function translateText(text: string, t: TFn): string {
  const whole = t(text);
  if (whole !== text || !text.includes("\n")) return whole;
  return text
    .split("\n")
    .map((line) => {
      const m = line.match(LINE_PREFIX);
      if (!m || !m[2]) return line;
      return m[1] + t(m[2]) + m[3];
    })
    .join("\n");
}

export function translateDeep<T>(value: T, t: TFn, key = ""): T {
  if (typeof value === "string") return (SKIP_KEYS.has(key) ? value : translateText(value, t)) as T;
  if (Array.isArray(value)) return value.map((v) => translateDeep(v, t, key)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = SKIP_KEYS.has(k) ? v : translateDeep(v, t, k);
    return out as T;
  }
  return value;
}

export type { Locale };
