-- 0003_community_chat_realtime.sql
--
-- Tahap 7: chat komunitas realtime.
--
-- Jalankan file ini SETELAH 0001_init.sql dan 0002_quiz_certification.sql.
--
-- Tabel `community_chats` sendiri sudah ada di 0001, begitu juga RLS-nya. Yang
-- belum ada adalah cara membaca NAMA pengirim. Policy `users_select_own` hanya
-- mengizinkan user membaca barisnya sendiri, jadi join client-side ke tabel
-- `users` untuk melihat nama orang lain akan ditolak RLS.
--
-- Solusinya sama seperti `get_leaderboard()` di 0001: RPC `security definer` yang
-- mengembalikan hanya kolom publik. Policy select `users` sengaja TIDAK
-- dilonggarkan untuk keperluan ini.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Pesan + nama pengirim dalam satu panggilan
--
-- Memakai fungsi terpisah per pesan (satu RPC per penulis) akan berarti N+1
-- request saat memuat 50 pesan. Join di dalam fungsi memberi satu round trip.
-- ─────────────────────────────────────────────────────────────────────────────
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

comment on function public.get_chat_messages(integer) is
  '50 pesan terbaru beserta nama pengirim. Dipakai CommunityScreen untuk memuat riwayat chat.';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Resolusi nama untuk pesan realtime
--
-- Event INSERT dari Realtime hanya membawa baris `community_chats` itu sendiri
-- (user_id, message, created_at) - tanpa nama. Client men-cache nama yang sudah
-- diketahui dari hasil pemuatan awal, lalu memanggil fungsi ini hanya untuk
-- user_id yang belum dikenal.
--
-- Menerima array id dan mengembalikan beberapa baris sekaligus, sehingga pesan
-- dari beberapa penulis baru tetap costing satu permintaan.
-- ─────────────────────────────────────────────────────────────────────────────
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
  -- Batasi ukuran array supaya fungsi ini tidak bisa dipakai menarik tabel
  -- `users` penuh lewat satu permintaan.
  limit 200;
$$;

comment on function public.get_chat_authors(uuid[]) is
  'Mengambil nama profil untuk daftar user_id. Dipakai untuk pesan yang masuk lewat Realtime.';

-- Hanya user login. Service_role tetap bisa karena bypass RLS.
revoke execute on function public.get_chat_messages(integer) from public, anon;
revoke execute on function public.get_chat_authors(uuid[]) from public, anon;
grant  execute on function public.get_chat_messages(integer)  to authenticated;
grant  execute on function public.get_chat_authors(uuid[])     to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Pastikan tabel ikut publikasi Realtime
--
-- 0001 sudah menambahkan community_chats ke supabase_realtime, tapi blok itu
-- idempoten dan dilewati kalau tabel sudah terdaftar. Mengulanginya di sini
-- aman: tanpa baris di tabel publikasi, Realtime tidak mengirim apa pun dan
-- chat akan diam-diam tidak sinkron di browser.
-- ─────────────────────────────────────────────────────────────────────────────
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