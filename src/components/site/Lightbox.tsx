"use client";

import YarlLightbox from "yet-another-react-lightbox";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import { isOptimizable } from "@/lib/images";

export type LightboxSlide = { src: string; alt: string; width?: number; height?: number };

/** Next.js optimizētā attēla adrese — lightbox ielādē piemērota izmēra AVIF/WebP. */
const optimized = (src: string, w: number) =>
  isOptimizable(src) ? `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75` : src;

/**
 * Pilnekrāna attēlu skatītājs. Tiek ielādēts tikai pēc pirmā klikšķa (next/dynamic),
 * tāpēc tas nepalielina lapas sākotnējo JS apjomu.
 */
export default function Lightbox({
  slides,
  index,
  onClose,
}: {
  slides: LightboxSlide[];
  index: number;
  onClose: () => void;
}) {
  return (
    <YarlLightbox
      open={index >= 0}
      index={index}
      close={onClose}
      plugins={[Counter]}
      controller={{ closeOnBackdropClick: true }}
      labels={{ Previous: "Iepriekšējā", Next: "Nākamā", Close: "Aizvērt" }}
      styles={{ container: { backgroundColor: "rgba(17, 24, 39, 0.96)" } }}
      slides={slides.map((s) => ({
        src: optimized(s.src, 1920),
        alt: s.alt,
        width: s.width,
        height: s.height,
        srcSet:
          s.width && s.height && isOptimizable(s.src)
            ? [828, 1280, 1920].map((w) => ({
                src: optimized(s.src, w),
                width: w,
                height: Math.round((w * s.height!) / s.width!),
              }))
            : undefined,
      }))}
    />
  );
}
