"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { STORAGE_BUCKET } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

/** Create a blank note and open its editor. */
export async function createNote() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("notes")
    .insert({ user_id: user.id, title: "", body: "" })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "メモの作成に失敗しました");
  }

  redirect(`/notes/${data.id}`);
}

/** Toggle archive state for a note. */
export async function setArchived(noteId: string, isArchived: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("notes")
    .update({ is_archived: isArchived })
    .eq("id", noteId);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}

/**
 * Delete a note. Its attachment rows are removed by the ON DELETE CASCADE
 * foreign key, but the Storage objects must be deleted explicitly first.
 */
export async function deleteNote(noteId: string) {
  const supabase = createClient();

  const { data: attachments } = await supabase
    .from("attachments")
    .select("file_path")
    .eq("note_id", noteId);

  if (attachments && attachments.length > 0) {
    await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(attachments.map((a) => a.file_path));
  }

  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
}
