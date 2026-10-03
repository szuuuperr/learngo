create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,

  name                text,
  username            text unique,
  avatar_url          text,

  xp                  integer not null default 450,
  level               integer not null default 5,
  xp_to_next          integer not null default 600,
  streak              integer not null default 12,
  lives               integer not null default 5,
  max_lives           integer not null default 5,
  gems                integer not null default 1200,
  keys                integer not null default 3,
  daily_goal_progress integer not null default 40,

  socratic_mode       text not null default 'strict'
                        check (socratic_mode in ('strict', 'guided')),
  active_lang         text not null default 'python',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.community_chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  message    text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists community_chats_created_at_idx
  on public.community_chats (created_at desc);

create index if not exists community_chats_user_id_idx
  on public.community_chats (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users           enable row level security;
alter table public.community_chats enable row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "chats_select_all" on public.community_chats;
drop policy if exists "chats_insert_own" on public.community_chats;
drop policy if exists "chats_update_own" on public.community_chats;
drop policy if exists "chats_delete_own" on public.community_chats;

create policy "chats_select_all"
  on public.community_chats
  for select
  to authenticated
  using (true);

create policy "chats_insert_own"
  on public.community_chats
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "chats_update_own"
  on public.community_chats
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chats_delete_own"
  on public.community_chats
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.get_leaderboard(limit_rows integer default 20)
returns table (
  id           uuid,
  name         text,
  avatar_url   text,
  level        integer,
  xp           integer,
  streak       integer,
  active_lang  text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    u.name,
    u.avatar_url,
    u.level,
    u.xp,
    u.streak,
    u.active_lang
  from public.users u
  order by u.xp desc, u.streak desc
  limit least(greatest(limit_rows, 1), 100);
$$;

grant execute on function public.get_leaderboard(integer) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, 'learner'), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname    = 'supabase_realtime'
      and schemaname = 'public'
      and tablename  = 'community_chats'
  ) then
    alter publication supabase_realtime add table public.community_chats;
  end if;
end;
$$;
