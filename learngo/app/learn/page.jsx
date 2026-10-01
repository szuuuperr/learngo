'use client'

import LearnScreen from '@/screens/LearnScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  const { navigate, setActiveLesson } = useUI()
  const onStartLesson = ({ lang, levelIndex, title }) =>
    setActiveLesson({ lang, levelIndex, title })

  return (
    <LearnScreen onNavigate={navigate} onStartLesson={onStartLesson} />
  )
}
