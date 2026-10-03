'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Reads the catalog tables plus achievements and activity: quests,
// notifications, study rooms, mentors, industry skills, partners, badges, and the
// daily XP calendar. Every section renders an explicit empty state when its table
// has no rows, so "no data" is never read as "zero".

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

// Single module-level store.
//
// Header, Home, and Community each call useCatalog(). With per-call state,
// marking a notification read inside the drawer would never reach the Header's
// bell: two copies of the same data. One store with subscribers keeps every
// screen on the same value and needs one query for all of them.
let snapshot = { data: EMPTY, loading: true }
const subscribers = new Set()
let inflight = null

// User whose data the store currently holds. Without it, user A's data stays
// readable after logout and B logs in on the same browser. The key guards
// publish rather than caching per user, so B sees empty first, then their own.
let ownerId = null

function publish(next) {
  snapshot = next
  subscribers.forEach((fn) => fn(snapshot))
}

async function fetchAll() {
  const supabase = createClient()

  // Tabel saling independen, jadi satu query yang gagal tidak boleh mengosongkan
  // seluruh layar. Kegagalan berakhir sebagai array kosong dan terlihat lewat
  // empty state per section.
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

// Beberapa layar bisa memanggil reload() bersamaan; satu promise dipakai
  // bersama supaya lima request tidak menjadi lima request.
function load(userId) {
  if (inflight && ownerId === userId) return inflight

  const mine = userId
  ownerId = mine
  publish({ ...snapshot, loading: true })

  const promise = fetchAll()
    .then((data) => {
      // Request user A bisa selesai setelah A logout dan B login; tanpa guard ini
      // data A akan menimpa store milik B.
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

  // Read status goes through an RPC, not a client UPDATE: writing
  // `read_by = '{uuid}'` directly would wipe other users' markers on the same row.
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

  // reload butuh user id karena guard di load() membandingkan pemilik request.
  const reload = useCallback(() => load(userId), [userId])

  return { ...state.data, loading: state.loading, markRead, markAllRead, reload }
}