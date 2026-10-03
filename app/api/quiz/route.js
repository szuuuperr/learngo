import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QUIZ_QUESTIONS } from '@/data/quiz'

// Award XP for a finished quiz. The client sends the chosen option index per
// question, so the score is recomputed here against QUIZ_QUESTIONS and the
// awarded XP never comes from a client-invented number.
//
// Batasnya: data/quiz.js ikut ter-bundle ke browser karena UI perlu membandingkan
// pilihan dengan kunci untuk mewarnai merah dan hijau, jadi kunci tetap terbaca
// dari DevTools. Yang hilang hanya jalur sepele award_quiz_xp(10).

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Sign in to take the quiz.' },
      { status: 401 },
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

// Jawaban harus berupa array sepanjang jumlah soal; index di luar rentang option
// ditolak, bukan diabaikan, karena diam-diam dianggap "tidak dijawab" akan membuat
// skor berbeda dari yang tampil di layar tanpa ada yang memberitahu.
  const answers = body?.answers
  if (!Array.isArray(answers) || answers.length !== QUIZ_QUESTIONS.length) {
    return NextResponse.json(
      { error: `answers must be an array of ${QUIZ_QUESTIONS.length} entries.` },
      { status: 400 },
    )
  }

  for (let i = 0; i < answers.length; i += 1) {
    const choice = answers[i]
    const options = QUIZ_QUESTIONS[i].options
    if (!Number.isInteger(choice) || choice < 0 || choice >= options.length) {
      return NextResponse.json(
        { error: `answers[${i}] must be an integer from 0 to ${options.length - 1}.` },
        { status: 400 },
      )
    }
  }

  const correct = answers.reduce(
    (total, choice, i) => total + (choice === QUIZ_QUESTIONS[i].answer ? 1 : 0),
    0,
  )

  const { data, error } = await supabase.rpc('award_quiz_xp', { correct_count: correct })

  if (error) {
    console.error('[api/quiz] award failed:', error.message)

    // The migration not being applied yet is the most likely cause and the one worth
    // naming explicitly right before a demo.
    const missing = error.message.includes('does not exist')
    return NextResponse.json(
      {
        error: missing
          ? 'Quiz scoring is not set up yet. Run supabase/migrations/0002_quiz_certification.sql first.'
          : 'Could not record your score. Please try again.',
        detail: error.message,
      },
      { status: missing ? 503 : 500 },
    )
  }

  const row = Array.isArray(data) ? data[0] : data

  // Quest perfect_quiz dihitung dari quiz_attempts, yang diisi award_quiz_xp,
// jadi satu RPC tambahan sudah cukup untuk menilainya setelah skor tercatat.
  await supabase.rpc('sync_daily_quests').then(({ error: questError }) => {
    if (questError) console.error('[api/quiz] quest sync failed:', questError.message)
  })

  return NextResponse.json({
    xp: row?.xp ?? null,
    level: row?.level ?? null,
    isCertified: Boolean(row?.is_certified),
    saved: true,
    correct,
    total: QUIZ_QUESTIONS.length,
    // Achievement yang baru terbuka dikembalikan oleh award_quiz_xp lewat
    // sync_achievements, jadi layar tidak perlu menebak badge mana yang baru didapat.
    achievements: row?.achievements ?? [],
  })
}