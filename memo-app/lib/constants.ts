/** Storage bucket name (must match the bucket created in Supabase). */
export const STORAGE_BUCKET = "attachments";

/** Maximum size per uploaded file: 10 MB. */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed file extensions (lower-case, without the dot). */
export const ALLOWED_EXTENSIONS = [
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "pdf",
] as const;

/** Allowed MIME types, used for the file <input> accept attribute. */
export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

/** Image extensions get a thumbnail; everything else (pdf) gets an icon. */
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp"];

/** Signed URL validity in seconds (1 hour). */
export const SIGNED_URL_TTL = 60 * 60;

export function getExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.includes(getExtension(fileName));
}

export type FileValidationResult = { ok: true } | { ok: false; error: string };

/** Validates a file against the extension and size rules (spec §2.3). */
export function validateFile(file: File): FileValidationResult {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `対応していない拡張子です（${ALLOWED_EXTENSIONS.join(", ")} のみ）`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: "ファイルサイズが10MBを超えています" };
  }
  return { ok: true };
}
