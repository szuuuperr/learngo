'use client'

import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useGame } from './GameContext'

// ─── Route map ────────────────────────────────────────────────────────────────
// Screen ids used across the app (onNavigate('tutor'), etc.) mapped to paths,
// plus which bottom-nav / sidebar tab each path highlights.
//
// Note: `quests` highlights the Game tab and `community` highlights the Other
// tab, mirroring the original imperative router in App.jsx.
export const ROUTES = {
  home:      { path: '/',          navTab: 'home' },
  tutor:     { path: '/tutor',     navTab: 'tutor' },
  learn:     { path: '/learn',     navTab: 'learn' },
  quests:    { path: '/quests',    navTab: 'game' },
  game:      { path: '/game',      navTab: 'game' },
  community: { path: '/community', navTab: 'other' },
  other:     { path: '/other',     navTab: 'other' },
}

const PATH_TO_TAB = Object.fromEntries(
  Object.entries(ROUTES).map(([id, { path, navTab }]) => [path, navTab]),
)

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { toastMsg, clearToast } = useGame()

  // ── Auth ────────────────────────────────────────────────────────────────────
  // TODO(Tahap 3): replace the `true` below with the real Supabase session.
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  // Read once during the initial render instead of inside an effect. The server
  // has no localStorage and always renders false, and suppressing the hydration
  // warning on <html> keeps the markup mismatch from being reported.
  const [showOnboarding, setShowOnboarding] = useState(
    () => typeof window !== 'undefined' && !localStorage.getItem('learngo_onboarded'),
  )

  // ── Overlays ────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null)
  const [questModal, setQuestModal] = useState(null)
  // activeLesson shape: { lang, levelIndex, title } — set by GameScreen/LearnScreen
  const [activeLesson, setActiveLesson] = useState(null)

  // ── PWA install prompt ──────────────────────────────────────────────────────
  const [pwaPrompt, setPwaPrompt] = useState(null)
  const [showPwaBanner, setShowPwaBanner] = useState(false)

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    setToast(null) // reset first so the same message re-triggers the animation
    requestAnimationFrame(() => setToast(msg))
  }, [])

  // GameContext raises its own toasts (earned XP, level up). Show whichever is
  // pending instead of copying one into the other via an effect — an effect that
  // only calls setState causes an extra render pass on every toast.
  const activeToast = toast ?? toastMsg

  const dismissToast = useCallback(() => {
    setToast(null)
    clearToast()
  }, [clearToast])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = useCallback((id) => {
    const route = ROUTES[id]
    if (!route) return
    router.push(route.path)
  }, [router])

  // Scroll back to top on route change (the SPA used to do this in navigate()).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  // ── PWA ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (localStorage.getItem('learngo_pwa_no')) return
    const handler = (e) => {
      e.preventDefault()
      setPwaPrompt(e)
      setShowPwaBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handlePwaInstall = useCallback(async () => {
    if (!pwaPrompt) return
    pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    setPwaPrompt(null)
    setShowPwaBanner(false)
    if (outcome === 'accepted') showToast('🎉 LearnGo installed successfully!')
  }, [pwaPrompt, showToast])

  const handlePwaDismiss = useCallback(() => {
    setShowPwaBanner(false)
    localStorage.setItem('learngo_pwa_no', '1')
  }, [])

  // ── Auth handlers ───────────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    setShowLogout(false)
    setIsLoggedIn(false)
    showToast('✅ Logged out successfully')
  }, [showToast])

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false)
    setIsLoggedIn(true)
    showToast('🎉 Welcome back to LearnGo!')
  }, [showToast])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const navTab = PATH_TO_TAB[pathname] ?? 'home'

  return (
    <UIContext.Provider value={{
      navigate, navTab, pathname,
      isLoggedIn, setIsLoggedIn,
      showAuth, setShowAuth,
      showLogout, setShowLogout,
      toast: activeToast, showToast, clearToast: dismissToast,
      questModal, setQuestModal,
      activeLesson, setActiveLesson,
      showOnboarding, setShowOnboarding,
      pwaPrompt, showPwaBanner,
      handlePwaInstall, handlePwaDismiss,
      handleLogout, handleAuthSuccess,
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be used inside UIProvider')
  return ctx
}
