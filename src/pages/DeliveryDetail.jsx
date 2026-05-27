import { useState, useEffect, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ChevronLeft, Minus, Plus, AlertTriangle, CheckCircle2, Package,
  MapPin, Hash, Clock, CheckSquare, Square, TrendingUp, TrendingDown,
  Filter, Eye, EyeOff,
} from "lucide-react";

function formatPeso(n) {
  if (n == null || isNaN(n)) return "₱0.00";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function ProfitToggle({ showProfit, onToggle, allItemsProfit }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-2xl transition-all active:scale-95"
      style={{
        background: showProfit ? "linear-gradient(135deg, #14532d, #166534)" : "#f1f5f9",
        border: `1.5px solid ${showProfit ? "#4ade80" : "#e2e8f0"}`,
        boxShadow: showProfit ? "0 2px 12px rgba(22,163,74,0.25)" : "none",
      }}
    >
      {showProfit
        ? <Eye size={13} color="#4ade80" strokeWidth={2.5} />
        : <EyeOff size={13} color="#94a3b8" strokeWidth={2.5} />}
      <div className="flex flex-col items-start" style={{ gap: 0 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: showProfit ? "#4ade80" : "#94a3b8", lineHeight: 1 }}>
          PROFIT
        </span>
        {showProfit && allItemsProfit != null
          ? <span style={{ fontSize: 12, fontWeight: 800, color: "#86efac", lineHeight: 1.2, letterSpacing: "-0.02em" }}>{formatPeso(allItemsProfit)}</span>
          : <span style={{ fontSize: 10, color: "#64748b", lineHeight: 1.2 }}>tap to view</span>}
      </div>
    </button>
  );
}

function QtyStepper({ value, packedQty, onChange }) {
  const MAX_QTY = packedQty + 10;
  const canDecrease = value > 0.5;
  const canIncrease = value < MAX_QTY;
  const isAbovePacked = value > packedQty;
  return (
    <div className="flex items-center">
      <button onClick={() => onChange(Math.round((value - 0.5) * 2) / 2)} disabled={!canDecrease}
        className="w-8 h-8 flex items-center justify-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 disabled:opacity-30 active:bg-slate-100 transition-colors">
        <Minus size={12} strokeWidth={2.5} className="text-slate-500" />
      </button>
      <div className="h-8 px-2 flex items-center justify-center border min-w-[52px]"
        style={{ borderColor: isAbovePacked ? "#6ee7b7" : "#e2e8f0", background: isAbovePacked ? "#f0fdf4" : "#fff" }}>
        <span className="text-sm font-bold tabular-nums" style={{ color: isAbovePacked ? "#059669" : "#1e293b" }}>{value}</span>
        <span className="text-xs text-slate-400 ml-1">dz</span>
      </div>
      <button onClick={() => onChange(Math.round((value + 0.5) * 2) / 2)} disabled={!canIncrease}
        className="w-8 h-8 flex items-center justify-center rounded-r-xl border border-l-0 border-slate-200 bg-slate-50 disabled:opacity-30 active:bg-slate-100 transition-colors">
        <Plus size={12} strokeWidth={2.5} color={isAbovePacked ? "#10b981" : "#94a3b8"} />
      </button>
    </div>
  );
}

function ConfirmModal({ customerName, originalTotal, finalTotal, finalProfit, itemCount, uncheckedCount, onConfirm, onCancel, loading }) {
  const changed = Math.abs(finalTotal - originalTotal) > 0.001;
  const hasProfit = finalProfit != null && !isNaN(finalProfit);
  return (
    <div className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}>
      <div className="w-full bg-white rounded-t-3xl px-5 pt-5 pb-8">
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
            <CheckCircle2 size={20} color="#16a34a" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">Mark as Delivered?</p>
            <p className="text-sm text-slate-400">{customerName}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 overflow-hidden mb-4" style={{ background: "#f8fafc" }}>
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Items confirmed</span>
            <span className="text-sm font-bold text-slate-700">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
          </div>
          {uncheckedCount > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Items not brought</span>
              <span className="text-sm font-bold text-orange-400">{uncheckedCount} item{uncheckedCount !== 1 ? "s" : ""}</span>
            </div>
          )}
          {changed && (
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <span className="text-xs text-slate-400 font-medium">Original total</span>
              <span className="text-sm font-medium text-slate-400 line-through">{formatPeso(originalTotal)}</span>
            </div>
          )}
          <div className={`px-4 py-3 flex items-center justify-between ${hasProfit ? "border-b border-slate-100" : ""}`}>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Amount to collect</span>
            <span className="text-lg font-bold text-green-600 tabular-nums">{formatPeso(finalTotal)}</span>
          </div>
          {hasProfit && (
            <div className="px-4 py-3 flex items-center justify-between"
              style={{ background: "linear-gradient(135deg, #f0fdf4, #dcfce7)" }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#15803d" }}>Est. Profit</p>
                {finalTotal > 0 && (
                  <p style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>
                    {((finalProfit / finalTotal) * 100).toFixed(1)}% margin
                  </p>
                )}
              </div>
              <span className="text-lg font-bold tabular-nums" style={{ color: "#15803d" }}>{formatPeso(finalProfit)}</span>
            </div>
          )}
        </div>
        {changed && (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-amber-50 border border-amber-100 mb-4">
            <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
              Total adjusted from original. {formatPeso(finalTotal)} will be added to {customerName}'s balance.
            </p>
          </div>
        )}
        {!changed && <p className="text-xs text-slate-400 text-center mb-4">{formatPeso(finalTotal)} will be added to {customerName}'s balance.</p>}
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 h-12 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-500 active:bg-slate-50 disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 h-12 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
            {loading
              ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              : <><CheckCircle2 size={15} strokeWidth={2.5} /> Confirm Delivery</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, isChecked, qty, showProfit, onToggle, onQtyChange }) {
  const isAbovePacked = qty > item.quantity_dozen;
  const isBelowPacked = qty < item.quantity_dozen && isChecked;
  const lineTotal = item.price_per_dozen * qty;
  const basePrice = item.base_price ?? null;
  const profitPerDz = basePrice != null ? item.price_per_dozen - basePrice : null;
  const lineProfit = profitPerDz != null ? profitPerDz * qty : null;
  const marginPct = basePrice != null && item.price_per_dozen > 0
    ? (profitPerDz / item.price_per_dozen) * 100 : null;

  let borderColor, iconBg, iconColor, cardBg, checkColor;
  if (!isChecked) {
    borderColor = "#fdba74"; iconBg = "#fff7ed"; iconColor = "#f97316"; cardBg = "#fffbf7"; checkColor = "#f97316";
  } else if (isAbovePacked) {
    borderColor = "#34d399"; iconBg = "#ecfdf5"; iconColor = "#059669"; cardBg = "#f0fdf8"; checkColor = "#059669";
  } else if (isBelowPacked) {
    borderColor = "#fcd34d"; iconBg = "#fef3c7"; iconColor = "#f59e0b"; cardBg = "#fffdf0"; checkColor = "#16a34a";
  } else {
    borderColor = "#4ade80"; iconBg = "linear-gradient(135deg, #f0fdf4, #dcfce7)"; iconColor = "#16a34a"; cardBg = "#f0fdf8"; checkColor = "#16a34a";
  }

  return (
    <div className="rounded-3xl border-2 overflow-hidden transition-all duration-200"
      style={{ borderColor, background: cardBg, boxShadow: isChecked ? "0 2px 12px rgba(0,0,0,0.06)" : "0 4px 16px rgba(249,115,22,0.12)" }}>
      <div className="flex items-center gap-3 px-4 py-4 active:opacity-70 transition-opacity cursor-pointer" onClick={onToggle}>
        <div className="shrink-0">
          {isChecked ? <CheckSquare size={30} color={checkColor} strokeWidth={2} /> : <Square size={30} color="#f97316" strokeWidth={2} />}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {isAbovePacked && isChecked ? <TrendingUp size={18} color={iconColor} strokeWidth={2} /> : <Package size={18} color={iconColor} strokeWidth={2} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold leading-tight truncate"
            style={{ fontSize: 16, color: isChecked ? "#0f172a" : "#9a3412", letterSpacing: "-0.01em" }}>
            {item.product_name}
          </p>
          <p className="mt-0.5 truncate" style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
            Size {item.product_size}<span className="mx-1.5 opacity-40">·</span>{formatPeso(item.price_per_dozen)}/dz
          </p>
          {isChecked && isAbovePacked && <p className="mt-1 font-bold" style={{ fontSize: 12, color: "#059669" }}>↑ +{qty - item.fulfilled_quantity_dozen} dz extra</p>}
          {isChecked && isBelowPacked && <p className="mt-1 font-bold" style={{ fontSize: 12, color: "#d97706" }}>↓ reduced from {item.fulfilled_quantity_dozen} dz</p>}
        </div>
        <div className="shrink-0 text-right" style={{ minWidth: 68 }}>
          <p className="font-extrabold tabular-nums leading-tight"
            style={{ fontSize: 16, color: isChecked ? "#0f172a" : "#ea580c", letterSpacing: "-0.02em" }}>
            {formatPeso(lineTotal)}
          </p>
          <p className="mt-0.5 font-semibold tabular-nums" style={{ fontSize: 12, color: "#94a3b8" }}>{qty} dz</p>
        </div>
      </div>

      {/* Profit breakdown — shown when toggle is on and item is checked */}
      {showProfit && lineProfit != null && (
  <div className="mx-3 mb-3 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}
    style={{
      background: lineProfit >= 0 ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "linear-gradient(135deg, #fff1f2, #ffe4e6)",
      border: `1.5px solid ${lineProfit >= 0 ? "#86efac" : "#fca5a5"}`,
    }}>
    <div className="flex items-center justify-between px-3 py-2.5">
      {/* Left: equation */}
      <div className="flex items-center gap-1.5">
        <div className="text-center">
          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em" }}>COST</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>{formatPeso(basePrice)}</div>
        </div>
        <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 300 }}>→</span>
        <div className="text-center">
          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em" }}>SELL</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>{formatPeso(item.price_per_dozen)}</div>
        </div>
        <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 300 }}>×</span>
        <div className="text-center">
          <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, letterSpacing: "0.06em" }}>QTY</div>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 800 }}>{qty}dz</div>
        </div>
      </div>
      {/* Right: profit badge */}
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl"
          style={{ background: lineProfit >= 0 ? "#dcfce7" : "#ffe4e6", border: `1px solid ${lineProfit >= 0 ? "#86efac" : "#fca5a5"}` }}>
          {lineProfit >= 0
            ? <TrendingUp size={12} color="#15803d" strokeWidth={2.5} />
            : <TrendingDown size={12} color="#be123c" strokeWidth={2.5} />}
          <span style={{ fontSize: 14, fontWeight: 900, color: lineProfit >= 0 ? "#15803d" : "#be123c", letterSpacing: "-0.02em" }}>
            {formatPeso(lineProfit)}
          </span>
        </div>
        {marginPct != null && (
          <span style={{ fontSize: 10, color: lineProfit >= 0 ? "#16a34a" : "#e11d48", fontWeight: 700, marginTop: 2 }}>
            {marginPct.toFixed(0)}% margin
          </span>
        )}
      </div>
    </div>
  </div>
)}

      {isChecked && (
        <div className="flex items-center justify-between px-4 pb-4 pt-1"
          style={{ borderTop: `1.5px solid ${borderColor}40` }}
          onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Delivery qty</span>
          <QtyStepper value={qty} packedQty={item.quantity_dozen} onChange={onQtyChange} />
        </div>
      )}
    </div>
  );
}

export default function DeliveryDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const passedOrder = location.state?.order;

  const [order, setOrder] = useState(passedOrder ?? null);
  const [items, setItems] = useState([]);
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [qtys, setQtys] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [showProfit, setShowProfit] = useState(false);

  const allItemsProfit = useMemo(() => {
  const hasCostData = items.some((i) => i.base_price != null);
  if (!hasCostData) return null;
  return items.reduce((sum, item) => {
    if (item.base_price == null) return sum; // skip items with no cost data
    const qty = qtys[item.id] ?? item.quantity_dozen;
    return sum + (item.price_per_dozen - item.base_price) * qty;
  }, 0);
}, [items, qtys]);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        if (!order) {
          const { data: orderData, error: orderErr } = await supabase
            .from("orders").select(`id, customer_id, order_total, created_at, customers ( name, location )`)
            .eq("id", id).single();
          if (orderErr) throw orderErr;
          setOrder({ ...orderData, customer_name: orderData.customers?.name ?? "—", customer_location: orderData.customers?.location ?? "—" });
        }
        const { data: itemData, error: itemErr } = await supabase
          .from("order_items")
          .select("id, price_per_dozen, fulfilled_quantity_dozen, quantity_dozen, products ( size, base_price, categories ( name ) )")
          .eq("order_id", id).eq("fulfilled", false).order("id");
        if (itemErr) throw itemErr;
        const loaded = (itemData ?? []).map((item) => ({
          ...item,
          product_name: item.products?.categories?.name ?? "Unknown",
          product_size: item.products?.size ?? "—",
          base_price: item.products?.base_price ?? null,
        }));
        setItems(loaded);
        setCheckedIds(new Set());
        const initQtys = {};
        for (const item of loaded) initQtys[item.id] = item.quantity_dozen;
        setQtys(initQtys);
      } catch (e) {
        console.error(e); setError("Failed to load order.");
      } finally { setLoading(false); }
    }
    load();
  }, [id]);

  const categories = useMemo(() => {
    const names = [...new Set(items.map((i) => i.product_name))];
    return ["All", ...names.sort()];
  }, [items]);

  const filteredItems = useMemo(
    () => activeCategory === "All" ? items : items.filter((i) => i.product_name === activeCategory),
    [items, activeCategory],
  );

  const activeItems = items.filter((i) => checkedIds.has(i.id));
  const uncheckedCount = items.filter((i) => !checkedIds.has(i.id)).length;
  const allChecked = items.length > 0 && uncheckedCount === 0;

  const finalTotal = activeItems.reduce(
    (sum, item) => sum + item.price_per_dozen * (qtys[item.id] ?? item.quantity_dozen), 0,
  );
  const originalTotal = Number(order?.order_total ?? 0);
  const totalChanged = Math.abs(finalTotal - originalTotal) > 0.001;

  const totalProfit = useMemo(() => {
  const hasCostData = activeItems.some((i) => i.base_price != null);
  if (!hasCostData) return null;
  return activeItems.reduce((sum, item) => {
    if (item.base_price == null) return sum; // skip items with no cost data
    const qty = qtys[item.id] ?? item.quantity_dozen;
    return sum + (item.price_per_dozen - item.base_price) * qty;
  }, 0);
}, [activeItems, qtys]);

  const hasCostData = items.some((i) => i.base_price != null);

  const adjustedCount = activeItems.filter((i) => (qtys[i.id] ?? i.quantity_dozen) !== i.quantity_dozen).length;
  const filteredChecked = filteredItems.filter((i) => checkedIds.has(i.id)).length;
  const filteredUnchecked = filteredItems.length - filteredChecked;

  function toggleItem(itemId) {
    setCheckedIds((prev) => { const next = new Set(prev); next.has(itemId) ? next.delete(itemId) : next.add(itemId); return next; });
  }
  function setQty(itemId, val) { setQtys((prev) => ({ ...prev, [itemId]: val })); }

  async function handleConfirm() {
    setSubmitting(true); setError(null);
    try {
      for (const item of items) {
        const delivering = checkedIds.has(item.id);
        await supabase.from("order_items").update({
          fulfilled_quantity_dozen: delivering ? (qtys[item.id] ?? item.quantity_dozen) : 0,
        }).eq("id", item.id);
      }
      const updatePayload = { status: "delivered", order_total: finalTotal, delivered_at: new Date().toISOString() };
// if (totalProfit != null) updatePayload.profit = totalProfit;
      // if (totalProfit != null) updatePayload.profit = totalProfit;
      await supabase.from("orders").update(updatePayload).eq("id", id);
      navigate("/delivery", { replace: true });
    } catch (e) {
      console.error(e);
      setError("Failed to save: " + (e?.message ?? "Unknown error"));
      setSubmitting(false); setShowConfirm(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Loading order…</p>
      </div>
    </div>
  );

  if (error && items.length === 0) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <p className="text-sm text-red-500 mb-3">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 font-medium">← Go back</button>
      </div>
    </div>
  );

  const orderCode = "ADG-" + String(id).slice(-6).toUpperCase();

  return (
    <div className="flex flex-col h-full">

      {/* ── Sub-header ── */}
      <div className="shrink-0 bg-white border-b border-slate-100 px-4 pt-3 pb-3"
        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>

        {/* Row 1: back + customer + total */}
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200 transition-colors shrink-0">
            <ChevronLeft size={17} strokeWidth={2.5} className="text-slate-600" />
          </button>
          <p className="flex-1 text-base font-bold text-slate-800 truncate leading-tight">{order?.customer_name ?? "—"}</p>
          <div className="shrink-0 text-right" style={{ minWidth: 72 }}>
            {totalChanged && <p className="text-xs text-slate-400 line-through leading-none mb-0.5 tabular-nums">{formatPeso(originalTotal)}</p>}
            <p className="text-sm font-bold tabular-nums leading-none" style={{ color: activeItems.length === 0 ? "#94a3b8" : "#16a34a" }}>
              {formatPeso(finalTotal)}
            </p>
          </div>
        </div>

        {/* Row 2: meta + profit toggle */}
        <div className="flex items-start justify-between gap-2 mb-2 pl-10">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 flex-1">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={10} className="shrink-0" />
              <span className="truncate max-w-[80px]">{order?.customer_location ?? "—"}</span>
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Hash size={10} className="shrink-0" />{orderCode}
            </span>
            {order?.created_at && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={10} className="shrink-0" />{formatDate(order.created_at)}
              </span>
            )}
          </div>
          {hasCostData && (
            <ProfitToggle
  showProfit={showProfit}
  onToggle={() => setShowProfit((v) => !v)}
  totalProfit={totalProfit}
  allItemsProfit={allItemsProfit}
  hasItems={activeItems.length > 0}
/>
          )}
        </div>

        {/* Profit summary banner */}
{showProfit && allItemsProfit != null && (
  <div className="rounded-2xl overflow-hidden mb-2"
    style={{ background: "linear-gradient(135deg, #14532d, #166534)", border: "1.5px solid #4ade80" }}>
    <div className="px-4 pt-2.5 pb-1">
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#4ade80" }}>ORDER PROFIT ESTIMATE</p>
    </div>
    <div className="flex pb-3">
      <div className="flex-1 flex flex-col items-center px-3 py-1">
        <span style={{ fontSize: 10, color: "#86efac", fontWeight: 600, letterSpacing: "0.05em" }}>ALL ITEMS</span>
        <span style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
          {formatPeso(allItemsProfit)}
        </span>
        {(() => {
          const allTotal = items.reduce((s, i) => s + i.price_per_dozen * (qtys[i.id] ?? i.quantity_dozen), 0);
          return allTotal > 0
            ? <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>{((allItemsProfit / allTotal) * 100).toFixed(1)}% margin</span>
            : null;
        })()}
      </div>
      <div style={{ width: 1, background: "#166534", margin: "8px 0" }} />
      <div className="flex-1 flex flex-col items-center px-3 py-1">
        <span style={{ fontSize: 10, color: "#86efac", fontWeight: 600, letterSpacing: "0.05em" }}>CONFIRMED</span>
        <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.2, color: activeItems.length > 0 ? "#86efac" : "#4b7c5a" }}>
          {totalProfit != null ? formatPeso(totalProfit) : "₱0.00"}
        </span>
        {totalProfit != null && finalTotal > 0
          ? <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>{((totalProfit / finalTotal) * 100).toFixed(1)}% margin</span>
          : <span style={{ fontSize: 11, color: "#4b7c5a", fontWeight: 600 }}>0 confirmed</span>}
      </div>
    </div>
  </div>
)}

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
          <div className="h-full rounded-full transition-all duration-300"
            style={{
              width: items.length ? `${(activeItems.length / items.length) * 100}%` : "0%",
              background: allChecked ? "linear-gradient(90deg, #16a34a, #22c55e)" : "linear-gradient(90deg, #f97316, #fb923c)",
            }} />
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-400">{activeItems.length}/{items.length} confirmed</span>
          {allChecked
            ? <span className="text-xs text-green-600 font-semibold">All confirmed ✓</span>
            : <span className="text-xs text-orange-500 font-medium">{uncheckedCount} remaining</span>}
        </div>

        {/* Category filter tabs */}
        {categories.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide -mx-1 px-1">
            <Filter size={11} className="text-slate-400 shrink-0" />
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              const catItems = cat === "All" ? items : items.filter((i) => i.product_name === cat);
              const catUnchecked = catItems.filter((i) => !checkedIds.has(i.id)).length;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95"
                  style={isActive ? { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff" } : { background: "#f1f5f9", color: "#64748b" }}>
                  {cat}
                  {catUnchecked > 0 && (
                    <span className="flex items-center justify-center rounded-full font-bold"
                      style={{ minWidth: 15, height: 15, fontSize: 9, paddingInline: 3, background: isActive ? "rgba(255,255,255,0.3)" : "#fed7aa", color: isActive ? "#fff" : "#ea580c" }}>
                      {catUnchecked}
                    </span>
                  )}
                  {catUnchecked === 0 && catItems.length > 0 && <span style={{ fontSize: 9 }}>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Scrollable item list ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3" style={{ minHeight: 0 }}>
        {adjustedCount > 0 && (
          <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle size={12} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-600 font-medium">{adjustedCount} item{adjustedCount !== 1 ? "s" : ""} with adjusted quantity</p>
          </div>
        )}
        {activeCategory !== "All" && (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{activeCategory}</p>
            <span className="text-xs text-slate-400">— {filteredChecked}/{filteredItems.length} confirmed{filteredUnchecked > 0 && `, ${filteredUnchecked} left`}</span>
          </div>
        )}
        <div className="flex flex-col gap-3 pb-4">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item}
              isChecked={checkedIds.has(item.id)}
              qty={qtys[item.id] ?? item.quantity_dozen}
              showProfit={showProfit}
              onToggle={() => toggleItem(item.id)}
              onQtyChange={(val) => setQty(item.id, val)} />
          ))}
          {filteredItems.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No items in this category.</p>}
        </div>
        {error && <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-500">{error}</div>}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="shrink-0 bg-white border-t border-slate-100 px-4 pt-3 pb-4"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.07)" }}>
        <button onClick={() => setShowConfirm(true)} disabled={activeItems.length === 0}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:opacity-90 disabled:cursor-not-allowed transition-all"
          style={{ background: activeItems.length === 0 ? "#cbd5e1" : "linear-gradient(135deg, #16a34a, #15803d)" }}>
          <CheckCircle2 size={17} strokeWidth={2.5} />
          {activeItems.length === 0
            ? "Tap items above to confirm"
            : allChecked
              ? `All Confirmed · Mark Delivered · ${formatPeso(finalTotal)}`
              : `Mark as Delivered · ${formatPeso(finalTotal)}`}
        </button>
      </div>

      {showConfirm && (
        <ConfirmModal
          customerName={order?.customer_name ?? "—"}
          originalTotal={originalTotal}
          finalTotal={finalTotal}
          finalProfit={totalProfit}
          itemCount={activeItems.length}
          uncheckedCount={uncheckedCount}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={submitting} />
      )}
    </div>
  );
}