"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Note } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

export function NoteEditor({ note }: { note: Note }) {
  const router = useRouter();
  const [title, setTitle] = useState(note.title ?? "");
  const [body, setBody] = useState(note.body ?? "");
  const [state, setState] = useState<SaveState>("idle");

  // Track the last persisted values to avoid redundant writes.
  const saved = useRef({ title: note.title ?? "", body: note.body ?? "" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (nextTitle: string, nextBody: string) => {
      if (
        nextTitle === saved.current.title &&
        nextBody === saved.current.body
      ) {
        return;
      }
      setState("saving");
      const supabase = createClient();
      const { error } = await supabase
        .from("notes")
        .update({ title: nextTitle, body: nextBody })
        .eq("id", note.id);

      if (error) {
        setState("error");
        return;
      }
      saved.current = { title: nextTitle, body: nextBody };
      setState("saved");
      router.refresh();
    },
    [note.id, router],
  );

  // Debounced autosave whenever title/body changes.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      void save(title, body);
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [title, body, save]);

  // Flush a pending save when leaving the page.
  useEffect(() => {
    return () => {
      void save(title, body);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="タイトル"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-lg font-medium outline-none focus:border-neutral-900"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="本文を入力…"
        rows={12}
        className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed outline-none focus:border-neutral-900"
      />
      <div className="h-4 text-right text-xs text-neutral-400">
        {state === "saving" && "保存中…"}
        {state === "saved" && "保存しました"}
        {state === "error" && (
          <span className="text-red-600">保存に失敗しました</span>
        )}
      </div>
    </div>
  );
}
