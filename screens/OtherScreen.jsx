'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import {
  Settings, HelpCircle, ChevronRight,
  Brain, User, LogOut, Info,
  MessageSquare, BookOpen, ChevronDown, Users, RotateCcw,
  Award, ClipboardCheck, X, Flame, Sparkles,
} from 'lucide-react'
import { useCatalog } from '../lib/useCatalog'
import { FoxMascot } from '../components/Header'
import { useGame } from '../context/GameContext'
import { useAuth } from '../context/AuthContext'

function Toggle({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-all duration-200 focus:outline-none flex-shrink-0
        ${checked ? 'bg-orange' : 'bg-raised border border-white/10'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <span className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all duration-200
        ${checked ? 'left-[18px]' : 'left-[2px]'}`}
        style={{ width: '18px', height: '18px', top: '2px' }}
      />
    </button>
  )
}

const faqs = [
  {
    q: 'What is Socratic Mode?',
    a: 'Socratic Mode makes the AI guide you with questions and hints instead of giving direct answers. This builds deeper understanding and prepares you for real technical interviews.',
  },
  {
    q: 'How do I upload my lecture PDFs?',
    a: 'Go to the AI Tutor tab and select "PDF Tools". Drag and drop your PDF or click to browse. The AI will parse, summarize, and create a study guide from it.',
  },
  {
    q: 'How is my data shared with companies?',
    a: 'Your personal information is never shared. Only an anonymized skill progress map is optionally shared with partner companies if you opt-in through the Community Hub.',
  },
  {
    q: 'How do I earn XP?',
    a: 'Complete daily quests, finish roadmap nodes, score well on quizzes, maintain streaks, and engage with the AI Tutor. Each activity awards XP shown in your gamification bar.',
  },
  {
    q: 'Can I switch AI modes mid-session?',
    a: 'Yes! Use the Mode dropdown in the AI Tutor screen at any time to switch between Socratic (guided questions) and Guided (hints + nudges) modes.',
  },
]

// Shown once when `is_certified` flips to true. The dismissal is remembered in
// localStorage, so a reload does not interrupt the user again - the badge on the
// profile card stays as the permanent reminder.
const POPUP_SEEN_KEY = 'learngo_cert_popup_seen'

function CertificationPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#212649]/80 animate-fade-in">
      <div className="w-full max-w-sm glass-card rounded-3xl border border-white/10 shadow-card overflow-hidden animate-slide-up">
        <div className="p-6 text-center relative">
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 text-slate hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(250,204,21,0.12)', border: '1px solid rgba(250,204,21,0.35)' }}>
            <Award size={30} style={{ color: '#FACC15' }} />
          </div>

          <h3 className="text-xl font-extrabold text-white mb-1">Fundamental Passed!</h3>
          <p className="text-sm text-slate leading-relaxed mb-5">
            Kuis fundamental IT kamu selesai dengan nilai sempurna. Kamu kini resmi
            LearnGo Certified.
          </p>

          <div className="glass-card rounded-xl border border-white/10 px-4 py-3 mb-5">
            <p className="text-xs text-slate mb-1">Badge baru di profilmu</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(240,208,128,0.15)', color: '#F0D080', border: '1px solid rgba(240,208,128,0.3)' }}>
              <Award size={13}/> Fundamental Passed
            </span>
          </div>

          <button onClick={onClose} className="btn-primary w-full">Mantap, lanjut belajar!</button>
        </div>
      </div>
    </div>
  )
}

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`glass-card rounded-xl border transition-all duration-200 ${open ? 'border-orange/25' : 'border-white/10'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3">
        <span className="text-sm font-semibold text-white leading-snug">{faq.q}</span>
        <ChevronDown size={16} className={`text-slate transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-slide-up">
          <p className="text-sm text-slate leading-relaxed">{faq.a}</p>
        </div>
      )}
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate uppercase tracking-widest mb-2 px-1">{title}</p>
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5">
        {children}
      </div>
    </div>
  )
}

function SettingsRow({ icon: Icon, iconColor = 'text-slate', label, description, right, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 ${onClick ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}>
      <div className={`flex-shrink-0 ${iconColor}`}>
        <Icon size={17} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-xs text-slate mt-0.5">{description}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
      {onClick && !right && <ChevronRight size={15} className="text-slate/50 flex-shrink-0" />}
    </div>
  )
}

export default function OtherScreen({ onLogout, onNavigate }) {
  const { xp, level, streak, setToast, socraticMode, setSocraticMode, resetProgress } = useGame()
  const { profile, displayName, user, avatarUrl } = useAuth()
  const { achievements, earnedSlugs } = useCatalog()
  const socraticStrict = socraticMode === 'strict'
  const [activeTab, setActiveTab]           = useState('settings')

  // Badge "Fundamental Passed" berasal dari kolom is_certified, achievement lain
  // dari tabel user_achievements — setiap badge di layar ini punya baris di database.
  const isCertified = profile?.is_certified === true
  const earned = earnedSlugs ?? []
  const badges = achievements
    .filter(a => earned.includes(a.slug))
    .map(a => ({ icon: a.icon, title: a.title }))

  if (isCertified && !badges.some(b => b.title === 'Fundamental Passed')) {
    badges.push({ icon: null, title: 'Fundamental Passed' })
  }

  const initials = (displayName || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Popup is derived, not effect-pushed: visible only when the user is certified,
// not dismissed this session, and never dismissed before. Reading localStorage
// during render is safe because the gate `isCertified` is false on server and hydration.
  const [certPopupDismissed, setCertPopupDismissed] = useState(false)
  const certSeenBefore = useMemo(
    () => isCertified
      && typeof window !== 'undefined'
      && localStorage.getItem(POPUP_SEEN_KEY) === '1',
    [isCertified],
  )
  const showCertPopup = isCertified && !certSeenBefore && !certPopupDismissed

  const handleSocraticToggle = (val) => {
    setSocraticMode(val ? 'strict' : 'guided')
    setToast(val
      ? 'Socratic Mode: Strict — AI asks questions only'
      : 'Socratic Mode: Guided — AI gives hints')
  }

  // Reset dikembalikan ke server lewat reset_user_progress, jadi hasilnya bisa
  // gagal. Toast sukses tidak boleh ditulis sebelum hasilnya diketahui, kalau tidak
  // user melihat "Starting fresh" padahal XP-nya masih utuh di server.
  const handleResetProgress = async () => {
    if (!window.confirm('Reset all progress? This cannot be undone.')) return

    const { ok, error } = await resetProgress()
    if (!ok) {
      setToast(error ?? 'Reset failed. Please try again.')
      return
    }

    localStorage.removeItem('learngo_save')
    setToast('Progress reset. Starting fresh!')
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="glass-card rounded-2xl border border-white/10 p-5 relative overflow-hidden">
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-lg font-extrabold text-white"
              style={{ background: '#FF7A00' }}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="56px" unoptimized referrerPolicy="no-referrer" className="object-cover" />
              ) : initials}
            </div>
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#212649', border: '2px solid #323868', color: '#FF7A00' }}>
              {level}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-white text-lg leading-tight">{displayName}</h2>
            <p className="text-sm" style={{ color: '#8B8CA5' }}>{profile?.username ?? user?.email ?? ''}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#FF7A00' }}>
                <Flame size={13}/> {streak} day streak
              </span>
              <span className="text-xs font-semibold text-gold inline-flex items-center gap-1">
                <Sparkles size={13}/> {xp} XP
              </span>
            </div>
          </div>
          <FoxMascot size={44} animated />
        </div>
        <div className="relative flex flex-wrap gap-1.5 mt-4">
          {badges.map(b => {
            // Sertifikasi punya warna sendiri supaya berbeda dari achievement biasa, jadi
            // pencocokan dilakukan pada title.
            const certified = b.title === 'Fundamental Passed'
            // `icon` berasal dari kolom achievements di database. Kalau kosong,
            // badge ini pakai lencana Award supaya tidak tampil kotak kosong.
            return (
              <span
                key={b.title}
                className={`text-xs glass-card border px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 ${
                  certified ? 'border-gold/40' : 'border-indigo'
                }`}
                style={{ color: certified ? '#F0D080' : '#8B8CA5' }}
              >
                {b.icon
                  ? <span className="text-sm leading-none">{b.icon}</span>
                  : <Award size={13} className="flex-shrink-0"/>}
                {b.title}
              </span>
            )
          })}
        </div>
      </div>

      {onNavigate && (
        <button
          onClick={() => onNavigate('quiz')}
          className="w-full glass-card glass-card-hover rounded-2xl border border-[#FF7A00]/25 p-4 flex items-center gap-3 text-left"
          style={{ background: 'rgba(255,122,0,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,122,0,0.15)', border: '1px solid rgba(255,122,0,0.3)' }}>
            <ClipboardCheck size={20} style={{ color: '#FF7A00' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Kuis Fundamental IT</p>
            <p className="text-xs" style={{ color: '#8B8CA5' }}>
              {isCertified ? 'Sudah disertifikasi — boleh diulang kapan saja' : '10 soal · +10 XP per jawaban benar'}
            </p>
          </div>
          {isCertified
            ? <Award size={16} style={{ color: '#FACC15' }} />
            : <ChevronRight size={16} style={{ color: '#8B8CA5' }} />}
        </button>
      )}

      {/* Community Hub quick-link (mobile only — desktop has sidebar entry) */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('community')}
          className="w-full lg:hidden glass-card glass-card-hover rounded-2xl border border-[#06B6D4]/25 p-4 flex items-center gap-3 text-left"
          style={{ background: 'rgba(6,182,212,0.06)' }}
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <Users size={20} style={{ color: '#06B6D4' }} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">Community Hub</p>
            <p className="text-xs" style={{ color: '#8B8CA5' }}>Peers, mentors & industry partners</p>
          </div>
          <ChevronRight size={16} style={{ color: '#8B8CA5' }} />
        </button>
      )}

      <div className="flex glass-card rounded-xl border border-white/10 p-0.5 gap-0.5">
        {[
          { id: 'settings', label: 'Settings', Icon: Settings },
          { id: 'help',     label: 'Help & FAQ', Icon: HelpCircle },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-150"
            style={activeTab === id
              ? { background: '#FF7A00', color: '#fff' }
              : { color: '#8B8CA5' }}>
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <SettingsSection title="AI Tutor Preferences">
            <SettingsRow
              icon={Brain}
              iconColor="text-cyan"
              label="Socratic Mode"
              description={socraticStrict ? "AI asks guiding questions only - no direct answers" : "AI provides hints and partial guidance"}
              right={
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate hidden sm:block">{socraticStrict ? 'Strict' : 'Guided'}</span>
                  <Toggle checked={socraticStrict} onChange={handleSocraticToggle} />
                </div>
              }
            />
          </SettingsSection>

          <SettingsSection title="Account">
            <SettingsRow
              icon={RotateCcw}
              iconColor="text-red-400"
              label="Reset Progress"
              description="Erase all XP, levels and quest history"
              onClick={handleResetProgress}
            />
            <SettingsRow
              icon={LogOut}
              iconColor="text-red-400"
              label="Log Out"
              onClick={onLogout}
            />
          </SettingsSection>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: MessageSquare, label: 'Contact Support', color: 'text-cyan', bg: 'bg-cyan/10', border: 'border-cyan/25' },
              { icon: BookOpen,      label: 'Documentation',   color: 'text-orange', bg: 'bg-orange/10', border: 'border-orange/25' },
              { icon: Info,          label: 'About LearnGo',   color: 'text-emerald', bg: 'bg-emerald/10', border: 'border-emerald/25' },
            ].map(({ icon: Icon, label, color, bg, border }) => (
              <button key={label}
                className={`glass-card rounded-2xl border ${border} ${bg} p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-opacity`}>
                <Icon size={22} className={color} />
                <span className="text-xs font-semibold text-white">{label}</span>
              </button>
            ))}
          </div>

          <div>
            <p className="text-sm font-semibold text-white mb-3">Frequently Asked Questions</p>
            <div className="space-y-2">
              {faqs.map((faq, i) => <FAQItem key={i} faq={faq} />)}
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-4 text-center">
            <FoxMascot size={40} animated />
            <p className="font-extrabold text-white mt-2">LearnGo v1.0.0</p>
            <p className="text-xs text-slate mt-0.5">AI Companion for CS Fundamentals · Built for Future of Work</p>
            <p className="text-xs text-slate/40 mt-1">React 19 · Next.js 16 · Powered by AI</p>
          </div>
        </div>
      )}

      {showCertPopup && (
        <CertificationPopup onClose={() => {
          // So the celebration only interrupts once; the profile badge is the lasting artifact.
          localStorage.setItem(POPUP_SEEN_KEY, '1')
          setCertPopupDismissed(true)
        }} />
      )}
    </div>
  )
}
