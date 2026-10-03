/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that must stay external to the Turbopack bundle: pdf-parse
  // pulls in pdfjs-dist and @napi-rs/canvas; bundling them breaks the native canvas
  // binding and the worker setup at runtime.
  serverExternalPackages: ['pdf-parse'],

  // dangerouslyAllowSVG sengaja TIDAK diaktifkan: aset brand di public/images dirender
  // dengan <img> biasa, bukan next/image, jadi tidak butuh optimasi gambar sama sekali.
  // Mengaktifkannya membuat Next meng-inline SVG ke dalam HTML, dan SVG bisa membawa
  // <script>. Aturan no-img-element dimatikan hanya di berkas yang memakai aset
  // tersebut — lihat eslint.config.mjs.
}

module.exports = nextConfig
