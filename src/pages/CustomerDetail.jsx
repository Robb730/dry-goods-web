import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, MapPin, Wallet, Package, CreditCard,
  CheckCircle2, AlertTriangle, ChevronDown, ArrowDownLeft, Truck
} from 'lucide-react'

// ── Fonts ─────────────────────────────────────────────────────────────────────
const _link = document.createElement('link')
_link.rel = 'stylesheet'
_link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap'
document.head.appendChild(_link)

const F = "'Plus Jakarta Sans', sans-serif"

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatPeso(n) {
  if (n == null || isNaN(n)) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

const LEVEL = {
  'Regular': { bg: '#fff7ed', color: '#c2410c' },
  'Level 2': { bg: '#eff6ff', color: '#1d4ed8' },
  'Level 3': { bg: '#faf5ff', color: '#6d28d9' },
  'Level 4': { bg: '#f0fdf4', color: '#15803d' },
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PaymentModal({ customer, onConfirm, onCancel, loading }) {
  const [amount, setAmount] = useState('')
  const ref = useRef(null)
  const balance = Number(customer.remaining_balance ?? 0)
  const parsed = parseFloat(amount)
  const valid = !isNaN(parsed) && parsed > 0
  const over = valid && parsed > balance

  useEffect(() => { setTimeout(() => ref.current?.focus(), 120) }, [])

  return (
    <div
      onClick={e => e.target === e.currentTarget && onCancel()}
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'flex-end', fontFamily: F }}
    >
      <style>{`
        @keyframes sheetUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
      <div style={{
        width: '100%', background: '#fff', borderRadius: '28px 28px 0 0',
        padding: '0 20px',
        paddingBottom: 'max(36px, calc(env(safe-area-inset-bottom) + 24px))',
        animation: 'sheetUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        boxShadow: '0 -12px 60px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0', margin: '14px auto 22px' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>Collect Payment</p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>{customer.name}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 3 }}>Outstanding</p>
            <p style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: balance > 0 ? '#dc2626' : '#16a34a' }}>{formatPeso(balance)}</p>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Amount Received</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 24, fontWeight: 700, color: valid ? '#0f172a' : '#cbd5e1', transition: 'color 0.15s', pointerEvents: 'none' }}>₱</span>
            <input
              ref={ref} type="number" inputMode="decimal" placeholder="0.00" value={amount}
              onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
              style={{
                width: '100%', boxSizing: 'border-box',
                paddingLeft: 42, paddingRight: 18, paddingTop: 18, paddingBottom: 18,
                borderRadius: 16, fontSize: 28, fontWeight: 800, fontFamily: F,
                outline: 'none', color: '#0f172a', letterSpacing: '-0.03em',
                border: `2px solid ${over ? '#fca5a5' : valid ? '#86efac' : '#e2e8f0'}`,
                background: over ? '#fff5f5' : valid ? '#f0fdf4' : '#f8fafc',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            />
          </div>
          <div style={{ minHeight: 22, marginTop: 8 }}>
            {valid && !over && (
              <p style={{ fontSize: 12, color: '#64748b', textAlign: 'right' }}>
                Remaining after: <strong style={{ color: '#0f172a', fontWeight: 700 }}>{formatPeso(balance - parsed)}</strong>
              </p>
            )}
            {over && (
              <p style={{ fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} strokeWidth={2.5} />Exceeds balance by {formatPeso(parsed - balance)}
              </p>
            )}
          </div>
        </div>

        {balance > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            {[balance, balance / 2, balance / 4].filter(v => v > 0).slice(0, 3).map((v, i) => (
              <button key={i} onClick={() => setAmount(String(Math.round(v * 100) / 100))}
                style={{ padding: '6px 12px', borderRadius: 99, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: F }}>
                {i === 0 ? 'Full' : i === 1 ? '½' : '¼'} · {formatPeso(v)}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} disabled={loading} style={{ flex: 1, height: 54, borderRadius: 16, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 15, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: F }}>Cancel</button>
          <button onClick={() => onConfirm(parsed)} disabled={!valid || loading}
            style={{ flex: 2, height: 54, borderRadius: 16, border: 'none', background: valid ? '#0f172a' : '#f1f5f9', color: valid ? '#fff' : '#94a3b8', fontSize: 15, fontWeight: 700, cursor: valid ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: F }}>
            {loading
              ? <div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <><CheckCircle2 size={16} strokeWidth={2.5} /> Confirm Payment</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Transaction Card ──────────────────────────────────────────────────────────
function TxCard({ entry, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const isOrder = entry.type === 'order'
  const isPayment = entry.type === 'payment'

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      border: '1px solid #e8edf2',
      marginBottom: isLast ? 0 : 6,
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div
        onClick={() => isOrder && setExpanded(x => !x)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: isOrder ? 'pointer' : 'default' }}
        onTouchStart={e => isOrder && (e.currentTarget.style.background = '#f8fafc')}
        onTouchEnd={e => (e.currentTarget.style.background = '#fff')}
      >
        {/* Icon */}
        <div style={{
          width: 36, height: 36, borderRadius: 11, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isPayment ? '#f0fdf4' : '#fff7ed',
        }}>
          {isPayment
            ? <ArrowDownLeft size={16} strokeWidth={2.5} color="#16a34a" />
            : <Package size={16} strokeWidth={2} color="#ea580c" />}
        </div>

        {/* Label + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em' }}>
              {isPayment ? 'Payment received' : `Order #${entry.orderNum}`}
            </p>
            {isOrder && entry.items?.length > 0 && (
              <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                · {entry.items.length} item{entry.items.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontWeight: 500 }}>
            {formatDate(entry.date)}
          </p>
        </div>

        {/* Amounts */}
        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <p style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em',
            color: isPayment ? '#16a34a' : '#ef4444',
          }}>
            {isPayment ? '−' : '+'}{formatPeso(entry.amount)}
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
            bal {formatPeso(entry.runningBalance)}
          </p>
        </div>

        {/* Chevron for orders */}
        {isOrder && (
          <ChevronDown
            size={14} strokeWidth={2.5} color="#cbd5e1"
            style={{ flexShrink: 0, transition: 'transform 0.22s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        )}
      </div>

      {/* Expanded order items */}
      {isOrder && expanded && entry.items?.length > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', background: '#fafafa', padding: '8px 14px 10px 62px' }}>
          {entry.items.map((item, i) => (
            <div key={item.id ?? i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 0',
              borderBottom: i < entry.items.length - 1 ? '1px dashed #f1f5f9' : 'none',
            }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                  {item.product_name}{item.size ? ` · Size ${item.size}` : ''}
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
                  {item.fulfilled_quantity_dozen ?? item.quantity_dozen} doz × {formatPeso(item.price_per_piece)}/pc
                </p>
              </div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                {formatPeso((item.fulfilled_quantity_dozen ?? item.quantity_dozen) * 6 * item.price_per_piece)}
              </p>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, marginTop: 2, borderTop: '1.5px solid #ececec' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order total</p>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{formatPeso(entry.amount)}</p>
          </div>
        </div>
      )}

      {/* Payment notes */}
      {isPayment && entry.notes && (
        <div style={{ borderTop: '1px solid #dcfce7', background: '#f0fdf4', padding: '6px 14px 8px 62px' }}>
          <p style={{ fontSize: 11, color: '#15803d', fontStyle: 'italic' }}>{entry.notes}</p>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomerDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState(location.state?.customer ?? null)
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [orderItems, setOrderItems] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paying, setPaying] = useState(false)

  // Ref for the scrollable container — used to jump to bottom on load
  const scrollRef = useRef(null)
  // Sentinel element at the very end of the list
  const bottomRef = useRef(null)

  useEffect(() => { load() }, [id])

  // Scroll to bottom whenever data finishes loading
  useEffect(() => {
    if (!loading && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'instant' })
    }
  }, [loading])

  async function load() {
    setLoading(true); setError(null)
    try {
      const { data: c, error: e1 } = await supabase
        .from('customers')
        .select('id,name,location,price_level,remaining_balance,created_at')
        .eq('id', id).single()
      if (e1) throw e1
      setCustomer(c)

      const { data: o, error: e2 } = await supabase
        .from('orders')
        .select('id,order_total,delivered_at,created_at')
        .eq('customer_id', id)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: true })
      if (e2) throw e2
      setOrders(o ?? [])

      if (o && o.length > 0) {
        const orderIds = o.map(x => x.id)
        const CHUNK = 50
        const allItems = []
        for (let i = 0; i < orderIds.length; i += CHUNK) {
          const chunk = orderIds.slice(i, i + CHUNK)
          const { data: items, error: itemErr } = await supabase
            .from('order_items')
            .select('id,order_id,quantity_dozen,fulfilled_quantity_dozen,price_per_piece,product:products(name,size)')
            .in('order_id', chunk)
          if (!itemErr && items) allItems.push(...items)
        }
        const map = {}
        allItems.forEach(item => {
          if (!map[item.order_id]) map[item.order_id] = []
          map[item.order_id].push({
            ...item,
            product_name: item.product?.name ?? '—',
            size: item.product?.size ?? '',
          })
        })
        setOrderItems(map)
      }

      const { data: p, error: e3 } = await supabase
        .from('payments')
        .select('id,amount_paid,paid_at,notes')
        .eq('customer_id', id)
        .order('paid_at', { ascending: true })
      if (e3) throw e3
      setPayments(p ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayment(amount) {
    setPaying(true)
    try {
      const newBalance = Math.max(0, Number(customer.remaining_balance ?? 0) - amount)
      await supabase.from('payments').insert({ customer_id: id, amount_paid: amount, paid_at: new Date().toISOString() })
      await supabase.from('customers').update({ remaining_balance: newBalance }).eq('id', id)
      setShowPayment(false)
      await load()
    } catch (e) {
      setError('Payment failed: ' + e.message)
    } finally {
      setPaying(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: F }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 28, height: 28, border: '2.5px solid #e2e8f0', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Loading…</p>
      </div>
    </div>
  )

  if (error && !customer) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', fontFamily: F, textAlign: 'center', padding: '0 24px' }}>
      <div>
        <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}>← Go back</button>
      </div>
    </div>
  )

  const balance = Number(customer?.remaining_balance ?? 0)
  const lvl = LEVEL[customer?.price_level] ?? { bg: '#f8fafc', color: '#64748b' }
  const hasBalance = balance > 0

  // Build ledger — oldest first (natural ascending sort for correct running balance)
  const ledger = []
  orders.forEach(o => {
    ledger.push({
      type: 'order',
      date: o.delivered_at ?? o.created_at,
      amount: Number(o.order_total ?? 0),
      orderNum: String(o.id).slice(-4).toUpperCase(),
      id: `order-${o.id}`,
      items: orderItems[o.id] ?? [],
      sortKey: new Date(o.delivered_at ?? o.created_at).getTime(),
    })
  })
  payments.forEach(p => {
    ledger.push({
      type: 'payment',
      date: p.paid_at,
      amount: Number(p.amount_paid ?? 0),
      notes: p.notes,
      id: `payment-${p.id}`,
      sortKey: new Date(p.paid_at).getTime(),
    })
  })
  // Sort oldest → newest (this is both the display order AND the running balance order)
  ledger.sort((a, b) => a.sortKey - b.sortKey)

  // Compute running balance in the same pass — no reversal needed
  let running = 0
  const withBalances = ledger.map(entry => {
    if (entry.type === 'order') running += entry.amount
    else running -= entry.amount
    return { ...entry, runningBalance: Math.max(0, running) }
  })

  const totalOrders = orders.length
  const totalSpend = orders.reduce((s, o) => s + Number(o.order_total ?? 0), 0)
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount_paid ?? 0), 0)
  const lastEntry = withBalances[withBalances.length - 1]

  return (
    <div style={{ fontFamily: F, background: '#f1f5f9', height: '100dvh', display: 'flex', flexDirection: 'column', WebkitFontSmoothing: 'antialiased' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .no-scrollbar::-webkit-scrollbar { display: none }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Sticky top bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #e8edf2',
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexShrink: 0,
        zIndex: 10,
      }}>
        <button onClick={() => navigate(-1)} style={{ width: 38, height: 38, borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ChevronLeft size={18} color="#0f172a" strokeWidth={2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
            {customer?.name}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {customer?.location && (
              <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500 }}>
                <MapPin size={10} strokeWidth={2} />{customer.location}
              </span>
            )}
            <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: lvl.bg, color: lvl.color }}>
              {customer?.price_level}
            </span>
          </div>
        </div>
        {lastEntry && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Last Activity</p>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginTop: 1 }}>{formatDate(lastEntry.date)}</p>
          </div>
        )}
      </div>

      {/* ── Static top section: balance + stats (never scrolls) ── */}
      <div style={{ flexShrink: 0, padding: '14px 14px 0', maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>

        {/* Balance card */}
        <div style={{
          background: hasBalance ? '#1e293b' : '#14532d',
          borderRadius: 20, padding: '18px 20px',
          marginBottom: 10,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: '50%', border: `1px solid ${hasBalance ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'}`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: -8, top: -8, width: 80, height: 80, borderRadius: '50%', border: `1px solid ${hasBalance ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)'}`, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Outstanding Balance</p>
              <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, color: hasBalance ? '#fca5a5' : '#86efac' }}>
                {formatPeso(balance)}
              </p>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
              {hasBalance ? <CreditCard size={17} color="rgba(255,255,255,0.65)" strokeWidth={1.8} /> : <CheckCircle2 size={17} color="#86efac" strokeWidth={2} />}
            </div>
          </div>
          <button onClick={() => setShowPayment(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, paddingLeft: 16, paddingRight: 18, borderRadius: 12, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: F }}>
            <Wallet size={14} strokeWidth={2.5} />
            Collect Payment
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '11px 14px', border: '1px solid #e8edf2' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total Spend</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>{formatPeso(totalSpend)}</p>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, padding: '11px 14px', border: '1px solid #e8edf2' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Total Paid</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>{formatPeso(totalPaid)}</p>
          </div>
          <div style={{ gridColumn: 'span 2', background: '#fff', borderRadius: 14, padding: '11px 14px', border: '1px solid #e8edf2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Deliveries Completed</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{totalOrders} orders</p>
            </div>
            <Truck size={20} color="#e2e8f0" strokeWidth={1.5} />
          </div>
        </div>

        {/* Transaction panel header — sits just above the scrollable list */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px', marginBottom: 8 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Transactions · oldest first
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{withBalances.length} entries</p>
        </div>
      </div>

      {/* ── Transaction panel: scrollable, fills remaining height ── */}
      <div
        ref={scrollRef}
        className="no-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 14px 88px',
          maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box',
        }}
      >
        {withBalances.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf2', padding: '48px 20px', textAlign: 'center', marginTop: 4 }}>
            <Package size={28} color="#e2e8f0" strokeWidth={1.5} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 500 }}>No transactions yet</p>
          </div>
        ) : (
          <>
            {withBalances.map((entry, i) => (
              <TxCard
                key={entry.id}
                entry={entry}
                isLast={i === withBalances.length - 1}
              />
            ))}

            {/* Current balance footer */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e8edf2', padding: '12px 14px', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>Current balance</p>
              <p style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.03em', color: hasBalance ? '#ef4444' : '#16a34a' }}>
                {formatPeso(balance)}
              </p>
            </div>
          </>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#dc2626', fontWeight: 500 }}>{error}</div>
        )}

        {/* Sentinel — auto-scrolled into view on load to show latest transaction */}
        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      {showPayment && customer && (
        <PaymentModal customer={customer} onConfirm={handlePayment} onCancel={() => setShowPayment(false)} loading={paying} />
      )}
    </div>
  )
}