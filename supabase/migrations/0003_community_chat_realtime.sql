create or replace function public.get_chat_messages(limit_rows integer default 50)
returns table (
  id            uuid,
  user_id       uuid,
  message       text,
  created_at    timestamptz,
  author_name   text,
  author_avatar text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.user_id,
    c.message,
    c.created_at,
    coalesce(u.name, 'Learner') as author_name,
    u.avatar_url                   as author_avatar
  from public.community_chats c
  left join public.users u on u.id = c.user_id
  order by c.created_at desc
  limit least(greatest(limit_rows, 1), 200);
$$;

create or replace function public.get_chat_authors(user_ids uuid[])
returns table (
  id         uuid,
  name       text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, coalesce(u.name, 'Learner'), u.avatar_url
  from public.users u
  where u.id = any(user_ids)
  limit 200;
$$;

revoke execute on function public.get_chat_messages(integer) from public, anon;
revoke execute on function public.get_chat_authors(uuid[]) from public, anon;
grant  execute on function public.get_chat_messages(integer)  to authenticated;
grant  execute on function public.get_chat_authors(uuid[])     to authenticated;

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
