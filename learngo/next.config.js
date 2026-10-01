/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that must stay external to the Turbopack bundle.
  // pdf-parse pulls in pdfjs-dist and @napi-rs/canvas; bundling them breaks the
  // native canvas binding and the worker setup at runtime.
  serverExternalPackages: ['pdf-parse'],

  // .svg assets in public/ and imported from JS are served as-is.
  // Next 16 uses Turbopack by default for dev + build.
}

module.exports = nextConfig
