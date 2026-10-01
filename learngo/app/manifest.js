export default function manifest() {
  return {
    name: 'LearnGo',
    short_name: 'LearnGo',
    description: 'AI-powered CS learning companion',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#FF7A00',
    background_color: '#0F172A',
    icons: [
      { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
