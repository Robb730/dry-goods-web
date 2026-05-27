import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Truck, CheckCircle, RefreshCw, MapPin, ChevronRight, Eye, EyeOff, TrendingUp } from 'lucide-react'

function formatPeso(n) {
  if (n == null || isNaN(n)) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// Compute profit from order_items rows (same logic as DeliveryDetail)
function computeProfit(items) {
  const hasCost = items.some((i) => i.products?.base_price != null)
  if (!hasCost) return null
  return items.reduce((sum, item) => {
    const bp = item.products?.base_price
    if (bp == null) return sum
    return sum + (item.price_per_dozen - bp) * item.fulfilled_quantity_dozen
  }, 0)
}

function ProfitBadge({ profit, total }) {
  if (profit == null) return null
  const margin = total > 0 ? ((profit / total) * 100).toFixed(1) : null
  return (
    <div className="flex flex-col items-end shrink-0">
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg"
        style={{ background: profit >= 0 ? '#dcfce7' : '#ffe4e6', border: `1px solid ${profit >= 0 ? '#86efac' : '#fca5a5'}` }}>
        <TrendingUp size={10} color={profit >= 0 ? '#15803d' : '#be123c'} strokeWidth={2.5} />
        <span style={{ fontSize: 11, fontWeight: 800, color: profit >= 0 ? '#15803d' : '#be123c', letterSpacing: '-0.01em' }}>
          {formatPeso(profit)}
        </span>
      </div>
      {margin != null && (
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 1 }}>{margin}% margin</span>
      )}
    </div>
  )
}

function OrderCard({ order, onTap, showProfit }) {
  return (
    <button
      onClick={() => onTap(order)}
      className="w-full text-left bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
        <Truck size={18} color="#2563eb" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{order.customer_name}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <MapPin size={10} strokeWidth={2} />
          {order.customer_location} · {timeAgo(order.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showProfit && order.computed_profit != null ? (
          <ProfitBadge profit={order.computed_profit} total={order.order_total} />
        ) : (
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{formatPeso(order.order_total)}</p>
            <p className="text-xs text-slate-400">total</p>
          </div>
        )}
        <ChevronRight size={16} className="text-slate-300" />
      </div>
    </button>
  )
}

function DeliveredCard({ order, showProfit }) {
  return (
    <div className="w-full bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: '#f0fdf4' }}>
        <CheckCircle size={18} color="#16a34a" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{order.customer_name}</p>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
          <MapPin size={10} strokeWidth={2} />
          {order.customer_location} · delivered {timeAgo(order.delivered_at)}
        </p>
      </div>
      <div className="text-right shrink-0">
        {showProfit && order.computed_profit != null ? (
          <ProfitBadge profit={order.computed_profit} total={order.order_total} />
        ) : (
          <>
            <p className="text-sm font-bold text-slate-800">{formatPeso(order.order_total)}</p>
            <p className="text-xs text-green-500 font-semibold">Delivered</p>
          </>
        )}
      </div>
    </div>
  )
}

function ProfitSummaryBanner({ orders }) {
  const ordersWithProfit = orders.filter((o) => o.computed_profit != null)
  if (ordersWithProfit.length === 0) return null

  const totalProfit = ordersWithProfit.reduce((s, o) => s + o.computed_profit, 0)
  const totalRevenue = ordersWithProfit.reduce((s, o) => s + Number(o.order_total), 0)
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : null

  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{ background: 'linear-gradient(135deg, #14532d, #166534)', border: '1.5px solid #4ade80' }}>
      <div className="px-4 pt-2.5 pb-1">
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#4ade80' }}>
          💰 PROFIT SUMMARY · {ordersWithProfit.length} ORDER{ordersWithProfit.length !== 1 ? 'S' : ''}
        </p>
      </div>
      <div className="flex pb-3">
        <div className="flex-1 flex flex-col items-center px-3 py-1">
          <span style={{ fontSize: 10, color: '#86efac', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL PROFIT</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {formatPeso(totalProfit)}
          </span>
          {margin != null && (
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>{margin}% avg margin</span>
          )}
        </div>
        <div style={{ width: 1, background: '#166534', margin: '8px 0' }} />
        <div className="flex-1 flex flex-col items-center px-3 py-1">
          <span style={{ fontSize: 10, color: '#86efac', fontWeight: 600, letterSpacing: '0.05em' }}>TOTAL REVENUE</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#86efac', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            {formatPeso(totalRevenue)}
          </span>
          <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>
            {ordersWithProfit.length} of {orders.length} tracked
          </span>
        </div>
      </div>
    </div>
  )
}

export default function OutForDelivery() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('out')
  const [outOrders, setOutOrders] = useState([])
  const [deliveredOrders, setDeliveredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfit, setShowProfit] = useState(false)

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [{ data: outData, error: outErr }, { data: delivData, error: delivErr }] = await Promise.all([
        supabase
          .from('orders')
          .select(`
            id, customer_id, order_total, created_at,
            customers ( name, location ),
            order_items ( price_per_dozen, fulfilled_quantity_dozen, quantity_dozen,
              products ( base_price ) )
          `)
          .eq('status', 'out_for_delivery')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select(`
            id, customer_id, order_total, created_at, delivered_at,
            customers ( name, location ),
            order_items ( price_per_dozen, fulfilled_quantity_dozen, quantity_dozen,
              products ( base_price ) )
          `)
          .eq('status', 'delivered')
          .gte('delivered_at', todayStart.toISOString())
          .order('delivered_at', { ascending: false }),
      ])

      if (outErr) throw outErr
      if (delivErr) throw delivErr

      const map = (o) => {
        // For out_for_delivery: use quantity_dozen (not yet fulfilled)
        // For delivered: use fulfilled_quantity_dozen
        const items = o.order_items ?? []
        const isDelivered = !!o.delivered_at
        const profitItems = isDelivered
          ? items.filter((i) => i.fulfilled_quantity_dozen > 0)
          : items

        // Use fulfilled qty for delivered, packed qty for out-for-delivery
        const profitItemsMapped = profitItems.map((i) => ({
          ...i,
          fulfilled_quantity_dozen: isDelivered
            ? i.fulfilled_quantity_dozen
            : i.quantity_dozen,
        }))

        return {
          ...o,
          customer_name: o.customers?.name ?? '—',
          customer_location: o.customers?.location ?? '—',
          computed_profit: computeProfit(profitItemsMapped),
        }
      }

      setOutOrders((outData ?? []).map(map))
      setDeliveredOrders((delivData ?? []).map(map))
    } catch (e) {
      console.error(e)
      setError('Failed to load orders: ' + (e?.message ?? 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const orders = tab === 'out' ? outOrders : deliveredOrders
  const hasAnyProfit = orders.some((o) => o.computed_profit != null)

  return (
    <div>
      {/* Tabs + controls row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          <button
            onClick={() => setTab('out')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === 'out' ? 'white' : 'transparent',
              color: tab === 'out' ? '#1e293b' : '#94a3b8',
              boxShadow: tab === 'out' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Truck size={12} strokeWidth={2.5} />
            Out
            {!loading && outOrders.length > 0 && (
              <span className="rounded-full px-1.5 py-0.5 font-bold"
                style={{ fontSize: '10px', background: tab === 'out' ? '#dbeafe' : '#e2e8f0', color: tab === 'out' ? '#1d4ed8' : '#94a3b8' }}>
                {outOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('delivered')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: tab === 'delivered' ? 'white' : 'transparent',
              color: tab === 'delivered' ? '#1e293b' : '#94a3b8',
              boxShadow: tab === 'delivered' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <CheckCircle size={12} strokeWidth={2.5} />
            Delivered Today
            {!loading && deliveredOrders.length > 0 && (
              <span className="rounded-full px-1.5 py-0.5 font-bold"
                style={{ fontSize: '10px', background: tab === 'delivered' ? '#dcfce7' : '#e2e8f0', color: tab === 'delivered' ? '#16a34a' : '#94a3b8' }}>
                {deliveredOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {!loading && hasAnyProfit && (
            <button
              onClick={() => setShowProfit((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
              style={{
                background: showProfit ? 'linear-gradient(135deg, #14532d, #166534)' : '#f1f5f9',
                border: `1.5px solid ${showProfit ? '#4ade80' : '#e2e8f0'}`,
                boxShadow: showProfit ? '0 2px 8px rgba(22,163,74,0.2)' : 'none',
              }}
            >
              {showProfit
                ? <Eye size={12} color="#4ade80" strokeWidth={2.5} />
                : <EyeOff size={12} color="#94a3b8" strokeWidth={2.5} />}
              <span style={{ fontSize: 11, fontWeight: 700, color: showProfit ? '#4ade80' : '#64748b' }}>
                Profit
              </span>
            </button>
          )}
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-500">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div className="flex flex-col gap-3 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            {tab === 'out'
              ? <Truck size={24} strokeWidth={1.5} className="text-slate-300" />
              : <CheckCircle size={24} strokeWidth={1.5} className="text-slate-300" />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {tab === 'out' ? 'No orders out for delivery' : 'No deliveries completed today'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
              {tab === 'out'
                ? 'Orders confirmed on the desktop app will appear here'
                : 'Delivered orders will show up here'}
            </p>
          </div>
        </div>
      )}

      {/* Order list */}
      {!loading && !error && orders.length > 0 && (
        <>
          {showProfit && <ProfitSummaryBanner orders={orders} />}
          <div className="flex flex-col gap-3">
            {tab === 'out'
              ? orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    showProfit={showProfit}
                    onTap={(o) => navigate(`/delivery/${o.id}`, { state: { order: o } })}
                  />
                ))
              : orders.map((order) => (
                  <DeliveredCard key={order.id} order={order} showProfit={showProfit} />
                ))
            }
          </div>
        </>
      )}
    </div>
  )
}