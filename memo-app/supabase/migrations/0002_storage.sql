-- Storage bucket + policies (spec §4.2)
--
-- Creates a PRIVATE bucket named "attachments". Files are stored under the
-- path {user_id}/{note_id}/{uuid}-{filename}, so the first path segment is the
-- owner's user id. The policies below restrict read/write/delete to objects
-- whose first path segment equals the authenticated user's id.

-- Create the private bucket (id == name == "attachments").
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

-- Helper note: storage.foldername(name) returns the path segments as an array,
-- so storage.foldername(name)[1] is the {user_id} folder.

drop policy if exists "attachments read own" on storage.objects;
create policy "attachments read own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments insert own" on storage.objects;
create policy "attachments insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments update own" on storage.objects;
create policy "attachments update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "attachments delete own" on storage.objects;
create policy "attachments delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
