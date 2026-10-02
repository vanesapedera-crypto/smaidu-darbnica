import type { Service } from "../types";
import { programs } from "./programs-legacy";
import { programOverrides } from "./program-texts";
import { PROGRAM_IMAGE } from "./service-media";

/**
 * Bērnu ballīšu programmas (privātpersonām).
 * Saturs pārņemts no iepriekšējās versijas (programs-legacy.ts) un pārveidots
 * vienotajā Service formātā, lai to varētu glabāt un rediģēt `services` tabulā.
 */

// Noņem emocijzīmes no virsrakstiem — jaunajā dizainā tās aizstāj ikonas
const stripEmoji = (s: string) =>
  s.replace(/[\p{Extended_Pictographic}️‍]/gu, "").trim();

export const privateServices: Service[] = programs.map((p, i) => {
  // Vecās smaidudarbnica.lv lapas saturs (aktuālākais) pārraksta vecā koda vērtības
  const o = programOverrides[p.slug] ?? {};
  return {
  slug: p.slug,
  audience: "private",
  title: p.title,
  excerpt: p.shortDescription,
  intro: o.intro ?? (p.description || p.shortDescription),
  body: o.body ?? "",
  highlights: o.gift ? [`🎁 ${o.gift}`] : [],
  suitableFor: [],
  activities:
    o.activities ??
    p.activities.map((a) => ({
      title: stripEmoji(a.title),
      description: a.description,
    })),
  pricing: o.pricing ?? p.pricing,
  pricingNote:
    o.note ??
    p.note ??
    "", // tukšs → lapā rāda piezīmi par izbraukuma izmaksām ar paneļa cenām (sk. ServiceDetail)
  faq: [],
  age: o.age ?? p.age,
  duration: o.duration ?? p.duration,
  participants: "",
  icon: "PartyPopper",
  heroImage: PROGRAM_IMAGE[p.slug] ?? `/media/${p.slug}/${p.slug}-01.webp`,
  albums: [p.slug],
  seasons: [],
  sort: (i + 1) * 10,
  published: true,
  seoTitle: "",
  seoDescription: "",
  };
});
