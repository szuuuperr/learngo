/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server-side packages that must stay external to the Turbopack bundle.
  // TODO(Tahap 5): add 'pdf-parse' here once the PDF summary route is built.
  serverExternalPackages: [],

  // .svg assets in public/ and imported from JS are served as-is.
  // Next 16 uses Turbopack by default for dev + build.
}

module.exports = nextConfig
