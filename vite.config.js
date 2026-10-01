import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function getPkgVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
    return pkg.version ?? '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function getCommitSha() {
  // Vercel exposes the full SHA at build time; locally fall back to git.
  // NOTE: globalThis.process avoids needing node globals in eslint (browser-only config).
  const vercelSha = globalThis.process?.env?.VERCEL_GIT_COMMIT_SHA
  if (vercelSha) return vercelSha.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return 'local'
  }
}

const PKG_VERSION = getPkgVersion()
const COMMIT_SHA = getCommitSha()
// Build stamp shown in the app chrome so a stale cached PWA bundle is
// diagnosable on sight. Format: YYYYMMDD-HHmm UTC.
const BUILD_TIME = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

export default defineConfig({
  define: {
    // Short display version: "1.0.0+87412c6". Kept stable across the file so
    // both old cached bundles and new ones can render something sensible.
    __APP_VERSION__: JSON.stringify(`${PKG_VERSION}+${COMMIT_SHA}`),
    __APP_PKG_VERSION__: JSON.stringify(PKG_VERSION),
    __APP_COMMIT__: JSON.stringify(COMMIT_SHA),
    __APP_BUILD_TIME__: JSON.stringify(BUILD_TIME),
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
        // Purge superseded precaches on activate so a phone that skipped a
        // deploy can never keep serving a doubly-stale bundle.
        cleanupOutdatedCaches: true,
        // New SW takes control as soon as the user taps Reload in the
        // UpdatePrompt banner (skipWaiting via updateServiceWorker(true)).
        clientsClaim: true,
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