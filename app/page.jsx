'use client'

import HomeScreen from '@/screens/HomeScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  const { navigate } = useUI()
  return <HomeScreen onNavigate={navigate} />
}
