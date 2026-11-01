import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Installable PWA. autoUpdate re-fetches the service worker and swaps in a
    // new build in the background; main.tsx calls the generated
    // registerSW() helper to activate it.
    VitePWA({
      registerType: 'autoUpdate',
      // Icons + manifest.webmanifest below live in / (served from public/).
      includeAssets: [
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        // Stable app identity for installability/TWA. Keeping id === start_url
        // means existing installs are recognised as the same app.
        id: '/',
        name: 'Field Book',
        short_name: 'Field Book',
        description: 'Event attendance and certification platform',
        lang: 'en',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['education', 'productivity'],
        start_url: '/',
        scope: '/',
        theme_color: '#E2A23B',
        background_color: '#F6F1E7',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // App shortcuts (long-press the installed icon). Both target existing
        // routes — no new pages. Student-gated: opening while signed out
        // redirects through the auth guard to /login, which is acceptable.
        shortcuts: [
          {
            name: 'My Certificates',
            short_name: 'Certificates',
            description: 'View your issued certificates',
            url: '/student/certificates',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Scan Attendance',
            short_name: 'Scan',
            description: 'Scan an event QR code to check in',
            url: '/student/scanner',
            icons: [{ src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        // Store/install listing screenshots. Real pixel dimensions read from
        // the source files (do not change these if the images are replaced
        // without re-measuring). form_factor "wide" = desktop listing,
        // "narrow" = mobile listing.
        screenshots: [
          {
            src: '/screenshots/homepage-wide.png',
            sizes: '1023x4944',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Field Book landing page',
          },
          {
            src: '/screenshots/login-narrow.png',
            sizes: '390x844',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Field Book sign-in on mobile',
          },
        ],
      },
      workbox: {
        // Precache the built app shell.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wasm,mjs}'],
        // SPA deep links -> index.html (mirrors the Vercel rewrite). index.html
        // is precached, so cached SPA routes load offline instead of the
        // browser's error page. offline.html is also precached (globPatterns
        // includes html) as the friendly hard-offline document for packaging
        // and for the Vercel-side fallback.
        navigateFallback: '/index.html',
        // Never route API/auth/callback URLs or Digital Asset Links through the
        // SPA fallback — assetlinks.json must be served as its own JSON file.
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/\.well-known\//],
        // pdfjs worker chunk can exceed the 2 MiB default; lift the ceiling
        // so the build does not silently drop it from the precache.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Treat all network/data sources as NetworkOnly — auth tokens and
        // API responses must never be served from cache.
        runtimeCaching: [
          {
            // Supabase (auth, REST, storage, realtime).
            urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co'),
            handler: 'NetworkOnly',
          },
          {
            // Certificate-service (VITE_CERTIFICATE_SERVICE_URL) and any other
            // cross-origin API host. Same-origin precached assets are handled
            // by the precache above; anything else cross-origin is not cached.
            urlPattern: ({ sameOrigin }) => !sameOrigin,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // Keep the SW out of the dev server so HMR is unaffected.
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
