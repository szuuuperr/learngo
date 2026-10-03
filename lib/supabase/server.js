import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Supabase client for Server Components, Server Actions and Route Handlers.
//
// Call this inside a request scope only — `cookies()` reads from the incoming
// request. Never hoist the result into a module-level variable: with Fluid
// compute a single client is shared across concurrent requests, which would leak
// one visitor's session into another's page.
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
            // Server Components cannot write cookies. This branch is reached
            // during the initial render, but proxy.js has already refreshed the
            // session and written the cookies to the response, so swallowing the
            // error here is correct rather than a lost update.
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