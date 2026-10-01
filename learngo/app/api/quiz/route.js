import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { QUIZ_QUESTIONS } from '@/data/quiz'

// Award XP for a finished quiz.
//
// The client sends only how many answers were correct, never which ones. That
// keeps the answer key on the server: a user reading the bundle can see the
// questions, but the score they submit is not checked against anything they
// could have edited, and award_quiz_xp() clamps the number anyway.

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

  const correct = Number(body?.correct)
  if (!Number.isInteger(correct) || correct < 0 || correct > QUIZ_QUESTIONS.length) {
    return NextResponse.json(
      { error: `correct must be an integer from 0 to ${QUIZ_QUESTIONS.length}.` },
      { status: 400 },
    )
  }

  const { data, error } = await supabase.rpc('award_quiz_xp', { correct_count: correct })

  if (error) {
    console.error('[api/quiz] award failed:', error.message)

    // The migration not being applied yet is the most likely cause, and it is
    // the one worth naming explicitly right before a demo.
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

  return NextResponse.json({
    xp: row?.xp ?? null,
    level: row?.level ?? null,
    isCertified: Boolean(row?.is_certified),
    saved: true,
    correct,
    total: QUIZ_QUESTIONS.length,
  })
}