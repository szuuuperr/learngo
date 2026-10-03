import { createBrowserClient } from '@supabase/ssr'

// Supabase client for Client Components.
//
// The client is cached in a module-level variable so repeated calls across
// component renders reuse one instance. Creating a new client per render would
// drop the in-memory auth state and could open duplicate Realtime channels.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}