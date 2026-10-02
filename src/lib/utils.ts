import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Saite uz uzņēmumu pakalpojumu. Pakalpojumam "izrades" ir sava lapa /izrades,
 * pārējiem — /uznemumiem/<slug>.
 */
export function businessHref(slug: string) {
  return slug === "izrades" ? "/izrades" : `/uznemumiem/${slug}`
}
