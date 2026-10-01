# Tahap 2 — Tutorial Setup Supabase untuk LearnGo

Panduan ini mengubah repo ini dari "punya file Supabase" jadi "terhubung ke database asli".

Isi:
1. Ambil kredensial
2. Isi `.env`
3. Jalankan SQL/RLS
4. Konfigurasi Google OAuth
5. Set URL redirect
6. Verifikasi (termasuk uji RLS via curl)
7. Troubleshooting

---

## 1. Ambil kredensial

Buka Supabase Dashboard → project LearnGo-mu → ikon ⚙️ **Project Settings** → **API Keys**.

Kamu butuh dua nilai:

| Nilai | Prefix | Dipakai di |
|---|---|---|
| Project URL | `https://xxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key | `sb_publishable_...` | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Secret key | `sb_secret_...` | `SUPABASE_SECRET_KEY` |

Secret key mungkin tersamar di UI (tampil sebagai `sb_secret_••••••••`). Klik ikon salin di sebelahnya untuk dapat nilai penuh.

> **Penting soal secret key.** Nilai `sb_secret_` melewati RLS — ini kunci admin. Kalau nilai aslinya pernah muncul di chat, commit, atau screenshot, **rotasi** di halaman ini: Settings → API Keys → hapus yang lama → buat baru. Key lama langsung mati.

---

## 2. Isi `.env`

File `.env` sudah ada di `learngo/learngo/.env`. Isi nilainya:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Aturan yang harus dijaga:

- **Prefix `NEXT_PUBLIC_` hanya untuk yang perlu dilihat browser.** Tanpa prefix itu, `process.env.X` bernilai `undefined` di client.
- **`SUPABASE_SECRET_KEY` TIDAK boleh diberi `NEXT_PUBLIC_`.** Kalau iya, secret key ikut ter-bundle ke JavaScript yang dikirim ke siapa pun. Sekali bocor, tidak bisa ditarik kembali.
- Restart `npm run dev` setelah edit `.env` — Next.js hanya membaca env saat start.

Cek cepat tanpa membuka file:

```
npm run dev
```

Lalu buka browser console di halaman mana pun:

```js
typeof process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
// harus "string"
```

Kalau `"undefined"`, restart dev server.

---

## 3. Jalankan SQL/RLS

File: `learngo/learngo/supabase/migrations/0001_init.sql`

Di Supabase Dashboard → **SQL Editor** → **New query** → salin **seluruh isi file** → **Run**.

Sekitar 10 detik. Yang terjadi:

| Bagian | Isi |
|---|---|
| 1 | Tabel `users` (profil + XP, level, streak, gems, settings) |
| 2 | Tabel `community_chats` (chat room publik) + 2 index |
| 3 | Trigger `updated_at` otomatis |
| 4 | RLS aktif + 7 policy |
| 5 | RPC `get_leaderboard()` |
| 6 | Trigger `on_auth_user_created` — profil dibuat otomatis saat login pertama |
| 7 | Realtime publication |

File aman dijalankan ulang — semua pakai `if not exists` / `drop policy if exists`.

### Konfirmasi hasilnya

Klik **Run** lagi atau jalankan query ini:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('users', 'community_chats');
```

Harus keluar **2 baris**, keduanya `rowsecurity = true`.

```sql
-- trigger auth harus ada
select tgname from pg_trigger where tgname = 'on_auth_user_created';

-- realtime harus terdaftar
select tablename from pg_publication_tables
where pubname = 'supabase_realtime';
```

Kalau `community_chats` tidak muncul di hasil terakhir, publication-nya belum ter-update — jalankan bagian 7 saja secara manual:

```sql
alter publication supabase_realtime add table public.community_chats;
```

---

## 4. Konfigurasi Google OAuth

### 4a. Di Supabase

**Authentication → Providers → Google**

- Buka toggle sampai **Enabled**
- **Google Client ID** dan **Google Client Secret**: temporarily kosongkan dulu, Google belum siap (langkah 4b)

**Authentication → URL Configuration**

| Field | Value |
|---|---|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Add redirect URL persis seperti itu — tanpa slash di akhir, tanpa trailing path lain. Tambahkan juga `http://127.0.0.1:3000/auth/callback` kalau kamu pernah buka lewat `127.0.0.1`.

### 4b. Di Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com) → buat project (atau pilih yang ada)
2. **APIs & Services → OAuth consent screen**
   - User type: **External**
   - Isi App name, User support email, Developer contact
   - Add scope: `.../auth/userinfo.email`, `.../auth/userinfo.profile`
   - Jangan pakai scope lain yang tidak perlu
3. **Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs**: `https://<project-ref>.supabase.co/auth/v1/callback`
     - `<project-ref>` adalah bagian URL-mu sebelum `.supabase.co`
   - Save → salin **Client ID** dan **Client Secret**
4. Kembali ke Supabase → Authentication → Providers → Google → tempel keduanya → Save

### 4c. Pastikan trigger profil jalan

Trigger `on_auth_user_created` membaca `raw_user_meta_data` milik Google. Kalau `name` di profilmu null setelah login, cek di SQL Editor:

```sql
select u.id, u.name, au.email, au.raw_user_meta_data
from public.users u
join auth.users au on au.id = u.id;
```

Kolom `email` **tidak ada** di `public.users` — email hanya ada di `auth.users`, dan tabel itu sengaja tidak kiteks ke profil supaya RLS tidak perlu mengekspos email user lain lewat join.

Kalau `name` kosong, berarti row-nya dibuat sebelum trigger dipasang. Perbaiki manual:

```sql
update public.users u
set name = split_part(au.email, '@', 1)
from auth.users au
where au.id = u.id
  and u.name is null;
```

Kalau dua-duanya (`u.name` dan `au.email`) kosong, akunnya dibuat manual di dashboard. Delete row profil lalu login ulang agar trigger berjalan — ini aman, `on delete cascade` hanya berlaku kalau user dihapus dari `auth.users`:

```sql
delete from public.users where id = 'UUID_USER_KAMU';
```

---

## 5. Verifikasi

### 5a. Row profil dibuat otomatis

Di SQL Editor:

```sql
-- sebelum login
select count(*) from public.users;
```

Lalu `npm run dev` → buka `http://localhost:3000` → login dengan Google → cek lagi. Kalau `name` terisi, trigger bekerja dan `GameContext` akan menampilkannya di header.

### 5b. Uji RLS via curl

Ini bukti bahwa policy benar-benar membatasi data, bukan cuma `enable row level security` yang tertulis.

**Persiapan** — login lewat curl untuk dapat access token:

```
curl -X POST "https://<project-ref>.supabase.co/auth/v1/token?grant_type=password" `
  -H "apikey: sb_publishable_..." `
  -H "Content-Type: application/json" `
  -d '{"email":"kamu@contoh.com","password":"password-kamu"}'
```

Salin `access_token` dari respons.

**Uji 1 — baca profil sendiri (harus BOLEH, Expect 200):**

```
curl "https://<project-ref>.supabase.co/rest/v1/users?select=id,name,xp" `
  -H "apikey: sb_publishable_..." `
  -H "Authorization: Bearer ACCESS_TOKEN_KAMU"
```

**Uji 2 — baca semua user tanpa login (harus DITOLAK, array kosong):**

```
curl "https://<project-ref>.supabase.co/rest/v1/users?select=id,name" `
  -H "apikey: sb_publishable_..."
```

Harus `[]`. Kalau dapat data, RLS tidak aktif — jalankan ulang bagian 4 file SQL.

**Uji 3 — tulis pesan sebagai orang lain (harus DITOLAK, 403):**

```
curl -X POST "https://<project-ref>.supabase.co/rest/v1/community_chats" `
  -H "apikey: sb_publishable_..." `
  -H "Authorization: Bearer ACCESS_TOKEN_KAMU" `
  -H "Content-Type: application/json" `
  -d '{"user_id":"00000000-0000-0000-0000-000000000000","message":"spam"}'
```

Harus `401` atau `403` dengan pesan RLS. Ganti UUID-nya dengan id user lain kalau punya.

**Uji 4 — tulis pesan sebagai diri sendiri (harus BOLEH, 201):**

```
curl -X POST "https://<project-ref>.supabase.co/rest/v1/community_chats" `
  -H "apikey: sb_publishable_..." `
  -H "Authorization: Bearer ACCESS_TOKEN_KAMU" `
  -H "Content-Type: application/json" `
  -d '{"user_id":"ID_USER_KAMU","message":"halo dari LearnGo"}'
```

Ambil `ID_USER_KAMU` dari respons Uji 1.

---

## 6. Yang terpasang di repo

| File | Fungsi |
|---|---|
| `lib/supabase/client.js` | `createBrowserClient` untuk Client Components |
| `lib/supabase/server.js` | `createServerClient` + `cookies()` untuk Server Components |
| `proxy.js` | Refresh session per-request (Next 16 ganti `middleware.ts` ke `proxy.ts`) |
| `app/auth/callback/route.js` | Tukar kode OAuth → session |
| `supabase/migrations/0001_init.sql` | Tabel + RLS + trigger + realtime |

`proxy.js` sengaja **tidak** melakukan redirect ke login. Orang yang belum login tetap bisa membuka halaman publik — logika redirect baru masuk di Tahap 3.

---

## 7. Troubleshooting

**`process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` undefined di browser**
Prefix `NEXT_PUBLIC_` salah, atau dev server belum direstart setelah edit `.env`.

**`@supabase/ssr: Your project's URL and API key are required`**
`.env` tidak terbaca. Pastikan file ada di `learngo/learngo/.env` — sejajar dengan `package.json`, bukan di root repo.

**Google OAuth balik ke `/` dengan `?auth=failed`**
Buka terminal, cari `[auth/callback]`. Pesan di situ menyebut penyebabnya. Yang paling sering: Redirect URL tidak persis sama antara Supabase dan Google, atau client ID/secret belum diisi.

**`relation "users" does not exist`**
SQL belum dijalankan, atau dijalankan di project Supabase yang salah. Cek URL project di `.env` sama dengan project yang sedang kamu buka di dashboard.

**Login berhasil tapi `/api/...` selalu 401**
`proxy.js` tidak jalan. Cek apakah file bernama `proxy.js` (bukan `middleware.js`) dan `export async function proxy` — Next 16 sudah deprecated `middleware`.

**Trigger tidak jalan / `name` null**
Trigger hanya jalan untuk signup **setelah** dibuat. User yang sudah ada sebelumnya tidak ter-backfill. Jalankan query update manual di bagian 4c.

**RLS terlihat aktif tapi semua select mengembalikan array kosong**
Ini normal untuk anon key — `users` hanya bisa dibaca oleh user yang login. Ini sesuai desain. Pakai access token seperti di Uji 1 untuk mengetes sebagai user.

---

## Berikutnya

Tahap 2, 3, dan 4 selesai: login Google tersambung ke session Supabase, `isLoggedIn`
membaca session asli, dan AI Tutor lewat `/api/tutor` (Langflow).

Panduan setup Langflow ada di `langflow/README.md`.

Yang masih mock: upload PDF di `AITutorScreen` (Tahap 5), kuis (Tahap 6), dan community
realtime (Tahap 7).