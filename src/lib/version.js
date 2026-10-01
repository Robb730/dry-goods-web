// Single source of truth for the build stamp shown in the app chrome.
// Values are baked in at build time via vite.config.js `define`:
//   __APP_VERSION__     -> "1.0.0+87412c6" (package version + commit)
//   __APP_BUILD_TIME__  -> "2026-10-01 11:00 UTC"
// Falls back to "dev" strings under `vite dev` before a build exists.

// eslint-disable-next-line no-undef
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev'
// eslint-disable-next-line no-undef
export const APP_BUILD_TIME = typeof __APP_BUILD_TIME__ !== 'undefined' ? __APP_BUILD_TIME__ : 'dev'
// eslint-disable-next-line no-undef
export const APP_COMMIT = typeof __APP_COMMIT__ !== 'undefined' ? __APP_COMMIT__ : 'dev'

// Compact one-liner for headers/footers: "v1.0.0+87412c6 · 2026-10-01 11:00 UTC"
export const APP_VERSION_LABEL = `v${APP_VERSION} · ${APP_BUILD_TIME}`
