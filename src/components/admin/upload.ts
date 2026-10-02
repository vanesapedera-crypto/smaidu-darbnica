"use client";

import { createClient } from "@supabase/supabase-js";
import { createUploadUrl } from "@/app/admin/actions";

const MAX_SIDE = 2400;

let client: ReturnType<typeof createClient> | null = null;
const storage = () =>
  (client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  })).storage;

/**
 * Samazina attēlu pārlūkā (garākā mala ≤ 2400 px) un pārveido WebP formātā.
 * Tā augšupielāde ir ātra un krātuvē neglabājas 10 MB telefona bildes.
 */
async function toWebp(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Neizdevās apstrādāt attēlu"))), "image/webp", 0.85),
  );
  return { blob, width, height };
}

export type UploadResult = { url: string; width: number | null; height: number | null };

export async function uploadImage(file: File, folder: string): Promise<UploadResult> {
  const isSvg = file.type === "image/svg+xml";
  const { blob, width, height } = isSvg ? { blob: file, width: null, height: null } : await toWebp(file);

  const target = await createUploadUrl(file.name, folder, isSvg ? "svg" : "webp");
  if ("error" in target) throw new Error(target.error);

  const { error } = await storage()
    .from("media")
    .uploadToSignedUrl(target.path, target.token, blob, { contentType: isSvg ? "image/svg+xml" : "image/webp" });
  if (error) throw new Error(error.message);

  return { url: target.publicUrl, width, height };
}
