import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase client for Server Components, Server Actions and Route Handlers.
//
// Call inside a request scope only — `cookies()` reads the incoming request.
// Never hoist the result to a module-level variable: with Fluid compute one
// client is shared across concurrent requests, leaking one visitor's session
// into another's page.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Server Components cannot write cookies. This branch is reached during the
            // initial render, but proxy.js has already refreshed the session and
            // written the cookies to the response, so swallowing the error here
            // is correct rather than a lost update.
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignored: called from a Server Component. See above.
          }
        },
      },
    },
  )
}