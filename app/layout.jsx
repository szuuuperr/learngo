import { Sour_Gummy, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '@/context/Providers'
import AppShell from '@/components/AppShell'

// Font utama: Sour Gummy, dirancang oleh Stefie Justprince. Sumbu variable
// weight 100-900, jadi kelas tailwind seperti font-extrabold tetap terpakai.
const sourGummy = Sour_Gummy({
  subsets: ['latin'],
  variable: '--font-gummy',
  display: 'swap',
})

// Hanya untuk kode dan angka: Sour Gummy tidak monospace, jadi jarak antar
// karakter di blok kode dan kolom angka akan tidak rata kalau ikut dipakainya.
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata = {
  title: 'LearnGo — AI Companion for CS Fundamentals',
  description: 'AI-powered CS learning companion',
  // Route manifest memang app/manifest.js, bukan app/manifest.webmanifest dan
  // bukan public/manifest.json. Menunjuk /manifest.json menghasilkan 404 dan
  // membuat browser tidak pernah membaca metadata PWA sama sekali.
  manifest: '/manifest.webmanifest',
  // Logo brand resmi, bukan icon-192.svg yang isinya fox geometris buatan tangan.
  icons: {
    icon: [
      { url: '/images/logo-learngo.svg', type: 'image/svg+xml' },
    ],
    apple: '/images/logo-learngo.svg',
  },
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
      <head>
        {/* Browser lama yang tidak mendukung SVG akan jatuh ke /favicon.ico. */}
        <link rel="icon" href="/images/logo-learngo.svg" type="image/svg+xml" />
      </head>
      <body className={`${sourGummy.variable} ${jetbrains.variable}`}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  )
}
