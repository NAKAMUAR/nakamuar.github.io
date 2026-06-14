import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Attachments } from "@/components/Attachments";
import { NoteEditor } from "@/components/NoteEditor";
import { createClient } from "@/lib/supabase/server";
import type { Attachment, Note } from "@/lib/types";

export default async function NoteEditPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!note) {
    notFound();
  }

  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("note_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm text-neutral-500 transition hover:text-neutral-900"
        >
          ← 一覧へ戻る
        </Link>
      </div>

      <NoteEditor note={note as Note} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">添付ファイル</h2>
        <Attachments
          noteId={(note as Note).id}
          userId={user.id}
          initialAttachments={(attachments ?? []) as Attachment[]}
        />
      </section>
    </main>
  );
}
