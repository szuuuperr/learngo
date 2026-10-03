'use client'

import QuestsScreen from '@/screens/QuestsScreen'
import { useUI } from '@/context/UIContext'

export default function Page() {
  // Tombol kartu quest hanya memindahkan user ke tab tempat quest itu dikerjakan.
  const { navigate } = useUI()

  return <QuestsScreen onNavigate={navigate} />
}