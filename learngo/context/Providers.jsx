'use client'

import React from 'react'
import { GameProvider } from './GameContext'
import { UIProvider } from './UIContext'

export function Providers({ children }) {
  return (
    <GameProvider>
      <UIProvider>{children}</UIProvider>
    </GameProvider>
  )
}
