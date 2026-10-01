'use client'

import React, { useState } from 'react'
import {
  CheckCircle, Lock, Play, ChevronRight, Star,
  X, Trophy, Zap, ArrowRight, HelpCircle,
} from 'lucide-react'
import { gameLevels, languages } from '../data/mockData'
import { useGame } from '../context/GameContext'
import { lessonsByLang } from '../data/curriculum'

// ─── Build quiz questions from curriculum lessons ────────────────────────────
function buildQuiz(lang) {
  const lessons = lessonsByLang[lang] || lessonsByLang.python
  return lessons.slice(0, 5).map((l, i) => ({
    id: i + 1,
    question: l.instruction,
    options: l.options,
    correct: l.correctOption,
    explanation: l.explanation.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1'),
  }))
}

// Fallback static questions for general DSA quiz
const fallbackQuiz = [
  { id:1, question:'Time complexity of Merge Sort?', options:['O(n²)','O(n log n)','O(log n)','O(n)'], correct:1, explanation:'Merge Sort: log n levels × O(n) merge = O(n log n).' },
  { id:2, question:'Which structure does BFS use?', options:['Stack','Heap','Queue','Tree'], correct:2, explanation:'BFS uses a Queue (FIFO) for level-order traversal.' },
  { id:3, question:'What does Big-O describe?', options:['Exact time','Best case','Upper bound','Memory'], correct:2, explanation:'Big-O is the upper bound on growth rate.' },
]

// ─── Inline learnPaths from gameLevels ───────────────────────────────────────
const learnPaths = languages.map(lang => {
  const levels = gameLevels[lang.id] || []
  const done = levels.filter(l => l.done)
  return {
    id: lang.id, title: lang.label + ' Path', icon: lang.icon, color: lang.color,
    totalNodes: levels.length, completedNodes: done.length,
    description: lang.label + ' fundamentals',
    nodes: levels.slice(0, 12).map(l => ({ id: l.level, title: l.title, level: l.chapter <= 3 ? 'beginner' : l.chapter <= 7 ? 'intermediate' : 'advanced', done: l.done, active: l.active })),
  }
})

// ─── Quiz Modal ──────────────────────────────────────────────────────────────
function QuizModal({ onClose, subject }) {
  const { earnXP } = useGame()
  // Build questions from curriculum if subject is a lang id, else fallback
  const questions = lessonsByLang[subject] ? buildQuiz(subject) : fallbackQuiz
  const [current, setCurrent]     = useState(0)
  const [selected, setSelected]   = useState(null)
  const [answered, setAnswered]   = useState(false)
  const [score, setScore]         = useState(0)
  const [finished, setFinished]   = useState(false)
  const [showReward, setShowReward] = useState(false)

  const q = questions[current]
  const isCorrect = selected === q?.correct

  const handleSelect = (idx) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    if (idx === q.correct) setScore(s => s + 1)
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setFinished(true)
      // Award XP for quiz completion
      setTimeout(() => { setShowReward(true); earnXP(score * 25) }, 400)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const pct = Math.round((score / questions.length) * 100)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-card rounded-3xl border border-white/10 overflow-hidden shadow-card animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-cyan" />
            <span className="font-bold text-white">Interactive Quiz</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate">{Math.min(current + 1, questions.length)}/{questions.length}</span>
            <button onClick={onClose} className="text-slate hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-navy">
          <div className="h-full bg-gradient-to-r from-orange to-yellow-400 transition-all duration-500"
            style={{ width: `${((current) / questions.length) * 100}%` }} />
        </div>

        <div className="px-6 py-5">
          {!finished ? (
            <>
              <p className="text-lg font-bold text-white mb-5 leading-snug">{q.question}</p>
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  let style = 'glass-card border border-white/10 hover:border-white/25'
                  if (answered) {
                    if (i === q.correct) style = 'bg-emerald/15 border border-emerald/50 ring-1 ring-emerald/30'
                    else if (i === selected && i !== q.correct) style = 'bg-red-500/15 border border-red-500/50'
                    else style = 'glass-card border border-white/5 opacity-50'
                  }
                  return (
                    <button key={i} onClick={() => handleSelect(i)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${style} ${!answered ? 'cursor-pointer' : 'cursor-default'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs font-bold flex-shrink-0
                          ${answered && i === q.correct ? 'bg-emerald border-emerald text-white' :
                            answered && i === selected && i !== q.correct ? 'bg-red-500 border-red-500 text-white' :
                            'border-white/20 text-slate'}`}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className={answered && i === q.correct ? 'text-emerald' :
                          answered && i === selected && i !== q.correct ? 'text-red-400' : 'text-white'}>
                          {opt}
                        </span>
                        {answered && i === q.correct && <CheckCircle size={16} className="text-emerald ml-auto" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Feedback */}
              {answered && (
                <div className={`mt-4 rounded-xl p-4 border animate-slide-up text-sm
                  ${isCorrect
                    ? 'bg-emerald/10 border-emerald/30 text-emerald'
                    : 'bg-orange/10 border-orange/30 text-orange-light'
                  }`}>
                  <p className="font-semibold mb-1">{isCorrect ? '✅ Correct! Well done.' : '🧠 Socratic Insight:'}</p>
                  <p className="text-slate-light leading-relaxed">{q.explanation}</p>
                </div>
              )}

              {answered && (
                <button onClick={handleNext} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  {current + 1 < questions.length ? (<>Next Question <ArrowRight size={14} /></>) : (<>Finish Quiz <Trophy size={14} /></>)}
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-4 animate-fade-in">
              {showReward && (
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-yellow-400/15 rounded-full flex items-center justify-center mb-3 border-2 border-yellow-400/40">
                    <Trophy size={36} className="text-yellow-400" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-1">Quiz Complete!</h3>
                  <p className="text-slate">You scored {score}/{questions.length} ({pct}%)</p>
                </div>
              )}
              {/* XP reward popup */}
              <div className="glass-card rounded-2xl border border-orange/30 p-4 mb-4 animate-slide-up">
                <div className="flex items-center justify-center gap-3">
                  <Star size={24} className="text-yellow-400" />
                  <div>
                    <p className="text-xl font-extrabold text-white">+{score * 25} XP Earned!</p>
                    <p className="text-xs text-slate">{pct >= 80 ? '🔥 Excellent! Bonus XP awarded.' : 'Keep practicing to unlock bonus XP!'}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); setShowReward(false) }}
                  className="btn-secondary flex-1">Try Again</button>
                <button onClick={onClose} className="btn-primary flex-1">Continue Learning</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Roadmap Node ────────────────────────────────────────────────────────────
function RoadmapNode({ node, index, onQuiz }) {
  const isActive = node.active && !node.done
  const isLocked = !node.done && !node.active

  const levelColors = { beginner: '#10B981', intermediate: '#F97316', advanced: '#8B5CF6' }
  const nodeColor = levelColors[node.level] || '#94A3B8'

  return (
    <div className="flex items-start gap-4 relative group">
      {/* Connector line */}
      {index > 0 && (
        <div className="absolute left-5 -top-5 w-0.5 h-5 bg-white/10 z-0" />
      )}

      {/* Node dot */}
      <div className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all duration-200
        ${node.done     ? 'bg-emerald/20 border-emerald shadow-[0_0_12px_rgba(16,185,129,0.3)]' :
          isActive       ? 'bg-orange/20 border-orange shadow-orange-glow animate-pulse-slow' :
                           'bg-navy-light border-white/10 opacity-50'}`}>
        {node.done
          ? <CheckCircle size={18} className="text-emerald" />
          : isActive
            ? <Play size={16} className="text-orange" />
            : <Lock size={14} className="text-slate" />}
      </div>

      {/* Card */}
      <div className={`flex-1 glass-card rounded-xl px-4 py-3 border transition-all duration-200 cursor-pointer mb-2
        ${node.done     ? 'border-emerald/20 hover:border-emerald/40' :
          isActive       ? 'border-orange/30 hover:border-orange/50 bg-orange/5' :
                           'border-white/5 opacity-50 cursor-not-allowed'}`}
        onClick={() => isActive && onQuiz()}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${node.done ? 'text-slate' : isActive ? 'text-white' : 'text-slate/60'}`}>
              {node.title}
            </p>
            <span className="text-xs capitalize mt-0.5 inline-block"
              style={{ color: isLocked ? '#475569' : nodeColor }}>
              {node.level}
            </span>
          </div>
          {isActive && (
            <div className="flex items-center gap-1.5">
              <span className="badge-xp text-xs">+25 XP</span>
              <ChevronRight size={14} className="text-orange" />
            </div>
          )}
          {node.done && <CheckCircle size={14} className="text-emerald" />}
        </div>
      </div>
    </div>
  )
}

// ─── Path Card ───────────────────────────────────────────────────────────────
function PathCard({ path, onSelect, selected }) {
  const pct = Math.round((path.completedNodes / path.totalNodes) * 100)
  const isSelected = selected === path.id

  return (
    <button
      onClick={() => onSelect(path.id)}
      className={`glass-card glass-card-hover rounded-2xl p-4 border transition-all duration-200 text-left w-full
        ${isSelected ? 'border-orange/40 bg-orange/10 ring-orange-glow' : 'border-white/10'}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: `${path.color}20`, border: `1px solid ${path.color}40` }}>
          {path.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-white leading-tight">{path.title}</p>
          <p className="text-xs text-slate">{path.description}</p>
        </div>
        {isSelected && <div className="w-2 h-2 bg-orange rounded-full flex-shrink-0 mt-1" />}
      </div>
      <div className="flex justify-between text-xs text-slate mb-1.5">
        <span>{path.completedNodes}/{path.totalNodes} nodes</span>
        <span style={{ color: path.color }}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-navy rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: path.color }} />
      </div>
    </button>
  )
}

// ─── Main Learn Screen ───────────────────────────────────────────────────────
export default function LearnScreen({ onNavigate, onStartLesson }) {
  const [selectedPath, setSelectedPath] = useState('python')
  const [quizOpen, setQuizOpen]         = useState(false)
  const [quizSubject, setQuizSubject]   = useState('python')

  const activePath = learnPaths.find(p => p.id === selectedPath)

  const openQuiz = (subject = 'python') => {
    setQuizSubject(subject)
    setQuizOpen(true)
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Learning Paths</h1>
          <p className="text-slate text-sm mt-0.5">Choose your track and follow the roadmap</p>
        </div>
        <button onClick={() => openQuiz(selectedPath)}
          className="btn-primary flex items-center gap-2">
          <Zap size={14} /> Take Quiz
        </button>
      </div>

      {/* Path selector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {learnPaths.map(path => (
          <PathCard key={path.id} path={path} onSelect={setSelectedPath} selected={selectedPath} />
        ))}
      </div>

      {/* Roadmap for selected path */}
      {activePath && (
        <div className="glass-card rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">{activePath.icon}</span>
            <div>
              <h2 className="text-lg font-extrabold text-white">{activePath.title} Roadmap</h2>
              <p className="text-xs text-slate">{activePath.completedNodes} of {activePath.totalNodes} topics completed</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate">
                {[
                  { color: 'bg-emerald', label: 'Done' },
                  { color: 'bg-orange', label: 'Active' },
                  { color: 'bg-white/20', label: 'Locked' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${color}`} /> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Two-column roadmap layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
            {activePath.nodes.map((node, i) => (
              <RoadmapNode
                key={node.id}
                node={node}
                index={i}
                onQuiz={() => {
                  // If node is active, start real lesson; otherwise open quiz
                  if (node.active && onStartLesson) {
                    onStartLesson({ lang: selectedPath, levelIndex: i, title: node.title })
                  } else {
                    openQuiz(selectedPath)
                  }
                }}
              />
            ))}
          </div>

          {/* Overall progress */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-white">Overall Progress</span>
              <span className="text-sm font-bold" style={{ color: activePath.color }}>
                {Math.round((activePath.completedNodes / activePath.totalNodes) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-navy rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.round((activePath.completedNodes / activePath.totalNodes) * 100)}%`,
                  background: `linear-gradient(90deg, ${activePath.color}, ${activePath.color}aa)`,
                }} />
            </div>
          </div>
        </div>
      )}

      {quizOpen && <QuizModal onClose={() => setQuizOpen(false)} subject={quizSubject} />}
    </div>
  )
}
