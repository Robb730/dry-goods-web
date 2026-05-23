import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Search, RefreshCw, MapPin, ArrowRight, X } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPeso(n) {
  if (n == null) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function formatOrderDate(ts) {
  if (!ts) return { day: '', time: '', date: '' }
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const dayName = d.toLocaleDateString('en-PH', { weekday: 'short' }).toUpperCase()
  const time = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true })
  let date
  if (isToday) date = 'Today'
  else if (isYesterday) date = 'Yesterday'
  else date = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })

  return { dayName, time, date }
}

const LOCATIONS = ['All', 'Gapan', 'San Fernando', 'Baliwag', 'Walk-in']

// ── Order Card ─────────────────────────────────────────────────────────────
function OrderCard({ order, onPrepare, onView }) {
  const { dayName, time, date } = formatOrderDate(order.created_at)
  const itemLabels = (order.order_items ?? []).map(
    i => `${i.product_name ?? '—'} ${i.product_size ?? ''} ×${i.quantity_dozen}dz`
  )
  const preview =
    itemLabels.slice(0, 2).join(', ') +
    (itemLabels.length > 2 ? ` +${itemLabels.length - 2} more` : '')
  const orderId = `#${String(order.id).padStart(5, '0')}`

  return (
    <div
      onClick={() => onView(order)}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.08)' }}
    >
      {/* Top strip — date/time */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="rounded-lg px-2 py-0.5 font-black"
            style={{ background: '#e2e8f0', color: '#475569', fontSize: '10px', letterSpacing: '0.05em' }}
          >
            {dayName}
          </span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
            {date}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{time}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{orderId}</span>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-bold text-slate-800" style={{ fontSize: '15px', letterSpacing: '-0.02em' }}>
            {order.customers?.name ?? 'Unknown'}
          </p>
          <div className="flex items-center gap-1 shrink-0" style={{ color: '#94a3b8' }}>
            <MapPin size={11} strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{order.customers?.location ?? '—'}</span>
          </div>
        </div>

        <p className="text-slate-400 mb-4" style={{ fontSize: '12px', lineHeight: 1.55 }}>
          {preview || <span className="italic">No items</span>}
        </p>

        <div className="flex items-center justify-between">
          <p className="font-black text-slate-800" style={{ fontSize: '17px', letterSpacing: '-0.03em' }}>
            {formatPeso(order.order_total)}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onPrepare(order) }}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 active:scale-95 transition-transform duration-100"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(37,99,235,0.35)',
            }}
          >
            Prepare
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose, onPrepare }) {
  if (!order) return null
  const { dayName, time, date } = formatOrderDate(order.created_at)
  const total = (order.order_items ?? []).reduce(
    (s, i) => s + (i.price_per_dozen ?? 0) * (i.quantity_dozen ?? 0), 0
  )
  const orderId = `#${String(order.id).padStart(5, '0')}`

  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50 px-4 pb-0"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white"
        style={{ borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 40px rgba(15,23,42,0.18)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>{orderId}</p>
            <p style={{ fontSize: '17px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', margin: '2px 0 0' }}>{order.customers?.name ?? 'Unknown'}</p>
          </div>
          <button onClick={onClose}
            className="flex items-center justify-center rounded-full"
            style={{ width: 30, height: 30, background: '#f1f5f9' }}>
            <X size={13} color="#64748b" strokeWidth={2.5} />
          </button>
        </div>

        {/* Meta strip */}
        <div className="flex items-center gap-4 mx-5 mb-4 px-3 py-2 rounded-xl shrink-0" style={{ background: '#f8fafc' }}>
          {order.customers?.location && (
            <span className="flex items-center gap-1" style={{ fontSize: '12px', color: '#64748b' }}>
              <MapPin size={12} strokeWidth={2} />{order.customers.location}
            </span>
          )}
          {order.customers?.price_level && (
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{order.customers.price_level}</span>
          )}
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{date} {time}</span>
        </div>

        {/* Items label */}
        <p className="px-5 shrink-0" style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
          Items ({(order.order_items ?? []).length})
        </p>

        {/* Scrollable items */}
        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 4 }}>
          <div className="mx-5 rounded-2xl overflow-hidden" style={{ border: '1px solid #f1f5f9' }}>
            {(order.order_items ?? []).map((item, i) => (
              <div key={item.id ?? i}
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 truncate" style={{ fontSize: '13px', margin: 0 }}>
                    {item.product_name ?? '—'} <span className="text-slate-400">- {item.product_size}</span>
                  </p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 0' }}>
                    {formatPeso(item.price_per_dozen)}/dz × {item.quantity_dozen}dz
                  </p>
                </div>
                <p style={{ fontSize: '14px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', margin: 0, marginLeft: 12 }}>
                  {formatPeso((item.price_per_dozen ?? 0) * (item.quantity_dozen ?? 0))}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer — total + prepare */}
        <div className="px-5 pt-3 pb-8 shrink-0" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Order total</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em' }}>{formatPeso(total)}</span>
          </div>
          <button onClick={() => { onClose(); onPrepare(order) }}
            className="w-full rounded-2xl py-3.5 font-black flex items-center justify-center gap-2 active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', fontSize: '14px', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}>
            <Package size={16} strokeWidth={2.5} /> Prepare Order
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmPrepareModal({ order, onConfirm, onCancel, loading }) {
  if (!order) return null
  return (
    <div
      className="fixed inset-0 flex items-end justify-center z-50 px-4 pb-6"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 bg-white"
        style={{ boxShadow: '0 20px 60px rgba(15,23,42,0.2)' }}
      >
        <div className="mb-1">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#eff6ff' }}
          >
            <Package size={20} color="#2563eb" strokeWidth={2} />
          </div>
          <p className="font-black text-slate-800 mb-1" style={{ fontSize: '17px', letterSpacing: '-0.02em' }}>
            Start preparing?
          </p>
          <p className="text-slate-500" style={{ fontSize: '13px' }}>
            Move <span className="font-bold text-slate-700">{order.customers?.name}'s</span> order to <span className="font-bold text-slate-700">Preparing</span>.
          </p>
        </div>

        <div
          className="rounded-2xl p-3 mt-4 mb-5"
          style={{ background: '#f8fafc' }}
        >
          {(order.order_items ?? []).slice(0, 3).map((item, i) => (
            <div key={i} className="flex justify-between py-1" style={{ fontSize: '12px' }}>
              <span className="text-slate-600">{item.product_name} {item.product_size}</span>
              <span className="font-semibold text-slate-500">×{item.quantity_dozen}dz</span>
            </div>
          ))}
          {(order.order_items ?? []).length > 3 && (
            <p className="text-slate-400 pt-1" style={{ fontSize: '11px' }}>
              +{order.order_items.length - 3} more items
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl py-3 font-bold"
            style={{ background: '#f1f5f9', color: '#64748b', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl py-3 font-bold active:scale-95 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: 'white',
              fontSize: '13px',
              boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            }}
          >
            {loading ? 'Moving…' : 'Yes, Prepare'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [search, setSearch]         = useState('')
  const [locationFilter, setLocation] = useState('All')
  const [preparing, setPreparing]   = useState(null) // order to confirm
  const [movingId, setMovingId]     = useState(null)

  const [viewing, setViewing] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          order_total,
          is_quick_sale,
          created_at,
          customers (
            id,
            name,
            location,
            price_level,
            remaining_balance
          ),
          order_items (
            id,
            quantity_dozen,
            price_per_dozen,
            fulfilled,
            fulfilled_quantity_dozen,
            product_name,
            product_size
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (err) throw err
      setOrders(data ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const channel = supabase
      .channel('orders-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  // ── Move to preparing ──────────────────────────────────────────────────
  async function confirmPrepare() {
    if (!preparing) return
    setMovingId(preparing.id)
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({ status: 'preparing' })
        .eq('id', preparing.id)
      if (err) throw err
      setPreparing(null)
      navigate('/orders')
    } catch (e) {
      alert('Failed to update order: ' + e.message)
    } finally {
      setMovingId(null)
    }
  }

  // ── Unique locations from current orders ──────────────────────────────
  const knownLocations = [...new Set(
    orders.map(o => o.customers?.location).filter(Boolean)
  )]
  const allLocations = ['All', ...LOCATIONS.filter(l => l !== 'All' && knownLocations.includes(l)), ...knownLocations.filter(l => !LOCATIONS.includes(l))]

  // ── Filter ─────────────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchLoc    = locationFilter === 'All' || o.customers?.location === locationFilter
    const matchSearch =
      search === '' ||
      (o.customers?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      String(o.id).includes(search)
    return matchLoc && matchSearch
  })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header count */}
      <div className="mb-4">
        <h1 className="font-black text-slate-800" style={{ fontSize: '22px', letterSpacing: '-0.03em' }}>
          Pending Orders
        </h1>
        <p className="text-slate-400" style={{ fontSize: '13px', marginTop: '2px' }}>
          {orders.length === 0 ? 'No pending orders' : `${orders.length} order${orders.length > 1 ? 's' : ''} waiting`}
        </p>
      </div>

      {/* Search + refresh */}
      <div className="flex gap-2 mb-3">
        <div
          className="flex flex-1 items-center gap-2 rounded-xl px-3 bg-white"
          style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.07)', height: 40 }}
        >
          <Search size={14} color="#94a3b8" strokeWidth={2} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer or order…"
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400"
            style={{ fontSize: '13px' }}
          />
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center rounded-xl bg-white active:scale-95 transition-all"
          style={{ width: 40, height: 40, boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}
        >
          <RefreshCw
            size={15}
            color="#94a3b8"
            strokeWidth={2}
            className={loading ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Location filter pills */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-0.5">
        {allLocations.map(loc => {
          const active = locationFilter === loc
          const count = loc === 'All' ? orders.length : orders.filter(o => o.customers?.location === loc).length
          if (loc !== 'All' && count === 0) return null
          return (
            <button
              key={loc}
              onClick={() => setLocation(loc)}
              className="shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-150"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                background: active ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'white',
                color: active ? 'white' : '#64748b',
                boxShadow: active
                  ? '0 2px 8px rgba(15,23,42,0.25)'
                  : '0 1px 3px rgba(15,23,42,0.07)',
              }}
            >
              <MapPin size={10} strokeWidth={2.5} />
              {loc}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5"
                  style={{
                    fontSize: '10px',
                    background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                    color: active ? 'white' : '#64748b',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-16" style={{ fontSize: '13px' }}>
          <p className="text-red-400 font-semibold mb-2">Failed to load orders</p>
          <p className="text-slate-400 mb-4" style={{ fontSize: '12px' }}>{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 rounded-xl text-white font-bold"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', fontSize: '12px' }}
          >
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex flex-col gap-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
              <div style={{ height: 36, background: '#f8fafc' }} />
              <div className="p-4">
                <div className="h-3.5 bg-slate-100 rounded-full w-1/3 mb-2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-2/3 mb-4" />
                <div className="h-8 bg-slate-100 rounded-xl w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400" style={{ fontSize: '13px' }}>
          <Package size={36} color="#e2e8f0" className="mx-auto mb-3" />
          <p className="font-semibold text-slate-500 mb-1">
            {search || locationFilter !== 'All' ? 'No matching orders' : 'No pending orders'}
          </p>
          <p style={{ fontSize: '12px' }}>
            {search || locationFilter !== 'All' ? 'Try adjusting your filters' : 'New orders will appear here'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pb-28">
          {filtered.map(order => (
            <OrderCard
  key={order.id}
  order={order}
  onPrepare={o => setPreparing(o)}
onView={o => setViewing(o)}  // ← add this
/>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => navigate('/orders/new')}
        className="fixed bottom-20 right-4 flex items-center gap-2 rounded-2xl px-4 py-3 active:scale-95 transition-transform duration-100"
        style={{
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          boxShadow: '0 4px 20px rgba(37,99,235,0.45)',
          color: 'white',
          fontWeight: 700,
          fontSize: '13px',
          zIndex: 40,
        }}
      >
        <Plus size={16} strokeWidth={2.5} />
        New Order
      </button>

      <OrderDetailModal
  order={viewing}
  onClose={() => setViewing(null)}
  onPrepare={o => setPreparing(o)}
/>

      {/* Confirm modal */}
      <ConfirmPrepareModal
        order={preparing}
        onConfirm={confirmPrepare}
        onCancel={() => setPreparing(null)}
        loading={movingId !== null}
      />

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}