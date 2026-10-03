create table if not exists public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  lang    text not null,
  completed_levels integer[] not null default '{}',
  primary key (user_id, lang)
);

alter table public.user_progress enable row level security;

drop policy if exists "user_progress_own" on public.user_progress;
create policy "user_progress_own"
  on public.user_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_quests (
  user_id    uuid not null references public.users(id) on delete cascade,
  quest_code text not null,
  done       boolean not null default false,
  day        date not null default current_date,
  primary key (user_id, quest_code, day)
);

alter table public.user_quests enable row level security;

drop policy if exists "user_quests_own" on public.user_quests;
create policy "user_quests_own"
  on public.user_quests
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists user_quests_day_idx
  on public.user_quests (day desc);

create or replace function public.award_gameplay_xp(
  xp_gain      integer default 0,
  gems_gain    integer default 0,
  keys_gain    integer default 0,
  new_streak   integer default null,
  new_lives    integer default null,
  new_progress integer default null
)
returns table (
  xp            integer,
  level         integer,
  xp_to_next    integer,
  streak        integer,
  lives         integer,
  gems          integer,
  keys          integer,
  daily_goal_progress integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id    uuid := auth.uid();
  row_users     public.users%rowtype;
  next_xp       integer;
  next_level    integer;
  next_threshold integer;
begin
  if current_id is null then
    raise exception 'You must be signed in to earn XP.';
  end if;

  select * into row_users
    from public.users
   where id = current_id
     for update;

  if not found then
    raise exception 'No profile found for the current user.';
  end if;

  next_xp        := row_users.xp + greatest(xp_gain, 0);
  next_level     := row_users.level;
  next_threshold := row_users.xp_to_next;

  if next_threshold is null or next_threshold <= 0 then
    next_threshold := 600;
  end if;

  while next_xp >= next_threshold loop
    next_level     := next_level + 1;
    next_threshold := round(next_threshold * 1.3);
  end loop;

  update public.users
     set xp    = next_xp,
         level = next_level,
         xp_to_next = next_threshold,
         streak   = case when new_streak is null then row_users.streak
                         else least(greatest(new_streak, 0), 365) end,
         lives    = case when new_lives is null then row_users.lives
                         else least(greatest(new_lives, 0), row_users.max_lives) end,
         gems     = row_users.gems + greatest(gems_gain, 0),
         keys     = row_users.keys + greatest(keys_gain, 0),
         daily_goal_progress = case when new_progress is null then row_users.daily_goal_progress
                                    else least(greatest(new_progress, 0), 100) end
   where id = current_id;

  return query
    select next_xp, next_level, next_threshold,
           row_users.streak, row_users.lives,
           row_users.gems + greatest(gems_gain, 0) as gems,
           row_users.keys + greatest(keys_gain, 0) as keys,
           case when new_progress is null then row_users.daily_goal_progress
                else least(greatest(new_progress, 0), 100) end as daily_goal_progress;
end;
$$;

revoke execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) from public, anon;
grant  execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) to authenticated;

create or replace function public.save_level_progress(
  lang text,
  levels integer[],
  quest_code text default null,
  quest_done boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to save progress.';
  end if;

  insert into public.user_progress (user_id, lang, completed_levels)
  values (auth.uid(), lang, coalesce(levels, '{}'::integer[]))
  on conflict on constraint user_progress_pkey do update
    set completed_levels = excluded.completed_levels;

  if quest_code is not null then
    insert into public.user_quests (user_id, quest_code, done)
    values (auth.uid(), quest_code, quest_done)
    on conflict on constraint user_quests_pkey do update
      set done = excluded.done;
  end if;
end;
$$;

revoke execute on function public.save_level_progress(text, integer[], text, boolean) from public, anon;
grant  execute on function public.save_level_progress(text, integer[], text, boolean) to authenticated;

update public.users
   set xp = 0,
       level = 1,
       xp_to_next = 600,
       streak = 0,
       daily_goal_progress = 0,
       gems = 0,
       keys = 0
 where xp = 450
   and level = 5
   and streak = 12;

alter table public.users alter column xp set default 0;
alter table public.users alter column level set default 1;
alter table public.users alter column streak set default 0;
alter table public.users alter column gems set default 0;
alter table public.users alter column keys set default 0;
alter table public.users alter column daily_goal_progress set default 0;

create table if not exists public.quests (
  quest_code  text primary key,
  title       text not null,
  description text,
  icon        text,
  xp_reward   integer not null default 20,
  target      integer not null default 1,
  sort_order  integer not null default 0
);

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  audience   uuid references public.users(id) on delete cascade,
  title      text not null,
  body       text,
  icon       text,
  link_tab   text,
  read_by    uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

create table if not exists public.study_rooms (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  topic      text,
  is_open    boolean not null default true,
  capacity   integer not null default 12,
  starts_at  timestamptz,
  sort_order integer not null default 0
);

create table if not exists public.mentors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  expertise   text,
  bio         text,
  next_slot   timestamptz,
  is_available boolean not null default true
);

create table if not exists public.industry_skills (
  id         uuid primary key default gen_random_uuid(),
  skill      text not null,
  icon       text,
  demand     text not null check (demand in ('Critical', 'High', 'Medium', 'Essential')),
  demand_pct integer not null check (demand_pct between 0 and 100),
  sort_order integer not null default 0
);

create table if not exists public.partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  match_pct  integer not null check (match_pct between 0 and 100),
  website    text,
  sort_order integer not null default 0
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'quests', 'study_rooms',
    'mentors', 'industry_skills', 'partners'
  ] loop
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', tbl || '_select_public', tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tbl || '_select_public', tbl
    );

    execute format('revoke all on public.%I from anon', tbl);
    execute format('grant  select on public.%I to authenticated', tbl);
  end loop;
end;
$$;

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_visible" on public.notifications;
create policy "notifications_select_visible"
  on public.notifications
  for select
  to authenticated
  using (audience is null or audience = auth.uid());

drop policy if exists "notifications_update_visible" on public.notifications;
drop policy if exists "notifications_select_public" on public.notifications;

revoke all on public.notifications from anon;
revoke update, delete, insert on public.notifications from authenticated;
grant  select on public.notifications to authenticated;

insert into public.quests (quest_code, title, description, icon, xp_reward, target, sort_order) values
  ('finish_lesson', 'Finish a lesson',   'Complete any lesson to full marks',        '📘', 20, 1, 1),
  ('perfect_quiz',  'Ace the quiz',      'Get every question right in one run',    '🎯', 30, 1, 2),
  ('chat_community','Join the discussion','Send a message in community chat',      '💬', 15, 1, 3),
  ('study_streak',  'Keep the streak',   'Study on three consecutive days',        '🔥', 25, 3, 4),
  ('all_languages', 'Explore a language', 'Open a lesson from another language',    '🌍', 20, 1, 5)
on conflict (quest_code) do update
  set title = excluded.title,
      description = excluded.description,
      icon = excluded.icon,
      xp_reward = excluded.xp_reward,
      target = excluded.target,
      sort_order = excluded.sort_order;

insert into public.study_rooms (title, topic, is_open, capacity, sort_order)
select v.title, v.topic, v.is_open, v.capacity, v.sort_order
from (values
  ('Merge Sort Deep Dive', 'Algorithms',  true,  8, 1),
  ('Python OOP Q&A',       'OOP',         true,  12, 2),
  ('Graph Theory',         'Data Structures', true, 10, 3),
  ('System Design Clinic','Architecture', false, 6, 4)
) as v(title, topic, is_open, capacity, sort_order)
where not exists (select 1 from public.study_rooms);

insert into public.mentors (name, expertise, bio, next_slot, is_available)
select v.name, v.expertise, v.bio, v.next_slot, v.is_available
from (values
  ('Dr. Budi Santoso', 'Algorithms',
   'PhD in Computer Science, 15 years teaching data structures.',
   date_trunc('day', now()) + interval '1 day 15 hours', true),
  ('Sinta Natalia', 'Web Engineering',
   'Frontend lead, focuses on React performance and accessibility.',
   date_trunc('day', now()) + interval '2 days 10 hours', true),
  ('Rafi Prasetyo', 'Systems',
   'Infrastructure engineer working on distributed databases.',
   null, false)
) as v(name, expertise, bio, next_slot, is_available)
where not exists (select 1 from public.mentors);

insert into public.industry_skills (skill, icon, demand, demand_pct, sort_order)
select v.skill, v.icon, v.demand, v.demand_pct, v.sort_order
from (values
  ('Python',       '🐍', 'Critical',  92, 1),
  ('JavaScript',   '⚡', 'Critical',  88, 2),
  ('React',        '⚛️', 'High',      84, 3),
  ('SQL',          '🗄️', 'High',      79, 4),
  ('TypeScript',   '📘', 'Medium',    72, 5),
  ('Docker',       '🐳', 'Essential', 65, 6),
  ('System Design','🧠', 'High',      76, 7),
  ('Git',          '🔀', 'Essential', 95, 8)
) as v(skill, icon, demand, demand_pct, sort_order)
where not exists (select 1 from public.industry_skills);

insert into public.partners (name, match_pct, website, sort_order)
select v.name, v.match_pct, v.website, v.sort_order
from (values
  ('Tokopedia Engineering', 84, 'https://www.tokopedia.com/careers', 1),
  ('Gojek Tech',            71, 'https://www.gojek.com/careers',    2),
  ('Ruangguru R&D',         68, 'https://www.ruangguru.com',       3)
) as v(name, match_pct, website, sort_order)
where not exists (select 1 from public.partners);

insert into public.notifications (audience, title, body, icon, link_tab)
select null, v.title, v.body, v.icon, v.link_tab
from (values
  ('Welcome to LearnGo',
   'Finish the onboarding wizard to pick your language and learning goal.',
   '👋', 'other'),
  ('New quiz available',
   'The Fundamental IT quiz is ready. Score 10 out of 10 to earn the certification badge.',
   '📝', 'learn')
) as v(title, body, icon, link_tab)
where not exists (
  select 1 from public.notifications n
  where n.title = v.title and n.audience is null
);

do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'user_progress', 'user_quests', 'quests', 'study_rooms', 'mentors'
  ] loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname    = 'supabase_realtime'
        and schemaname = 'public'
        and tablename  = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end;
$$;
