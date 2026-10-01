'use client'

import HomeScreen from '@/screens/HomeScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  const { navigate, setQuestModal } = useUI()
  return <HomeScreen onNavigate={navigate} onStartQuest={setQuestModal} />
}
