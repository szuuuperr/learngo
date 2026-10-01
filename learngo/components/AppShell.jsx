'use client'

import React, { useState } from 'react'
import Header from './Header'
import { Sidebar, BottomNav } from './Navigation'
import { AuthModal, LogoutModal } from './AuthModals'
import LessonScreen from '../screens/LessonScreen'
import OnboardingScreen from '../screens/OnboardingScreen'
import { useUI } from '../context/UIContext'

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up pointer-events-none">
      <div
        className="glass-card border border-white/15 px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-card flex items-center gap-2 whitespace-nowrap"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        {msg}
      </div>
    </div>
  )
}

// ─── Quest Start Modal ────────────────────────────────────────────────────────
function QuestStartModal({ quest, onClose, onNavigate }) {
  const [launched, setLaunched] = useState(false)

  const handleStart = () => {
    setLaunched(true)
    setTimeout(() => {
      onClose()
      onNavigate('tutor')
    }, 800)
  }

  if (!quest) return null

  const isEasy = quest.difficultyColor === 'emerald'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm glass-card rounded-3xl border border-white/10 shadow-card overflow-hidden animate-slide-up">
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">{quest.icon}</div>
          <h3 className="text-xl font-extrabold text-white mb-1">{quest.title}</h3>
          <p className="text-sm text-[#94A3B8] mb-4 leading-relaxed">{quest.description}</p>
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="badge-xp">+{quest.xp} XP</span>
            <span
              className="tag-pill text-xs border"
              style={{
                background:   isEasy ? 'rgba(16,185,129,0.15)' : 'rgba(255,122,0,0.15)',
                color:        isEasy ? '#10B981' : '#F97316',
                borderColor:  isEasy ? 'rgba(16,185,129,0.3)' : 'rgba(255,122,0,0.3)',
              }}
            >
              {quest.difficulty}
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}    className="btn-secondary flex-1">Not now</button>
            <button onClick={handleStart} className="btn-primary flex-1">
              {launched ? '🚀 Launching…' : '▶ Start Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Login Gate Splash ────────────────────────────────────────────────────────
function LoginGate({ onOpen }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#0F172A]/95 backdrop-blur-md">
      <div className="text-center px-6 max-w-sm w-full">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#FF7A00', boxShadow: '0 0 30px rgba(255,122,0,0.4)' }}
        >
          <span className="text-4xl">🦊</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Welcome to <span style={{ color: '#FF7A00' }}>LearnGo</span>
        </h2>
        <p className="text-[#94A3B8] text-sm mb-6 leading-relaxed">
          Your AI-powered CS companion. Master fundamentals, earn XP, and get industry-ready.
        </p>
        <button onClick={onOpen} className="btn-primary px-8 py-3 text-base w-full">
          Get Started 🚀
        </button>
        <p className="text-xs text-[#94A3B8]/50 mt-4">Free forever · No credit card needed</p>
      </div>
    </div>
  )
}

// ─── PWA Install Banner ───────────────────────────────────────────────────────
function PWAInstallBanner({ onInstall, onDismiss }) {
  return (
    <div
      className="fixed bottom-20 lg:bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="pointer-events-auto mx-4 mb-2 w-full max-w-sm glass-card border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-card animate-slide-up"
        style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#FF7A00' }}
        >
          <span className="text-lg">🦊</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight">Install LearnGo App</p>
          <p className="text-xs text-[#94A3B8]">Add to home screen for quick access</p>
        </div>
        <button
          onClick={onInstall}
          className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          className="text-[#94A3B8] hover:text-white transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────
// Persistent chrome (header, sidebar, bottom nav, overlays) wrapped around the
// page rendered by the App Router. Per-page content arrives as `children`.
export default function AppShell({ children }) {
  const {
    navigate, navTab,
    isLoggedIn, showAuth, setShowAuth, showLogout, setShowLogout,
    showPwaBanner: pwaBannerVisible,
    toast, showToast, clearToast,
    questModal, setQuestModal,
    activeLesson, setActiveLesson,
    showOnboarding,
    handlePwaInstall, handlePwaDismiss,
    handleLogout, handleAuthSuccess,
  } = useUI()

  return (
    <div className="min-h-screen bg-[#0F172A] dot-grid">
      {/* ── Fixed Header ── */}
      <Header
        onNavigate={navigate}
        onLogout={() => setShowLogout(true)}
        onSettings={() => navigate('other')}
      />

      {/* ── Desktop Sidebar ── */}
      <Sidebar active={navTab} onNavigate={navigate} />

      {/* ── Main Content (page) ── */}
      <main className="pt-16 pb-20 lg:pb-6 lg:pl-56 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 py-5">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <BottomNav active={navTab} onNavigate={navigate} />

      {/* ── Modals ── */}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
      {showLogout && (
        <LogoutModal onClose={() => setShowLogout(false)} onConfirm={handleLogout} />
      )}
      {questModal && (
        <QuestStartModal
          quest={questModal}
          onClose={() => setQuestModal(null)}
          onNavigate={navigate}
        />
      )}

      {/* ── Lesson Modal (full-screen, above everything) ── */}
      {activeLesson && (
        <LessonScreen
          lang={activeLesson.lang}
          levelIndex={activeLesson.levelIndex}
          title={activeLesson.title}
          onClose={() => setActiveLesson(null)}
          onComplete={() => {
            setActiveLesson(null)
            showToast('🏆 Lesson complete! Keep going!')
          }}
        />
      )}

      {/* ── Toast ── */}
      {toast && <Toast msg={toast} onDone={clearToast} />}

      {/* ── Login Gate (full-screen overlay when logged out) ── */}
      {!isLoggedIn && <LoginGate onOpen={() => setShowAuth(true)} />}

      {/* ── Onboarding Wizard ── */}
      {showOnboarding && isLoggedIn && (
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      )}

      {/* ── PWA Install Banner ── */}
      {pwaBannerVisible && (
        <PWAInstallBanner onInstall={handlePwaInstall} onDismiss={handlePwaDismiss} />
      )}
    </div>
  )
}
