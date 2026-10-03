'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Reads the catalog tables from migration 0004 plus achievements and activity
// from migration 0005: quests, notifications, study rooms, mentors, industry
// skills, partners, badges, and the daily XP calendar.
//
// Before this hook these sections rendered hardcoded numbers, so the UI could
// claim things the database never backed. Every section now shows an explicit
// empty state when its table has no rows, which keeps "no data" from being read
// as "zero".

const EMPTY = {
  quests: [],
  notifications: [],
  studyRooms: [],
  mentors: [],
  industrySkills: [],
  partners: [],
  achievements: [],
  earnedSlugs: [],
  activity: [],
  quizHistory: [],
}

// Each builder gets its own client so ordering can differ per table without
// sharing a mutable builder between parallel calls.
const BUILDERS = {
  quests:        () => createClient().from('quests').select('*')
                      .order('sort_order', { ascending: true }),
  studyRooms:    () => createClient().from('study_rooms').select('*')
                      .order('sort_order', { ascending: true }),
  mentors:       () => createClient().from('mentors').select('*')
                      .order('name', { ascending: true }),
  industrySkills:() => createClient().from('industry_skills').select('*')
                      .order('sort_order', { ascending: true }),
  partners:      () => createClient().from('partners').select('*')
                      .order('sort_order', { ascending: true }),
  notifications: () => createClient().from('notifications').select('*')
                      .order('created_at', { ascending: false }).limit(10),
  achievements:  () => createClient().from('achievements').select('*')
                      .order('sort_order', { ascending: true }),
  earnedSlugs:   () => createClient().from('user_achievements').select('slug'),
}

// Store tunggal di level modul.
//
// Header, Home, dan Community memanggil useCatalog() masing-masing. Kalau
// setiap panggilan punya state sendiri, menandai notifikasi terbaca di dalam
// drawer tidak pernah sampai ke lonceng di Header: keduanya jadi dua salinan
// data yang berbeda. Satu store dengan daftar subscriber membuat semua layar
// membaca nilai yang sama dan satu query cukup untuk semuanya.
let snapshot = { data: EMPTY, loading: true }
const subscribers = new Set()
let inflight = null

// User yang sedang memiliki data di store.
//
// Tanpa ini, data user A tetap terbaca setelah logout dan user B masuk di
// browser yang sama: snapshot masih berisi notifikasi dan achievement A sampai
// request B selesai. Kunci user id dipakai untuk Guard publish, bukan untuk
// cache per user, jadi B pasti melihat data kosong dulu lalu datanya sendiri.
let ownerId = null

function publish(next) {
  snapshot = next
  subscribers.forEach((fn) => fn(snapshot))
}

async function fetchAll() {
  const supabase = createClient()

  // Tabel saling independen, jadi satu query yang gagal tidak boleh
  // mengosongkan seluruh layar. Kegagalan berakhir sebagai array kosong
  // dan terlihat lewat empty state per section.
  const entries = await Promise.all(
    Object.entries(BUILDERS).map(async ([key, build]) => {
      const { data: rows, error } = await build()
      if (error) {
        console.error(`[catalog] ${key} failed:`, error.message)
        return [key, []]
      }
      return [key, rows ?? []]
    }),
  )

  // RPC sederhana untuk data yang butuh logika server, bukan filter biasa.
  const [activity, badges, history] = await Promise.all([
    supabase.rpc('get_recent_activity', { days_back: 13 }),
    supabase.rpc('get_user_badges'),
    supabase.rpc('get_quiz_history', { limit_rows: 5 }),
  ])

  if (activity.error) console.error('[catalog] activity failed:', activity.error.message)
  if (badges.error) console.error('[catalog] badges failed:', badges.error.message)
  if (history.error) console.error('[catalog] quiz history failed:', history.error.message)

  return {
    ...EMPTY,
    ...Object.fromEntries(entries),
    activity: activity.data ?? [],
    earnedSlugs: (badges.data ?? []).map(b => b.slug),
    quizHistory: history.data ?? [],
  }
}

// Beberapa layar bisa memanggil reload() pada saat yang sama. Satu promise
// dipakai bersama supaya lima request tidak menjadi lima request.
function load(userId) {
  if (inflight && ownerId === userId) return inflight

  const mine = userId
  ownerId = mine
  publish({ ...snapshot, loading: true })

  const promise = fetchAll()
    .then((data) => {
      // Request user A bisa selesai setelah A logout dan B login. Tanpa guard
      // ini, data A akan menimpa store milik B.
      if (ownerId !== mine) return snapshot.data
      publish({ data, loading: false })
      return data
    })
    .finally(() => {
      if (inflight === promise) inflight = null
    })

  inflight = promise
  return promise
}

function reset() {
  ownerId = null
  publish({ data: EMPTY, loading: false })
}

export function useCatalog() {
  const { user, isLoggedIn } = useAuth()
  const userId = user?.id ?? null
  const [state, setState] = useState(snapshot)

  useEffect(() => {
    subscribers.add(setState)
    return () => { subscribers.delete(setState) }
  }, [])

  useEffect(() => {
    if (!isLoggedIn || !userId) {
      reset()
      return
    }
    load(userId)
  }, [isLoggedIn, userId])

  // Status read ditulis lewat RPC, bukan UPDATE dari client. Menulis
  // `read_by = '{uuid}'` langsung akan menghapus penanda user lain pada baris
  // yang sama, jadi setiap user akan membuat notifikasi yang sudah dibaca
  // kembali tidak terbaca untuk semua orang. Fungsi server hanya menambah id.
  const markRead = useCallback(async (id) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.rpc('mark_notifications_read', { ids: [id] })
    if (error) {
      console.error('[catalog] mark read failed:', error.message)
      return
    }

    // Update lokal memakai gabungan, bukan nilai dari server, supaya penanda
    // milik user lain tetap terlihat utuh di layar.
    publish({
      ...snapshot,
      data: {
        ...snapshot.data,
        notifications: snapshot.data.notifications.map(n =>
          n.id === id
            ? { ...n, read_by: [...new Set([...(n.read_by ?? []), user.id])] }
            : n,
        ),
      },
    })
  }, [])

  const markAllRead = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // ids null berarti tandai semua yang terlihat oleh user ini.
    const { error } = await supabase.rpc('mark_notifications_read', { ids: null })
    if (error) {
      console.error('[catalog] mark all read failed:', error.message)
      return
    }

    publish({
      ...snapshot,
      data: {
        ...snapshot.data,
        notifications: snapshot.data.notifications.map(n => ({
          ...n,
          read_by: [...new Set([...(n.read_by ?? []), user.id])],
        })),
      },
    })
  }, [])

  // reload sekarang butuh user id karena guard di load() membandingkan
  // pemilik request. Layar cukup menutupinya dengan identitas yang sedang aktif.
  const reload = useCallback(() => load(userId), [userId])

  return { ...state.data, loading: state.loading, markRead, markAllRead, reload }
}