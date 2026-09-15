import { useEffect, useRef, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ClipboardList, Package, Truck, Users, LogOut } from 'lucide-react'

function TShirtMark({ size = 15, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden="true">
      <path d="M32 28 L22 34 L28.5 44 L34 40 L34 74.5 Q34 77 36.5 77 L63.5 77 Q66 77 66 74.5 L66 40 L71.5 44 L78 34 L68 28 C66.5 28 64.8 26.5 63 22 L57 22 C55.5 26.5 53 29.2 50 29.2 C47 29.2 44.5 26.5 43 22 L37 22 C35.2 26.5 33.5 28 32 28 Z" fill={color} />
      <path d="M43 22 Q50 29 57 22" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

const links = [
  { to: '/orders',    label: 'Orders',    icon: ClipboardList },
  { to: '/preparing', label: 'Preparing', icon: Package },
  { to: '/delivery',  label: 'Delivery',  icon: Truck },
  { to: '/customers', label: 'Customers', icon: Users },
]

const pageTitles = {
  '/orders':     'Orders',
  '/orders/new': 'New Order',
  '/preparing':  'Preparing',
  '/delivery':   'Delivery',
  '/customers':  'Customers',
}

const DETAIL_PREFIXES = ['/delivery/', '/preparing/', '/customers/']

/*
 * Z-INDEX MAP (keep this in sync with any modal/overlay added in child pages)
 *   nav (this file)........... 40
 *   page-level modals.......... 50  (PaymentModal, ConfirmModal, etc.)
 *   toasts / global alerts..... 60
 *
 * The bottom nav MUST stay below anything the page itself renders as an
 * overlay, or its buttons get visually clipped/unclickable on small screens.
 * Previously both were z-50, and because <nav> comes after <Outlet/> in the
 * DOM, it silently won every stacking tie and covered modal buttons.
 */
const Z_NAV = 40

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const navRef = useRef(null)
  const headerRef = useRef(null)

  // Measure the nav bar's real rendered height instead of guessing a fixed
  // number. This keeps content padding correct across devices, font-size
  // accessibility settings, and safe-area insets — and it self-corrects if
  // the nav's content ever changes (longer labels, larger icons, etc.).
  const [navHeight, setNavHeight] = useState(60)

  useEffect(() => {
    const el = navRef.current
    if (!el) return
    const measure = () => setNavHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('orientationchange', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  // Block touch drag on chrome so holding nav/header never scrolls main
  useEffect(() => {
    const nav = navRef.current
    const header = headerRef.current
    if (!nav && !header) return
    function block(e) {
      // Allow taps on buttons/links, but block drag/scroll
      const t = e.target
      if (t && t.closest && t.closest('a, button')) {
        // let click go through, but prevent move from bubbling to main
        if (e.type === 'touchmove') e.preventDefault()
        return
      }
      if (e.type === 'touchmove') e.preventDefault()
    }
    const els = [nav, header].filter(Boolean)
    els.forEach(el => {
      el.addEventListener('touchmove', block, { passive: false })
      el.addEventListener('touchstart', block, { passive: true })
    })
    return () => {
      els.forEach(el => {
        el.removeEventListener('touchmove', block)
        el.removeEventListener('touchstart', block)
      })
    }
  }, [])

  const isDetailPage = DETAIL_PREFIXES.some((prefix) =>
    location.pathname.startsWith(prefix) && location.pathname.length > prefix.length
  )

  const pageTitle = pageTitles[location.pathname] ?? "Abella's Dry Goods"

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div
      className="fixed inset-0 flex flex-col md:flex-row overflow-hidden"
      style={{
        background: '#f0f4ff',
        fontFamily: "'DM Sans', sans-serif",
        '--bottom-nav-space': `calc(${navHeight}px + env(safe-area-inset-bottom))`,
      }}
    >
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col shrink-0 bg-white border-r border-slate-100" style={{ width: 240 }}>
        <div className="flex items-center gap-2.5 px-5 shrink-0" style={{ height: 64, borderBottom: '1px solid #e2e8f0' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <TShirtMark size={20} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-slate-800 leading-none" style={{ fontSize: '14px', letterSpacing: '-0.02em' }}>Abella's</p>
            <p className="font-semibold text-slate-400 leading-none" style={{ fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Dry Goods</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/orders'}
              className="flex items-center gap-3 rounded-xl px-3 transition-all"
              style={{ minHeight: 44 }}
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center justify-center rounded-lg shrink-0" style={{ width: 36, height: 36, background: isActive ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'transparent' }}>
                    <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? '#2563eb' : '#94a3b8'} />
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: isActive ? '#1e293b' : '#64748b' }}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 shrink-0" style={{ borderTop: '1px solid #f1f5f9', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 active:bg-red-50 transition-colors"
            style={{ minHeight: 44, fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}
          >
            <LogOut size={15} strokeWidth={2.2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top bar — stays fixed, never scrolls */}
        <header
          ref={headerRef}
          className="app-chrome shrink-0 bg-white px-4 md:px-6 shadow-[0_1px_0_#e2e8f0] relative z-20"
          style={{
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            touchAction: 'none',
            overscrollBehavior: 'none',
          }}
        >
          <div className="flex items-center justify-between mb-3 md:mb-0 md:py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center md:hidden" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                <TShirtMark size={16} />
              </div>
              <span className="font-bold text-slate-800 tracking-tight md:hidden" style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>
                Abella's Dry Goods
              </span>
              {/* Desktop: show page title inline here */}
              <h1 className="hidden md:block text-slate-800 font-bold" style={{ fontSize: '18px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {!isDetailPage ? pageTitle : "Abella's Dry Goods"}
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex md:hidden items-center gap-1.5 text-slate-400 active:scale-95 transition-all duration-150 rounded-xl px-2.5 py-1.5 active:bg-red-50"
              style={{ fontSize: '12px', fontWeight: 500, minHeight: 32 }}
            >
              <LogOut size={13} strokeWidth={2.2} />
              Logout
            </button>
            {/* Desktop secondary title / detail crumb */}
            <span className="hidden md:block text-slate-400" style={{ fontSize: '12px', fontWeight: 500 }}>
              {isDetailPage ? pageTitle : ''}
            </span>
          </div>

          {!isDetailPage && (
            <div className="px-0.5 pb-3 md:hidden">
              <h1 className="text-slate-800 font-bold" style={{ fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {pageTitle}
              </h1>
            </div>
          )}
        </header>

        {/* Page content — the ONLY scroll container on mobile */}
        <main
          id="app-main-scroll"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 md:px-6 pt-4"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain',
            touchAction: 'pan-y',
            paddingBottom: 'var(--bottom-nav-space)',
            transform: 'translateZ(0)',
          }}
        >
          <div className="container-app pb-2">
            <Outlet />
          </div>
        </main>

        {/* Bottom nav — mobile only, fixed above safe area, never scrolls */}
        <nav
          ref={navRef}
          className="app-chrome shrink-0 bg-white border-t border-slate-100 md:hidden relative z-20"
          style={{
            zIndex: Z_NAV,
            boxShadow: '0 -4px 24px rgba(37,99,235,0.07)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            touchAction: 'none',
            overscrollBehavior: 'none',
          }}
        >
          <div className="flex" style={{ height: 60 }}>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/orders'}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
                style={{ WebkitTapHighlightColor: 'transparent', minHeight: 60 }}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                        style={{ width: 32, height: 3, background: 'linear-gradient(90deg, #2563eb, #60a5fa)', borderRadius: '0 0 4px 4px' }}
                      />
                    )}
                    <span
                      className="flex items-center justify-center rounded-xl transition-all duration-150"
                      style={{
                        width: 40, height: 32,
                        background: isActive ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : 'transparent',
                      }}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? '#2563eb' : '#94a3b8'} />
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: isActive ? 700 : 500, color: isActive ? '#2563eb' : '#94a3b8', letterSpacing: '0.01em' }}>
                      {label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}