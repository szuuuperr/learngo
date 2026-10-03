-- 0004_realtime_gamification_and_catalog.sql
--
-- Tahap 8 bagian 1: mengganti sisa mock dengan sumber data nyata.
--
-- Jalankan file ini SETELAH 0001, 0002, dan 0003.
--
-- Dua kelompok perubahan:
--
-- A. Gamifikasi pindah dari localStorage ke tabel `users`. Sebelumnya earnXP()
--    hanya menulis ke browser, sehingga XP dari menyelesaikan lesson hilang
--    begitu tab di-refresh. Hanya XP kuis yang tersimpan, lewat RPC terpisah.
--
-- B. Tabel katalog untuk section yang tadinya menampilkan angka statis:
--    daily quests, notifications, study rooms, mentors, industry skills, dan
--    partner companies. Tabel ini diisi dengan seed data di bagian bawah, jadi
--    section yang tadinya menebak-nebak sekarang benar-benar membaca baris.

-- ═════════════════════════════════════════════════════════════════════════════
-- BAGIAN A - GAMIFIKASI TERSINKRON
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- A1. Tabel progres per bahasa
--
-- completedLevels, questsDone, dan achievements sebelumnya hanya hidup di
-- localStorage. Dipisah dari `users` karena isinya per-bahasa (Python bisa 7
-- level, JavaScript masih 0) sementara profil di `users` bersifat global.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_progress (
  user_id uuid not null references public.users(id) on delete cascade,
  lang    text not null,
  -- Panjang array dibatasi di sisi aplikasi; check di sini menjaga baris tetap
  -- dalam bentuk yang bisa di-render.
  completed_levels integer[] not null default '{}',
  primary key (user_id, lang)
);

comment on table public.user_progress is
  'Progres level per bahasa. Replace localStorage, sehingga selesai lesson di HP muncul di laptop.';

alter table public.user_progress enable row level security;

drop policy if exists "user_progress_own" on public.user_progress;
create policy "user_progress_own"
  on public.user_progress
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- A2. Tabel quest harian per user
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_quests (
  user_id    uuid not null references public.users(id) on delete cascade,
  quest_code text not null,
  done       boolean not null default false,
  day        date not null default current_date,
  primary key (user_id, quest_code, day)
);

comment on table public.user_quests is
  'Quest harian yang sudah diselesaikan. Kunci (user_id, quest_code, day) membuat quest reset otomatis tiap tengah malam tanpa cron.';

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

-- ─────────────────────────────────────────────────────────────────────────────
-- A3. RPC award_xp untuk gameplay
--
-- Sekarang ada dua sumber XP: kuis lewat award_quiz_xp() di 0002, dan gameplay
-- lewat earnXP() di GameContext. Yang kedua ini butuh RPC juga, dengan aturan:
--
--   - Row users dikunci dengan FOR UPDATE supaya dua tab yang menyelesaikan
--     lesson bersamaan tidak saling menimpa hasil update.
--   - Field non-XP (streak, lives, gems, progress harian) ikut ditulis karena
--     ini satu-satunya jalur penulisan untuk field-field itu.
--   - Unlike award_quiz_xp, fungsi ini tidak menyentuh is_certified. Sertifikat
--     tetap khusus achievement kuis, sesuai brief.
--
-- Parameter dipakai sebagai nilai absolut, bukan delta, untuk streak dan
-- lives supaya client tidak perlu menghitung batas atas dan bawah sendiri. XP dan
-- gems/keys memakai delta karena nilainya memang bertambah.
-- ─────────────────────────────────────────────────────────────────────────────
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

  -- FOR UPDATE menahan baris sampai transaksi selesai. Tanpa ini, dua tab yang
  -- earns XP bersamaan bisa membaca xp lama yang sama lalu menimpanya.
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

  -- Sama seperti award_quiz_xp: threshold yang rusak akan membuat loop di bawah
  -- berjalan tanpa akhir.
  if next_threshold is null or next_threshold <= 0 then
    next_threshold := 600;
  end if;

  while next_xp >= next_threshold loop
    next_level     := next_level + 1;
    next_threshold := round(next_threshold * 1.3);
  end loop;

  -- Nilai lama diambil dari row_users, bukan ditulis sebagai nama kolom
  -- telanjang. OUT parameter fungsi ini bernama streak, lives, gems, keys, dan
  -- daily_goal_progress, sama persis dengan kolom users, sehingga plpgsql akan
  -- menolak statement ini dengan "column reference streak is ambiguous".
  update public.users
     set xp    = next_xp,
         level = next_level,
         xp_to_next = next_threshold,
         -- greatest/least menjaga streak dan lives tetap di rentang wajar kalau
         -- ada data yang rusak atau request yang tidak sengaja mengirim angka
         -- ekstrem.
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

comment on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) is
  'Menambah XP gameplay dan menulis streak/lives/gems/progress. Dipanggil GameContext saat lesson selesai.';

revoke execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) from public, anon;
grant  execute on function public.award_gameplay_xp(integer, integer, integer, integer, integer, integer) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- A4. RPC save_progress untuk level dan quest
--
-- Dipisah dari award_gameplay_xp karena dipanggil sering (setiap lesson selesai)
-- dan tidak menyentuh XP. Upsert avoided via ON CONFLICT supaya idempoten.
-- ─────────────────────────────────────────────────────────────────────────────
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

  -- Nama constraint dipakai di ON CONFLICT, bukan daftar kolom, karena parameter
  -- `lang` dan `quest_code` bernama sama dengan kolom tujuan dan plpgsql akan
  -- menolak daftar kolom dengan "column reference is ambiguous".
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

comment on function public.save_level_progress(text, integer[], text, boolean) is
  'Menyimpan level yang sudah selesai dan status quest harian. Idempoten.';

revoke execute on function public.save_level_progress(text, integer[], text, boolean) from public, anon;
grant  execute on function public.save_level_progress(text, integer[], text, boolean) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- A5. Normalisasi data mock yang merembes ke user nyata
--
-- Kolom users di 0001 sengaja diberi default 450/5/12 supaya angka pertama yang
-- masuk ke UI terasa konsisten dengan mock lama. Konsekuensinya user yang baru
-- daftar langsung terlihat sebagai "level 5, 450 XP, 12-day streak" padahal nol
-- aktivitas, dan ambang sertifikasi jadi kabur.
--
-- User yang sudah menyelesaikan kuis TIDAK boleh di-reset, jadi baris yang xp-nya
-- sudah di atas default dipertahankan. Yang diubah hanya akun yang belum punya
-- aktivitas sama sekali.
-- ─────────────────────────────────────────────────────────────────────────────
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

-- Default kolom diubah supaya akun berikutnya langsung benar sejak signup.
-- Angka mock tidak lagi masuk ke user asli.
alter table public.users alter column xp set default 0;
alter table public.users alter column level set default 1;
alter table public.users alter column streak set default 0;
alter table public.users alter column gems set default 0;
alter table public.users alter column keys set default 0;
alter table public.users alter column daily_goal_progress set default 0;

-- ═════════════════════════════════════════════════════════════════════════════
-- BAGIAN B - TABEL KATALOG
--
-- Semua tabel di sini dibaca semua user yang login dan tidak pernah ditulis
-- client. Policy select-nya cukup satu blok select_public per tabel.
-- ═════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- B1. Daily quests
--
-- quest_code jadi kunci alami, bukan id uuid: client memakai kode yang sama
-- untuk menandai selesai, jadi kodenya perlu stabil dan bisa dibaca.
-- ─────────────────────────────────────────────────────────────────────────────
-- Namanya `description`, bukan `desc`. DESC adalah kata kunci SQL di
-- PostgreSQL, jadi kolom `desc` menggagalkan create table dan harus selalu
-- diapit tanda kutip di setiap select. Nama panjang ini juga sama dengan kolom
-- description di tabel achievements dan notifications.
create table if not exists public.quests (
  quest_code  text primary key,
  title       text not null,
  description text,
  icon        text,
  xp_reward   integer not null default 20,
  target      integer not null default 1,
  sort_order  integer not null default 0
);

comment on table public.quests is
  'Definisi quest harian. Yang mana yang sudah dikerjakan user disimpan di user_quests.';

-- ─────────────────────────────────────────────────────────────────────────────
-- B2. Notifications
-- ─────────────────────────────────────────────────────────────────────────────
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

comment on table public.notifications is
  'Notifikasi. audience null berarti untuk semua user; baris per-user dipakai untuk pesan pribadi.';

create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- B3. Study rooms
--
-- Section ini tadinya mengklaim "Live Now" dengan angka hardcode. Sekarang
-- claim itu diturunkan dari is_open, jadi tidak akan pernah berbeda dari
-- database.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.study_rooms (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  topic      text,
  is_open    boolean not null default true,
  capacity   integer not null default 12,
  starts_at  timestamptz,
  sort_order integer not null default 0
);

comment on table public.study_rooms is
  'Ruang belajar bersama. Status live diturunkan dari is_open.';

-- ─────────────────────────────────────────────────────────────────────────────
-- B4. Mentors
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.mentors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  expertise   text,
  bio         text,
  next_slot   timestamptz,
  is_available boolean not null default true
);

comment on table public.mentors is
  'Mentor yang bisa dibooking. Slot berikutnya disimpan sebagai timestamptz.';

-- ─────────────────────────────────────────────────────────────────────────────
-- B5. Industry skills
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.industry_skills (
  id         uuid primary key default gen_random_uuid(),
  skill      text not null,
  icon       text,
  demand     text not null check (demand in ('Critical', 'High', 'Medium', 'Essential')),
  demand_pct integer not null check (demand_pct between 0 and 100),
  sort_order integer not null default 0
);

comment on table public.industry_skills is
  'Keterampilan industri beserta persentase permintaan dari partner.';

-- ─────────────────────────────────────────────────────────────────────────────
-- B6. Partner companies
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.partners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  match_pct  integer not null check (match_pct between 0 and 100),
  website    text,
  sort_order integer not null default 0
);

comment on table public.partners is
  'Perusahaan partner industri beserta persentase kecocokan skill.';

-- ─────────────────────────────────────────────────────────────────────────────
-- B7. RLS untuk seluruh tabel katalog
--
-- Tabel ini dibaca semua user login dan ditulis hanya lewat seed SQL, jadi
-- tidak ada policy insert/update/delete. Row yang tidak lolos select policy
-- otomatis tidak terlihat, jadi policy select saja sudah cukup.
--
-- Pengecualian: notifications tidak ikut loop ini. Baris dengan audience null
-- memang untuk semua orang, tapi baris dengan audience terisi hanya untuk satu
-- user, jadi select policy `using (true)` akan membocorkan pesan pribadi ke
-- semua akun. Policy-nya ditulis terpisah di bawah. Client hanya mendapat hak
-- SELECT; penandaan read_by lewat RPC.
-- ─────────────────────────────────────────────────────────────────────────────
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

    -- Listener ini membaca kolom yang memang sudah tampil di UI.
    execute format('revoke all on public.%I from anon', tbl);
    execute format('grant  select on public.%I to authenticated', tbl);
  end loop;
end;
$$;

-- Notifikasi: audience null = broadcast, audience terisi = pribadi.
alter table public.notifications enable row level security;

drop policy if exists "notifications_select_visible" on public.notifications;
create policy "notifications_select_visible"
  on public.notifications
  for select
  to authenticated
  using (audience is null or audience = auth.uid());

-- Tidak ada policy UPDATE di sini. Satu policy update dengan using true akan
-- membiarkan setiap user menimpa read_by milik user lain pada notifikasi
-- broadcast, dan mengizinkan title atau body ikut diubah padahal keduanya bukan
-- milik user tersebut.
--
-- Penandaan hanya boleh lewat RPC mark_notifications_read di 0005. Fungsi itu
-- security definer, jadi menambahkan id ke read_by tetap bisa dilakukan meski
-- client tidak punya hak UPDATE sama sekali. namesake policy dari versi lama
-- ikut dibuang supaya project yang sempat menjalankan file versi sebelumnya
-- tidak menyimpan celah yang sama.
drop policy if exists "notifications_update_visible" on public.notifications;
drop policy if exists "notifications_select_public" on public.notifications;

revoke all on public.notifications from anon;
revoke update, delete, insert on public.notifications from authenticated;
grant  select on public.notifications to authenticated;

-- ═════════════════════════════════════════════════════════════════════════════
-- BAGIAN C - SEED DATA
--
-- Isi tabel katalog. Dipisah dari DDL di atas supaya file ini bisa
-- dijalankan ulang tanpa menggandakan baris: setiap insert bergantung pada
-- pg_typeof uniqueness dari primary key atau unique constraint.
-- ═════════════════════════════════════════════════════════════════════════════

-- Daily quests ----------------------------------------------------------------
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

-- Study rooms -----------------------------------------------------------------
insert into public.study_rooms (title, topic, is_open, capacity, sort_order)
select v.title, v.topic, v.is_open, v.capacity, v.sort_order
from (values
  ('Merge Sort Deep Dive', 'Algorithms',  true,  8, 1),
  ('Python OOP Q&A',       'OOP',         true,  12, 2),
  ('Graph Theory',         'Data Structures', true, 10, 3),
  ('System Design Clinic','Architecture', false, 6, 4)
) as v(title, topic, is_open, capacity, sort_order)
where not exists (select 1 from public.study_rooms);

-- Mentors ---------------------------------------------------------------------
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

-- Industry skills -------------------------------------------------------------
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

-- Partners --------------------------------------------------------------------
insert into public.partners (name, match_pct, website, sort_order)
select v.name, v.match_pct, v.website, v.sort_order
from (values
  ('Tokopedia Engineering', 84, 'https://www.tokopedia.com/careers', 1),
  ('Gojek Tech',            71, 'https://www.gojek.com/careers',    2),
  ('Ruangguru R&D',         68, 'https://www.ruangguru.com',       3)
) as v(name, match_pct, website, sort_order)
where not exists (select 1 from public.partners);

-- Notifications ---------------------------------------------------------------
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

-- ═════════════════════════════════════════════════════════════════════════════
-- BAGIAN D - REALTIME UNTUK TABEL YANG BACA UI
--
-- users, community_chats, dan tabel katalog di atas publication. Menambahkan
-- sisanya supaya section yang berubah di tab lain ikut ter-refresh tanpa reload.
-- Notification tidak dimasukkan: isinya per-user dan sering berubah, realtime
-- untuk tabel yang tidak di-cache di UI hanya menambah beban.
-- ═════════════════════════════════════════════════════════════════════════════
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