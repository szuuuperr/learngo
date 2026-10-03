'use client'

import OtherScreen from '@/screens/OtherScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  const { navigate, setShowLogout } = useUI()

  return (
    <OtherScreen
      onLogout={() => setShowLogout(true)}
      onNavigate={navigate}
    />
  )
}
