import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Search, Check, Plus, Minus,
  ShoppingCart, User, X, MapPin, Trash2, ChevronDown
} from 'lucide-react'
import { supabase } from '../lib/supabase'

// ── Helpers ────────────────────────────────────────────────────────────────
function formatPeso(n) {
  if (n == null) return '₱0.00'
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

async function resetSequences() {
  const { error } = await supabase.rpc('reset_order_sequences')
  if (error) console.warn('[resetSeq] non-fatal:', error.message)
}

const STEPS = ['Customer', 'Items', 'Review']
const QTY_PRESETS = [0.5, 1, 2, 3]

const SIZE_ORDER = ['xxxs','xxs','xs','s','m','l','xl','xxl','fs']

function sizeRank(size) {
  if (size == null) return Infinity
  const s = String(size).toLowerCase().trim()
  if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s) * 0.001
  const idx = SIZE_ORDER.indexOf(s)
  return idx === -1 ? Infinity : idx + 1000
}

function sortSizes(products) {
  return [...products].sort((a, b) => {
    const ra = sizeRank(a.size), rb = sizeRank(b.size)
    if (ra !== rb) return ra - rb
    return String(a.size).localeCompare(String(b.size))
  })
}

// ── Step Indicator ─────────────────────────────────────────────────────────
function StepBar({ current }) {
  return (
    <div className="flex items-center mb-6">
      {STEPS.map((label, i) => {
        const done = i < current, active = i === current
        return (
          <div key={label} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 28, height: 28,
                  background: done ? '#16a34a' : active ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f1f5f9',
                  boxShadow: active ? '0 2px 8px rgba(37,99,235,0.35)' : 'none',
                }}>
                {done
                  ? <Check size={13} color="white" strokeWidth={3} />
                  : <span style={{ fontSize: '11px', fontWeight: 800, color: active ? 'white' : '#94a3b8' }}>{i + 1}</span>}
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#1e293b' : done ? '#16a34a' : '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, marginBottom: 18, marginLeft: 4, marginRight: 4, background: done ? '#16a34a' : '#e2e8f0', borderRadius: 2, transition: 'background 0.3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Customer Selector ──────────────────────────────────────────────
function StepCustomer({ selected, onSelect }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('All')
  const [showLocations, setShowLocations] = useState(false)

  useEffect(() => {
    supabase.from('customers').select('id, name, location, price_level, remaining_balance').order('name')
      .then(({ data }) => { setCustomers(data ?? []); setLoading(false) })
  }, [])

  const locations = ['All', ...Array.from(new Set(customers.map(c => c.location).filter(Boolean))).sort()]

  const filtered = customers.filter(c => {
    const matchSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || (c.location ?? '').toLowerCase().includes(search.toLowerCase())
    const matchLocation = locationFilter === 'All' || c.location === locationFilter
    return matchSearch && matchLocation
  })

  return (
    <div className="pb-6">
      <div className="mb-4">
        <h2 className="font-black text-slate-800 mb-0.5" style={{ fontSize: '17px', letterSpacing: '-0.02em' }}>Select Customer</h2>
        <p className="text-slate-400" style={{ fontSize: '12px' }}>Search by name or location</p>
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 bg-white mb-2" style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.07)', height: 42 }}>
        <Search size={14} color="#94a3b8" strokeWidth={2} />
        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer…"
          className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400" style={{ fontSize: '13px' }} />
        {search && <button onClick={() => setSearch('')}><X size={13} color="#94a3b8" /></button>}
      </div>

      <div className="mb-3">
        <div className="relative">
          <button onClick={() => setShowLocations(v => !v)}
            className="flex items-center gap-2 rounded-xl px-3 bg-white w-full"
            style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.07)', height: 38 }}>
            <MapPin size={13} color={locationFilter !== 'All' ? '#2563eb' : '#94a3b8'} strokeWidth={2} />
            <span style={{ fontSize: '13px', color: locationFilter !== 'All' ? '#2563eb' : '#94a3b8', fontWeight: locationFilter !== 'All' ? 700 : 400, flex: 1, textAlign: 'left' }}>
              {locationFilter !== 'All' ? locationFilter : 'All locations'}
            </span>
            {locationFilter !== 'All' && (
  <span
    onClick={e => {
      e.stopPropagation()
      setLocationFilter('All')
    }}
    className="rounded-full flex items-center justify-center cursor-pointer"
    style={{ width: 18, height: 18, background: '#e0e7ff' }}
  >
    <X size={9} color="#2563eb" strokeWidth={3} />
  </span>
)}
            <ChevronDown size={13} color="#94a3b8" strokeWidth={2} style={{ transform: showLocations ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {showLocations && (
            <div className="absolute top-10 left-0 right-0 rounded-xl overflow-hidden z-30"
              style={{ background: 'white', boxShadow: '0 8px 24px rgba(15,23,42,0.14)', border: '1px solid #e2e8f0' }}>
              {locations.map(loc => (
                <button key={loc} onClick={() => { setLocationFilter(loc); setShowLocations(false) }}
                  className="w-full text-left px-4 py-2.5 flex items-center justify-between"
                  style={{ fontSize: '13px', fontWeight: locationFilter === loc ? 700 : 400, color: locationFilter === loc ? '#2563eb' : '#475569', background: locationFilter === loc ? '#eff6ff' : 'transparent', borderBottom: '1px solid #f8fafc' }}>
                  {loc}
                  {locationFilter === loc && <Check size={12} color="#2563eb" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-2" />
              <div className="h-2.5 bg-slate-100 rounded-full w-1/3" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <User size={32} color="#e2e8f0" className="mx-auto mb-2" />
            <p style={{ fontSize: '13px' }}>No customers found</p>
          </div>
        ) : filtered.map(c => {
          const isSelected = selected?.id === c.id
          return (
            <button key={c.id} onClick={() => onSelect(c)} className="w-full text-left rounded-2xl p-4 transition-all duration-150"
              style={{ background: isSelected ? 'linear-gradient(135deg,#eff6ff,#dbeafe)' : 'white', border: isSelected ? '2px solid #2563eb' : '2px solid transparent', boxShadow: isSelected ? '0 2px 12px rgba(37,99,235,0.15)' : '0 1px 4px rgba(15,23,42,0.07)' }}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate" style={{ fontSize: '14px' }}>{c.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {c.location && <span className="flex items-center gap-1" style={{ fontSize: '11px', color: '#94a3b8' }}><MapPin size={10} strokeWidth={2} />{c.location}</span>}
                    {c.price_level && <span className="rounded-lg px-2 py-0.5 font-bold" style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', letterSpacing: '0.04em' }}>{c.price_level}</span>}
                  </div>
                </div>
                {isSelected && <div className="rounded-full flex items-center justify-center ml-3 shrink-0" style={{ width: 24, height: 24, background: '#2563eb' }}><Check size={13} color="white" strokeWidth={3} /></div>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Item Picker ────────────────────────────────────────────────────
function ItemPicker({ customer, cartItems, onCartChange }) {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openCat, setOpenCat] = useState(null)
  const [selSize, setSelSize] = useState({})
  const [selQty, setSelQty] = useState({})
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: cats }, { data: prods }, { data: priceRows }] = await Promise.all([
        supabase.from('categories').select('id, name, code').order('name'),
        supabase.from('products').select('id, category_id, size, base_price, item_code').order('size'),
        supabase.from('product_prices').select('product_id, level_name, selling_price_per_dozen'),
      ])
      setCategories(cats ?? [])
      setProducts(prods ?? [])
      setPrices(priceRows ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function getPrice(productId) {
    const level = customer?.price_level
    if (!level) return null
    const row = prices.find(p => p.product_id === productId && p.level_name === level)
    return row?.selling_price_per_dozen ?? null
  }

  function catMatchScore(cat, q) {
    if (q === '') return 0
    const catName = cat.name.toLowerCase()
    let best = Infinity
    for (const p of cat.sizes) {
      const code = (p.item_code ?? '').toLowerCase()
      if (code === q)            { best = Math.min(best, 0); break }
      if (code.startsWith(q))    best = Math.min(best, 1)
      else if (code.includes(q)) best = Math.min(best, 3)
    }
    if (catName.startsWith(q))    best = Math.min(best, 2)
    else if (catName.includes(q)) best = Math.min(best, 4)
    for (const p of cat.sizes) {
      if ((p.size ?? '').toLowerCase().includes(q)) best = Math.min(best, 5)
    }
    return best
  }

  const q = search.toLowerCase().trim()
  const filteredCats = categories
    .map(cat => ({ ...cat, sizes: sortSizes(products.filter(p => p.category_id === cat.id)) }))
    .filter(cat => cat.sizes.length > 0)
    .map(cat => ({ ...cat, _score: catMatchScore(cat, q) }))
    .filter(cat => cat._score < Infinity)
    .sort((a, b) => a._score - b._score)

  function handleCatTap(catId) {
    if (openCat === catId) { setOpenCat(null); return }
    setOpenCat(catId)
    const sorted = sortSizes(products.filter(p => p.category_id === catId))
    if (sorted.length > 0 && !selSize[catId]) setSelSize(s => ({ ...s, [catId]: sorted[0].id }))
    if (!selQty[catId]) setSelQty(q => ({ ...q, [catId]: 1 }))
  }

  function handleAddToCart(cat) {
    const productId = selSize[cat.id]
    const qty = selQty[cat.id] ?? 1
    const product = products.find(p => p.id === productId)
    if (!product) return
    const price = getPrice(productId)
    const key = String(productId)
    const existing = cartItems.find(i => i._key === key)
    if (existing) {
      onCartChange(cartItems.map(i => i._key === key ? { ...i, quantity_dozen: qty, price_per_dozen: price, subtotal: (price ?? 0) * qty } : i))
    } else {
      onCartChange([...cartItems, { _key: key, product_id: productId, product_name: cat.name, product_size: product.size, quantity_dozen: qty, price_per_dozen: price, subtotal: (price ?? 0) * qty }])
    }
    setOpenCat(null)
  }

  function removeFromCart(key) { onCartChange(cartItems.filter(i => i._key !== key)) }

  const cartTotal = cartItems.reduce((s, i) => s + (i.subtotal ?? 0), 0)

  return (
    // Extra bottom padding so content isn't hidden behind the fixed "Review Order" bar
    <div style={{ paddingBottom: 100 }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-black text-slate-800 mb-0.5" style={{ fontSize: '17px', letterSpacing: '-0.02em' }}>Add Items</h2>
          <p className="text-slate-400" style={{ fontSize: '12px' }}>
            {customer?.name} · <span style={{ color: '#64748b', fontWeight: 600 }}>{customer?.price_level ?? 'Standard'}</span> pricing
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 bg-white mb-3" style={{ boxShadow: '0 1px 4px rgba(15,23,42,0.07)', height: 42 }}>
        <Search size={14} color="#94a3b8" strokeWidth={2} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or item code…"
          className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400" style={{ fontSize: '13px' }} />
        {search && <button onClick={() => setSearch('')}><X size={13} color="#94a3b8" /></button>}
      </div>

      {/* Collapsible cart strip */}
      {cartItems.length > 0 && (
        <div className="rounded-2xl mb-3 overflow-hidden" style={{ border: '1px solid #bfdbfe', background: 'linear-gradient(135deg,#eff6ff,#dbeafe)' }}>
          <button onClick={() => setCartOpen(v => !v)} className="w-full flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <ShoppingCart size={13} color="#2563eb" strokeWidth={2.5} />
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#1d4ed8' }}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#1d4ed8', letterSpacing: '-0.03em' }}>{formatPeso(cartTotal)}</span>
              <ChevronDown size={13} color="#3b82f6" strokeWidth={2.5} style={{ transform: cartOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
          </button>
          {cartOpen && (
            <div className="px-3 pb-3" style={{ borderTop: '1px solid #bfdbfe' }}>
              <div className="flex flex-col gap-1.5 pt-2" style={{ maxHeight: 160, overflowY: 'auto' }}>
                {cartItems.map(item => (
                  <div key={item._key} className="flex items-center justify-between">
                    <span style={{ fontSize: '12px', color: '#1e40af' }}>
                      {item.product_name}<span style={{ opacity: 0.7 }}> - {item.product_size} · ×{item.quantity_dozen}dz</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e40af' }}>{formatPeso(item.subtotal)}</span>
                      <button onClick={() => removeFromCart(item._key)}><X size={11} color="#93c5fd" strokeWidth={2.5} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Product list */}
      <div className="flex flex-col gap-2">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
              <div className="h-3 bg-slate-100 rounded-full w-1/3 mb-3" />
              <div className="flex gap-2">{[...Array(4)].map((_, j) => <div key={j} className="h-7 w-10 bg-slate-100 rounded-xl" />)}</div>
            </div>
          ))
        ) : filteredCats.length === 0 ? (
          <div className="text-center py-10 text-slate-400"><p style={{ fontSize: '13px' }}>No products found</p></div>
        ) : filteredCats.map(cat => {
          const isOpen = openCat === cat.id
          const totalInCart = cartItems.filter(i => i.product_name === cat.name).reduce((s, i) => s + i.quantity_dozen, 0)
          return (
            <div key={cat.id} className="rounded-2xl overflow-hidden"
              style={{ background: 'white', boxShadow: isOpen ? '0 4px 16px rgba(37,99,235,0.12)' : '0 1px 4px rgba(15,23,42,0.07)', border: isOpen ? '1.5px solid #dbeafe' : '1.5px solid transparent' }}>
              <button onClick={() => handleCatTap(cat.id)} className="w-full text-left px-4 py-3.5" style={{ background: isOpen ? '#f8fafc' : 'transparent' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <p className="font-bold text-slate-800" style={{ fontSize: '14px' }}>{cat.name}</p>
                    {totalInCart > 0 && <span className="rounded-full flex items-center justify-center font-bold shrink-0" style={{ minWidth: 20, height: 20, padding: '0 5px', background: '#2563eb', color: 'white', fontSize: '10px' }}>{totalInCart}dz</span>}
                  </div>
                  {!isOpen && (
                    <div className="flex gap-1 items-center">
                      {cat.sizes.slice(0, 6).map(p => {
                        const inCart = cartItems.some(i => i._key === String(p.id))
                        return (
                          <span key={p.id} className="rounded-lg font-bold"
                            style={{ fontSize: '10px', padding: '2px 7px', background: inCart ? '#dbeafe' : '#f1f5f9', color: inCart ? '#1d4ed8' : '#94a3b8', border: inCart ? '1px solid #93c5fd' : '1px solid transparent' }}>
                            {p.size}
                          </span>
                        )
                      })}
                      {cat.sizes.length > 6 && <span style={{ fontSize: '10px', color: '#cbd5e1' }}>+{cat.sizes.length - 6}</span>}
                    </div>
                  )}
                </div>
              </button>
            </div>
          )
        })}
      </div>

      {/* Bottom sheet when a category is open */}
      {openCat && (() => {
        const cat = filteredCats.find(c => c.id === openCat)
        if (!cat) return null
        const activeProdId = selSize[cat.id] ?? cat.sizes[0]?.id
        const activeQty = selQty[cat.id] ?? 1
        const activePrice = getPrice(activeProdId)
        const existingCartItem = cartItems.find(i => i._key === String(activeProdId))
        const activeProduct = cat.sizes.find(p => p.id === activeProdId)
        return (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, background: 'white', borderTop: '1.5px solid #e2e8f0', boxShadow: '0 -8px 32px rgba(15,23,42,0.12)', borderRadius: '20px 20px 0 0', padding: '16px 16px 80px' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-black text-slate-800" style={{ fontSize: '15px', letterSpacing: '-0.02em' }}>{cat.name}</p>
              <button onClick={() => setOpenCat(null)} className="rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: '#f1f5f9' }}>
                <X size={13} color="#64748b" strokeWidth={2.5} />
              </button>
            </div>
            <div className="mb-3">
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Size</p>
              <div className="flex gap-2 flex-wrap">
                {cat.sizes.map(p => {
                  const isActive = activeProdId === p.id
                  const inCart = cartItems.some(i => i._key === String(p.id))
                  return (
                    <button key={p.id} onClick={() => setSelSize(s => ({ ...s, [cat.id]: p.id }))} className="rounded-xl font-bold transition-all"
                      style={{ fontSize: '13px', padding: '6px 14px', background: isActive ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : inCart ? '#eff6ff' : '#f8fafc', color: isActive ? 'white' : inCart ? '#1d4ed8' : '#475569', border: inCart && !isActive ? '1.5px solid #bfdbfe' : '1.5px solid transparent', boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.3)' : 'none' }}>
                      {p.size}{inCart && !isActive && <Check size={9} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />}
                    </button>
                  )
                })}
              </div>
              {activeProduct?.item_code && <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: 6 }}>Item code: <span style={{ fontWeight: 700, color: '#64748b' }}>{activeProduct.item_code}</span></p>}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl px-2" style={{ background: '#f8fafc', height: 42, border: '1.5px solid #e2e8f0' }}>
                <button onClick={() => setSelQty(s => ({ ...s, [cat.id]: Math.max(0.5, (s[cat.id] ?? 1) - 0.5) }))} style={{ color: '#94a3b8', padding: '0 2px' }}><Minus size={13} strokeWidth={2.5} /></button>
                <input type="number" min="0.5" step="0.5" value={activeQty}
                  onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0.5) setSelQty(s => ({ ...s, [cat.id]: v })) }}
                  className="text-center bg-transparent outline-none text-slate-700 font-bold" style={{ width: 40, fontSize: '13px' }} />
                <span style={{ fontSize: '11px', color: '#94a3b8', marginRight: 2 }}>dz</span>
                <button onClick={() => setSelQty(s => ({ ...s, [cat.id]: (s[cat.id] ?? 1) + 0.5 }))} style={{ color: '#94a3b8', padding: '0 2px' }}><Plus size={13} strokeWidth={2.5} /></button>
              </div>
              <div className="flex-1 rounded-xl px-3 flex items-center justify-end" style={{ background: '#f8fafc', height: 42 }}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                  {activePrice != null ? formatPeso(activePrice * activeQty) : <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>No price</span>}
                </span>
              </div>
              <button onClick={() => handleAddToCart(cat)} disabled={activePrice == null}
                className="rounded-xl flex items-center justify-center gap-1.5 font-bold active:scale-95 transition-transform shrink-0"
                style={{ height: 42, paddingLeft: 18, paddingRight: 18, background: activePrice == null ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: activePrice == null ? '#94a3b8' : 'white', fontSize: '13px', boxShadow: activePrice != null ? '0 2px 10px rgba(37,99,235,0.35)' : 'none' }}>
                {existingCartItem ? <><Check size={14} strokeWidth={2.5} /> Update</> : <><Plus size={14} strokeWidth={2.5} /> Add</>}
              </button>
            </div>
            <div className="flex gap-2 mt-2.5">
              {QTY_PRESETS.map(q => (
                <button key={q} onClick={() => setSelQty(s => ({ ...s, [cat.id]: q }))} className="rounded-lg font-bold transition-all"
                  style={{ fontSize: '11px', padding: '4px 10px', background: activeQty === q ? '#0f172a' : '#f1f5f9', color: activeQty === q ? 'white' : '#64748b' }}>
                  {q}dz
                </button>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Step 3: Review & Submit ────────────────────────────────────────────────
function StepReview({ customer, cartItems, onRemoveItem, onSubmit, submitting }) {
  const total = cartItems.reduce((s, i) => s + (i.subtotal ?? 0), 0)

  return (
    <div className="pb-6">
      <div className="mb-4">
        <h2 className="font-black text-slate-800 mb-0.5" style={{ fontSize: '17px', letterSpacing: '-0.02em' }}>Review Order</h2>
        <p className="text-slate-400" style={{ fontSize: '12px' }}>Confirm everything before submitting</p>
      </div>

      {/* Customer card */}
      <div className="rounded-2xl p-4 mb-3" style={{ background: 'white', boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Customer</p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-slate-800" style={{ fontSize: '15px' }}>{customer?.name}</p>
          <div className="flex items-center gap-2">
            {customer?.location && <span className="flex items-center gap-1" style={{ fontSize: '11px', color: '#94a3b8' }}><MapPin size={10} strokeWidth={2} />{customer.location}</span>}
            {customer?.price_level && <span className="rounded-lg px-2 py-0.5 font-bold" style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b' }}>{customer.price_level}</span>}
          </div>
        </div>
      </div>

      {/* Items — scrollable panel */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'white', boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
        <div className="px-4 pt-3 pb-1.5">
          <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Items ({cartItems.length})</p>
        </div>

        {/* Scrollable item rows */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {cartItems.map((item, i) => (
            <div key={item._key} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : 'none' }}>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-700 truncate" style={{ fontSize: '13px' }}>
                  {item.product_name} <span className="text-slate-400">- {item.product_size}</span>
                </p>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: 1 }}>{formatPeso(item.price_per_dozen)}/dz × {item.quantity_dozen}dz</p>
              </div>
              <div className="flex items-center gap-3 ml-3">
                <span className="font-black text-slate-800" style={{ fontSize: '14px', letterSpacing: '-0.02em' }}>{formatPeso(item.subtotal)}</span>
                <button onClick={() => onRemoveItem(item._key)} className="rounded-lg flex items-center justify-center" style={{ width: 28, height: 28, background: '#fef2f2' }}>
                  <Trash2 size={12} color="#ef4444" strokeWidth={2} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Sticky total at bottom of card */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '2px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.03em', textTransform: 'uppercase' }}>Order Total</span>
          <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em' }}>{formatPeso(total)}</span>
        </div>
      </div>

      {/* Submit */}
      <button onClick={onSubmit} disabled={submitting || cartItems.length === 0}
        className="w-full rounded-2xl py-4 font-black flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
        style={{ background: cartItems.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: cartItems.length === 0 ? '#94a3b8' : 'white', fontSize: '15px', letterSpacing: '-0.01em', boxShadow: cartItems.length > 0 ? '0 4px 20px rgba(37,99,235,0.45)' : 'none' }}>
        {submitting ? 'Placing Order…' : <><Check size={17} strokeWidth={2.5} /> Place Order</>}
      </button>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function NewOrder() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [customer, setCustomer] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [submitting, setSubmitting] = useState(false)

  function goNext() { setStep(s => Math.min(s + 1, 2)) }
  function goBack() {
    if (step === 0) navigate(-1)
    else setStep(s => s - 1)
  }

  async function submitOrder() {
    if (!customer || cartItems.length === 0) return
    setSubmitting(true)
    try {
      await resetSequences()
      const total = cartItems.reduce((s, i) => s + (i.subtotal ?? 0), 0)
      const { data: orderData, error: orderErr } = await supabase.from('orders')
        .insert({ customer_id: customer.id, status: 'pending', order_total: total, is_quick_sale: false })
        .select('id').single()
      if (orderErr) throw orderErr
      const items = cartItems.map(i => ({
        order_id: orderData.id, product_id: i.product_id, product_name: i.product_name,
        product_size: i.product_size, quantity_dozen: i.quantity_dozen,
        price_per_dozen: i.price_per_dozen, fulfilled: false, fulfilled_quantity_dozen: 0,
      }))
      const { error: itemsErr } = await supabase.from('order_items').insert(items)
      if (itemsErr) throw itemsErr
      navigate('/orders')
    } catch (e) {
      alert('Failed to place order: ' + e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const canNext = step === 0 ? !!customer : step === 1 ? cartItems.length > 0 : false

  return (
    // Layout's <main> already scrolls — NewOrder just renders in normal flow
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={goBack} className="flex items-center justify-center rounded-xl bg-white active:scale-95 transition-all"
          style={{ width: 38, height: 38, boxShadow: '0 1px 4px rgba(15,23,42,0.08)' }}>
          <ArrowLeft size={16} color="#475569" strokeWidth={2.5} />
        </button>
        <div>
          <h1 className="font-black text-slate-800" style={{ fontSize: '20px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>New Order</h1>
          {customer && step > 0 && <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: 1 }}>{customer.name}</p>}
        </div>
      </div>

      <StepBar current={step} />

      {step === 0 && <StepCustomer selected={customer} onSelect={c => { setCustomer(c); goNext() }} />}
      {step === 1 && (
        <>
          <ItemPicker customer={customer} cartItems={cartItems} onCartChange={setCartItems} />

          {/* Fixed "Review Order" bar — always visible above Layout's bottom nav */}
          <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, padding: '10px 16px 12px', background: 'linear-gradient(to top, white 80%, transparent)', zIndex: 40 }}>
            <button onClick={goNext} disabled={!canNext}
              className="w-full rounded-2xl py-3.5 font-black flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
              style={{ background: canNext ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#e2e8f0', color: canNext ? 'white' : '#94a3b8', fontSize: '14px', letterSpacing: '-0.01em', boxShadow: canNext ? '0 4px 20px rgba(37,99,235,0.4)' : 'none' }}>
              Review Order <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </>
      )}
      {step === 2 && (
        <StepReview customer={customer} cartItems={cartItems}
          onRemoveItem={key => setCartItems(items => items.filter(i => i._key !== key))}
          onSubmit={submitOrder} submitting={submitting} />
      )}
    </div>
  )
}