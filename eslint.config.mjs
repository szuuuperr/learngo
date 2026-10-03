import { defineConfig } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

export default defineConfig([
  ...nextCoreWebVitals,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'next-env.d.ts',
    ],
  },
  {
    // Aset vektor di public/images pakai <img> biasa: next/image menolak SVG dari
    // public/ kecuali dangerouslyAllowSVG diaktifkan, karena SVG bisa berisi skrip
    // yang dieksekusi saat di-inline. Aset di sini vektor murni tanpa <script> dan
    // path-nya teks statis dari repo. Halaman lain tetap memakai next/image untuk raster.
    files: [
      'components/LearnGoLogo.jsx',
      'components/LanguageIcon.jsx',
      'components/Header.jsx',
      'screens/HomeScreen.jsx',
      'screens/LessonScreen.jsx',
    ],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
])
