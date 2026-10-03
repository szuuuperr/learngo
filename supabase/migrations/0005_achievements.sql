-- 0005_achievements.sql
--
-- Tahap 8 bagian 2: achievements dan streak calendar.
--
-- Latar belakang. Badge sebelumnya di-hardcode sebagai array string di
-- mockData.js, lalu dirender sebagai "unlocked: true" di dua tempat berbeda yang
-- tidak pernah agreeing satu sama lain. Tidak ada satu pun sumber kebenaran,
-- dan tidak ada cara memastikan achievement itu benar-benar dicapai.
-- Achievements sekarang punya definisi di tabel katalog dan CONDATE per user,
-- awarded dari sisi server pada aksi yang memang bisa dibuktikan.
--
-- Jalankan file ini SETELAH 0001, 0002, 0003, dan 0004.

-- ═════════════════════════════════════════════════════════════════════════════
-- 1. DEFINISI ACHIEVEMENT
--
-- `requirement` disimpan sebagai teks supaya UI bisa menampilkannya apa adanya,
-- dan `check_kind` memberi tahu client dari mana statusnya berasal. Nilai
-- check_kind adalah 'derived', artinya status dihitung dari angka profil user
-- sendiri dan tidak perlu disimpan terpisah.
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.achievements (
  slug        text primary key,
  title       text not null,
  description text not null,
  icon        text not null,
  xp_reward   integer not null default 0,
  -- Ambang yang harus dicapai user: streak 7 hari, 3 quest, skor kuis 10/10.
  threshold   integer not null default 0,
  -- Sumber angka yang dipakai server saat deciding achievement. Daftar ini harus
  -- sama persis dengan cabang di sync_achievements, karena check di bawah
  -- menolak nilai yang tidak dikenal. Kalau ditambah achievement baru di sini
  -- tanpa menambah cabangnya di sync_achievements, syaratnya tidak akan pernah
  -- terpenuhi.
  check_kind  text not null check (check_kind in (
    'streak', 'quests_done', 'quiz_score', 'summaries', 'leaderboard', 'dsa_track'
  )),
  sort_order  integer not null default 0
);

-- Constraint check_kind ditulis ulang secara eksplisit, bukan hanya lewat
-- `create table if not exists`. Kalau tabel achievements sudah ada dari
-- percobaan sebelumnya dengan daftar nilai yang lebih sempit, perintah create
-- akan dilewati dan check constraint lama tetap menolak enam achievement di
-- seed di bawah. Nama constraint Postgres otomatis, jadi ini yang harus
-- dijatuhkan. Harus berada sebelum insert seed di bawah.
alter table public.achievements drop constraint if exists achievements_check_kind_check;
alter table public.achievements
  add constraint achievements_check_kind_check
  check (check_kind in (
    'streak', 'quests_done', 'quiz_score', 'summaries', 'leaderboard', 'dsa_track'
  ));

comment on table public.achievements is
  'Definisi achievement. Status terbuka dihitung server dari profil user, bukan disimpan manual.';

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

-- ═════════════════════════════════════════════════════════════════════════════
-- 2. ACHIEVEMENT YANG SUDAH DIRAIHKAN
--
-- Dicatat server-side pada aksi yang memang bisa dibuktikan. Baris ini tidak
-- pernah dihapus, jadi achievement yang sudah didapat tidak hilang kalau user
-- nanti tidak lagi memenuhi syaratnya.
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.user_achievements (
  user_id      uuid not null references public.users(id) on delete cascade,
  slug         text not null references public.achievements(slug) on delete cascade,
  earned_at    timestamptz not null default now(),
  -- Nilai yang memenuhi syarat saat itu, disimpan supaya UI bisa menampilkan
  -- "reached 8500 XP" alih-alih angka yang tidak jelas asal-usulnya.
  progress_at_award integer,
  primary key (user_id, slug)
);

comment on table public.user_achievements is
  'Achievement yang sudah diraih. Ditulis oleh RPC server, tidak pernah oleh client.';

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

-- ═════════════════════════════════════════════════════════════════════════════
-- 3. FUNGSI PENGECEK ACHIEVEMENT
--
-- Satu tempat yang memutuskan achievement mana yang baru terbuka, dipakai oleh
-- award_gameplay_xp dan award_quiz_xp. Mengambil angka langsung dari baris
-- profile yang sudah dikunci, bukan dari parameter, supaya tidak bisa diberikan
-- angka berbeda oleh client.
--
-- on conflict do nothing membuat pemanggilan berulang aman: quest yang selesai
-- dua kali tidak menghasilkan achievement dobel.
-- ═════════════════════════════════════════════════════════════════════════════
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
    return; -- dipanggil tanpa session, tidak ada yang bisa diberikan.
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

  -- Nama variabel `summaries` sengaja diubah menjadi summary_docs: kalau
  -- tetap `summaries`, plpgsql mengira itu kolom tabel summaries pada select
  -- di bawah dan menolak dengan "column reference summaries is ambiguous".
  select count(*) into summary_docs
    from public.summaries where user_id = current_id;

  select coalesce(max(correct), 0) into best_score
    from public.quiz_attempts
   where user_id = current_id;

  -- Peringkat user sendiri di leaderboard. Menghitung langsung lebih murah
  -- daripada memanggil get_leaderboard() yang mengurutkan seluruh tabel.
  select count(*) + 1 into top_count
    from public.users other
   where other.xp > target.xp;

  select count(*) into dsa_done
    from public.user_progress
   where user_id = current_id
     and lang = 'dsa'
     and array_length(completed_levels, 1) >= 10;

  -- Satu loop untuk semua jenis. Enam insert terpisah dengan syarat berbeda akan
  -- menghasilkan enam tempat yang harus diubah kalau ada achievement baru,
  -- dan itu sumber bug yang mahal. SELECT di bawah hanya menghasilkan baris
  -- achievement yang syaratnya sudah terpenuhi.
  for slug_hit in
    select a.slug
      from public.achievements a
     where (a.check_kind = 'streak'      and target.streak >= a.threshold)
        or (a.check_kind = 'quests_done' and quests_hit    >= a.threshold)
        or (a.check_kind = 'quiz_score'  and best_score   >= a.threshold)
        or (a.check_kind = 'summaries'   and summary_docs >= a.threshold)
        -- leaderboard dibalik: makin kecil peringkatnya makin baik.
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
    -- Nama constraint, bukan daftar kolom: OUT parameter fungsi ini bernama
    -- `slug`, sama dengan kolom user_achievements, dan plpgsql akan menolak
    -- `on conflict (user_id, slug)` dengan "column reference slug is ambiguous".
    on conflict on constraint user_achievements_pkey do nothing;

    -- FOUND bernilai true hanya kalau baris benar-benar disisipkan, jadi ini
    -- yang membedakan achievement baru dari achievement yang sudah dimiliki.
    if found then
      newly := array_append(newly, slug_hit);
    end if;
  end loop;

  -- Kembalikan hanya yang baru terbuka pada pemanggilan ini, supaya UI bisa
  -- menampilkan toast tepat satu kali dan tidak mengulang achievement lama.
  return query
    select a.slug, a.title, a.icon, a.xp_reward
      from public.achievements a
     where a.slug = any (newly)
     order by a.sort_order;
end;
$$;

comment on function public.sync_achievements() is
  'Mengecek achievement yang baru terbuka dan mengembalikannya. Dipanggil setelah award_gameplay_xp dan award_quiz_xp.';

revoke execute on function public.sync_achievements() from public, anon;
grant  execute on function public.sync_achievements() to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 4. TABEL YANG DIPERLUKAN sync_achievements
--
-- quiz_attempts dan summaries menyimpan riwayat supaya achievement berbasis
-- "skor terbaik" dan "jumlah dokumen" punya sumber data nyata. Keduanya juga
-- berguna sendiri: halaman Other bisa menampilkan riwayat kuis yang sebenarnya.
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.quiz_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  correct    integer not null check (correct between 0 and 10),
  xp_gain    integer not null,
  created_at timestamptz not null default now()
);

comment on table public.quiz_attempts is
  'Riwayat percobaan kuis. Sumber achievement Logic Pro.';

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

comment on table public.summaries is
  'Dokumen yang sudah diringkas. Sumber achievement Bookworm.';

create index if not exists summaries_user_idx
  on public.summaries (user_id, created_at desc);

alter table public.summaries enable row level security;

drop policy if exists "summaries_own" on public.summaries;
create policy "summaries_own"
  on public.summaries
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Tidak ada policy INSERT. Baris hanya boleh dibuat lewat record_summary di
-- bawah, supaya filename dan page_count yang dihitung route summarize tidak
-- datang bebas dari client dan achievement Bookworm punya sumber yang jelas.
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

  -- Bookworm dihitung ulang setelah baris masuk supaya syaratnya benar-benar
  -- terpenuhi oleh dokumen yang sudah diringkas, bukan oleh tebakan client.
  select count(*) into earned_count from public.sync_achievements();

  return earned_count;
end;
$$;

comment on function public.record_summary(text, integer) is
  'Mencatat satu dokumen yang sudah diringkas. Dipanggil route summarize.';

revoke execute on function public.record_summary(text, integer) from public, anon;
grant  execute on function public.record_summary(text, integer) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 5. RIHARIAN AKTIVITAS HARIAN
--
-- Kolom `day` menyimpan tanggal unik hari belajar. Kalender streak membaca
-- kolom ini, jadi kalender menampilkan hari yang benar-benar ada aktivitasnya,
-- bukan pola tujuh hari yang selalu sama.
-- ═════════════════════════════════════════════════════════════════════════════
create table if not exists public.daily_activity (
  user_id    uuid not null references public.users(id) on delete cascade,
  day        date not null default current_date,
  xp_earned  integer not null default 0,
  primary key (user_id, day)
);

comment on table public.daily_activity is
  'Aktivitas belajar per hari. Dasar untuk streak calendar dan klaim streak.';

create index if not exists daily_activity_day_idx
  on public.daily_activity (day desc);

alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_own" on public.daily_activity;
create policy "daily_activity_own"
  on public.daily_activity
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- 6. RPC award_gameplay_xp dan award_quiz_xp DIPERBARUI
--
-- Fungsi versi 0004 tidak pernah menyentuh achievement dan tidak mencatat
-- aktivitas harian, sehingga streak tidak akan pernah naik sendiri.
--
-- Dua fungsi di bawah ditambah kolom kembalian `achievements`, jadi definisi
-- lama harus DIBUANG dulu. PostgreSQL menolak create or replace yang mengubah
-- jumlah atau tipe kolom result: "cannot change return type of existing
-- function". Signature parameter-nya tetap sama persis, jadi pemanggil
-- GameContext dan /api/quiz tidak perlu berubah. Grant di bawah juga ditulis
-- ulang karena drop function ikut menghapus hak aksesnya.
-- ═════════════════════════════════════════════════════════════════════════════
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
  -- Achievement yang baru terbuka pada pemanggilan ini. Dikembalikan agar
  -- client bisa menampilkan toast tanpa perlu RPC kedua.
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

  -- xp_gain di-clamp. Parameter ini masih dikirim client karena GameContext
  -- memanggil fungsi yang sama dari beberapa tempat, jadi tanpa batas
  -- award_gameplay_xp(xp_gain => 999999) langsung menaikkan level berkali-kali
  -- dalam satu request. Batas 500 dipilih di atas nilai terbesar yang
  -- dikirim aplikasi: satu lesson 10 XP, satu kuis 25 XP per soal, dan quest
  -- harian paling besar 30 XP.
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

  -- Kelima nilai di bawah sudah dihitung dari row_users, bukan dibaca sebagai
  -- nama kolom telanjang di dalam UPDATE. OUT parameter fungsi ini bernama
  -- streak, lives, gems, keys, dan daily_goal_progress, sama persis dengan
  -- kolom users, jadi plpgsql akan menolak `streak` tanpa prefiks dengan
  -- "column reference streak is ambiguous".
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

  -- Catat aktivitas hari ini kalau ada XP yang benar-benar diperoleh. Yang
  -- ditulis adalah nilai setelah clamp, bukan xp_gain mentah, supaya kalender
  -- dan streak memakai angka yang sama dengan users.xp. Baris dengan 0 XP tidak
  -- dicatat supaya satu klik yang tidak mendekati lesson tidak terhitung sebagai
  -- hari belajar.
  if granted > 0 then
insert into public.daily_activity (user_id, day, xp_earned)
  values (current_id, current_date, granted)
  on conflict on constraint daily_activity_pkey do update
    set xp_earned = public.daily_activity.xp_earned + excluded.xp_earned;
  end if;

  -- sync_achievements mengembalikan baris achievement yang baru terbuka.
  -- Diterjemahkan ke jsonb supaya jadi satu kolom di tabel kembalian.
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

  -- Kolom kembalian memakai variabel next_* yang sama dengan yang ditulis ke
  -- tabel users. Menulis `streak` atau `gems` di sini akan membaca OUT
  -- parameter yang tidak pernah diisi, sehingga client menerima NULL dan
  -- menimpanya ke state sebagai angka kosong.
  return query
    select next_xp, next_level, next_threshold, next_streak, next_lives,
           next_gems, next_keys, next_progress, unlocked;
end;
$$;

-- Signature sengaja dipertahankan persis seperti 0002, termasuk nama parameter
-- `correct_count` dan urutan kolom kembalian, supaya route /api/quiz yang
-- memanggilnya secara posisional tidak perlu diubah.
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

  -- Riwayat dicatat supaya achievement berbasis skor terbaik punya sumber data.
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

-- Grant diulang di sini karena kedua fungsi tadi dijatuhkan sebelum dibuat
-- ulang, dan drop function menghapus hak akses yang sebelumnya sudah diberi.
comment on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) is
  'Menambah XP gameplay, mencatat aktivitas harian, dan mengembalikan achievement yang baru terbuka.';
comment on function public.award_quiz_xp(integer) is
  'Menambah XP kuis, mencatat percobaan, dan menentukan is_certified.';

revoke execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) from public, anon;
grant  execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) to authenticated;
revoke execute on function public.award_quiz_xp(integer) from public, anon;
grant  execute on function public.award_quiz_xp(integer) to authenticated;

-- `levels` boleh null. Klien yang hanya menyelesaikan quest mengirim levels
-- null dan expects baris user_progress miliknya tidak tersentuh sama sekali.
-- Versi sebelumnya memakai levels integer[] dengan default '{}', jadi
-- completeQuest() yang mengirim levels: [] menimpa progres lesson user dengan
-- array kosong setiap kali satu quest diselesaikan. Null membuat "tidak ada
-- perubahan" dan array kosong menjadi "hapus semua progres", dua hal yang
-- sebelumnya tercampur jadi satu.
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

  -- Baris progress hanya ditulis kalau levels benar-benar dikirim. Menghapus
  -- seluruh progres harus jadi keputusan eksplisit, bukan efek samping quest.
  -- Kedua upsert memakai NAMA CONSTRAINT, bukan daftar kolom. Parameter
  -- `lang` dan `quest_code` punya nama yang sama dengan kolom tujuan, jadi
  -- `on conflict (user_id, lang)` ditolak dengan "column reference lang is
  -- ambiguous". Nama constraint tidak pernah ditafsirkan sebagai variabel.
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

-- ═════════════════════════════════════════════════════════════════════════════
-- 7. QUEST DAILY: SELESAI KARENA AKTIVITAS NYATA
--
-- Sebelumnya satu klik pada kartu quest langsung menulis done = true di
-- user_quests lalu membayar XP. Itu membuat quest tanpa syarat: user bisa
-- membuka tab Quests, mengklik lima quest, lalu mendapat 110 XP tanpa
-- menyelesaikan satu pun lesson. Klien tidak lagi boleh menandai quest
-- selesai; server yang mengevaluasi tiap quest dari data yang sudah ada.
--
-- Fungsi ini idempoten lewat on conflict do nothing, jadi boleh dipanggil
-- setiap kali halaman Quests dibuka.
-- ═════════════════════════════════════════════════════════════════════════════
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

  -- Panjang streak dihitung dari daily_activity, bukan dari kolom streak di
  -- users, supaya tidak bisa terlihat selesai tanpa hari yang tercatat.
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
    -- Setiap syarat dihitung dari tabel yang menyimpan aksi aslinya.
    -- check_kind bukan lagi kolom quests, jadi pemetaannya ada di sini dan
    -- satu tempat saja.
    unlocked := case catalog_row.quest_code
      when 'finish_lesson'   then lessons_done > 0
      when 'perfect_quiz'    then best_score >= 10
      when 'chat_community'  then chat_posts > 0
      when 'study_streak'    then streak_len >= greatest(catalog_row.target, 1)
      when 'all_languages'   then langs_touched >= 2
      else false
    end;

    if unlocked then
      -- ON CONFLICT ditulis dengan NAMA CONSTRAINT, bukan daftar kolom.
      -- Daftar kolom membuat plpgsql salah membaca nama itu sebagai variabel
      -- OUT `quest_code` yang ada di scope fungsi ini, dan Postgres menolak
      -- dengan "column reference quest_code is ambiguous" tepat saat ada quest
      -- yang terbuka. Nama constraint tidak pernah bertabrakan dengan variabel.
      insert into public.user_quests (user_id, quest_code, done)
      values (current_id, catalog_row.quest_code, true)
      on conflict on constraint user_quests_pkey do nothing;

      -- Bayar XP hanya saat baris benar-benar baru dibuat.
      if found then
        perform public.award_gameplay_xp(
          xp_gain => catalog_row.xp_reward,
          gems_gain => greatest(catalog_row.xp_reward / 5, 1)
        );
      end if;
    end if;

    -- OUT parameter harus diisi eksplisit. `return next` tanpa ekspresi
    -- membaca nilai OUT parameter, bukan field record, jadi
    -- catalog_row.quest_code tidak otomatis ikut terbawa. Tanpa dua baris
    -- pertama di sini client menerima quest_code null dan tidak pernah tahu
    -- quest mana yang baru terbuka.
    quest_code := catalog_row.quest_code;
    xp_reward  := case when unlocked then catalog_row.xp_reward else 0 end;
    return next;
  end loop;
end;
$$;

comment on function public.sync_daily_quests() is
  'Menilai quest harian dari aktivitas nyata lalu membayar XP sekali per quest per hari.';

revoke execute on function public.sync_daily_quests() from public, anon;
grant  execute on function public.sync_daily_quests() to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. RPC baca untuk UI
-- ═════════════════════════════════════════════════════════════════════════════

-- Satu panggilan untuk seluruh data streak calendar. Mengembalikan tanggal
-- dalam 14 hari terakhir supaya client tidak perlu menghitung rentang sendiri
-- dan tidak pernah salah menghitung hari yang belum terjadi.
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

comment on function public.get_recent_activity(integer) is
  'Aktivitas XP untuk streak calendar. Nol berarti tidak ada aktivitas pada hari itu.';

revoke execute on function public.get_recent_activity(integer) from public, anon;
grant  execute on function public.get_recent_activity(integer) to authenticated;

-- Riwayat kuis untuk halaman Other.
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

-- Menandai notifikasi terbaca.
--
-- Ini harus lewat fungsi, bukan UPDATE langsung dari client. Kalau client menulis
-- `read_by = '{uuid}'`, setiap user yang membuka halaman akan menghapus penanda
-- milik user lain: notifikasi yang sudah dibaca A akan terlihat belum dibaca
-- oleh B. Fungsi ini hanya menambah id, jadi tidak ada yang hilang.
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

  -- ids null berarti tandai semua yang terlihat. Baris broadcast dan baris
  -- milik sendiri adalah satu-satunya kandidat, jadi hasil fungsi ini tidak
  -- bergantung pada policy yang mungkin berubah di kemudian hari.
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

comment on function public.mark_notifications_read(uuid[]) is
  'Menambah id user ke read_by tanpa menimpa user lain. ids null = tandai semua.';

revoke execute on function public.mark_notifications_read(uuid[]) from public, anon;
grant  execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- 9. RESET PROGRESS
--
-- Tombol Reset di halaman Other menyebut menghapus XP, level, dan riwayat
-- quest. Versi lama melakukannya dari client: menghapus baris user_progress dan
-- user_quests, lalu memanggil award_gameplay_xp dengan delta nol.
--
-- Dua masalah. award_gameplay_xp menambah XP, jadi delta nol hanya menulis ulang
-- angka yang sama dan xp tidak pernah kembali ke nol. Dan achievement, riwayat
-- kuis, serta aktivitas harian tidak tersentuh, sehingga kalender_activity dan
-- lencana masih menampilkan lama setelah reset.
--
-- Fungsi ini mengembalikan profil ke kondisi seperti akun yang baru daftar.
-- ═════════════════════════════════════════════════════════════════════════════
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

  -- Riwayat dihapus lebih dulu supaya tidak ada baris yang bentrok dengan baris
  -- profil yang ditulis ulang di bawah. summaries ikut dihapus: achievement
  -- "bookworm" menghitung baris di tabel itu, jadi kalau ringkasan tetap ada
  -- sementara user_achievements dikosongkan, lencana itu terbuka lagi di
  -- panggilan sync berikutnya tanpa pengguna membuat ringkasan baru.
  delete from public.user_progress      where user_id = current_id;
  delete from public.user_quests       where user_id = current_id;
  delete from public.user_achievements where user_id = current_id;
  delete from public.daily_activity    where user_id = current_id;
  delete from public.quiz_attempts     where user_id = current_id;
  delete from public.summaries         where user_id = current_id;

  -- xp dan level dikembalikan ke baseline 0 dan 1. lives memakai max_lives milik
  -- user supaya nyawa penuh sejak awal. Kolom ditulis sebagai u.max_lives
  -- karena OUT parameter fungsi ini juga bernama max_lives, jadi `lives =
  -- max_lives` akan ditolak dengan "column reference max_lives is ambiguous".
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

  -- Nilai dikembalikan dari baris users yang sudah ditulis ulang di atas,
  -- bukan konstanta, supaya max_lives milik user ikut terbaca client.
  return query
    select u.xp, u.level, u.xp_to_next, u.streak, u.lives, u.max_lives,
           u.gems, u.keys, u.is_certified
      from public.users u
     where u.id = current_id;
end;
$$;

comment on function public.reset_user_progress() is
  'Menghapus progres dan riwayat milik user sendiri, lalu mengembalikan profil ke kondisi signup baru.';

revoke execute on function public.reset_user_progress() from public, anon;
grant  execute on function public.reset_user_progress() to authenticated;

-- Badge milik user untuk halaman Other. Bedanya dengan tabel achievements:
-- yang ini hanya baris yang benar-benar diraih.
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

-- ═════════════════════════════════════════════════════════════════════════════
-- 8. REALTIME
-- ═════════════════════════════════════════════════════════════════════════════
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