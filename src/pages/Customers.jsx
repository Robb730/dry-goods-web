import { useState, useEffect, useMemo, useRef, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Search, MapPin, ChevronRight, User, AlertCircle, X } from 'lucide-react'

// ── Font injection ─────────────────────────────────────────────────────────────
const _link = document.createElement('link')
_link.rel = 'stylesheet'
_link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap'
document.head.appendChild(_link)

// ── Persisted UI state ─────────────────────────────────────────────────────────
// Lives outside the component (module scope) so it survives unmount/remount.
// Only ever restored when we know we're coming BACK from a customer detail page —
// controlled by the `cameFromDetail` flag, set right before navigating away.
const listState = {
  search: '',
  locFilter: 'All',
  scrollTop: 0,
  cameFromDetail: false,
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatPeso(n) {
  if (n == null || isNaN(n)) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const LOCATIONS = ['All', 'Gapan', 'San Fernando', 'Baliwag', 'Walk-in']

const LEVEL_STYLES = {
  'Regular': { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  'Level 2': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  'Level 3': { bg: '#f3e8ff', color: '#6b21a8', dot: '#a855f7' },
  'Level 4': { bg: '#dcfce7', color: '#14532d', dot: '#22c55e' },
}
function getLevelStyle(level) {
  return LEVEL_STYLES[level] ?? { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' }
}

// ── Skeleton row ───────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      borderBottom: '1px solid #f1f5f9',
      animation: 'pulse 1.4s ease-in-out infinite',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f1f5f9', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ height: 12, borderRadius: 6, background: '#f1f5f9', width: '45%', marginBottom: 8 }} />
        <div style={{ height: 10, borderRadius: 6, background: '#f1f5f9', width: '28%' }} />
      </div>
      <div style={{ height: 12, borderRadius: 6, background: '#f1f5f9', width: 64 }} />
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function Customers() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  // Only seed from persisted state if we're actually returning from a detail page.
  // Otherwise start fresh (top of list, no filters, empty search).
  const shouldRestore = listState.cameFromDetail
  const [search, setSearch]       = useState(shouldRestore ? listState.search : '')
  const [locFilter, setLocFilter] = useState(shouldRestore ? listState.locFilter : 'All')

  const scrollContainerRef = useRef(null)
  const restoredRef = useRef(false) // guards against restoring more than once per mount

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      const { data, error: err } = await supabase
        .from('customers')
        .select('id, name, location, price_level, remaining_balance')
        .order('name')
      if (err) { setError(err.message); setLoading(false); return }
      setCustomers(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  // Consume the flag immediately after reading it, so a later plain re-render
  // (e.g. leaving via the bottom nav to Orders, then coming back to Customers)
  // doesn't accidentally restore again.
  useEffect(() => {
    listState.cameFromDetail = false
  }, [])

  // Keep the store in sync as the user types/filters, so if they tap a customer
  // right now, the next "back" restores this exact state.
  useEffect(() => { listState.search = search }, [search])
  useEffect(() => { listState.locFilter = locFilter }, [locFilter])

  // Restore scroll position once rows have actually rendered (after loading finishes),
  // but only when we determined on mount that we're returning from a detail page.
  useLayoutEffect(() => {
    if (!loading && shouldRestore && !restoredRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = listState.scrollTop
      restoredRef.current = true
    }
  }, [loading, shouldRestore])

  // Track scroll position continuously so it's always current when the user navigates away.
  function handleScroll(e) {
    listState.scrollTop = e.currentTarget.scrollTop
  }

  function goToCustomer(c) {
    // Snapshot everything right before leaving, and flag that the next Customers
    // mount should restore it.
    listState.search = search
    listState.locFilter = locFilter
    listState.scrollTop = scrollContainerRef.current?.scrollTop ?? 0
    listState.cameFromDetail = true
    navigate(`/customers/${c.id}`, { state: { customer: c } })
  }

  const locations = useMemo(() => {
    const fromData = [...new Set(customers.map(c => c.location).filter(Boolean))]
    return ['All', ...LOCATIONS.slice(1), ...fromData.filter(l => !LOCATIONS.includes(l))]
  }, [customers])

  // Customers matching the active location filter (independent of search text) —
  // used to drive the summary strip.
  const locationScoped = useMemo(() =>
    locFilter === 'All' ? customers : customers.filter(c => c.location === locFilter),
    [customers, locFilter])

  const filtered = useMemo(() =>
    locationScoped.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
    [locationScoped, search])

  const summaryCount = locationScoped.length
  const summaryOwed = useMemo(() =>
    locationScoped.reduce((s, c) => s + Number(c.remaining_balance ?? 0), 0),
    [locationScoped])

  const F = "'Sora', sans-serif"

  return (
    <div style={{
      fontFamily: F, display: 'flex', flexDirection: 'column', height: '100%',
      width: '100%', maxWidth: 640, margin: '0 auto',
      padding: '16px 16px 0', overflow: 'hidden', paddingBottom: 96,
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        .cust-row:active { background: #f8fafc !important; }
        .loc-btn:active { opacity: 0.75; }
        .cust-scroll::-webkit-scrollbar { width: 4px; }
        .cust-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }
        .cust-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── Summary strip ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1px 1fr',
        background: '#fff',
        borderRadius: 18,
        border: '1px solid #f0f0f0',
        marginBottom: 14,
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 4px' }}>
            {locFilter === 'All' ? 'Customers' : locFilter}
          </p>
          <p style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
            {summaryCount}
          </p>
        </div>
        <div style={{ background: '#f1f5f9' }} />
        <div style={{ padding: '14px 18px' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Outstanding
          </p>
          <p style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', margin: 0, lineHeight: 1,
            color: summaryOwed > 0 ? '#dc2626' : '#16a34a',
          }}>
            {formatPeso(summaryOwed)}
          </p>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: 10, flexShrink: 0 }}>
        <Search size={14} strokeWidth={2.5} style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Search customers…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            paddingLeft: 36, paddingRight: search ? 36 : 14,
            paddingTop: 10, paddingBottom: 10,
            borderRadius: 13,
            border: '1.5px solid #e8edf2',
            background: '#fff',
            fontSize: 13, fontWeight: 500, fontFamily: F,
            color: '#0f172a',
            outline: 'none',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              background: '#f1f5f9', border: 'none', borderRadius: '50%',
              width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0,
            }}
          >
            <X size={11} strokeWidth={2.5} color="#64748b" />
          </button>
        )}
      </div>

      {/* ── Location filter ── */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4,
        marginBottom: 12, flexShrink: 0,
        WebkitOverflowScrolling: 'touch',
      }}>
        {locations.map(loc => {
          const isActive = locFilter === loc
          return (
            <button
              key={loc}
              className="loc-btn"
              onClick={() => setLocFilter(loc)}
              style={{
                flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 13px',
                borderRadius: 99,
                border: isActive ? 'none' : '1.5px solid #e8edf2',
                background: isActive ? '#0f172a' : '#fff',
                color: isActive ? '#fff' : '#64748b',
                fontSize: 12, fontWeight: 600, fontFamily: F,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {loc !== 'All' && (
                <MapPin size={10} strokeWidth={2.5} style={{ opacity: 0.7 }} />
              )}
              {loc}
            </button>
          )
        })}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', borderRadius: 12, marginBottom: 10,
          background: '#fef2f2', border: '1px solid #fecaca', flexShrink: 0,
        }}>
          <AlertCircle size={14} color="#ef4444" />
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0, fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {/* ── Scrollable list container ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="cust-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #eef1f5',
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Loading */}
        {loading && [...Array(7)].map((_, i) => <SkeletonRow key={i} />)}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 20px' }}>
            <User size={28} strokeWidth={1.5} color="#cbd5e1" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, margin: 0 }}>No customers found</p>
          </div>
        )}

        {/* Rows */}
        {!loading && filtered.map((c, i) => {
          const lvl = getLevelStyle(c.price_level)
          const bal = Number(c.remaining_balance ?? 0)
          const initial = c.name.charAt(0).toUpperCase()
          const isLast = i === filtered.length - 1

          return (
            <button
              key={c.id}
              className="cust-row"
              onClick={() => goToCustomer(c)}
              style={{
                width: '100%', textAlign: 'left', boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: isLast ? 'none' : '1px solid #f8fafc',
                cursor: 'pointer',
                fontFamily: F,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: lvl.bg,
                fontSize: 14, fontWeight: 700, color: lvl.color,
              }}>
                {initial}
              </div>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: '0 0 3px', fontSize: 13.5, fontWeight: 600,
                  color: '#0f172a', letterSpacing: '-0.01em',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {c.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {c.location && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: '#94a3b8', fontWeight: 500, whiteSpace: 'nowrap' }}>
                      <MapPin size={9} strokeWidth={2} />
                      {c.location}
                    </span>
                  )}
                  <span style={{
                    fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                    background: lvl.bg, color: lvl.color, whiteSpace: 'nowrap',
                  }}>
                    {c.price_level}
                  </span>
                </div>
              </div>

              {/* Balance */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{
                  margin: '0 0 2px', fontSize: 13, fontWeight: 700,
                  color: bal > 0 ? '#dc2626' : '#16a34a',
                  letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}>
                  {formatPeso(bal)}
                </p>
                <p style={{ margin: 0, fontSize: 9.5, color: '#cbd5e1', fontWeight: 500 }}>balance</p>
              </div>

              <ChevronRight size={14} strokeWidth={2.5} color="#e2e8f0" style={{ flexShrink: 0 }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}