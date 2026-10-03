-- ============================================================================
-- LearnGo - 0001_init
--
-- Jalankan SELURUH file ini di Supabase Dashboard -> SQL Editor -> Run.
-- File aman dijalankan ulang: menggunakan `if not exists` dan `drop policy if
-- exists`, jadi tidak menghapus data yang sudah ada.
--
-- Isi:
--   1. Tabel `users`                - profil + progres gamifikasi
--   2. Tabel `community_chats`      - ruang chat publik (realtime)
--   3. RLS policies                 - wajib, ini yang membatasi akses data
--   4. Trigger on_auth_user_created - profil dibuat otomatis saat login
--   5. Realtime publication         - tanpa ini subscribe tidak akan fire
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL users
--
-- `id` mereferensikan auth.users(id). Row dibuat oleh trigger di bagian 4,
-- bukan oleh client, jadi `id` tidak punya default.
-- ----------------------------------------------------------------------------
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,

  -- Profil dasar (ikut dari Google / Supabase Auth)
  name                text,
  username            text unique,
  avatar_url          text,

  -- Gamifikasi. Default sengaja dibuat sama dengan mock lama di
  -- GameContext.jsx supaya angka pertama yang masuk ke UI terasa konsisten.
  xp                  integer not null default 450,
  level               integer not null default 5,
  xp_to_next          integer not null default 600,
  streak              integer not null default 12,
  lives               integer not null default 5,
  max_lives           integer not null default 5,
  gems                integer not null default 1200,
  keys                integer not null default 3,
  daily_goal_progress integer not null default 40,

  -- Settings
  socratic_mode       text not null default 'strict'
                        check (socratic_mode in ('strict', 'guided')),
  active_lang         text not null default 'python',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.users is
  'Profil LearnGo. Satu row per akun, dibuat otomatis oleh trigger on_auth_user_created.';

-- ----------------------------------------------------------------------------
-- 2. TABEL community_chats
--
-- Ruang publik: semua user yang login boleh baca, tapi hanya boleh menulis
-- dengan user_id milik sendiri. RLS di bagian 3 yang menegakkan itu.
-- ----------------------------------------------------------------------------
create table if not exists public.community_chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  message    text not null check (char_length(trim(message)) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- CommunityScreen mengambil 50 pesan terbaru, jadi index desc sudah cukup.
create index if not exists community_chats_created_at_idx
  on public.community_chats (created_at desc);

create index if not exists community_chats_user_id_idx
  on public.community_chats (user_id);

comment on table public.community_chats is
  'Chat room publik. RLS: semua user boleh baca, hanya boleh tulis baris sendiri.';

-- ----------------------------------------------------------------------------
-- 3. updated_at otomatis
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 4. RLS - ROW LEVEL SECURITY
--
-- Setelah `enable row level security`, setiap baris yang tidak lolos policy
-- menjadi tidak terlihat dan tidak bisa ditulis. Request memakai publishable
-- key (anon role) akanAlways evaluates policy ini.
--
-- service_role tetap bypass RLS - itulah gunanya untuk operasi admin seperti
-- awarding XP (Tahap 6).
-- ----------------------------------------------------------------------------
alter table public.users           enable row level security;
alter table public.community_chats enable row level security;

-- users ---------------------------------------------------------------------
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;

-- Baca hanya baris sendiri.
--
-- Catatan: CommunityScreen butuh daftar member + leaderboard. Karena policy ini
-- menutup rows milik orang lain, daftar member itu tidak bisa diambil langsung
-- dari tabel
-- `users`. Solusinya: panggil RPC `get_leaderboard()` di bagian 5, yang
-- `security definer` dan mengembalikan hanya kolom yang memang publik
-- (name, avatar, level, xp). Jangan longgarkan policy select untuk ini.
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);

-- Row dibuat oleh trigger, bukan client. Policy ini tetap berguna sebagai
-- pengaman kalau nanti ada signup flow yang menulis profil sendiri.
create policy "users_insert_own"
  on public.users
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Update hanya baris sendiri. `with check` menutup celah escalation: tanpa
-- baris ini, user bisa menulis id orang lain lewat `UPDATE ... WHERE`.
create policy "users_update_own"
  on public.users
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keterbatasan yang perlu diketahui: Postgres RLS bekerja di level row, bukan
-- level kolom. Artinya user yang boleh update barisnya sendiri juga bisa
-- mengubah xp/level/gems di baris itu. Untuk demo ini dapat diterima - RLS
-- tetap mencegah user menyentuh data akun LAIN. Kalau nanti perlu XP
-- tamper-proof, hapus policy update ini dan expose Server Action yang menulis
-- lewat service_role key.
-- community_chats ------------------------------------------------------------
drop policy if exists "chats_select_all" on public.community_chats;
drop policy if exists "chats_insert_own" on public.community_chats;
drop policy if exists "chats_update_own" on public.community_chats;
drop policy if exists "chats_delete_own" on public.community_chats;

-- Public room: semua user login boleh baca semua pesan.
create policy "chats_select_all"
  on public.community_chats
  for select
  to authenticated
  using (true);

-- Hanya boleh menulis sebagai diri sendiri.
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

-- ----------------------------------------------------------------------------
-- 5. RPC: leaderboard publik
--
-- Mengembalikan kolom yang memang sudah terlihat di UI (nama, avatar, level,
-- xp, bahasa aktif) tanpa membuka baris `users` milik orang lain.
--
-- SECURITY DEFINER: fungsi berjalan dengan hak pemilik (postgres), jadi
-- policy select di tabel `users` tidak berlaku di dalamnya. Karena itu isi
-- fungsi ini wajib dijaga sempit - jangan pernah menerima parameter bebas dan
-- membangun query dinamis dari situ.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- 6. TRIGGER - buat profil otomatis saat login pertama kali
--
-- SECURITY DEFINER wajib. Trigger ini berjalan dengan hak postgres, bukan hak
-- user yang sedang login; tanpa itu INSERT dari trigger akan ditolak policy RLS.
-- ----------------------------------------------------------------------------
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
    -- Nama dari metadata Google. Fallback ke bagian email sebelum "@" supaya
    -- kolom tidak kosong untuk akun yang tidak menyertakan nama.
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

-- ----------------------------------------------------------------------------
-- 7. REALTIME
--
-- PENTING: tabel harus terdaftar di publication supabase_realtime sebelum
-- `.channel().on('postgres_changes')` bisa fire. Publication default sering
-- tidak menyertakan tabel baru, jadi subscribe akan berhasil diam-diam tapi
-- tidak pernah mengirim event.
--
-- Dibungkus IF NOT EXISTS supaya file ini bisa dijalankan ulang tanpa error.
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- SELESAI
--
-- Verifikasi (SQL Editor, harus return 2 baris dengan rowsecurity = true):
--
--   select tablename, rowsecurity
--   from pg_tables
--   where schemaname = 'public'
--     and tablename in ('users', 'community_chats');
--
-- Lihat TUTORIAL.md bagian 6 untuk uji RLS via curl.
-- ============================================================================