'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'

// ─── Persistence helpers ───────────────────────────────────────────────────────
const SAVE_KEY = 'learngo_save'
const SAVED_FIELDS = [
  'xp','level','xpToNext','streak','lives','gems','keys',
  'dailyGoalProgress','completedLevels','questsDone','achievements',
  'socraticMode','activeLang',
]

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

// ─── Initial State ─────────────────────────────────────────────────────────────
const INITIAL_DEFAULTS = {
  // User. `name` is a placeholder only - APPLY_PROFILE replaces it with the
  // real value from the `users` row as soon as Supabase returns it.
  name: 'Learner',
  level: 5,
  xp: 450,
  xpToNext: 600,
  streak: 12,
  lives: 5,
  maxLives: 5,
  gems: 1200,
  keys: 3,
  dailyGoalProgress: 40,
  socraticMode: 'strict', // 'strict' | 'guided'

  // Progress per language: { python: [true,true,false,...], javascript: [...], ... }
  completedLevels: {
    python:     [true, true, true, true, false, false, false, false, false, false],
    javascript: [false, false, false, false, false, false, false, false, false, false],
    cpp:        [false, false, false, false, false, false, false, false, false, false],
    dsa:        [false, false, false, false, false, false, false, false, false, false],
  },

  // Active language in game
  activeLang: 'python',

  // Daily quests completion
  questsDone: {},

  // Achievements unlocked
  achievements: {
    streakMaster: true,
    quickLearner: true,
    logicPro: true,
    bookworm: false,
    top10: false,
    algorithmAce: false,
  },

  // Toast queue
  toastMsg: null,
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'HYDRATE': {
      const next = { ...state }
      for (const k of SAVED_FIELDS) {
        if (action.saved[k] !== undefined) next[k] = action.saved[k]
      }
      return next
    }

    // Overwrite the display/stats fields from the `users` row. Only the fields
    // listed here are touched - completedLevels, questsDone and achievements
    // stay owned by localStorage, since they are per-device state for now.
    //
    // socratic_mode and active_lang are deliberately NOT applied here. Both are
    // user-controlled preferences that the UI writes to this state directly, so
    // reading them back from the profile on every load would silently undo the
    // user's choice the moment the profile arrived or was refetched.
    case 'APPLY_PROFILE': {
      const p = action.profile
      const next = { ...state }
      if (p.name != null)      next.name = p.name
      if (p.xp != null)        next.xp = p.xp
      if (p.level != null)     next.level = p.level
      if (p.xp_to_next != null) next.xpToNext = p.xp_to_next
      if (p.streak != null)    next.streak = p.streak
      if (p.lives != null)     next.lives = p.lives
      if (p.max_lives != null) next.maxLives = p.max_lives
      if (p.gems != null)      next.gems = p.gems
      if (p.keys != null)      next.keys = p.keys
      if (p.daily_goal_progress != null) next.dailyGoalProgress = p.daily_goal_progress
      return next
    }

    case 'EARN_XP': {
      const newXP = state.xp + action.amount
      const levelUp = newXP >= state.xpToNext
      return {
        ...state,
        xp: levelUp ? newXP - state.xpToNext : newXP,
        level: levelUp ? state.level + 1 : state.level,
        xpToNext: levelUp ? Math.round(state.xpToNext * 1.3) : state.xpToNext,
        gems: state.gems + Math.floor(action.amount / 5),
        dailyGoalProgress: Math.min(100, state.dailyGoalProgress + Math.floor(action.amount / 3)),
        toastMsg: levelUp ? `🎉 Level Up! You're now Level ${state.level + 1}!` : `✨ +${action.amount} XP!`,
      }
    }

    case 'LOSE_LIFE': {
      const newLives = Math.max(0, state.lives - 1)
      return {
        ...state,
        lives: newLives,
        toastMsg: newLives === 0 ? '💔 No lives left! Try again tomorrow.' : `💔 Oops! ${newLives} lives remaining.`,
      }
    }

    case 'RESTORE_LIVES':
      return { ...state, lives: state.maxLives }

    case 'COMPLETE_LEVEL': {
      const { lang, levelIndex } = action
      const prev = state.completedLevels[lang] || []
      const updated = [...prev]
      updated[levelIndex] = true
      return {
        ...state,
        completedLevels: { ...state.completedLevels, [lang]: updated },
        dailyGoalProgress: Math.min(100, state.dailyGoalProgress + 10),
      }
    }

    case 'SET_ACTIVE_LANG':
      return { ...state, activeLang: action.lang }

    case 'SET_SOCRATIC_MODE':
      return { ...state, socraticMode: action.mode }

    case 'COMPLETE_QUEST': {
      const newDone = { ...state.questsDone, [action.questId]: true }
      const questCount = Object.keys(newDone).length
      return {
        ...state,
        questsDone: newDone,
        dailyGoalProgress: Math.min(100, state.dailyGoalProgress + 15),
        achievements: {
          ...state.achievements,
          quickLearner: questCount >= 3 ? true : state.achievements.quickLearner,
        },
      }
    }

    case 'RESET':
      return { ...INITIAL_DEFAULTS, toastMsg: null }

    case 'CLEAR_TOAST':
      return { ...state, toastMsg: null }

    case 'SET_TOAST':
      return { ...state, toastMsg: action.msg }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const GameContext = createContext(null)

export function GameProvider({ children }) {
  // Start from the defaults on BOTH server and first client render, then pull
  // the saved state in from localStorage after mount. Reading localStorage in
  // the useReducer initializer would produce different HTML on the server and
  // the client, which React reports as a hydration mismatch.
  const [state, dispatch] = useReducer(reducer, INITIAL_DEFAULTS)
  const saveTimer = useRef(null)
  const hydrated = useRef(false)

  // Hydrate from localStorage after mount.
  useEffect(() => {
    const saved = loadSaved()
    if (Object.keys(saved).length > 0) dispatch({ type: 'HYDRATE', saved })
    hydrated.current = true
  }, [])

  // Pull the authoritative profile in once Supabase has loaded it. Runs after
  // the localStorage hydration above, so a returning user sees their stored
  // progress first and their DB profile second.
  const { profile } = useAuth()
  const profileId = profile?.id ?? null
  useEffect(() => {
    if (!profileId) return
    dispatch({ type: 'APPLY_PROFILE', profile })
  }, [profileId, profile])

  // Debounced save to localStorage (600ms). Skipped until hydration finished so
  // the defaults never overwrite the saved state.
  useEffect(() => {
    if (!hydrated.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const toSave = {}
      for (const k of SAVED_FIELDS) toSave[k] = state[k]
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(toSave)) } catch {}
    }, 600)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [state])

  const earnXP        = useCallback((amount) => dispatch({ type: 'EARN_XP', amount }), [])
  const loseLife      = useCallback(() => dispatch({ type: 'LOSE_LIFE' }), [])
  const restoreLives  = useCallback(() => dispatch({ type: 'RESTORE_LIVES' }), [])
  const completeLevel = useCallback((lang, idx) => dispatch({ type: 'COMPLETE_LEVEL', lang, levelIndex: idx }), [])
  const setActiveLang = useCallback((lang) => dispatch({ type: 'SET_ACTIVE_LANG', lang }), [])
  const completeQuest     = useCallback((id) => dispatch({ type: 'COMPLETE_QUEST', questId: id }), [])
  const clearToast        = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), [])
  const setToast          = useCallback((msg) => dispatch({ type: 'SET_TOAST', msg }), [])
  const setSocraticMode   = useCallback((mode) => dispatch({ type: 'SET_SOCRATIC_MODE', mode }), [])
  const resetProgress     = useCallback(() => dispatch({ type: 'RESET' }), [])

  // Derived helpers
  const getLangProgress = (lang) => {
    const done = (state.completedLevels[lang] || []).filter(Boolean).length
    return { done, total: 10, pct: Math.round((done / 10) * 100) }
  }

  const isLevelDone = (lang, idx) => !!(state.completedLevels[lang] || [])[idx]

  return (
    <GameContext.Provider value={{
      ...state,
      earnXP, loseLife, restoreLives, completeLevel,
      setActiveLang, completeQuest, clearToast, setToast,
      setSocraticMode, getLangProgress, isLevelDone, resetProgress,
    }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}
