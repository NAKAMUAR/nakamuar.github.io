import { redirect } from "next/navigation";

import { Nav } from "@/components/Nav";
import { NewNoteButton } from "@/components/NewNoteButton";
import { NoteCard } from "@/components/NoteCard";
import { SearchBar } from "@/components/SearchBar";
import { createClient } from "@/lib/supabase/server";
import type { Note } from "@/lib/types";

type SearchParams = {
  q?: string;
  archived?: string;
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const showArchived = searchParams.archived === "1";
  const q = (searchParams.q ?? "").trim();

  let query = supabase
    .from("notes")
    .select("*")
    .eq("is_archived", showArchived)
    .order("updated_at", { ascending: false });

  if (q) {
    // Simple keyword search over title and body (spec §2.2).
    const pattern = `%${q}%`;
    query = query.or(`title.ilike.${pattern},body.ilike.${pattern}`);
  }

  const { data: notes } = await query;
  const list = (notes ?? []) as Note[];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Nav active="memo" email={user.email ?? ""} />

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight">メモ</h1>
        <NewNoteButton />
      </div>

      <SearchBar defaultQuery={q} showArchived={showArchived} />

      {list.length === 0 ? (
        <p className="mt-10 text-center text-sm text-neutral-500">
          {q
            ? "一致するメモはありません。"
            : showArchived
              ? "アーカイブはありません。"
              : "メモはまだありません。「新規」から作成しましょう。"}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((note) => (
            <li key={note.id}>
              <NoteCard note={note} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
