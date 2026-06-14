-- Calendar events (spec: Apple Calendar 相当のスケジュール機能)
--
-- updated_at の自動更新は 0001_init.sql で定義済みの set_updated_at() を再利用する。

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default '',
  location    text,
  notes       text,
  all_day     boolean not null default false,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  color       text not null default 'blue',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_events_user on events(user_id);
create index if not exists idx_events_starts on events(starts_at);
create index if not exists idx_events_range on events(user_id, starts_at, ends_at);

-- Row Level Security: a user may only operate on their own events.
alter table events enable row level security;

drop policy if exists "own events" on events;
create policy "own events" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists trg_events_updated on events;
create trigger trg_events_updated
  before update on events
  for each row execute function set_updated_at();
