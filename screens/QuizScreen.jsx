'use client'

import React, { useState } from 'react'
import {
  Trophy, Check, X, ArrowRight, ArrowLeft, RotateCcw,
  Award, Sparkles, Target,
} from 'lucide-react'
import { QUIZ_QUESTIONS, XP_PER_CORRECT, CERTIFICATION_XP } from '../data/quiz'
import { FoxMascot } from '../components/Header'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

// Satu soal per layar sesuai brief Tahap 6.

const LETTERS = ['A', 'B', 'C', 'D']

export default function QuizScreen() {
  // syncQuests dipakai supaya quest perfect_quiz yang baru terpenuhi langsung
  // terlihat di kartu quest tanpa perlu membuka tab lain.
  const { setToast, syncQuests } = useGame()
  // The RPC updated the `users` row, so the cached profile is stale afterwards.
  // Refreshing keeps the XP bar and the certificate badge consistent with the DB
  // instead of waiting for a full page reload.
  const { refreshProfile } = useAuth()

  const [index, setIndex]     = useState(0)
  const [answers, setAnswers] = useState([])
  const [phase, setPhase]     = useState('intro')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult]   = useState(null)

  const question = QUIZ_QUESTIONS[index]
  const isLast   = index === QUIZ_QUESTIONS.length - 1

  const start = () => {
    setIndex(0)
    setAnswers([])
    setResult(null)
    setPhase('quiz')
  }

  const choose = (choice) => {
    // Locked once answered, so the tally matches what was shown on screen.
    if (answers[index]) return
    setAnswers(prev => {
      const next = [...prev]
      next[index] = { choice, correct: choice === question.answer }
      return next
    })
  }

  const next = () => {
    if (isLast) return finish()
    setIndex(i => i + 1)
  }

  const prev = () => setIndex(i => Math.max(0, i - 1))

  const finish = async () => {
    setPhase('result')

    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Kirim index pilihan per soal, bukan jumlah jawaban benar. Skornya
        // dihitung ulang di server dari data/quiz.js supaya XP yang diberikan
        // tidak bergantung pada angka yang dikirim client.
        body: JSON.stringify({ answers: answers.map(a => a?.choice ?? -1) }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data.error || 'Could not save your score.')

      setResult(data)
      refreshProfile()

      // Route sudah memanggil sync_daily_quests setelah award_quiz_xp, jadi
      // kartu quest di layar lain ikut ter-update. Panggilan kedua di sini
      // idempoten: quest yang sudah dibayar tidak dibayar lagi.
      syncQuests()

      // Achievement baru dikembalikan RPC, jadi toast-nya bisa langsung dicetak. Hanya
      // yang pertama ditampilkan karena GameContext menyimpan satu pesan pada satu
      // waktu; sisanya akan saling menimpa dalam render yang sama.
      const [firstAward] = data.achievements ?? []
      if (firstAward) {
        setToast(`${firstAward.icon ?? ''} Achievement unlocked: ${firstAward.title}`)
      }
    } catch (err) {
      console.error('Quiz submit failed:', err)
      setToast(err.message)
      // The score still stands locally; only the persistence failed.
      setResult({
        xp: null,
        level: null,
        isCertified: false,
        saved: false,
      })
    }
    setSubmitting(false)
  }

  const correctCount = answers.filter(a => a?.correct).length
  const earned = correctCount * XP_PER_CORRECT
  const newlyCertified = result?.isCertified && result?.saved !== false

  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in">
<div className="glass-card rounded-3xl border border-indigo p-8 text-center">
          <h1 className="text-2xl font-extrabold text-white mb-2">Kuis Fundamental IT</h1>
          <p className="text-sm text-slate leading-relaxed mb-6 max-w-md mx-auto">
            10 soal pilihan ganda tentang algoritma dan struktur data. Setiap jawaban benar
            bernilai {XP_PER_CORRECT} XP — kuis sempurna menjamin {CERTIFICATION_XP} XP dan membuka
            badge <strong>Fundamental Passed</strong> di profilmu.
          </p>

          <div className="flex items-center justify-center gap-6 mb-7 text-sm">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-cyan">{QUIZ_QUESTIONS.length}</p>
              <p className="text-xs text-slate">Soal</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-orange">{XP_PER_CORRECT} XP</p>
              <p className="text-xs text-slate">Per benar</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-yellow-400">{CERTIFICATION_XP} XP</p>
              <p className="text-xs text-slate">Sertifikat</p>
            </div>
          </div>

          <button
            onClick={start}
            className="px-6 py-3 rounded-xl bg-orange hover:bg-orange-glow text-white font-bold text-sm transition-all"
          >
            Mulai Kuis
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const pct = Math.round((correctCount / QUIZ_QUESTIONS.length) * 100)

    return (
      <div className="max-w-2xl mx-auto py-8 animate-fade-in space-y-4">
<div className="glass-card rounded-3xl border border-indigo p-8 text-center">
            <>
              <div className="flex justify-center mb-3"><Award size={56} className="text-gold" /></div>
              <h1 className="text-2xl font-extrabold text-white mb-1">Fundamental Passed!</h1>
              <p className="text-sm text-slate mb-5">
                Sertifikat fundamental IT sudah terbuka di profilmu.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-3"><Trophy size={48} className="text-cyan" /></div>
              <h1 className="text-2xl font-extrabold text-white mb-1">
                {pct >= 70 ? 'Bagus!' : pct >= 40 ? 'Lumayan!' : 'Perlu latihan lagi'}
              </h1>
              <p className="text-sm text-slate mb-5">
                {pct >= 70
                  ? 'Kamu menguasai dasar-dasarnya dengan baik.'
                  : pct >= 40
                    ? 'Sudah setengah jalan. Ulangi soal yang terlewat.'
                    : 'Baca materinya sekali lagi, lalu coba lagi — tidak ada batas percobaan.'}
              </p>
            </>
          )&#125;

          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white">{correctCount}/{QUIZ_QUESTIONS.length}</p>
              <p className="text-xs text-slate">Benar</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-orange">+{earned}</p>
              <p className="text-xs text-slate">XP</p>
            </div>
            {result?.xp != null && (
              <div className="text-center">
                <p className="text-3xl font-extrabold text-cyan">{result.xp}</p>
                <p className="text-xs text-slate">Total XP</p>
              </div>
            )}
          </div>

          {submitting && (
            <p className="text-xs text-slate mb-4">Menyimpan skor…</p>
          )}

          {result?.saved === false && (
            <p className="text-xs text-orange mb-4">
              Skor tidak tersimpan ke database, tapi hasil di layar tetap berlaku.
            </p>
          )}

          <button
            onClick={start}
            className="px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-glow text-white font-bold text-sm transition-all"
          >
            <RotateCcw size={14} className="inline mr-1.5" />
            Ulangi Kuis
          </button>
        </div>

        {/* Review, so a wrong answer can be learned from rather than just
            counted. */}
        <div className="glass-card rounded-2xl border border-indigo p-5">
          <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-3">
            Pembahasan
          </p>
          <div className="space-y-3">
            {QUIZ_QUESTIONS.map((q, i) => {
              const a = answers[i]
              const right = a?.correct
              return (
                <div
                  key={i}
                  className="rounded-xl border p-3"
                  style={right
                    ? { borderColor: 'rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.07)' }
                    : { borderColor: 'rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.07)' }}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    {right
                      ? <Check size={14} className="text-emerald mt-0.5 flex-shrink-0" strokeWidth={3} />
                      : <X size={14} className="text-red-400 mt-0.5 flex-shrink-0" strokeWidth={3} />}
                    <p className="text-xs text-white leading-relaxed flex-1">{q.question}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 mt-0.5 ${
                      right ? 'text-emerald' : 'text-red-400'
                    }`}>
                      {right ? 'Benar' : 'Salah'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-light ml-6">
                    Jawaban: <span className="text-emerald font-semibold">{LETTERS[q.answer]}. {q.options[q.answer]}</span>
                  </p>
                  {!right && a && (
                    <p className="text-xs text-red-400/90 ml-6">
                      Kamu pilih: {LETTERS[a.choice]}. {q.options[a.choice]}
                    </p>
                  )}
                  <p className="text-xs text-slate ml-6 mt-1 leading-relaxed">{q.explanation}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const answered = answers[index]

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate">
          Soal {index + 1} dari {QUIZ_QUESTIONS.length}
        </span>
        <span className="text-xs font-semibold text-emerald">
          {correctCount} benar
        </span>
      </div>

      <div className="flex gap-1.5 mb-6">
        {QUIZ_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              answers[i]?.correct ? 'bg-emerald'
                : answers[i] ? 'bg-red-500/60'
                  : i === index ? 'bg-orange'
                    : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      <div className="glass-card rounded-2xl border border-indigo p-6 mb-4">
        <p className="text-base text-white font-semibold leading-relaxed whitespace-pre-line mb-5">
          {question.question}
        </p>

        {/* Answer states are colour-coded but also carry an icon and a text label, so
            the result never depends on telling green from red alone. Wrong answers
            use red, not brand orange, which would read as "selected" not "incorrect". */}
        <div className="space-y-2">
          {question.options.map((opt, i) => {
            const chosen = answered?.choice === i
            const isRight = i === question.answer

            let tone = 'border-white/10 hover:border-orange/40 hover:bg-white/5'
            if (answered) {
              if (isRight) tone = 'border-emerald bg-emerald/15'
              else if (chosen) tone = 'border-red-500 bg-red-500/15'
              else tone = 'border-white/10 opacity-40'
            }

            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={Boolean(answered)}
                className={`w-full text-left flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${tone} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                  answered && isRight ? 'bg-emerald text-obsidian'
                    : answered && chosen ? 'bg-red-500 text-white'
                      : 'bg-white/10 text-slate'
                }`}>
                  {answered && isRight
                    ? <Check size={13} strokeWidth={3} />
                    : answered && chosen
                      ? <X size={13} strokeWidth={3} />
                      : LETTERS[i]}
                </span>
                <span className={`text-sm flex-1 ${
                  answered && isRight ? 'text-white font-medium'
                    : answered && chosen ? 'text-white'
                      : answered ? 'text-slate' : 'text-slate-light'
                }`}>
                  {opt}
                </span>
                {answered && isRight && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald flex-shrink-0">
                    Benar
                  </span>
                )}
                {answered && chosen && !isRight && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-red-400 flex-shrink-0">
                    Jawabanmu
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {answered && (
          <div
            className="mt-4 rounded-xl border p-3 flex items-start gap-2.5"
            style={answered.correct
              ? { borderColor: 'rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.08)' }
              : { borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)' }}
          >
            {answered.correct
              ? <Check size={15} className="text-emerald mt-0.5 flex-shrink-0" strokeWidth={3} />
              : <X size={15} className="text-red-400 mt-0.5 flex-shrink-0" strokeWidth={3} />}
            <div>
              <p className={`text-xs font-bold mb-1 ${answered.correct ? 'text-emerald' : 'text-red-400'}`}>
                {answered.correct ? 'Benar' : 'Belum tepat'}
                {!answered.correct && (
                  <span className="text-slate font-normal">
                    {' '}— jawaban yang benar adalah {LETTERS[question.answer]}
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-light leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={index === 0}
          className="px-4 py-2.5 rounded-xl glass-card border border-white/10 text-slate hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          Sebelumnya
        </button>

        {!answered ? (
          <span className="text-xs text-slate/60 flex items-center gap-1.5">
            <Target size={13} />
            Pilih satu jawaban
          </span>
        ) : (
          <button
            onClick={next}
            className="px-5 py-2.5 rounded-xl bg-orange hover:bg-orange-glow text-white font-bold text-sm transition-all flex items-center gap-1.5"
          >
            {isLast ? 'Selesai' : 'Lanjut'}
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {isLast && answered && (
        <p className="text-xs text-slate/60 text-center mt-4 flex items-center justify-center gap-1.5">
          <Sparkles size={12} />
          Soal terakhir — tekan Selesai untuk menyimpan skor
        </p>
      )}
    </div>
  )
}