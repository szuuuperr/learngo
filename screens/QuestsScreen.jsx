'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  Flame, Star, Trophy, Zap, Play, CheckCircle,
  Lock, ChevronRight, Target, Crown, Medal, Award,
} from 'lucide-react'
import { FoxMascot } from '../components/Header'
import { useGame } from '../context/GameContext'
import { useCatalog } from '../lib/useCatalog'
import { useLeaderboard } from '../lib/useLeaderboard'


function XPRing({ xp, xpToNext, level }) {
  // xp adalah total kumulatif dan xpToNext adalah ambang total level berikutnya,
  // jadi rasio ini sudah benar untuk model itu; tetap dijepit karena sebelum
  // SET_STATS tiba angka optimistik bisa lewat ambang dan dashoffset negatif
  // membuat cincin hilang.
  const ratio = xpToNext > 0 ? xp / xpToNext : 0
  const pct = Math.max(0, Math.min(100, ratio * 100))
  const r = 44
  const circ = 2 * Math.PI * r
  const dashOffset = circ * (1 - pct / 100)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="112" height="112" viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#313668" strokeWidth="8" />
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

// Baris-barisnya datang dari RPC get_leaderboard(). Email seperti "Top 20%" dan
// hitung mundur "Resets in 2d 14h" adalah angka fiktif yang tidak ada di
// database, jadi lebih jujur tidak ditampilkan.
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
      } : {}}
    >
      <div className={`w-6 text-center font-bold text-sm
        ${entry.rank <= 3 ? 'text-yellow-400' : entry.isMe ? 'text-orange' : 'text-slate'}`}>
        {rankIcons[entry.rank] || <span>{entry.rank}</span>}
      </div>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={entry.isMe
          ? { background: '#FF7A00' }
          : { background: '#212649', border: '1px solid #313668' }}
      >
        {entry.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${entry.isMe ? 'text-orange' : 'text-white'}`}>
          {entry.name} {entry.isMe && <span className="text-xs" style={{ color: 'rgba(255,122,0,0.7)' }}>(you)</span>}
        </p>
        <p className="text-xs text-slate">Level {entry.level}</p>
      </div>
      <div className="flex items-center gap-1">
        <Star size={12} className="text-yellow-400" />
        <span className="text-sm font-bold text-white">{entry.xp.toLocaleString('id-ID')}</span>
      </div>
    </div>
  )
}

// Baris di user_achievements (migration 0005) adalah sumber badge: deskripsi
// dibaca dari kolom `requirement` dan ikon dari kolom icon di achievements,
// bukan dari daftar atau angka statis di file ini.

function AchievementBadge({ a }) {
  return (
    <div className={`glass-card rounded-2xl p-4 border text-center transition-all duration-200
      ${a.unlocked ? 'border-orange/25 bg-orange/5 hover:border-orange/40' : 'border-indigo opacity-50'}`}>
      {/* Kolom icon di database masih menyimpan glyph; kalau kosong, jatuh ke lencana
          Award supaya tidak pernah menampilkan kotak kosong. */}
      <div className="mb-2 flex justify-center">
        {a.icon
          ? <span className={`text-3xl leading-none ${!a.unlocked ? 'grayscale' : ''}`}>{a.icon}</span>
          : <Award size={30} className={a.unlocked ? 'text-orange' : 'text-slate'} strokeWidth={1.8}/>}
      </div>
      <p className={`text-xs font-bold ${a.unlocked ? 'text-white' : 'text-slate'}`}>{a.title}</p>
      <p className="text-xs text-slate mt-0.5">{a.desc}</p>
      {a.unlocked && <span className="badge-xp mt-2 inline-block">+{a.xp} XP</span>}
      {!a.unlocked && <Lock size={12} className="mx-auto mt-2 text-slate/50" />}
    </div>
  )
}

// Tombol di bawah hanya mengarahkan user ke tempat quest itu dikerjakan. Quest
// diselesaikan oleh server setelah aktivitasnya benar-benar tercatat, jadi
// tidak ada tombol yang menulis done = true secara langsung.
const QUEST_ROUTES = {
  finish_lesson:  { tab: 'learn',  label: 'Open Learning' },
  perfect_quiz:   { tab: 'quiz',   label: 'Take the Quiz' },
  chat_community: { tab: 'community', label: 'Open Chat' },
  study_streak:   { tab: 'learn',  label: 'Keep Studying' },
  all_languages:  { tab: 'learn',  label: 'Browse Tracks' },
}

function QuestCard({ quest, onNavigate }) {
  const { questsDone } = useGame()
  const done = !!questsDone[quest.id]
  const pct = quest.total > 0 ? Math.round((quest.progress / quest.total) * 100) : 0
  const route = QUEST_ROUTES[quest.id] ?? QUEST_ROUTES.finish_lesson

  return (
    <div className={`glass-card glass-card-hover rounded-2xl p-4 border transition-all duration-200
      ${done ? 'border-emerald/25 bg-emerald/5' : 'border-white/10'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-raised border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
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
        <span className="tag-pill bg-raised text-slate text-xs">{quest.category}</span>
        <span className="badge-xp ml-auto">+{quest.xp} XP</span>
      </div>

      {quest.total > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate mb-1">
            <span>{quest.progress}/{quest.total}</span><span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-raised rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${done ? 'bg-emerald' : 'bg-orange'}`}
              style={{ width: `${done ? 100 : pct}%` }} />
          </div>
        </div>
      )}

      {!done ? (
        <button onClick={() => onNavigate?.(route.tab)}
          className="btn-primary w-full flex items-center justify-center gap-2">
          <Play size={14} /> {route.label}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-2 text-emerald text-sm font-semibold">
          <CheckCircle size={14} /> Completed!
        </div>
      )}
    </div>
  )
}

// Label hari dalam bahasa Inggris mengikuti label `<input type="date">`, jadi
// tanggal yang dihitung di sini cocok dengan yang dikembalikan database.
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Empat belas hari terakhir, bukan tujuh hari tetap. Sumbernya tabel
// daily_activity lewat RPC get_recent_activity, yang mengembalikan satu baris per
// hari termasuk hari tanpa aktivitas.
function StreakCalendar() {
  const { streak } = useGame()
  const { activity, loading } = useCatalog()

  const days = useMemo(() => {
    const byDay = new Map((activity ?? []).map(r => [String(r.day), r.xp_earned ?? 0]))
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - (13 - i))
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      return {
        key,
        label: DAY_LABELS[date.getDay()],
        date: date.getDate(),
        xp: byDay.get(key) ?? 0,
        isToday: i === 13,
      }
    })
  }, [activity])

  const activeDays = days.filter(d => d.xp > 0).length

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={16} className="text-orange" />
        <span className="text-sm font-bold text-white">Last 14 Days</span>
        <span className="badge-xp ml-auto inline-flex items-center gap-1">
          <Flame size={12} className="text-orange"/> {streak} days
        </span>
      </div>

      {loading && activity.length === 0 ? (
        <p className="text-xs text-slate py-3 text-center">Loading activity…</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 justify-between">
            {days.map((d) => (
              <div key={d.key} className="flex flex-col items-center gap-1.5">
                <div
                  title={`${d.date}: ${d.xp} XP`}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all
                    ${d.isToday ? 'border-orange/60' : ''}`}
                  style={d.xp > 0 ? {
                    background: 'rgba(255,122,0,0.18)',
                    borderColor: 'rgba(255,122,0,0.4)',
                  } : {
                    background: '#212649',
                    borderColor: '#313668',
                  }}
                >
                  {d.xp > 0
                    ? <Flame size={16} className="text-orange" />
                    : <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />}
                </div>
                <span className="text-xs text-slate">{d.label[0]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate mt-3">
            {activeDays === 0
              ? 'No XP earned in the last 14 days yet.'
              : `${activeDays} of 14 days with XP earned.`}
          </p>
        </>
      )}
    </div>
  )
}

export default function QuestsScreen({ onNavigate }) {
  const [tab, setTab] = useState('quests')
  const { xp, xpToNext, level, syncQuests } = useGame()
  const { quests, achievements, earnedSlugs, loading: catalogLoading } = useCatalog()
  const { entries: leaderboard, loading: leaderboardLoading } = useLeaderboard()

  // Baris yang menandai user sendiri, supaya lencana "Your rank" tidak
  // disappeared saat user ini tidak ada di 20 baris teratas.
  const meRow = leaderboard.find(e => e.isMe)
  const meRank = meRow?.rank ?? null

  const barPct = xpToNext > 0
    ? Math.max(0, Math.min(100, (xp / xpToNext) * 100))
    : 0

  // Minta server menilai ulang quest setiap kali tab ini dibuka. Evaluasi
  // dilakukan di database karena activity yang menjadi syaratnya tercatat di
  // beberapa tabel: progress lesson, riwayat kuis, chat, dan daily_activity.
  useEffect(() => {
    syncQuests()
  }, [syncQuests])

  // unlocked dihitung dari daftar slug yang benar-benar ada di database, bukan
  // dari angka hardcode per kartu. Kolom `icon` di database menyimpan emoji,
  // jadi dipakai apa adanya sebagai teks; baris tanpa ikon memakai default di
  // AchievementBadge.
  const badgeList = useMemo(
    () => (achievements ?? []).map(a => ({
      id: a.slug,
      icon: a.icon ?? null,
      title: a.title,
      desc: a.description,
      xp: a.xp_reward,
      unlocked: earnedSlugs.includes(a.slug),
    })),
    [achievements, earnedSlugs],
  )

  const earnedCount = badgeList.filter(b => b.unlocked).length

  return (
    <div className="animate-fade-in space-y-5">
      <div className="glass-card rounded-2xl border border-white/10 p-5 relative overflow-hidden">
        <div className="flex items-center gap-5">
          <XPRing xp={xp} xpToNext={xpToNext} level={level} />
          <div className="flex-1">
            <p className="text-xs text-slate uppercase tracking-widest mb-0.5">Level Progress</p>
            <h2 className="text-xl font-extrabold text-white">Level {level}</h2>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate mb-1">
                <span>{xp} XP total</span>
                <span>{Math.max(0, xpToNext - xp)} XP to level {level + 1}</span>
              </div>
              <div className="h-2 bg-raised rounded-full overflow-hidden">
                <div className="h-full bg-orange rounded-full"
                  style={{ width: `${barPct}%` }} />
              </div>
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {badgeList.filter(b => b.unlocked).length === 0 ? (
                <span className="text-xs text-slate">No badges earned yet.</span>
              ) : badgeList.filter(b => b.unlocked).map(b => (
                <span key={b.id} title={b.desc}
                  className="text-xs glass-card border border-white/10 px-2.5 py-1 rounded-full text-slate">
                  {b.icon} {b.title}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StreakCalendar />

      <div className="flex bg-obsidian rounded-xl border border-indigo p-0.5 gap-0.5">
        {[
          { id: 'quests',       label: 'Daily Quests', Icon: Zap },
          { id: 'leaderboard',  label: 'Leaderboard',  Icon: Trophy },
          { id: 'achievements', label: 'Achievements', Icon: Award },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150
              ${tab === id ? 'bg-orange text-white' : 'text-slate hover:text-white'}`}>
            <Icon size={13} />
            <span className="truncate">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'quests' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {catalogLoading && quests.length === 0 ? (
            <p className="text-xs text-slate col-span-full py-3 text-center">Loading quests…</p>
          ) : quests.length === 0 ? (
            <p className="text-xs text-slate col-span-full py-3 text-center">
              No daily quests available right now.
            </p>
          ) : quests.map(q => (
            <QuestCard
              key={q.quest_code}
              onNavigate={onNavigate}
              quest={{
                id: q.quest_code,
                title: q.title,
                description: q.description,
                icon: q.icon,
                xp: q.xp_reward,
                // difficulty dan category tidak ada di tabel quests. Quest di
                // sini selalu harian, jadi labelnya diturunkan dari data yang
                // ada, bukan diisi kategori fiktif.
                difficulty: 'Daily',
                difficultyColor: 'orange',
                category: 'Daily goal',
                total: q.target,
                progress: 0,
              }}
            />
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400" />
            <span className="font-bold text-white text-sm">Leaderboard</span>
            {meRank && (
              <span className="text-xs text-slate ml-auto">
                Your rank: <span className="text-orange font-semibold">#{meRank}</span>
              </span>
            )}
          </div>
          <div className="p-2 space-y-1">
            {leaderboardLoading ? (
              <p className="text-xs text-slate px-3 py-3 text-center">Loading leaderboard…</p>
            ) : leaderboard.length === 0 ? (
              <p className="text-xs text-slate px-3 py-3 text-center">
                No leaderboard entries yet.
              </p>
            ) : leaderboard.map(e => <LeaderboardRow key={e.rank} entry={e} />)}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div>
          {catalogLoading && achievements.length === 0 ? (
            <p className="text-xs text-slate py-3 text-center">Loading achievements…</p>
          ) : badgeList.length === 0 ? (
            <p className="text-xs text-slate py-3 text-center">No achievements defined yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {badgeList.map(a => <AchievementBadge key={a.id} a={a} />)}
              </div>
              <p className="text-xs text-center text-slate mt-3">
                {earnedCount}/{badgeList.length} achievements unlocked
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
