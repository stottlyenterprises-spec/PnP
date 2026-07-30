create table if not exists public.deeds_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  device_id text not null,
  schema_version integer not null default 3,
  payload jsonb not null
);

create table if not exists public.deeds_snapshot_revisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  revision bigint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null,
  device_id text not null,
  schema_version integer not null,
  payload jsonb not null,
  unique (user_id, revision)
);

create index if not exists deeds_snapshot_revisions_user_revision
  on public.deeds_snapshot_revisions(user_id, revision desc);

alter table public.deeds_snapshots enable row level security;
alter table public.deeds_snapshot_revisions enable row level security;

drop policy if exists "Users own their D.E.E.D.S. snapshot" on public.deeds_snapshots;
create policy "Users own their D.E.E.D.S. snapshot"
  on public.deeds_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users read their D.E.E.D.S. history" on public.deeds_snapshot_revisions;
create policy "Users read their D.E.E.D.S. history"
  on public.deeds_snapshot_revisions for select
  using (auth.uid() = user_id);

-- Revision rows are inserted only by the authenticated D.E.E.D.S. server
-- route with the service role. No client insert policy is intentionally
-- defined for this table.
