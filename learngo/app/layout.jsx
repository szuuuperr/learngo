import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/context/Providers'
import AppShell from '@/components/AppShell'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata = {
  title: 'LearnGo — AI Companion for CS Fundamentals',
  description: 'AI-powered CS learning companion',
  manifest: '/manifest.json',
  icons: { icon: '/icon-192.svg' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LearnGo',
  },
}

export const viewport = {
  themeColor: '#FF7A00',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="learngo" suppressHydrationWarning>
      <body className={`${jakarta.variable} ${jetbrains.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
