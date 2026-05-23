import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Truck, CheckCircle, RefreshCw, MapPin, ChevronRight } from 'lucide-react'

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

function OrderCard({ order, onTap }) {
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
        <div className="text-right">
          <p className="text-sm font-bold text-slate-800">{formatPeso(order.order_total)}</p>
          <p className="text-xs text-slate-400">total</p>
        </div>
        <ChevronRight size={16} className="text-slate-300" />
      </div>
    </button>
  )
}

function DeliveredCard({ order }) {
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
        <p className="text-sm font-bold text-slate-800">{formatPeso(order.order_total)}</p>
        <p className="text-xs text-green-500 font-semibold">Delivered</p>
      </div>
    </div>
  )
}

export default function OutForDelivery() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('out') // 'out' | 'delivered'
  const [outOrders, setOutOrders] = useState([])
  const [deliveredOrders, setDeliveredOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchOrders() {
    setLoading(true)
    setError(null)
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const [{ data: outData, error: outErr }, { data: delivData, error: delivErr }] = await Promise.all([
        supabase
          .from('orders')
          .select('id, customer_id, order_total, created_at, customers ( name, location )')
          .eq('status', 'out_for_delivery')
          .order('created_at', { ascending: false }),
        supabase
          .from('orders')
          .select('id, customer_id, order_total, created_at, delivered_at, customers ( name, location )')
          .eq('status', 'delivered')
          .gte('delivered_at', todayStart.toISOString())
          .order('delivered_at', { ascending: false }),
      ])

      if (outErr) throw outErr
      if (delivErr) throw delivErr

      const map = (o) => ({
        ...o,
        customer_name:     o.customers?.name     ?? '—',
        customer_location: o.customers?.location ?? '—',
      })

      setOutOrders((outData ?? []).map(map))
      setDeliveredOrders((delivData ?? []).map(map))
    } catch (e) {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [])

  const orders = tab === 'out' ? outOrders : deliveredOrders

  return (
    <div>
      {/* Tabs + Refresh */}
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
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
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

      {/* Order cards */}
      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-3 mt-3">
          {tab === 'out'
            ? orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onTap={(o) => navigate(`/delivery/${o.id}`, { state: { order: o } })}
                />
              ))
            : orders.map((order) => (
                <DeliveredCard key={order.id} order={order} />
              ))
          }
        </div>
      )}
    </div>
  )
}