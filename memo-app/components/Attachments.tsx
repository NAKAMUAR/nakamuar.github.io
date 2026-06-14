"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  SIGNED_URL_TTL,
  STORAGE_BUCKET,
  isImageFile,
  validateFile,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Attachment } from "@/lib/types";

/** Keep the storage key ASCII-safe; the original name lives in file_name. */
function safeName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function Attachments({
  noteId,
  userId,
  initialAttachments,
}: {
  noteId: string;
  userId: string;
  initialAttachments: Attachment[];
}) {
  const [attachments, setAttachments] =
    useState<Attachment[]>(initialAttachments);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Refresh signed URLs whenever the attachment list changes (spec §4.2).
  const refreshUrls = useCallback(async (items: Attachment[]) => {
    if (items.length === 0) {
      setUrls({});
      return;
    }
    const supabase = createClient();
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(
        items.map((a) => a.file_path),
        SIGNED_URL_TTL,
      );

    const map: Record<string, string> = {};
    data?.forEach((entry) => {
      if (entry.signedUrl && entry.path) {
        map[entry.path] = entry.signedUrl;
      }
    });
    setUrls(map);
  }, []);

  useEffect(() => {
    void refreshUrls(attachments);
  }, [attachments, refreshUrls]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    const supabase = createClient();

    try {
      const inserted: Attachment[] = [];
      for (const file of Array.from(files)) {
        const check = validateFile(file);
        if (!check.ok) {
          setError(`${file.name}: ${check.error}`);
          continue;
        }

        const path = `${userId}/${noteId}/${crypto.randomUUID()}-${safeName(
          file.name,
        )}`;

        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { contentType: file.type });
        if (upErr) {
          setError(`${file.name}: アップロードに失敗しました`);
          continue;
        }

        const { data: row, error: insErr } = await supabase
          .from("attachments")
          .insert({
            note_id: noteId,
            user_id: userId,
            file_path: path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          })
          .select("*")
          .single();

        if (insErr || !row) {
          // Roll back the orphaned storage object.
          await supabase.storage.from(STORAGE_BUCKET).remove([path]);
          setError(`${file.name}: 保存に失敗しました`);
          continue;
        }

        inserted.push(row as Attachment);
      }

      if (inserted.length > 0) {
        setAttachments((prev) => [...prev, ...inserted]);
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(attachment: Attachment) {
    if (!confirm(`「${attachment.file_name}」を削除しますか？`)) return;
    setError(null);
    const supabase = createClient();

    // Delete the storage object first, then the DB record (spec §2.3).
    const { error: rmErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([attachment.file_path]);
    if (rmErr) {
      setError("ファイルの削除に失敗しました");
      return;
    }

    const { error: delErr } = await supabase
      .from("attachments")
      .delete()
      .eq("id", attachment.id);
    if (delErr) {
      setError("レコードの削除に失敗しました");
      return;
    }

    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600 transition hover:border-neutral-900 hover:text-neutral-900">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {uploading ? "アップロード中…" : "＋ ファイルを追加（画像 / PDF・最大10MB）"}
        </label>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {attachments.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {attachments.map((a) => {
            const url = urls[a.file_path];
            const image = isImageFile(a.file_name);
            return (
              <li
                key={a.id}
                className="group relative overflow-hidden rounded-lg border border-neutral-200 bg-white"
              >
                <a
                  href={url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                  aria-disabled={!url}
                >
                  {image && url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={a.file_name}
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 w-full flex-col items-center justify-center gap-1 bg-neutral-50 text-neutral-400">
                      <span className="text-2xl">📄</span>
                      <span className="text-[10px] uppercase">
                        {image ? "読み込み中" : "PDF"}
                      </span>
                    </div>
                  )}
                </a>
                <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                  <span
                    className="truncate text-[11px] text-neutral-600"
                    title={a.file_name}
                  >
                    {a.file_name}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(a)}
                    className="shrink-0 text-[11px] text-red-600 hover:underline"
                  >
                    削除
                  </button>
                </div>
                <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[10px] text-white">
                  {formatSize(a.size_bytes)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
