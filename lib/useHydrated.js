'use client'

import { useSyncExternalStore } from 'react'

// Reading localStorage during render returns a different value on the server
// (nothing stored) than on the client (the real value), which React reports as a
// hydration mismatch. useSyncExternalStore handles this: getServerSnapshot serves
// the server render *and* the hydration pass, and getSnapshot only takes over
// afterwards, so the first client render always matches the server markup.
const noopSubscribe = () => () => {}

export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,   // client, after hydration
    () => false,  // server and hydration pass
  )
}
