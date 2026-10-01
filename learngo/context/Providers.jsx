'use client'

import React from 'react'
import { GameProvider } from './GameContext'
import { AuthProvider } from './AuthContext'
import { UIProvider } from './UIContext'

// Order matters. UIProvider reads auth state, and GameProvider reads the
// profile, so both have to sit inside AuthProvider.
export function Providers({ children }) {
  return (
    <AuthProvider>
      <GameProvider>
        <UIProvider>{children}</UIProvider>
      </GameProvider>
    </AuthProvider>
  )
}