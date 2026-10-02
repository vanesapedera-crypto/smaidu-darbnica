import Image, { type ImageProps } from "next/image";
import { mediaInfo } from "@/lib/content/media";
import { isOptimizable } from "@/lib/images";

/**
 * next/image ietinājums: lokāliem attēliem automātiski pievieno blur priekšskatījumu
 * un izmērus no media.json. Augšupielādētiem (Supabase) attēliem strādā kā parasts <Image>.
 * Tikai servera komponentēm.
 */
export default function Photo({ src, alt, fill, width, height, ...props }: ImageProps & { src: string }) {
  const info = mediaInfo(src);
  const blur = info ? { placeholder: "blur" as const, blurDataURL: info.blur } : {};
  const unoptimized = !isOptimizable(src);

  if (fill) return <Image src={src} alt={alt} fill unoptimized={unoptimized} {...blur} {...props} />;

  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? info?.width ?? 1600}
      height={height ?? info?.height ?? 1067}
      unoptimized={unoptimized}
      {...blur}
      {...props}
    />
  );
}
