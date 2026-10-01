import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { APP_VERSION_LABEL } from '../lib/version'

// Surfaces when the precached PWA bundle is outdated: one tap reloads to the
// newest deployed version instead of silently running stale code.
export default function UpdatePrompt() {
  // NOTE: vite-plugin-pwa v1 returns state as [value, setter] tuples.
  // `immediate: true` checks for a new SW on page load; the interval +
  // visibility listener catch deploys that land while the app sits open.
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, r) {
      if (!r) return
      const check = () => r.update().catch(() => {})
      const id = setInterval(check, 60 * 60 * 1000)
      const onVisible = () => { if (document.visibilityState === 'visible') check() }
      document.addEventListener('visibilitychange', onVisible)
      // Best-effort cleanup if HMR swaps this module.
      if (import.meta.hot) {
        import.meta.hot.dispose(() => {
          clearInterval(id)
          document.removeEventListener('visibilitychange', onVisible)
        })
      }
    },
  })

  // Keep the current build label visible in devtools-adjacent UI even when no
  // update is pending — useful together with the Layout footer badge.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`[app-version] ${APP_VERSION_LABEL}`)
  }, [])

  if (!needRefresh) return null

  return (
    <div
      className="fixed left-0 right-0 flex justify-center px-4"
      style={{ bottom: 'calc(var(--bottom-nav-space, 76px) + 12px)', zIndex: 60 }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl pl-4 pr-2 py-2"
        style={{ background: '#0f172a', boxShadow: '0 8px 32px rgba(15,23,42,0.4)', maxWidth: 420, width: '100%' }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white" style={{ fontSize: '12px', fontWeight: 700 }}>
            New version available
          </p>
          <p className="text-slate-400 truncate" style={{ fontSize: '10px', fontWeight: 500 }} title={APP_VERSION_LABEL}>
            {APP_VERSION_LABEL} — tap Reload to update
          </p>
        </div>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-xl px-4 active:scale-95 transition-transform"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: 'white', fontSize: '12px', fontWeight: 700, minHeight: 36 }}
        >
          Reload
        </button>
      </div>
    </div>
  )
}
