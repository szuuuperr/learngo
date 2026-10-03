'use client'

import React, { useState } from 'react'
import { ChevronRight, ArrowLeft, Target, Brain, Trophy, Zap } from 'lucide-react'
import { LearnGoLogoFull } from '../components/LearnGoLogo'
import { LanguageIcon } from '../components/LanguageIcon'
import { useGame } from '../context/GameContext'
import { languages } from '../data/curriculum'

function Dots({ total, current }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width:  i === current ? '20px' : '8px',
            height: '8px',
            background: i === current ? '#FF7A00' : 'rgba(255,255,255,0.2)',
          }}
        />
      ))}
    </div>
  )
}

function StepWelcome({ onNext }) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <div className="mb-6">
        <LearnGoLogoFull size={150} />
      </div>
      <h1 className="text-3xl font-extrabold text-white mb-3 leading-tight">
        Welcome to <span style={{ color: '#FF7A00' }}>LearnGo</span>
      </h1>
      <p className="text-slate text-sm leading-relaxed max-w-xs mb-8">
        Your AI-powered CS companion. Learn with Socratic guidance, earn XP,
        and get industry-ready — one lesson at a time.
      </p>
      <div className="w-full space-y-3 max-w-xs">
        <div className="glass-card rounded-xl border border-indigo p-3 flex items-center gap-3 text-left">
          <Brain size={20} className="text-cyan"/>
          <p className="text-xs text-slate"><span className="text-white font-semibold">Socratic AI</span> — learn by questioning, not memorising</p>
        </div>
        <div className="glass-card rounded-xl border border-indigo p-3 flex items-center gap-3 text-left">
          <Trophy size={20} className="text-gold"/>
          <p className="text-xs text-slate"><span className="text-white font-semibold">Gamified</span> — XP, streaks, quests, achievements</p>
        </div>
        <div className="glass-card rounded-xl border border-indigo p-3 flex items-center gap-3 text-left">
          <Zap size={20} className="text-orange"/>
          <p className="text-xs text-slate"><span className="text-white font-semibold">Industry-ready</span> — Python, JavaScript, C++, DSA</p>
        </div>
      </div>
      <button onClick={onNext} className="btn-primary mt-8 px-10 py-3 text-base w-full max-w-xs">
        Let&apos;s Go <ChevronRight size={16} className="inline -mt-0.5" />
      </button>
    </div>
  )
}

function StepLanguage({ selected, onSelect, onNext, onBack }) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <h2 className="text-2xl font-extrabold text-white mb-2">Pick your first language</h2>
      <p className="text-sm text-slate mb-6">You can always add more later.</p>
      <div className="w-full grid grid-cols-2 gap-3 max-w-xs mb-6">
        {languages.map(lang => (
          <button
            key={lang.id}
            onClick={() => onSelect(lang.id)}
            className="glass-card rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-150"
            style={{
              borderColor: selected === lang.id ? '#FF7A00' : 'rgba(255,255,255,0.08)',
              background: selected === lang.id ? 'rgba(255,122,0,0.12)' : undefined,
            }}
          >
            <LanguageIcon lang={lang.id} size={24} />
            <span className="text-sm font-bold text-white">{lang.label}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={onBack} className="btn-secondary flex-1">Back</button>
        <button onClick={onNext} disabled={!selected} className="btn-primary flex-1" style={!selected ? { opacity: 0.45 } : {}}>
          Continue
        </button>
      </div>
    </div>
  )
}

const GOAL_OPTIONS = [
  { label: 'Casual',   mins: 5,  desc: '5 min / day',  xp: 20  },
  { label: 'Regular',  mins: 10, desc: '10 min / day', xp: 50  },
  { label: 'Serious',  mins: 20, desc: '20 min / day', xp: 100 },
  { label: 'Intense',  mins: 30, desc: '30 min / day', xp: 150 },
]

function StepGoal({ selected, onSelect, onDone, onBack }) {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <div className="mb-3">
        <Target size={36} style={{ color: '#FF7A00' }} />
      </div>
      <h2 className="text-2xl font-extrabold text-white mb-2">Set your daily goal</h2>
      <p className="text-sm text-slate mb-6">How much time can you commit each day?</p>
      <div className="w-full space-y-2 max-w-xs mb-6">
        {GOAL_OPTIONS.map(g => (
          <button
            key={g.label}
            onClick={() => onSelect(g)}
            className="w-full glass-card rounded-xl border p-3.5 flex items-center gap-3 text-left transition-all duration-150"
            style={{
              borderColor: selected?.label === g.label ? '#FF7A00' : 'rgba(255,255,255,0.08)',
              background: selected?.label === g.label ? 'rgba(255,122,0,0.12)' : undefined,
            }}
          >
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{g.label}</p>
              <p className="text-xs text-slate">{g.desc}</p>
            </div>
            <span className="badge-xp text-xs">+{g.xp} XP/day</span>
          </button>
        ))}
      </div>
      <div className="flex gap-3 w-full max-w-xs">
        <button onClick={onBack} className="btn-secondary flex-1">Back</button>
          <button onClick={onDone} disabled={!selected} className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5" style={!selected ? { opacity: 0.45 } : {}}>
            Start Learning <ChevronRight size={16} className="inline"/>
          </button>
      </div>
    </div>
  )
}

export default function OnboardingScreen({ onDone }) {
  const { setActiveLang, setToast } = useGame()
  const [step, setStep]       = useState(0)
  const [lang, setLang]       = useState(null)
  const [goal, setGoal]       = useState(null)

  const handleDone = () => {
    if (lang)  setActiveLang(lang)
    setToast(`Welcome to LearnGo! Let's start with ${lang ?? 'Python'}.`)
    localStorage.setItem('learngo_onboarded', '1')
    onDone()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#212649] overflow-y-auto">
      <div className="relative w-full max-w-sm mx-auto px-6 py-12 flex flex-col items-center gap-8">
        {/* Dots indicator */}
        <Dots total={3} current={step} />

        {/* Step content */}
        {step === 0 && (
          <StepWelcome onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepLanguage
            selected={lang}
            onSelect={setLang}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepGoal
            selected={goal}
            onSelect={setGoal}
            onDone={handleDone}
            onBack={() => setStep(1)}
          />
        )}
      </div>
    </div>
  )
}
