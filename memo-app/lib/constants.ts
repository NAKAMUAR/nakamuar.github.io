/** Storage bucket name (must match the bucket created in Supabase). */
export const STORAGE_BUCKET = "attachments";

/**
 * Calendar event colors (Apple Calendar 風のプリセット). Tailwind purges
 * unused classes, so the full class strings are listed statically here.
 */
export type EventColorKey =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export const EVENT_COLORS: Record<
  EventColorKey,
  { label: string; dot: string; chip: string; ring: string }
> = {
  red: { label: "レッド", dot: "bg-red-500", chip: "bg-red-100 text-red-800", ring: "ring-red-500" },
  orange: { label: "オレンジ", dot: "bg-orange-500", chip: "bg-orange-100 text-orange-800", ring: "ring-orange-500" },
  yellow: { label: "イエロー", dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800", ring: "ring-amber-500" },
  green: { label: "グリーン", dot: "bg-green-500", chip: "bg-green-100 text-green-800", ring: "ring-green-500" },
  blue: { label: "ブルー", dot: "bg-blue-500", chip: "bg-blue-100 text-blue-800", ring: "ring-blue-500" },
  purple: { label: "パープル", dot: "bg-purple-500", chip: "bg-purple-100 text-purple-800", ring: "ring-purple-500" },
};

export const DEFAULT_EVENT_COLOR: EventColorKey = "blue";

export function eventColor(key: string) {
  return EVENT_COLORS[(key as EventColorKey) in EVENT_COLORS ? (key as EventColorKey) : DEFAULT_EVENT_COLOR];
}

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
