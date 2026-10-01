# Setup Langflow — AI Tutor (IBM Bob)

Panduan menjalankan flow Langflow yang dipakai `POST /api/tutor`. Langflow Desktop
(adanya lokal) adalah cara tercepat untuk demo — tanpa akun, tanpa Cloud.

---

## 1. Jalankan Langflow

### Opsi A — Langflow Desktop (paling mudah)

1. Buka <https://www.langflow.org> → **Download** → pilih Windows
2. Install, lalu jalankan aplikasinya
3. Browser terbuka otomatis ke `http://localhost:7860`

### Opsi B — Docker

```bash
docker run -it --rm -p 7860:7860 langflowai/langflow:latest
```

### Mengisi kredensial model

Langflow butuh key LLM. **Settings → Model Providers**, lalu pilih salah satu:

| Provider | Cara dapat | Catatan |
|---|---|---|
| **Groq** | Groq Console → API Keys | Free tier, cepat, recommended untuk demo |
| **Ollama** | `ollama pull llama3.1` | Gratis tapi butuh RAM 8 GB+ |
| **OpenAI** | platform.openai.com → API keys | Berbayar, paling stabil |

---

## 2. Bangun flow

Buka kanvas, lalu drag empat komponen dan sambungkan:

```
┌─────────────┐     ┌──────────┐     ┌────────────┐     ┌────────────┐
│ Chat Input  │────▶│  Prompt  │────▶│ Model LLM  │────▶│Chat Output │
│             │     │          │     │(Groq/Ollama│     │            │
└─────────────┘     └──────────┘     │ /OpenAI)   │     └────────────┘
                                    └────────────┘
```

Cara mencari komponen: klik kanvas kosong, ketik namanya di search box.

Sambungan (drag dari titik bulat kanan ke titik bulat kiri):

| Dari | Ke | Slot |
|---|---|---|
| Chat Input | Prompt | Input |
| Prompt | Model LLM | Input |
| Model LLM | Chat Output | Message |

---

## 3. Isi Prompt

Klik komponen **Prompt**, ganti Template-nya dengan salah satu di bawah. Ini yang
menentukan karakter tutor — komponen **Prompt** adalah tempat system prompt hidup.

### strict (Socratic murni)

```
You are Bob, a Socratic AI tutor for computer science students studying in Indonesia.

Your ONLY method is to respond with guiding questions — never give direct answers,
complete code solutions, or step-by-step explanations unless the student has
already tried and shown their work. Probe their reasoning and expose gaps with
targeted questions so they discover the answer themselves.

Keep responses to 2-4 sentences. Always end with a question.
Never write a full working solution, even if the student asks directly.
Reply in the language the student uses. If they write in Indonesian, reply in
Indonesian.
```

### guided (petunjuk + contoh parsial)

```
You are Bob, an AI tutor for computer science students studying in Indonesia.

Use the Guided Socratic method: provide clear hints, partial explanations, and
nudges in the right direction. You may give short code snippets as examples,
but always follow them with a question asking the student to extend or apply
what they just learned.

Keep responses focused and encouraging. Always end with a question or a small
challenge.
Never paste a complete solution to the exact problem the student is on.
Reply in the language the student uses. If they write in Indonesian, reply in
Indonesian.
```

> Prompt yang sama ada di `learngo/lib/langflow.js` (`SYSTEM_PROMPTS`) dan dikirim
> ulang dari `app/api/tutor/route.js` sebagai pengaman. Kalau flow ini lupa
> diatur, perilaku tutor tetap aman karena `/api/tutor` mengirim prompt-nya sendiri.

---

## 4. Atur model

Klik komponen model, isi:

| Field | Nilai |
|---|---|
| Model name | `llama-3.1-8b-instant` (Groq), `llama3.1` (Ollama), `gpt-4o-mini` (OpenAI) |
| Temperature | `0.7` |
| Max tokens | `300` |

Biarkan input lain kosong.

---

## 5. Ambil Flow ID

**Save** dulu (pojok kiri atas), lalu buka flow-nya dari daftar. Flow ID adalah
UUID di URL:

```
http://localhost:7860/flows/aa5a238b-02c0-4f03-bc5c-cc3a83335cdf
                   └──────────── FLOW ID ────────────┘
```

---

## 6. Ambil API key

**Settings → API Keys** → salin key yang ada (Langflow Desktop biasanya sudah
menyediakan satu secara default).

---

## 7. Isi `.env`

File `learngo/.env`:

```bash
LANGFLOW_URL=http://localhost:7860
LANGFLOW_FLOW_ID=aa5a238b-02c0-4f03-bc5c-cc3a83335cdf
LANGFLOW_API_KEY=gsk_xxxxxxxxxxxxxxxx
LANGFLOW_INPUT_TYPE=chat
LANGFLOW_OUTPUT_TYPE=chat
```

Restart `npm run dev` setelah mengubah `.env` — Next.js hanya membaca env saat start.

**Port bentrok?** Jalankan Langflow di port lain lalu sesuaikan `LANGFLOW_URL`:

```bash
docker run -it --rm -p 7861:7860 langflowai/langflow:latest
# LANGFLOW_URL=http://localhost:7861
```

---

## 8. Tes dengan curl

Selalu tes di luar aplikasi lebih dulu, supaya jelas masalahnya di Langflow atau
di LearnGo:

```bash
curl -X POST "http://localhost:7860/api/v1/run/FLOW_ID_KAMU?stream=false" `
  -H "x-api-key: API_KEY_KAMU" `
  -H "Content-Type: application/json" `
  -d '{"input_value":"jelaskan merge sort","input_type":"chat","output_type":"chat"}'
```

| Hasil | Artinya |
|---|---|
| JSON berisi `outputs` | Flow siap dipakai |
| `401` | API key salah |
| `404` | Flow ID salah, atau flow belum di-save |
| `422` | Koneksi ke LLM gagal — cek model provider |
| Timeout | Model lambat; naikkan timeout atau ganti model lebih kecil |

Kalau dapat JSON, masuk ke browser: `http://localhost:3000/tutor`, login, lalu
tulis "jelaskan merge sort".

---

## Troubleshooting

**`/api/tutor` balas 503 "not configured"**
Tiga variabel `LANGFLOW_*` kosong atau masih placeholder. Pesan lengkapnya ada
di `detail` field respons JSON.

**`/api/tutor` balas 502 "unreachable"**
Server Langflow mati, atau `LANGFLOW_URL` salah. Cek Langflow masih jalan di
browser.

**`401 Unauthorized` dari `/api/tutor`**
Bukan masalah Langflow. Session Supabase habis — logout lalu login lagi. Token
access kedaluwarsa sekitar satu jam, dan `proxy.js` me-refresh-nya otomatis; error
ini biasanya muncul kalau tab dibiarkan lama tanpa interaksi.

**Jawaban tutor memberi kode lengkap padahal harusnya Socratic**
Tunggalkan komponen Prompt: mungkin Prompt tidak terhubung ke LLM, sehingga model
menerima pesan mentah tanpa instruksi apa pun. Periksa sambungan di langkah 2.

**Port 7860 sudah dipakai**
`netstat -ano | findstr :7860` di CMD untuk melihat prosesnya, lalu `taskkill /PID
<nomer> /F`.

---

## Catatan untuk demo

Langflow harus berjalan sepanjang presentasi. Kalau laptop restart di tengah demo,
`/api/tutor` akan balas 502 sampai server-nya dinyalakan lagi. Dua mitigasi:

1. Set Langflow Desktop / Docker untuk start otomatis saat login Windows
2. Simpan command start di README demo dan buka terminal terpisah sebelum presentasi

Siapkan juga satu screenshot percakapan yang berhasil, sebagai cadangan kalau
koneksi LLM gagal saat demo.