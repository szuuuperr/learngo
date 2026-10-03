create table if not exists public.achievements (
  slug        text primary key,
  title       text not null,
  description text not null,
  icon        text not null,
  xp_reward   integer not null default 0,
  threshold   integer not null default 0,
  check_kind  text not null check (check_kind in (
    'streak', 'quests_done', 'quiz_score', 'summaries', 'leaderboard', 'dsa_track'
  )),
  sort_order  integer not null default 0
);

alter table public.achievements drop constraint if exists achievements_check_kind_check;
alter table public.achievements
  add constraint achievements_check_kind_check
  check (check_kind in (
    'streak', 'quests_done', 'quiz_score', 'summaries', 'leaderboard', 'dsa_track'
  ));

insert into public.achievements
  (slug, title, description, icon, xp_reward, threshold, check_kind, sort_order)
values
  ('streak_master',  'Streak Master',  'Study 7 days in a row',                '🔥', 100, 7,  'streak',      1),
  ('quick_learner',  'Quick Learner',  'Finish 3 daily quests',                '⚡', 75,  3,  'quests_done', 2),
  ('logic_pro',      'Logic Pro',      'Score 10 out of 10 on the quiz',       '🧠', 150, 10, 'quiz_score',  3),
  ('bookworm',       'Bookworm',       'Summarise 10 study documents',          '📚', 120, 10, 'summaries',   4),
  ('top_rank',       'Top Rank',       'Reach the top 5 on the leaderboard',    '🏆', 200, 5,  'leaderboard', 5),
  ('algorithm_ace',  'Algorithm Ace',  'Finish the DSA track',                  '🌟', 250, 10, 'dsa_track',   6)
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      icon = excluded.icon,
      xp_reward = excluded.xp_reward,
      threshold = excluded.threshold,
      check_kind = excluded.check_kind,
      sort_order = excluded.sort_order;

create table if not exists public.user_achievements (
  user_id      uuid not null references public.users(id) on delete cascade,
  slug         text not null references public.achievements(slug) on delete cascade,
  earned_at    timestamptz not null default now(),
  progress_at_award integer,
  primary key (user_id, slug)
);

create index if not exists user_achievements_user_idx
  on public.user_achievements (user_id);

alter table public.user_achievements enable row level security;

drop policy if exists "user_achievements_own" on public.user_achievements;
create policy "user_achievements_own"
  on public.user_achievements
  for select
  to authenticated
  using (auth.uid() = user_id);

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_public" on public.achievements;
create policy "achievements_select_public"
  on public.achievements
  for select
  to authenticated
  using (true);

revoke all on public.achievements from anon;
grant  select on public.achievements to authenticated;
revoke all on public.user_achievements from anon;
grant  select on public.user_achievements to authenticated;

create or replace function public.sync_achievements()
returns table (slug text, title text, icon text, xp_reward integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  target     public.users%rowtype;
  quests_hit integer;
  summary_docs integer;
  best_score integer;
  top_count  integer;
  dsa_done   integer;
  slug_hit   text;
  newly      text[] := '{}';
begin
  if current_id is null then
    return;
  end if;

  select * into target from public.users where id = current_id;
  if not found then
    return;
  end if;

  select count(*) into quests_hit
    from public.user_quests
   where user_id = current_id
     and done
     and day = current_date;

  select count(*) into summary_docs
    from public.summaries where user_id = current_id;

  select coalesce(max(correct), 0) into best_score
    from public.quiz_attempts
   where user_id = current_id;

  select count(*) + 1 into top_count
    from public.users other
   where other.xp > target.xp;

  select count(*) into dsa_done
    from public.user_progress
   where user_id = current_id
     and lang = 'dsa'
     and array_length(completed_levels, 1) >= 10;

  for slug_hit in
    select a.slug
      from public.achievements a
     where (a.check_kind = 'streak'      and target.streak >= a.threshold)
        or (a.check_kind = 'quests_done' and quests_hit    >= a.threshold)
        or (a.check_kind = 'quiz_score'  and best_score   >= a.threshold)
        or (a.check_kind = 'summaries'   and summary_docs >= a.threshold)
        or (a.check_kind = 'leaderboard' and top_count     <= a.threshold)
        or (a.check_kind = 'dsa_track'   and dsa_done      >= a.threshold)
  loop
    insert into public.user_achievements (user_id, slug, progress_at_award)
    values (
      current_id,
      slug_hit,
      case (select a.check_kind from public.achievements a where a.slug = slug_hit)
        when 'streak'      then target.streak
        when 'quests_done' then quests_hit
        when 'quiz_score'  then best_score
        when 'summaries'   then summary_docs
        when 'leaderboard' then top_count
        when 'dsa_track'   then dsa_done
      end
    )
    on conflict on constraint user_achievements_pkey do nothing;

    if found then
      newly := array_append(newly, slug_hit);
    end if;
  end loop;

  return query
    select a.slug, a.title, a.icon, a.xp_reward
      from public.achievements a
     where a.slug = any (newly)
     order by a.sort_order;
end;
$$;

revoke execute on function public.sync_achievements() from public, anon;
grant  execute on function public.sync_achievements() to authenticated;

create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  correct    integer not null check (correct between 0 and 10),
  xp_gain    integer not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx
  on public.quiz_attempts (user_id, created_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_attempts_own" on public.quiz_attempts;
create policy "quiz_attempts_own"
  on public.quiz_attempts
  for select
  to authenticated
  using (auth.uid() = user_id);

create table if not exists public.summaries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  filename   text not null,
  page_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists summaries_user_idx
  on public.summaries (user_id, created_at desc);

alter table public.summaries enable row level security;

drop policy if exists "summaries_own" on public.summaries;
create policy "summaries_own"
  on public.summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke insert, update, delete on public.summaries from authenticated;

create or replace function public.record_summary(p_filename text, p_page_count integer default 0)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  earned_count integer;
  granted     integer;
begin
  if current_id is null then
    raise exception 'You must be signed in to save a summary.';
  end if;

  if p_filename is null or btrim(p_filename) = '' then
    raise exception 'filename must not be empty.';
  end if;

  insert into public.summaries (user_id, filename, page_count)
  values (current_id, btrim(p_filename), greatest(coalesce(p_page_count, 0), 0));

  select count(*) into earned_count from public.sync_achievements();

  return earned_count;
end;
$$;

revoke execute on function public.record_summary(text, integer) from public, anon;
grant  execute on function public.record_summary(text, integer) to authenticated;

create table if not exists public.daily_activity (
  user_id    uuid not null references public.users(id) on delete cascade,
  day        date not null default current_date,
  xp_earned  integer not null default 0,
  primary key (user_id, day)
);

create index if not exists daily_activity_day_idx
  on public.daily_activity (day desc);

alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_own" on public.daily_activity;
create policy "daily_activity_own"
  on public.daily_activity
  for select
  to authenticated
  using (auth.uid() = user_id);

drop function if exists public.award_gameplay_xp(integer, integer, integer, integer, integer, integer);
drop function if exists public.award_quiz_xp(integer);

create function public.award_gameplay_xp(
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
  daily_goal_progress integer,
  achievements  jsonb
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
  next_streak   integer;
  next_lives    integer;
  next_gems     integer;
  next_keys     integer;
  next_progress integer;
  granted       integer;
  unlocked      jsonb := '[]'::jsonb;
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

  granted        := least(greatest(coalesce(xp_gain, 0), 0), 500);
  next_xp        := row_users.xp + granted;
  next_level     := row_users.level;
  next_threshold := row_users.xp_to_next;

  if next_threshold is null or next_threshold <= 0 then
    next_threshold := 600;
  end if;

  while next_xp >= next_threshold loop
    next_level     := next_level + 1;
    next_threshold := round(next_threshold * 1.3);
  end loop;

  next_streak   := row_users.streak;
  next_lives    := row_users.lives;
  next_gems     := row_users.gems + greatest(gems_gain, 0);
  next_keys     := row_users.keys + greatest(keys_gain, 0);
  next_progress := row_users.daily_goal_progress;

  if new_streak is not null then
    next_streak := least(greatest(new_streak, 0), 365);
  end if;

  if new_lives is not null then
    next_lives := least(greatest(new_lives, 0), row_users.max_lives);
  end if;

  if new_progress is not null then
    next_progress := least(greatest(new_progress, 0), 100);
  end if;

  update public.users
     set xp    = next_xp,
         level = next_level,
         xp_to_next = next_threshold,
         streak   = next_streak,
         lives    = next_lives,
         gems     = next_gems,
         keys     = next_keys,
         daily_goal_progress = next_progress
   where id = current_id;

  if granted > 0 then
insert into public.daily_activity (user_id, day, xp_earned)
  values (current_id, current_date, granted)
  on conflict on constraint daily_activity_pkey do update
    set xp_earned = public.daily_activity.xp_earned + excluded.xp_earned;
  end if;

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'slug', sa.slug,
             'title', sa.title,
             'icon', sa.icon,
             'xp_reward', sa.xp_reward
           ) order by sa.title),
           '[]'::jsonb
         )
    into unlocked
    from public.sync_achievements() sa;

  return query
    select next_xp, next_level, next_threshold, next_streak, next_lives,
           next_gems, next_keys, next_progress, unlocked;
end;
$$;

create function public.award_quiz_xp(correct_count integer)
returns table (xp integer, level integer, is_certified boolean, achievements jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  xp_gain    integer;
  new_xp     integer;
  new_level  integer;
  new_xp_to_next integer;
  new_certified boolean;
  unlocked      jsonb := '[]'::jsonb;
begin
  if current_id is null then
    raise exception 'You must be signed in to earn XP.';
  end if;

  if correct_count < 0 or correct_count > 10 then
    raise exception 'correct_count must be between 0 and 10, got %', correct_count;
  end if;

  xp_gain := correct_count * 10;

  select u.xp, u.level, u.xp_to_next, u.is_certified
    into new_xp, new_level, new_xp_to_next, new_certified
    from public.users u
   where u.id = current_id
     for update;

  if not found then
    raise exception 'No profile found for the current user.';
  end if;

  new_xp := new_xp + xp_gain;

  if new_xp_to_next is null or new_xp_to_next <= 0 then
    new_xp_to_next := 600;
  end if;

  while new_xp >= new_xp_to_next loop
    new_level := new_level + 1;
    new_xp_to_next := round(new_xp_to_next * 1.3);
  end loop;

  new_certified := coalesce(new_certified, false) or (xp_gain >= 100);

  update public.users
     set xp = new_xp,
         level = new_level,
         xp_to_next = new_xp_to_next,
         is_certified = new_certified
   where id = current_id;

  insert into public.quiz_attempts (user_id, correct, xp_gain)
  values (current_id, correct_count, xp_gain);

  if xp_gain > 0 then
    insert into public.daily_activity (user_id, day, xp_earned)
    values (current_id, current_date, xp_gain)
    on conflict on constraint daily_activity_pkey do update
      set xp_earned = public.daily_activity.xp_earned + excluded.xp_earned;
  end if;

  select coalesce(
           jsonb_agg(jsonb_build_object(
             'slug', sa.slug, 'title', sa.title,
             'icon', sa.icon, 'xp_reward', sa.xp_reward
           ) order by sa.title),
           '[]'::jsonb
         )
    into unlocked
    from public.sync_achievements() sa;

  return query select new_xp, new_level, new_certified, unlocked;
end;
$$;

revoke execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) from public, anon;
grant  execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) to authenticated;
revoke execute on function public.award_quiz_xp(integer) from public, anon;
grant  execute on function public.award_quiz_xp(integer) to authenticated;

create or replace function public.save_level_progress(
  lang text,
  levels integer[] default null,
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

  if levels is not null then
    insert into public.user_progress (user_id, lang, completed_levels)
    values (auth.uid(), lang, levels)
    on conflict on constraint user_progress_pkey do update
      set completed_levels = excluded.completed_levels;
  end if;

  if quest_code is not null then
    insert into public.user_quests (user_id, quest_code, done)
    values (auth.uid(), quest_code, quest_done)
    on conflict on constraint user_quests_pkey do update
      set done = excluded.done;
  end if;

  perform public.sync_achievements();
end;
$$;

create or replace function public.sync_daily_quests()
returns table (quest_code text, xp_reward integer, unlocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  lessons_done integer;
  best_score  integer;
  chat_posts   integer;
  streak_len   integer;
  langs_touched integer;
  catalog_row  record;
begin
  if current_id is null then
    return;
  end if;

  select count(*) into lessons_done
    from public.user_progress
   where user_id = current_id
     and array_length(completed_levels, 1) > 0;

  select coalesce(max(correct), 0) into best_score
    from public.quiz_attempts
   where user_id = current_id;

  select count(*) into chat_posts
    from public.community_chats
   where user_id = current_id;

  with days as (
    select distinct a.day
      from public.daily_activity a
     where a.user_id = current_id
       and a.day <= current_date
     order by a.day desc
     limit 30
  ), ranked as (
    select d.day,
           row_number() over (order by d.day desc) as pos,
           current_date - d.day as gap
      from days d
  )
  select count(*) into streak_len
    from ranked
   where gap = pos - 1;

  select count(*) into langs_touched
    from public.user_progress
   where user_id = current_id
     and array_length(completed_levels, 1) > 0;

  for catalog_row in
    select q.quest_code, q.xp_reward, q.target
      from public.quests q
     order by q.sort_order
  loop
    unlocked := case catalog_row.quest_code
      when 'finish_lesson'   then lessons_done > 0
      when 'perfect_quiz'    then best_score >= 10
      when 'chat_community'  then chat_posts > 0
      when 'study_streak'    then streak_len >= greatest(catalog_row.target, 1)
      when 'all_languages'   then langs_touched >= 2
      else false
    end;

    if unlocked then
      insert into public.user_quests (user_id, quest_code, done)
      values (current_id, catalog_row.quest_code, true)
      on conflict on constraint user_quests_pkey do nothing;

      if found then
        perform public.award_gameplay_xp(
          xp_gain => catalog_row.xp_reward,
          gems_gain => greatest(catalog_row.xp_reward / 5, 1)
        );
      end if;
    end if;

    quest_code := catalog_row.quest_code;
    xp_reward  := case when unlocked then catalog_row.xp_reward else 0 end;
    return next;
  end loop;
end;
$$;

revoke execute on function public.sync_daily_quests() from public, anon;
grant  execute on function public.sync_daily_quests() to authenticated;

create or replace function public.get_recent_activity(days_back integer default 13)
returns table (day date, xp_earned integer)
language sql
stable
security definer
set search_path = public
as $$
  select current_date - d.offset_days as day,
         coalesce(a.xp_earned, 0) as xp_earned
    from generate_series(0, least(greatest(days_back, 0), 60)) as d(offset_days)
    left join public.daily_activity a
      on a.user_id = auth.uid()
     and a.day = current_date - d.offset_days
   order by d.offset_days desc;
$$;

revoke execute on function public.get_recent_activity(integer) from public, anon;
grant  execute on function public.get_recent_activity(integer) to authenticated;

create or replace function public.get_quiz_history(limit_rows integer default 5)
returns table (
  id         uuid,
  correct    integer,
  xp_gain    integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select q.id, q.correct, q.xp_gain, q.created_at
    from public.quiz_attempts q
   where q.user_id = auth.uid()
   order by q.created_at desc
   limit least(greatest(limit_rows, 1), 50);
$$;

revoke execute on function public.get_quiz_history(integer) from public, anon;
grant  execute on function public.get_quiz_history(integer) to authenticated;

create or replace function public.mark_notifications_read(ids uuid[] default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  touched    integer;
begin
  if current_id is null then
    raise exception 'You must be signed in to mark notifications.';
  end if;

  update public.notifications n
     set read_by = case
                     when current_id = any (n.read_by) then n.read_by
                     else array_append(n.read_by, current_id)
                   end
   where (audience is null or audience = current_id)
     and (ids is null or n.id = any (ids))
     and not (current_id = any (n.read_by));

  get diagnostics touched = row_count;
  return touched;
end;
$$;

revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant  execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function public.reset_user_progress()
returns table (
  xp integer, level integer, xp_to_next integer,
  streak integer, lives integer, max_lives integer,
  gems integer, keys integer, is_certified boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
begin
  if current_id is null then
    raise exception 'You must be signed in to reset progress.';
  end if;

  delete from public.user_progress      where user_id = current_id;
  delete from public.user_quests       where user_id = current_id;
  delete from public.user_achievements where user_id = current_id;
  delete from public.daily_activity    where user_id = current_id;
  delete from public.quiz_attempts     where user_id = current_id;
  delete from public.summaries         where user_id = current_id;

  update public.users u
     set xp = 0,
         level = 1,
         xp_to_next = 600,
         streak = 0,
         lives = u.max_lives,
         gems = 0,
         keys = 0,
         daily_goal_progress = 0,
         is_certified = false
   where u.id = current_id;

  if not found then
    raise exception 'No profile found for the current user.';
  end if;

  return query
    select u.xp, u.level, u.xp_to_next, u.streak, u.lives, u.max_lives,
           u.gems, u.keys, u.is_certified
      from public.users u
     where u.id = current_id;
end;
$$;

revoke execute on function public.reset_user_progress() from public, anon;
grant  execute on function public.reset_user_progress() to authenticated;

create or replace function public.get_user_badges()
returns table (
  slug       text,
  title      text,
  description text,
  icon       text,
  earned_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.slug, a.title, a.description, a.icon, ua.earned_at
    from public.user_achievements ua
    join public.achievements a on a.slug = ua.slug
   where ua.user_id = auth.uid()
   order by ua.earned_at desc;
$$;

revoke execute on function public.get_user_badges() from public, anon;
grant  execute on function public.get_user_badges() to authenticated;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['achievements', 'user_achievements', 'daily_activity'] loop
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end;
$$;
