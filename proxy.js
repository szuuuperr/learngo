import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Session refresh proxy (Next.js 16 renamed `middleware.ts` to `proxy.ts`).
// Not optional: the access token in the auth cookie expires about an hour after
// it was issued, so this refreshes it per matched request and writes the new
// cookies onto the outgoing response. Skip it and users get logged out at random.
export async function proxy(request) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          // Mirror onto the request so Server Components in this same pass see
          // the refreshed token.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Rebuild the response, otherwise the refreshed cookies are dropped.
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          if (headers) {
            Object.entries(headers).forEach(([key, value]) => {
              supabaseResponse.headers.set(key, value)
            })
          }
        },
      },
    },
  )

  // Do not insert logic between creating the client and this call. Running
  // anything async in between can read a half-initialised session.
  const { data, error } = await supabase.auth.getClaims()

  if (error && process.env.NODE_ENV === 'development') {
    console.error('[proxy] session refresh failed:', error.message)
  }

  // Session refresh only — no redirect logic. A redirect here would lock out
  // anyone opening the app while logged out. Tahap 3 wires route protection if needed.
  void data

  // Returning supabaseResponse (not a fresh NextResponse) is what keeps the
  // cookie store in sync between browser and server.
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on every path except:
     * - _next/static  (build output)
     * - _next/image   (image optimizer)
     * - favicon.ico
     * - static assets (svg/png/jpg/webp/fonts)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)',
  ],
}