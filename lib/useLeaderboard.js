'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/context/AuthContext'

// Leaderboard for the peer list and the Quests tab.
//
// Data comes from the get_leaderboard() RPC rather than a client-side join,
// because RLS on `users` only lets each user read their own row. The list is
// empty on a fresh database since everyone starts at 0 XP, which is shown as an
// explicit empty state rather than padded with invented rows.

export function useLeaderboard(limit = 10) {
  const { isLoggedIn, user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      if (!isLoggedIn) {
        setEntries([])
        setLoading(false)
        return
      }

      setLoading(true)
      const { data, error } = await createClient().rpc('get_leaderboard', { limit_rows: limit })

      if (cancelled) return

      if (error) {
        console.error('[leaderboard] failed:', error.message)
        setEntries([])
        setLoading(false)
        return
      }

      const currentUserId = user?.id ?? null
      setEntries((data ?? []).map((row, i) => ({
        rank: i + 1,
        id: row.id,
        name: row.name || 'Learner',
        avatarUrl: row.avatar_url ?? null,
        xp: row.xp ?? 0,
        level: row.level ?? 1,
        streak: row.streak ?? 0,
        isMe: row.id === currentUserId,
      })))

      setLoading(false)
    })()

    return () => { cancelled = true }
  }, [isLoggedIn, user?.id, limit])

  return { entries, loading }
}