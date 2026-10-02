/**
 * Vai attēlu var optimizēt ar next/image. Atļauti ir lokālie (/media/…) un
 * Supabase Storage attēli (sk. next.config.ts). Citām adresēm, ko administrators
 * varētu ielīmēt ar roku, attēls tiek rādīts neoptimizēts, nevis izraisa kļūdu.
 */
const storagePrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}/storage/v1/object/public/`;

export function isOptimizable(src: string): boolean {
  return (src.startsWith("/") && !src.startsWith("//")) || (storagePrefix.length > 30 && src.startsWith(storagePrefix));
}
