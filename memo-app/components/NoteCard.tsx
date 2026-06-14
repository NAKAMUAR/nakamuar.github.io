"use client";

import Link from "next/link";
import { useTransition } from "react";

import { deleteNote, setArchived } from "@/app/actions";
import type { Note } from "@/lib/types";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NoteCard({ note }: { note: Note }) {
  const [isPending, startTransition] = useTransition();

  const preview = (note.body ?? "").trim();
  const title = (note.title ?? "").trim();

  function toggleArchive() {
    startTransition(() => setArchived(note.id, !note.is_archived));
  }

  function remove() {
    if (!confirm("このメモを削除しますか？添付ファイルも削除されます。")) return;
    startTransition(() => deleteNote(note.id));
  }

  return (
    <div
      className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <Link href={`/notes/${note.id}`} className="block">
        <h2 className="truncate font-medium text-neutral-900">
          {title || "（無題）"}
        </h2>
        {preview && (
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-neutral-600">
            {preview}
          </p>
        )}
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-neutral-400">
          {formatDate(note.updated_at)}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleArchive}
            disabled={isPending}
            className="rounded-md px-2 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50"
          >
            {note.is_archived ? "戻す" : "アーカイブ"}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
