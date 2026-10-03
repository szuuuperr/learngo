-- 0002_quiz_certification.sql
--
-- Tahap 6: kuis fundamental + sertifikat.
--
-- Jalankan file ini SETELAH 0001_init.sql di Supabase SQL Editor.
--
-- Dua hal yang sengaja dipisah dari 0001: kolom sertifikat dan function award.
-- 0001 sudah berjalan di project kamu, jadi mengubahnya tidak akan pernah
-- ikut menerapkan apa pun pada database yang sudah ada.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Kolom sertifikat
--
alter table public.users
  add column if not exists is_certified boolean not null default false;

comment on column public.users.is_certified is
  'True setelah kuis fundamental IT lolos. Hanya bisa diset oleh award_quiz_xp().';

-- Supabase memberi hak UPDATE penuh atas tabel di schema public ke role
-- authenticated secara default. Karena policy "users_update_own" di 0001 hanya
-- membatasi ROW mana, user masih bebas menulis kolom apa pun di barisnya
-- sendiri - termasuk is_certified. Jadi hak UPDATE dicabut di level TABEL lalu
-- diberikan kembali hanya per KOLOM yang memang boleh diubah sendiri.
--
-- Kolom yang hilang (xp, level, xp_to_next, is_certified, streak, lives,
-- gems, keys, daily_goal_progress) jadi hanya bisa ditulis lewat function kita.
-- Profile edit yang wajar - nama, avatar, bahasa, mode tutor - tetap jalan.
revoke update on public.users from authenticated;
grant  update (name, username, avatar_url, socratic_mode, active_lang)
  on public.users to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fungsi award XP atomik
--
-- PLAN Tahap 6: "+10 per benar (atomik via SQL update ... set xp = xp + 10,
-- jangan read-then-write)". Read-then-write dari client akan race kalau dua
-- tab terbuka bersamaan. xp = xp + delta di dalam satu UPDATE bebas race,
-- karena Postgres mengunci baris selama statement berjalan.
--
-- Besaran reward sengaja tetap di server. Kalau client yang menentukan
-- besarnya, user tinggal mengirim angka besar; clamp di bawah menutup jalur itu.
-- ─────────────────────────────────────────────────────────────────────────────
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
  -- auth.uid() null = dipanggil tanpa session. Function ini hanya untuk user
  -- yang login, jadi tolak lebih dulu daripada menulis angka apa pun.
  if current_id is null then
    raise exception 'You must be signed in to earn XP.';
  end if;

  -- Clamp, jangan percaya input. Satu kuis 10 soal, jadi > 1000 berarti
  -- sesuatu yang salah, dan tanpa clamp user bisa award_quiz_xp(999999).
  if correct_count < 0 or correct_count > 10 then
    raise exception 'correct_count must be between 0 and 10, got %', correct_count;
  end if;

  xp_gain := correct_count * 10;

  select u.xp, u.level, u.xp_to_next, u.is_certified
    into new_xp, new_level, new_xp_to_next, new_certified
    from public.users u
   where u.id = current_id
   for update;

  -- Baris profil belum ada (signup yang sangat baru, trigger belum selesai).
  if not found then
    raise exception 'No profile found for the current user.';
  end if;

  new_xp := new_xp + xp_gain;

  -- xp_to_next yang rusak (0 atau negatif) akan membuat loop di bawah tidak
  -- pernah berhenti. Baris dengan nilai aneh lebih baik diluruskan di sini
  -- daripada menggantungkan setiap request kuis.
  if new_xp_to_next is null or new_xp_to_next <= 0 then
    new_xp_to_next := 600;
  end if;

  -- Naikkan level berulang kali kalau XP tembus beberapa ambang sekaligus.
  -- Kenaikan berulang penting untuk quiz ganda dari satu tab.
  while new_xp >= new_xp_to_next loop
    new_level := new_level + 1;
    new_xp_to_next := round(new_xp_to_next * 1.3);
  end loop;

  -- Sertifikat mengikuti brief: 10 benar = 100 XP = "Fundamental Passed".
  --
  -- Yang diperiksa adalah xp_gain dari kuis INI, bukan new_xp total. Kolom xp
  -- di 0001 default-nya 450 untuk data mock, jadi ambang "xp >= 100" versi brief
  -- kalau dibaca terhadap total akan menyertifikasikan semua user sejak signup.
  -- Mengukur XP dari kuis itu sendiri membuat syaratnya achievement, bukan
  -- baseline yang kebetulan sudah terpenuhi.
  --
  -- coalesce menjaga sertifikat yang sudah didapat tidak hilang, dan or membuat
  -- pengulangan kuis tidak membatalkan apa pun.
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

comment on function public.award_quiz_xp(integer) is
  'Menambah XP kuis secara atomik dan menentukan is_certified. Dipanggil dari /api/quiz.';

-- Hanya user login boleh memanggil. Service_role tetap bisa karena bypass RLS.
revoke execute on function public.award_quiz_xp(integer) from public, anon;
grant  execute on function public.award_quiz_xp(integer) to authenticated;