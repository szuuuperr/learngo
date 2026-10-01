'use client'

import React, {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

// Session + profile state.
//
// The Supabase browser client already persists the session in cookies, so a
// full page load picks the existing session back up. `onAuthStateChange` then
// keeps `user` in sync for the rest of the session (including sign-out from
// another tab).
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // True until the first session check settles. Consumers that render
  // differently for "logged in" vs "logged out" must wait for this, otherwise
  // the server has no cookie and the first client render would disagree with
  // the server markup.
  const [loading, setLoading] = useState(true)

  // Lazy useState initializer rather than a ref: the React lint rules reject
  // touching `.current` during render, and a ref write there would not be
  // reliably visible before the first effect runs anyway.
  const [supabase] = useState(createClient)

  // Load the `public.users` row for the current user.
  //
  // Runs on every session change rather than on mount, because the profile row
  // is created by an auth trigger that finishes a moment after the session
  // lands. A user whose profile is still missing gets `null` here and the UI
  // falls back to the auth metadata instead of crashing.
  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('users')
      .select('id,name,username,avatar_url,xp,level,xp_to_next,streak,lives,max_lives,gems,keys,daily_goal_progress,socratic_mode,active_lang,is_certified')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      // A missing profile is expected right after first signup, so this is a
      // debug-level concern rather than something the user needs to see.
      console.error('[auth] profile fetch failed:', error.message)
      setProfile(null)
      return
    }
    setProfile(data ?? null)
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

  // ── Sign in with Google (PKCE) ─────────────────────────────────────────────
  // PKCE is the default for supabase-js v2 and requires no extra config. The
  // verifier is stored in a cookie by the browser client, then app/auth/callback
  // exchanges the `code` for a session server-side.
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

  // ── Email + password ───────────────────────────────────────────────────────
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