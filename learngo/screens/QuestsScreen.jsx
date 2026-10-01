'use client'

import React, { useState } from 'react'
import {
  Flame, Star, Trophy, Zap, Play, CheckCircle,
  Lock, ChevronRight, Target, Crown, Medal,
} from 'lucide-react'
import { user, dailyQuests } from '../data/mockData'
import { FoxMascot } from '../components/Header'
import { useGame } from '../context/GameContext'

// ─── XP Level Ring ───────────────────────────────────────────────────────────
function XPRing({ xp, xpToNext, level }) {
  const pct = (xp / xpToNext) * 100
  const r = 44
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - pct / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#1E293B" strokeWidth="8" />
        <circle cx="56" cy="56" r={r} fill="none"
          stroke="url(#xpGrad)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF7A00" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <FoxMascot size={28} animated />
        <span className="text-xs font-extrabold text-white mt-0.5">Lv.{level}</span>
      </div>
    </div>
  )
}

// ─── Leaderboard Row ─────────────────────────────────────────────────────────
const leaderboard = [
  { rank: 1, name: 'Sari Dewi',   xp: 2840, level: 12, isMe: false, avatar: 'SD' },
  { rank: 2, name: 'Rafi Hakim',  xp: 2610, level: 11, isMe: false, avatar: 'RH' },
  { rank: 3, name: 'Putri Ayu',   xp: 2450, level: 10, isMe: false, avatar: 'PA' },
  { rank: 4, name: 'You',         xp: 450,  level: 5,  isMe: true,  avatar: 'AP' },
  { rank: 5, name: 'Bima Sakti',  xp: 380,  level: 4,  isMe: false, avatar: 'BS' },
]

const rankIcons = {
  1: <Crown size={14} className="text-yellow-400" />,
  2: <Medal size={14} className="text-slate" />,
  3: <Medal size={14} className="text-yellow-700" />,
}

function LeaderboardRow({ entry }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
      style={entry.isMe ? {
        background: 'rgba(255,122,0,0.09)',
        border: '1px solid rgba(255,122,0,0.2)',
        boxShadow: '0 0 0 2px rgba(255,122,0,0.15)',
      } : {}}
    >
      <div className={`w-6 text-center font-bold text-sm
        ${entry.rank <= 3 ? 'text-yellow-400' : entry.isMe ? 'text-orange' : 'text-slate'}`}>
        {rankIcons[entry.rank] || <span>{entry.rank}</span>}
      </div>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={entry.isMe
          ? { background: 'linear-gradient(135deg,#FF7A00,#FF9A40)', boxShadow: '0 0 12px rgba(255,122,0,0.4)' }
          : { background: '#24304A', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        {entry.avatar}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${entry.isMe ? 'text-orange' : 'text-white'}`}>
          {entry.name} {entry.isMe && <span className="text-xs" style={{ color: 'rgba(255,122,0,0.7)' }}>(you)</span>}
        </p>
        <p className="text-xs text-slate">Level {entry.level}</p>
      </div>
      <div className="flex items-center gap-1">
        <Star size={12} className="text-yellow-400" />
        <span className="text-sm font-bold text-white">{entry.xp.toLocaleString()}</span>
      </div>
    </div>
  )
}

// ─── Achievement Badge ────────────────────────────────────────────────────────
const achievements = [
  { id: 1, icon: '🔥', title: 'Streak Master',   desc: '12-day streak',   unlocked: true,  xp: 100 },
  { id: 2, icon: '⚡', title: 'Quick Learner',   desc: '3 quests in 1d',  unlocked: true,  xp: 75  },
  { id: 3, icon: '🧠', title: 'Logic Pro',        desc: '5 perfect scores', unlocked: true, xp: 150 },
  { id: 4, icon: '📚', title: 'Bookworm',         desc: 'Read 10 PDFs',    unlocked: false, xp: 120 },
  { id: 5, icon: '🏆', title: 'Top 10 Rank',      desc: 'Reach rank #10',  unlocked: false, xp: 200 },
  { id: 6, icon: '🌟', title: 'Algorithm Ace',    desc: 'Complete Algo path', unlocked: false, xp: 250 },
]

function AchievementBadge({ a }) {
  return (
    <div className={`glass-card rounded-2xl p-4 border text-center transition-all duration-200
      ${a.unlocked ? 'border-yellow-400/25 bg-yellow-400/5 hover:border-yellow-400/40' : 'border-white/10 opacity-50'}`}>
      <div className={`text-3xl mb-2 ${!a.unlocked ? 'grayscale' : ''}`}>{a.icon}</div>
      <p className={`text-xs font-bold ${a.unlocked ? 'text-white' : 'text-slate'}`}>{a.title}</p>
      <p className="text-xs text-slate mt-0.5">{a.desc}</p>
      {a.unlocked && <span className="badge-xp mt-2 inline-block">+{a.xp} XP</span>}
      {!a.unlocked && <Lock size={12} className="mx-auto mt-2 text-slate/50" />}
    </div>
  )
}

// ─── Quest Card (reusable) ────────────────────────────────────────────────────
function QuestCard({ quest }) {
  const { questsDone, completeQuest, earnXP } = useGame()
  const done = !!(questsDone[quest.id] || quest.completed)
  const pct = quest.total > 0 ? Math.round((quest.progress / quest.total) * 100) : 0

  const handleStart = () => {
    if (!done) {
      completeQuest(quest.id)
      earnXP(quest.xp)
    }
  }

  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-4 border transition-all duration-200
      ${done ? 'border-emerald/25 bg-emerald/5' : 'border-white/10'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-navy border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
          {quest.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-bold text-sm text-white leading-tight">{quest.title}</p>
            {done && <CheckCircle size={16} className="text-emerald flex-shrink-0" />}
          </div>
          <p className="text-xs text-slate mt-0.5">{quest.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`tag-pill text-xs border ${
          quest.difficultyColor === 'emerald'
            ? 'bg-emerald/15 text-emerald border-emerald/30'
            : 'bg-orange/15 text-orange-light border-orange/30'
        }`}>{quest.difficulty}</span>
        <span className="tag-pill bg-navy-light text-slate text-xs">{quest.category}</span>
        <span className="badge-xp ml-auto">+{quest.xp} XP</span>
      </div>

      {quest.total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate mb-1">
            <span>{quest.progress}/{quest.total}</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-navy rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${done ? 'bg-emerald' : 'bg-orange'}`}
              style={{ width: `${done ? 100 : pct}%` }} />
          </div>
        </div>
      )}

      {!done ? (
        <button onClick={handleStart}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <Play size={14} /> Start Quest
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2 text-emerald text-sm font-semibold">
          <CheckCircle size={14} /> Completed!
        </div>
      )}
    </div>
  )
}

// ─── Streak Calendar ──────────────────────────────────────────────────────────
function StreakCalendar() {
  const { streak } = useGame()
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  // last 7 days: true = studied, false = not
  const studied = [true, true, true, false, true, true, true]

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-orange" />
        <span className="text-sm font-bold text-white">This Week&apos;s Streak</span>
        <span className="badge-xp ml-auto">{streak} days 🔥</span>
      </div>
      <div className="flex gap-2 justify-between">
        {days.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border transition-all"
              style={studied[i] ? {
                background: 'rgba(255,122,0,0.18)',
                borderColor: 'rgba(255,122,0,0.4)',
                boxShadow: '0 0 8px rgba(255,122,0,0.2)',
              } : {
                background: '#1E293B',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {studied[i]
                ? <Flame size={16} className="text-orange" />
                : <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />}
            </div>
            <span className="text-xs text-slate">{d}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Quests Screen ───────────────────────────────────────────────────────
export default function QuestsScreen() {
  const [tab, setTab] = useState('quests') // 'quests' | 'leaderboard' | 'achievements'
  const { xp, xpToNext, level, streak } = useGame()

  return (
    <div className="animate-fade-in space-y-5">
      {/* Header + XP Ring */}
      <div className="glass-card rounded-2xl border border-white/10 p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(255,122,0,0.08) 0%, rgba(6,182,212,0.04) 100%)' }}>
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ background: 'rgba(255,122,0,0.06)' }} />
        <div className="flex items-center gap-5">
          <XPRing xp={xp} xpToNext={xpToNext} level={level} />
          <div className="flex-1">
            <p className="text-xs text-slate uppercase tracking-widest mb-0.5">Rank Progress</p>
            <h2 className="text-xl font-extrabold text-white">Level {level} — Apprentice</h2>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate mb-1">
                <span>{xp} XP</span>
                <span>{xpToNext} XP next level</span>
              </div>
              <div className="h-2 bg-navy rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange to-yellow-400 rounded-full"
                  style={{ width: `${(xp / xpToNext) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {user.badges.map(b => (
                <span key={b} className="text-xs glass-card border border-white/10 px-2.5 py-1 rounded-full text-slate">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Streak Calendar */}
      <StreakCalendar />

      {/* Tab switcher */}
      <div className="flex glass-card rounded-xl border border-white/10 p-0.5 gap-0.5">
        {[
          { id: 'quests',       label: '⚡ Daily Quests' },
          { id: 'leaderboard',  label: '🏆 Leaderboard' },
          { id: 'achievements', label: '🏅 Achievements' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150
              ${tab === t.id ? 'bg-orange text-white' : 'text-slate hover:text-white'}`}
            style={tab === t.id ? { boxShadow: '0 0 12px rgba(255,122,0,0.25)' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'quests' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dailyQuests.map(q => <QuestCard key={q.id} quest={q} />)}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-bold text-white text-sm">Weekly Leaderboard</span>
            <span className="text-xs text-slate ml-auto">Resets in 2d 14h</span>
          </div>
          <div className="p-2 space-y-1">
            {leaderboard.map(e => <LeaderboardRow key={e.rank} entry={e} />)}
          </div>
          <div className="px-4 pb-3 pt-1 text-center">
            <p className="text-xs text-slate">You are in the <span className="text-orange font-semibold">Top 20%</span> this week. Keep going!</p>
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {achievements.map(a => <AchievementBadge key={a.id} a={a} />)}
          </div>
          <p className="text-xs text-center text-slate mt-3">
            {achievements.filter(a => a.unlocked).length}/{achievements.length} achievements unlocked
          </p>
        </div>
      )}
    </div>
  )
}
