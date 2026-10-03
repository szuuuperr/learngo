alter table public.users
  add column if not exists is_certified boolean not null default false;

revoke update on public.users from authenticated;
grant  update (name, username, avatar_url, socratic_mode, active_lang)
  on public.users to authenticated;

create or replace function public.award_quiz_xp(correct_count integer)
returns table (xp integer, level integer, is_certified boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid := auth.uid();
  new_xp integer;
  new_level integer;
  new_certified boolean;
  xp_gain integer;
  new_xp_to_next integer;
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

  return query select new_xp, new_level, new_certified;
end;
$$;

revoke execute on function public.award_quiz_xp(integer) from public, anon;
grant  execute on function public.award_quiz_xp(integer) to authenticated;
