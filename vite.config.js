import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Build stamp shown in the app chrome (Layout footer) so a stale cached
  // PWA bundle is diagnosable on sight. Format: YYYYMMDD-HHmm UTC.
  define: {
    __APP_VERSION__: JSON.stringify(
      new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    ),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' (not autoUpdate): a new bundle waits until the user taps
      // Reload in the UpdatePrompt banner, so an update can never yank the
      // page mid-order. The banner is the only update UI — see UpdatePrompt.
      registerType: 'prompt',
      includeAssets: ['favicon-32.png', 'logo.svg', 'apple-touch-icon.png', 'icon-*.png', 'apple-splash-*.png'],
      manifest: false, // we ship public/manifest.webmanifest manually
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Supabase REST (PostgREST) queries. NetworkFirst, but entries
            // expire after 5 min so a stale/poisoned response can never linger
            // (e.g. an empty per-order detail response cached during a timeout
            // shadowing live data on a later visit).
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            method: 'GET',
            options: { cacheName: 'supabase-api', networkTimeoutSeconds: 8, cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 60, maxAgeSeconds: 5 * 60 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
})