import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// OAuth callback. Supabase redirects here after a Google sign-in carrying a
// one-time `code`. Exchanging it for a session has to happen server-side: the
// PKCE verifier lives in an httpOnly cookie the browser client cannot read.
//
// Deliberately no redirect guard for `!user`: the demo flow wants an
// unauthenticated "Sign in with Google" click to land on /tutor.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error_description') || searchParams.get('error')

  if (error) {
    console.error('[auth/callback] OAuth error:', error)
    return NextResponse.redirect(`${origin}/?auth=failed`)
  }

  const next = sanitizeNext(searchParams.get('next'))

  if (!code) {
    return NextResponse.redirect(`${origin}${next}?auth=missing-code`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] code exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}${next}?auth=failed`)
  }

  // Prefer the host the request actually arrived on. Behind a proxy (Vercel,
  // ngrok, a tunnel for mobile demos) `origin` can be the internal host, while
  // x-forwarded-host carries the public one.
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'
  const base =
    !isLocal && forwardedHost ? `https://${forwardedHost}` : origin

  return NextResponse.redirect(`${base}${next}`)
}

// Only allow same-site relative paths. Without this check an attacker could
// craft ?next=//evil.com and turn the login into an open redirect.
function sanitizeNext(value) {
  if (!value) return '/tutor'
  if (!value.startsWith('/')) return '/tutor'
  // "//host" and "/\host" are protocol-relative URLs, not local paths.
  if (value.startsWith('//') || value.startsWith('/\\')) return '/tutor'
  return value
}