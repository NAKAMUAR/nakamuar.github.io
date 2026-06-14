import { createNote } from "@/app/actions";

export function NewNoteButton() {
  return (
    <form action={createNote}>
      <button
        type="submit"
        className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-neutral-700"
      >
        新規
      </button>
    </form>
  );
}
