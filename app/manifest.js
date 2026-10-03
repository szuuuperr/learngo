// Metadata PWA. Berkas ini di-serve oleh Next sebagai /manifest.webmanifest,
// sesuai metadata.manifest di app/layout.jsx.
//
// Ikon memakai logo brand resmi, bukan icon-192.svg / icon-512.svg yang isinya
// fox geometris buatan tangan.
export default function manifest() {
  return {
    name: 'LearnGo',
    short_name: 'LearnGo',
    description: 'AI-powered CS learning companion',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    theme_color: '#FF7A00',
    background_color: '#212649',
    icons: [
      { src: '/images/logo-learngo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}
