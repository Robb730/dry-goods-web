import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Search, RefreshCw, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

function formatPeso(n) {
  if (n == null) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function formatOrderDate(ts) {
  if (!ts) return { dayName: '', time: '', date: '' }
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

function PreparingCard({ order, onClick }) {
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
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden cursor-pointer active:scale-[0.99] transition-transform duration-100"
      style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.08)' }}
    >
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
        <div className="flex items-center gap-2">
          <span className="rounded-lg px-2 py-0.5 font-black" style={{ background: '#e2e8f0', color: '#475569', fontSize: '10px', letterSpacing: '0.05em' }}>{dayName}</span>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>{date}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{time}</span>
        </div>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{orderId}</span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="font-bold text-slate-800" style={{ fontSize: '15px', letterSpacing: '-0.02em' }}>{order.customers?.name ?? 'Unknown'}</p>
          <div className="flex items-center gap-1 shrink-0" style={{ color: '#94a3b8' }}>
            <MapPin size={11} strokeWidth={2} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>{order.customers?.location ?? '—'}</span>
          </div>
        </div>
        <p className="text-slate-400 mb-4" style={{ fontSize: '12px', lineHeight: 1.55 }}>{preview || <span className="italic">No items</span>}</p>
        <div className="flex items-center justify-between">
          <p className="font-black text-slate-800" style={{ fontSize: '17px', letterSpacing: '-0.03em' }}>{formatPeso(order.order_total)}</p>
          <div className="flex items-center gap-1.5 rounded-xl px-3.5 py-2" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 10px rgba(217,119,6,0.3)' }}>
            <Package size={12} strokeWidth={2.5} />
            Checklist
            <ArrowRight size={13} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Preparing() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocation] = useState('All')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          id, status, order_total, created_at,
          customers (id, name, location, price_level),
          order_items (id, quantity_dozen, price_per_dozen, product_name, product_size)
        `)
        .eq('status', 'preparing')
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
      .channel('preparing-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchOrders])

  const knownLocations = [...new Set(orders.map(o => o.customers?.location).filter(Boolean))]
  const allLocations = ['All', ...LOCATIONS.filter(l => l !== 'All' && knownLocations.includes(l)), ...knownLocations.filter(l => !LOCATIONS.includes(l))]

  const filtered = orders.filter(o => {
    const matchLoc = locationFilter === 'All' || o.customers?.location === locationFilter
    const matchSearch = search === '' || (o.customers?.name ?? '').toLowerCase().includes(search.toLowerCase()) || String(o.id).includes(search)
    return matchLoc && matchSearch
  })

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-4">
        <p className="text-slate-400" style={{ fontSize: '13px', marginTop: '2px' }}>
          {orders.length === 0 ? 'No orders being prepared' : `${orders.length} order${orders.length > 1 ? 's' : ''} in progress`}
        </p>
      </div>

      <div className="flex gap-2 mb-3">
        <div className="flex flex-1 items-center gap-2 rounded-xl px-3 bg-white" style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.07)', height: 40 }}>
          <Search size={14} color="#94a3b8" strokeWidth={2} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer or order…"
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400" style={{ fontSize: '13px' }} />
        </div>
        <button onClick={fetchOrders} disabled={loading}
          className="flex items-center justify-center rounded-xl bg-white active:scale-95 transition-all"
          style={{ width: 40, height: 40, boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
          <RefreshCw size={15} color="#94a3b8" strokeWidth={2} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar pb-0.5">
        {allLocations.map(loc => {
          const active = locationFilter === loc
          const count = loc === 'All' ? orders.length : orders.filter(o => o.customers?.location === loc).length
          if (loc !== 'All' && count === 0) return null
          return (
            <button key={loc} onClick={() => setLocation(loc)}
              className="shrink-0 flex items-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-150"
              style={{ fontSize: '12px', fontWeight: 700, background: active ? 'linear-gradient(135deg,#0f172a,#1e293b)' : 'white', color: active ? 'white' : '#64748b', boxShadow: active ? '0 2px 8px rgba(15,23,42,0.25)' : '0 1px 3px rgba(15,23,42,0.07)' }}>
              <MapPin size={10} strokeWidth={2.5} />
              {loc}
              {count > 0 && (
                <span className="rounded-full px-1.5 py-0.5" style={{ fontSize: '10px', background: active ? 'rgba(255,255,255,0.2)' : '#f1f5f9', color: active ? 'white' : '#64748b' }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="text-center py-16" style={{ fontSize: '13px' }}>
          <p className="text-red-400 font-semibold mb-2">Failed to load orders</p>
          <p className="text-slate-400 mb-4" style={{ fontSize: '12px' }}>{error}</p>
          <button onClick={fetchOrders} className="px-4 py-2 rounded-xl text-white font-bold" style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', fontSize: '12px' }}>Retry</button>
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
          <p className="font-semibold text-slate-500 mb-1">{search || locationFilter !== 'All' ? 'No matching orders' : 'Nothing being prepared'}</p>
          <p style={{ fontSize: '12px' }}>{search || locationFilter !== 'All' ? 'Try adjusting your filters' : 'Orders moved to preparing will appear here'}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pb-28">
          {filtered.map(o => (
            <PreparingCard key={o.id} order={o} onClick={() => navigate(`/preparing/${o.id}`)} />
          ))}
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}