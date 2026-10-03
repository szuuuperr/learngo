'use client'

import GameScreen from '@/screens/GameScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  const { setActiveLesson } = useUI()
  const onStartLesson = ({ lang, levelIndex, title }) =>
    setActiveLesson({ lang, levelIndex, title })

  return <GameScreen onStartLesson={onStartLesson} />
}
