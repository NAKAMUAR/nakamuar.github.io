-- Schema: notes + attachments (spec §3)

create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text,
  body        text,
  is_archived boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists attachments (
  id          uuid primary key default gen_random_uuid(),
  note_id     uuid not null references notes(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz default now()
);

create index if not exists idx_notes_user on notes(user_id);
create index if not exists idx_notes_updated on notes(updated_at desc);
create index if not exists idx_attach_note on attachments(note_id);

-- updated_at auto-update trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_notes_updated on notes;
create trigger trg_notes_updated
  before update on notes
  for each row execute function set_updated_at();

-- Row Level Security: a user may only operate on their own rows (spec §4.1)
alter table notes enable row level security;
alter table attachments enable row level security;

drop policy if exists "own notes" on notes;
create policy "own notes" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own attachments" on attachments;
create policy "own attachments" on attachments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
