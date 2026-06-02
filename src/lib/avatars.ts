// Cute colorful avatars (emoji-based, zero asset deps, works on every device).
export const AVATARS = [
  "🦊", "🐼", "🐯", "🐵", "🦁", "🐸", "🐙", "🦄",
  "🐧", "🐨", "🐰", "🐺", "🐲", "🦉", "🦋", "🐳",
] as const;

export type Avatar = string;

export const DEFAULT_AVATAR = "🦊";

// An avatar value is either an emoji (default) or an uploaded image reference.
// Uploaded images are stored as "img:<storage-path>" inside the avatars bucket.
const IMG_PREFIX = "img:";

export const isImageAvatar = (v?: string | null): boolean =>
  !!v && v.startsWith(IMG_PREFIX);

export const toImageAvatar = (path: string) => `${IMG_PREFIX}${path}`;

export const imageAvatarPath = (v: string) => v.slice(IMG_PREFIX.length);

/**
 * Resolve an avatar value to a displayable image URL (or null when it's an emoji).
 * The avatars bucket is private, so we generate a long-lived signed URL.
 */
export async function resolveAvatarUrl(
  supabase: { storage: { from: (b: string) => any } },
  v?: string | null,
): Promise<string | null> {
  if (!isImageAvatar(v)) return null;
  const { data } = await supabase.storage
    .from("avatars")
    .createSignedUrl(imageAvatarPath(v as string), 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

/**
 * Compress an image file in the browser to a small square JPEG (max 256px),
 * keeping uploads tiny and fast to load on every device.
 */
export async function compressImage(file: File, size = 256): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const min = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - min) / 2;
  const sy = (bitmap.height - min) / 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, sx, sy, min, min, 0, 0, size, size);
  bitmap.close?.();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
      "image/jpeg",
      0.82,
    ),
  );
}
