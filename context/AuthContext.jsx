'use client'

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

// The Supabase browser client persists the session in cookies, so a full page
// load picks the existing session back up. `onAuthStateChange` keeps `user` in
// sync for the rest of the session, including sign-out from another tab.
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // True until the first session check settles. Consumers that render
  // differently for "logged in" vs "logged out" must wait for this, otherwise
  // the first client render disagrees with the server markup.
  const [loading, setLoading] = useState(true)

  const [supabase] = useState(createClient)

  // Set when a loadProfile call has been started for a given user id, so a
  // retry loop from an older session cannot overwrite a newer result.
  const profileLoadId = useRef(null)

  // Load the `public.users` row for the current user.
  //
  // Runs on every session change rather than on mount, because the profile row
  // is created by an auth trigger that finishes a moment after the session
  // lands. A missing row is a legitimate transient state right after signup, so
  // it is retried: treating it as final leaves profile null, which makes every
  // earnXP/completeLevel silently no-op and looks like lost progress.
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      profileLoadId.current = null
      setProfile(null)
      return
    }

    profileLoadId.current = userId
    const isStale = () => profileLoadId.current !== userId

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const { data, error } = await supabase
        .from('users')
        .select('id,name,username,avatar_url,xp,level,xp_to_next,streak,lives,max_lives,gems,keys,daily_goal_progress,socratic_mode,active_lang,is_certified')
        .eq('id', userId)
        .maybeSingle()

      if (isStale()) return

      if (error) {
        console.error('[auth] profile fetch failed:', error.message)
        setProfile(null)
        return
      }

      if (data) {
        setProfile(data)
        return
      }

      // Baris belum ada: trigger mungkin masih berjalan, atau migrasi yang
      // meng-install trigger belum pernah dijalankan di project ini.
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)))
        continue
      }

      console.error(
        '[auth] no public.users row for this account. ' +
        'Is 0001_init.sql applied, so on_auth_user_created exists?',
      )
      setProfile(null)
    }
  }, [supabase])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)

      // TOKEN_REFRESHED fires often (roughly hourly). Re-reading the profile on
      // every one of those is wasted work for a row that rarely changes.
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        loadProfile(nextSession?.user?.id ?? null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

  // PKCE is the default for supabase-js v2. The verifier goes into a cookie set
  // by the browser client, then app/auth/callback exchanges the `code`.
  const signInWithGoogle = useCallback(async (next = '/') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        scopes: 'email profile',
      },
    })

    // A successful call navigates away, so reaching the next line means it
    // failed. Google being disabled in the dashboard surfaces here.
    if (error) throw new Error(error.message)
  }, [supabase])

  const signInWithPassword = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }, [supabase])

  const signUp = useCallback(async (email, password, name) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      // Read by the on_auth_user_created trigger to fill public.users.name.
      options: { data: { full_name: name } },
    })
    if (error) throw new Error(error.message)
    return (await supabase.auth.getSession()).data.session
  }, [supabase])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
    setProfile(null)
  }, [supabase])

  // Display name, preferring the profile row over whatever the OAuth provider
  // sent. Falls back through several sources because Google metadata is not
  // guaranteed for every account.
  const displayName =
    profile?.name ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.user_metadata?.name ||
    session?.user?.email?.split('@')[0] ||
    'Learner'

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isLoggedIn: !!session,
    displayName,
    avatarUrl: profile?.avatar_url ?? session?.user?.user_metadata?.avatar_url ?? null,
    signInWithGoogle,
    signInWithPassword,
    signUp,
    signOut,
    refreshProfile: () => loadProfile(session?.user?.id ?? null),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}