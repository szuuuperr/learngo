'use client'

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { createClient } from '@/lib/supabase/client'
import { lessonsByLang } from '@/data/curriculum'

// localStorage hanya memegang preferensi tampilan. Semua angka gamifikasi dan
// level tinggal di Supabase sebagai sumber kebenaran.
const SAVE_KEY = 'learngo_save'
const LOCAL_FIELDS = ['socraticMode', 'activeLang']

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

const INITIAL_DEFAULTS = {
  // Placeholder saja; APPLY_PROFILE menggantinya dari baris `users`.
  name: 'Learner',
  level: 1,
  xp: 0,
  xpToNext: 600,
  streak: 0,
  lives: 5,
  maxLives: 5,
  gems: 0,
  keys: 0,
  dailyGoalProgress: 0,
  socraticMode: 'strict', // 'strict' | 'guided'

  // Progress per bahasa: { python: [true,true,false,...], javascript: [...], ... }
  completedLevels: {
    python:     [false, false, false, false, false, false, false, false, false, false],
    javascript: [false, false, false, false, false, false, false, false, false, false],
    cpp:        [false, false, false, false, false, false, false, false, false, false],
    dsa:        [false, false, false, false, false, false, false, false, false, false],
  },

  activeLang: 'python',

  // Quest harian yang sudah selesai: { finish_lesson: true, ... }
  questsDone: {},

  // Achievement yang baru terbuka pada sesi ini, keyed by slug. Daftar lengkap
  // milik user dibaca dari tabel user_achievements lewat useCatalog, supaya
  // tidak ada dua sumber kebenaran.
  achievements: {},

  toastMsg: null,
}

function reducer(state, action) {
  switch (action.type) {

    case 'HYDRATE': {
      const next = { ...state }
      for (const k of LOCAL_FIELDS) {
        if (action.saved[k] !== undefined) next[k] = action.saved[k]
      }
      return next
    }

    // Baris `users` adalah sumber kebenaran untuk angka dan preferensi.
    // completedLevels dan questsDone datang lewat action terpisah karena
    // keduanya tinggal di tabel user_progress dan user_quests.
    case 'APPLY_PROFILE': {
      const p = action.profile
      const next = { ...state }
      if (p.socratic_mode != null) next.socraticMode = p.socratic_mode
      if (p.active_lang != null)   next.activeLang = p.active_lang
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

    // DB menyimpan indeks lesson yang selesai, sedangkan state memakai array
    // boolean sejajar dengan urutan lesson. Panjang array mengikuti jumlah
    // lesson di kurikulum, bukan panjang daftar indeks.
    case 'APPLY_LEVELS': {
      const indices = action.levels ?? []
      const total = (lessonsByLang[action.lang] ?? []).length
      const arr = Array(total).fill(false)
      indices.forEach((i) => {
        if (Number.isInteger(i) && i >= 0 && i < total) arr[i] = true
      })
      return {
        ...state,
        completedLevels: { ...state.completedLevels, [action.lang]: arr },
      }
    }

    case 'APPLY_QUESTS': {
      const done = {}
      for (const row of action.rows ?? []) {
        if (row.done) done[row.quest_code] = true
      }
      return { ...state, questsDone: done }
    }

    case 'EARN_XP': {
      // xp adalah total kumulatif dan xpToNext adalah ambang total untuk level
      // berikutnya. Aturan ini harus sama dengan award_gameplay_xp di server
      // supaya update optimistis tidak melompat mundur saat angka otoritatif tiba.
      const newXP = state.xp + action.amount
      let level = state.level
      let threshold = state.xpToNext > 0 ? state.xpToNext : 600
      while (newXP >= threshold) {
        level += 1
        threshold = Math.round(threshold * 1.3)
      }
      return {
        ...state,
        xp: newXP,
        level,
        xpToNext: threshold,
        gems: state.gems + Math.floor(action.amount / 5),
        dailyGoalProgress: Math.min(100, state.dailyGoalProgress + Math.floor(action.amount / 3)),
        toastMsg: level > state.level
          ? `🎉 Level Up! You're now Level ${level}!`
          : `✨ +${action.amount} XP!`,
      }
    }

    // Nilai sudah dari server, jadi dipakai apa adanya. Dipakai setelah RPC
    // award_gameplay_xp selesai supaya angka di UI sama dengan yang tersimpan.
    case 'SET_STATS': {
      const s = action.stats
      return {
        ...state,
        xp: s.xp ?? state.xp,
        level: s.level ?? state.level,
        xpToNext: s.xp_to_next ?? state.xpToNext,
        streak: s.streak ?? state.streak,
        lives: s.lives ?? state.lives,
        gems: s.gems ?? state.gems,
        keys: s.keys ?? state.keys,
        dailyGoalProgress: s.daily_goal_progress ?? state.dailyGoalProgress,
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
      return {
        ...state,
        questsDone: newDone,
        dailyGoalProgress: Math.min(100, state.dailyGoalProgress + 15),
      }
    }

    // Server yang memutuskan lewat sync_achievements dan hanya mengirim
    // achievement yang baru terbuka, jadi toast tidak muncul dua kali.
    case 'PUSH_ACHIEVEMENT': {
      const a = action.achievement
      if (!a?.slug) return state
      return {
        ...state,
        achievements: { ...state.achievements, [a.slug]: true },
        toastMsg: `${a.icon ?? ''} Achievement unlocked: ${a.title}!`,
      }
    }

    // Preferensi tetap dipertahankan karena activeLang dan socraticMode sudah
    // ditulis ke baris users. Nilai default di sini harus sama dengan default
    // kolom users agar tidak melenceng setelah reset.
    case 'RESET':
      return {
        ...INITIAL_DEFAULTS,
        activeLang: state.activeLang,
        socraticMode: state.socraticMode,
        toastMsg: null,
      }

    case 'CLEAR_TOAST':
      return { ...state, toastMsg: null }

    case 'SET_TOAST':
      return { ...state, toastMsg: action.msg }

    default:
      return state
  }
}

const GameContext = createContext(null)

export function GameProvider({ children }) {
  // Mulai dari default di render server maupun render client pertama, lalu
  // tarik state tersimpan setelah mount. Membaca localStorage di useReducer
  // initializer akan menghasilkan hydration mismatch.
  const [state, dispatch] = useReducer(reducer, INITIAL_DEFAULTS)
  const saveTimer = useRef(null)
  const hydrated = useRef(false)

  // Angka gamifikasi sengaja tidak hydrate dari sini: angka lama di browser
  // akan menimpa nilai yang baru saja ditarik dari database.
  useEffect(() => {
    const saved = loadSaved()
    if (Object.keys(saved).length > 0) dispatch({ type: 'HYDRATE', saved })
    hydrated.current = true
  }, [])

  const { profile, refreshProfile } = useAuth()
  const profileId = profile?.id ?? null

  // Nilai active_lang dan socratic_mode yang baru dipilih user di perangkat ini.
  // AuthContext menyimpan salinan baris users yang hanya berubah setelah
  // refetch, jadi ref ini menahan kedua kolom itu sampai server mengonfirmasi
  // nilai yang sama.
  const localPrefs = useRef(null)

  // Tarik profil otoritatif. Menjalankan setelah hydration di atas supaya
  // user yang kembali melihat preferensinya dulu, lalu angka dari database.
  useEffect(() => {
    if (!profileId) return

    const pinned = localPrefs.current
    let incoming = profile

    if (pinned) {
      const next = { ...profile }

      if (next.active_lang != null && next.active_lang !== pinned.active_lang) {
        delete next.active_lang
      }
      if (next.socratic_mode != null && next.socratic_mode !== pinned.socratic_mode) {
        delete next.socratic_mode
      }

      // Server sudah mengembalikan nilai yang sama dengan pilihan user, jadi
      // jepitannya bisa dilepas.
      if (next.active_lang == null && next.socratic_mode == null) {
        localPrefs.current = null
      }

      incoming = next
    }

    dispatch({ type: 'APPLY_PROFILE', profile: incoming })
  }, [profileId, profile])

  // Progres level dan quest tinggal di tabel terpisah dari `users` karena
  // isinya per-bahasa dan per-hari.
  useEffect(() => {
    if (!profileId) return
    const supabase = createClient()
    let cancelled = false

    ;(async () => {
      const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('lang, completed_levels')

      // Kegagalan baca tidak boleh senyap: select yang ditolak RLS atau tabel yang
      // belum ada akan terlihat sama dengan "belum ada progres".
      if (progressError) {
        console.error('[game] reading user_progress failed:', progressError.message)
      }

      if (cancelled) return
      for (const row of progress ?? []) {
        dispatch({ type: 'APPLY_LEVELS', lang: row.lang, levels: row.completed_levels })
      }

      // Baris quest lama sengaja tidak diambil: `day` adalah bagian primary key
      // sehingga quest selesai hari ini otomatis terpisah dari quest kemarin.
      const { data: questRows, error: questError } = await supabase
        .from('user_quests')
        .select('quest_code, done')
        .gte('day', new Date().toISOString().slice(0, 10))

      if (questError) {
        console.error('[game] reading user_quests failed:', questError.message)
      }

      if (!cancelled) dispatch({ type: 'APPLY_QUESTS', rows: questRows ?? [] })
    })()

    return () => { cancelled = true }
  }, [profileId])

  // Simpan preferensi saja, debounce 600ms, dilewati sampai hydration selesai
  // supaya default tidak menimpa state tersimpan. Dependensi sengaja menyebut
  // kedua preferensi secara eksplisit, bukan `state`, kalau tidak efek ini
  // berjalan tiap kali XP bertambah.
  const { socraticMode, activeLang } = state

  useEffect(() => {
    if (!hydrated.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { localStorage.setItem(SAVE_KEY, JSON.stringify({ socraticMode, activeLang })) } catch {}
    }, 600)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [socraticMode, activeLang])

  // Dispatch dulu supaya UI sempat render nilai baru, lalu angka otoritatif dari
  // server menggantikannya. Kalau RPC gagal, state lokal tetap menampilkan
  // angka yang diklik user dan profil ditarik ulang pada kunjungan berikutnya.
  const earnXP = useCallback(async (amount) => {
    if (amount <= 0) return
    if (!profileId) {
      console.error('[game] earnXP called without a profile row')
      dispatch({ type: 'SET_TOAST', msg: 'XP not saved: your profile is still loading.' })
      return
    }
    dispatch({ type: 'EARN_XP', amount })

    const supabase = createClient()
    const { data, error } = await supabase.rpc('award_gameplay_xp', {
      xp_gain: amount,
      // Server menjumlahkan gems sendiri; progres harian dikirim sebagai nilai
      // absolut karena baris users tidak bisa menghitungnya.
      gems_gain: Math.floor(amount / 5),
      new_progress: Math.min(100, state.dailyGoalProgress + Math.floor(amount / 3)),
    })

    if (error) {
      console.error('[game] award_gameplay_xp failed:', error.message)
      return
    }
    dispatch({ type: 'SET_STATS', stats: data?.[0] })

    // sync_achievements dijalankan server di dalam RPC yang sama dan hanya
    // mengembalikan achievement yang benar-benar baru terbuka.
    const awarded = Array.isArray(data?.[0]?.achievements) ? data[0].achievements : []
    awarded.forEach((a) => dispatch({ type: 'PUSH_ACHIEVEMENT', achievement: a }))
  }, [profileId, state.dailyGoalProgress])

  const loseLife = useCallback(async () => {
    dispatch({ type: 'LOSE_LIFE' })

    if (!profileId) return
    const supabase = createClient()
    const { data, error } = await supabase.rpc('award_gameplay_xp', {
      xp_gain: 0,
      // Nilai dikirim absolut, bukan pengurangan, karena dua tab yang sama-sama
      // kehilangan nyawa akan saling menimpa kalau server menghitung dari
      // nilai yang dibaca client.
      new_lives: Math.max(0, state.lives - 1),
    })
    if (error) {
      console.error('[game] lose life failed:', error.message)
      return
    }
    dispatch({ type: 'SET_STATS', stats: data?.[0] })

    const awarded = Array.isArray(data?.[0]?.achievements) ? data[0].achievements : []
    awarded.forEach((a) => dispatch({ type: 'PUSH_ACHIEVEMENT', achievement: a }))
  }, [profileId, state.lives])

  const restoreLives = useCallback(async () => {
    dispatch({ type: 'RESTORE_LIVES' })

    if (!profileId) return
    const supabase = createClient()
    const { data, error } = await supabase.rpc('award_gameplay_xp', {
      xp_gain: 0,
      new_lives: state.maxLives,
    })
    if (error) {
      console.error('[game] restore lives failed:', error.message)
      return
    }
    dispatch({ type: 'SET_STATS', stats: data?.[0] })
  }, [profileId, state.maxLives])

// Client hanya meminta server menilai ulang semua quest; server yang memutuskan
  // mana yang syaratnya sudah terpenuhi. Definisi ini harus mendahului
  // completeLevel di bawah, karena completeLevel memanggilnya.
  const syncQuests = useCallback(async () => {
  if (!profileId) return []

  const supabase = createClient()
  const { data, error } = await supabase.rpc('sync_daily_quests')
  if (error) {
    console.error('[game] sync quests failed:', error.message)
    return []
  }

  const unlocked = (data ?? []).filter(r => r.unlocked).map(r => r.quest_code)
  if (unlocked.length > 0) {
    dispatch({
      type: 'APPLY_QUESTS',
      rows: unlocked.map(code => ({ quest_code: code, done: true })),
    })

    // RPC ini membayar XP quest di server, jadi profil harus ditarik ulang agar
    // Header tidak menampilkan XP lama.
    await refreshProfile()
  }

  return unlocked
}, [profileId, refreshProfile])

const completeLevel = useCallback(async (lang, idx) => {
    dispatch({ type: 'COMPLETE_LEVEL', lang, levelIndex: idx })

    // Penulisan gagal harus terlihat sebagai toast, bukan cuma baris di console,
    // karena angka dispatch di atas hanya hidup di memori.
    if (!profileId) {
      console.error('[game] completeLevel called without a profile row')
      dispatch({
        type: 'SET_TOAST',
        msg: 'Progress not saved: your profile is still loading. Try again in a moment.',
      })
      return
    }

    const next = state.completedLevels[lang] || []
    const indices = []
    next.forEach((done, i) => { if (done) indices.push(i) })
    if (!indices.includes(idx)) indices.push(idx)

    const supabase = createClient()
    const { error } = await supabase.rpc('save_level_progress', {
      lang,
      levels: indices,
    })
    if (error) {
      console.error('[game] save progress failed:', error.message)
      dispatch({
        type: 'SET_TOAST',
        msg: 'Progress not saved. Please try again.',
      })
    }

    // Quest finish_lesson dan all_languages bergantung pada baris user_progress
    // yang baru ditulis, jadi penilaiannya harus menyusul.
    syncQuests()
  }, [profileId, state.completedLevels, syncQuests])

// Preferensi ditulis ke baris `users`, bukan hanya ke localStorage, supaya
  // memilih bahasa di HP juga berlaku di laptop.
  const persistPreference = useCallback(async (patch) => {
    if (!profileId) return
    const supabase = createClient()
    const { error } = await supabase.from('users').update(patch).eq('id', profileId)
    if (error) {
      console.error('[game] save preference failed:', error.message)
      // Penulisan gagal: jangan tahan APPLY_PROFILE, nilai server adalah sumber
      // kebenaran dan harus bisa menimpa pilihan lokal.
      localPrefs.current = null
      return
    }

    // Refetch membuat AuthContext ikut berubah, jadi efek pemanggil
    // refreshProfile tidak lagi mengembalikan snapshot basi lewat APPLY_PROFILE.
    await refreshProfile()
  }, [profileId, refreshProfile])

  const setActiveLang = useCallback((lang) => {
    dispatch({ type: 'SET_ACTIVE_LANG', lang })
    localPrefs.current = { ...(localPrefs.current ?? {}), active_lang: lang }
    persistPreference({ active_lang: lang })
  }, [persistPreference])

  const clearToast = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), [])
  const setToast = useCallback((msg) => dispatch({ type: 'SET_TOAST', msg }), [])

  const setSocraticMode = useCallback((mode) => {
    dispatch({ type: 'SET_SOCRATIC_MODE', mode })
    localPrefs.current = { ...(localPrefs.current ?? {}), socratic_mode: mode }
    persistPreference({ socratic_mode: mode })
  }, [persistPreference])

  // Reset lewat RPC reset_user_progress agar achievement, riwayat kuis, dan
  // daily_activity ikut bersih; delete dari client tidak menyentuhnya.
  const resetProgress = useCallback(async () => {
    if (!profileId) {
      dispatch({ type: 'RESET' })
      return { ok: true }
    }

    const supabase = createClient()
    const { data, error } = await supabase.rpc('reset_user_progress')
    if (error) {
      console.error('[game] reset failed:', error.message)
      return { ok: false, error: error.message }
    }

    dispatch({ type: 'RESET' })

    // Baris profil dari server dipakai langsung supaya angka di Header sama
    // dengan yang tersimpan.
    const row = data?.[0]
    if (row) {
      dispatch({
        type: 'SET_STATS',
        stats: {
          xp: row.xp,
          level: row.level,
          xpToNext: row.xp_to_next,
          streak: row.streak,
          lives: row.lives,
          maxLives: row.max_lives,
          gems: row.gems,
          keys: row.keys,
          dailyGoalProgress: 0,
          isCertified: row.is_certified,
        },
      })
    }

    // Reset juga mengubah achievement dan riwayat kuis, yang masih ada di
    // AuthContext sampai profil ditarik ulang.
    await refreshProfile()

    return { ok: true }
  }, [profileId, refreshProfile])

  // Total dihitung dari kurikulum, bukan angka tetap, jadi menambah lesson baru
  // tidak membuat progres terkunci di 100%.
  const getLangProgress = (lang) => {
    const done = (state.completedLevels[lang] || []).filter(Boolean).length
    const total = (lessonsByLang[lang] || []).length
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
  }

  const isLevelDone = (lang, idx) => !!(state.completedLevels[lang] || [])[idx]

  return (
    <GameContext.Provider value={{
      ...state,
      earnXP, loseLife, restoreLives, completeLevel,
      setActiveLang, syncQuests, clearToast, setToast,
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