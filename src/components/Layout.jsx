import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ClipboardList, Package, Truck, Users, LogOut, ShoppingBag } from 'lucide-react'

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

// Actual on-screen height of the nav bar content (before safe-area is added).
const NAV_HEIGHT = 60

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()

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
      className="flex flex-col overflow-hidden"
      style={{
        // 100dvh instead of 100vh/h-screen: iOS Safari (and the standalone
        // home-screen app) resizes the visual viewport as browser chrome
        // shows/hides, and vh doesn't track that — dvh does.
        height: '100dvh',
        background: '#f0f4ff',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        className="shrink-0 bg-white px-4 shadow-[0_1px_0_#e2e8f0]"
        style={{
          // Pad the status-bar / notch area on iPhones running as a home-screen app.
          paddingTop: 'max(16px, env(safe-area-inset-top))',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
              <ShoppingBag size={15} color="white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-slate-800 tracking-tight"
              style={{ fontSize: '15px', letterSpacing: '-0.01em' }}>
              Abella's Dry Goods
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 active:scale-95 transition-all duration-150 rounded-xl px-2.5 py-1.5 active:bg-red-50"
            style={{ fontSize: '12px', fontWeight: 500 }}
          >
            <LogOut size={13} strokeWidth={2.2} />
            Logout
          </button>
        </div>

        {!isDetailPage && (
          <div className="px-0.5 pb-3">
            <h1 className="text-slate-800 font-bold"
              style={{ fontSize: '22px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {pageTitle}
            </h1>
          </div>
        )}
      </header>

      {/* Page content */}
      <main
        className={isDetailPage
          ? 'flex-1 overflow-hidden flex flex-col'
          : 'flex-1 overflow-y-auto px-4 pt-4'
        }
        style={{
          // Bottom padding = nav height + safe-area inset, so content never
          // hides behind the fixed nav or the home-indicator gap.
          paddingBottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50"
        style={{
          boxShadow: '0 -4px 24px rgba(37,99,235,0.07)',
          // Extend the bar's own background into the safe area instead of
          // leaving a white/transparent gap under the home-indicator.
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex" style={{ height: NAV_HEIGHT }}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/orders'}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
              style={{ WebkitTapHighlightColor: 'transparent' }}
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
  )
}