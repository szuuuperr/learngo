'use client'

import React, {
  createContext, useCallback, useContext, useEffect, useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useGame } from './GameContext'
import { useAuth } from './AuthContext'
import { useHydrated } from '@/lib/useHydrated'

// ─── Route map ────────────────────────────────────────────────────────────────
// Screen ids used across the app (onNavigate('tutor'), etc.) mapped to paths,
// plus which bottom-nav / sidebar tab each path highlights.
//
// Note: `quests` highlights the Game tab, `quiz` highlights Learn, and
// `community` highlights the Other tab, mirroring the original imperative router
// in App.jsx.
export const ROUTES = {
  home:      { path: '/',          navTab: 'home' },
  tutor:     { path: '/tutor',     navTab: 'tutor' },
  learn:     { path: '/learn',     navTab: 'learn' },
  quests:    { path: '/quests',    navTab: 'game' },
  game:      { path: '/game',      navTab: 'game' },
  quiz:      { path: '/quiz',      navTab: 'learn' },
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
  // Session state lives in AuthContext; this provider only mirrors it so the
  // existing `useUI().isLoggedIn` consumers keep working unchanged.
  const { isLoggedIn, signOut } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  // Overlays driven by localStorage must not render until after hydration,
  // otherwise the client renders markup the server never produced.
  const hydrated = useHydrated()

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
  const handleLogout = useCallback(async () => {
    setShowLogout(false)
    try {
      await signOut()
      showToast('✅ Logged out successfully')
    } catch (err) {
      // The session is gone locally either way, so a failed server call should
      // not leave the modal spinning.
      console.error('[auth] sign out failed:', err.message)
      showToast('⚠️ Signed out locally, server call failed')
    }
  }, [signOut, showToast])

  const handleAuthSuccess = useCallback(() => {
    setShowAuth(false)
    setIsLoggedIn(true)
    showToast('🎉 Welcome back to LearnGo!')
  }, [showToast])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const navTab = PATH_TO_TAB[pathname] ?? 'home'

  // Gated on `hydrated` so the server and the hydration pass both render
  // without the modal, and it appears only on the client afterwards.
  const onboardingVisible = hydrated && showOnboarding

  return (
    <UIContext.Provider value={{
      navigate, navTab, pathname,
      isLoggedIn,
      showAuth, setShowAuth,
      showLogout, setShowLogout,
      toast: activeToast, showToast, clearToast: dismissToast,
      questModal, setQuestModal,
      activeLesson, setActiveLesson,
      showOnboarding: onboardingVisible, setShowOnboarding,
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
