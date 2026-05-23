import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  X,
  Minus,
  Plus,
  Package,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

function formatPeso(n) {
  if (n == null) return "₱0.00";
  return "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 });
}

const QTY_PRESETS = [0.5, 1, 2, 3];

// ── Item Row ───────────────────────────────────────────────────────────────
function ItemRow({ item, onChange }) {
  const isIncluded = item.fulfilled === true;
  const isSkipped = item.fulfilled === false;
  const isNeutral = item.fulfilled === null;

  const subtotal = isIncluded
    ? (item.price_per_dozen ?? 0) * item.fulfilled_quantity_dozen
    : 0;

  function setQty(val) {
    const v = Math.round(val * 2) / 2;
    if (v < 0.5) {
      onChange({ ...item, fulfilled: false, fulfilled_quantity_dozen: 0 });
    } else {
      const capped = Math.min(v, item.quantity_dozen);
      onChange({ ...item, fulfilled: true, fulfilled_quantity_dozen: capped });
    }
  }

  function handleCheck() {
    if (isIncluded) {
      onChange({ ...item, fulfilled: null, fulfilled_quantity_dozen: item.quantity_dozen });
    } else {
      onChange({ ...item, fulfilled: true, fulfilled_quantity_dozen: item.quantity_dozen });
    }
  }

  function handleSkip() {
    onChange({ ...item, fulfilled: false, fulfilled_quantity_dozen: 0 });
  }

  function handleUndo() {
    onChange({ ...item, fulfilled: null, fulfilled_quantity_dozen: item.quantity_dozen });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: isSkipped ? "#fafafa" : "white",
        border: isSkipped ? "1.5px solid #f1f5f9" : isIncluded ? "1.5px solid #dbeafe" : "1.5px solid #e2e8f0",
        boxShadow: isIncluded ? "0 2px 10px rgba(37,99,235,0.08)" : "none",
        opacity: isSkipped ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">

        {/* Checkbox */}
        <button
          onClick={handleCheck}
          className="shrink-0 flex items-center justify-center rounded-lg transition-all active:scale-90"
          style={{
            width: 26, height: 26,
            background: isIncluded ? "#2563eb" : "white",
            border: isIncluded ? "2px solid #2563eb" : isSkipped ? "2px solid #fca5a5" : "2px solid #cbd5e1",
            boxShadow: isIncluded ? "0 2px 6px rgba(37,99,235,0.3)" : "none",
          }}
        >
          {isIncluded && <Check size={13} color="white" strokeWidth={3} />}
          {isSkipped && <X size={11} color="#f87171" strokeWidth={3} />}
        </button>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <p
            className="font-bold truncate"
            style={{
              fontSize: "14px",
              color: isSkipped ? "#94a3b8" : "#1e293b",
              textDecoration: isSkipped ? "line-through" : "none",
              letterSpacing: "-0.01em",
            }}
          >
            {item.product_name}
            <span style={{ fontWeight: 400, color: isSkipped ? "#cbd5e1" : "#64748b" }}>
              {" "}— {item.product_size}
            </span>
          </p>
          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: 1 }}>
            Ordered: {item.quantity_dozen}dz · {formatPeso(item.price_per_dozen)}/dz
          </p>
        </div>

        {/* Right side action */}
        {isNeutral && (
          <button
            onClick={handleSkip}
            className="shrink-0 rounded-xl font-bold active:scale-95 transition-all"
            style={{ fontSize: "11px", padding: "5px 10px", background: "#fef2f2", color: "#ef4444" }}
          >
            Skip
          </button>
        )}
        {isSkipped && (
          <button
            onClick={handleUndo}
            className="shrink-0 rounded-xl font-bold active:scale-95 transition-all"
            style={{ fontSize: "11px", padding: "5px 10px", background: "#f1f5f9", color: "#64748b" }}
          >
            Undo
          </button>
        )}
        {isIncluded && (
          <span
            className="font-black shrink-0"
            style={{ fontSize: "14px", color: "#1e293b", letterSpacing: "-0.02em" }}
          >
            {formatPeso(subtotal)}
          </span>
        )}
      </div>

      {/* Qty controls */}
      {isIncluded && (
        <div className="flex items-center gap-2 px-4 pb-3" style={{ paddingLeft: 56 }}>
          <div
            className="flex items-center gap-1 rounded-xl px-2"
            style={{ background: "#f8fafc", height: 38, border: "1px solid #e2e8f0" }}
          >
            <button onClick={() => setQty(item.fulfilled_quantity_dozen - 0.5)} style={{ color: "#94a3b8", padding: "0 3px" }}>
              <Minus size={13} strokeWidth={2.5} />
            </button>
            <span className="font-bold text-slate-700 text-center" style={{ width: 36, fontSize: "13px" }}>
              {item.fulfilled_quantity_dozen}
            </span>
            <span style={{ fontSize: "11px", color: "#94a3b8", marginRight: 2 }}>dz</span>
            <button
              onClick={() => setQty(item.fulfilled_quantity_dozen + 0.5)}
              disabled={item.fulfilled_quantity_dozen >= item.quantity_dozen}
              style={{ color: item.fulfilled_quantity_dozen >= item.quantity_dozen ? "#cbd5e1" : "#94a3b8", padding: "0 3px" }}
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>
          <div className="flex gap-1 flex-wrap flex-1">
            {QTY_PRESETS.filter((q) => q <= item.quantity_dozen).map((q) => (
              <button
                key={q}
                onClick={() => setQty(q)}
                className="rounded-lg font-bold transition-all active:scale-95"
                style={{
                  fontSize: "11px", padding: "4px 9px",
                  background: item.fulfilled_quantity_dozen === q ? "#0f172a" : "#f1f5f9",
                  color: item.fulfilled_quantity_dozen === q ? "white" : "#64748b",
                }}
              >
                {q}dz
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Confirm Modal ──────────────────────────────────────────────────────────
function ConfirmReadyModal({ items, total, onConfirm, onCancel, loading }) {
  const skippedCount = items.filter((i) => !i.fulfilled).length;
  const reducedCount = items.filter(
    (i) => i.fulfilled && i.fulfilled_quantity_dozen < i.quantity_dozen,
  ).length;

  return (
    <div
  className="fixed inset-0 flex items-end justify-center z-50 px-4"
  style={{ paddingBottom: 'max(90px, calc(env(safe-area-inset-bottom) + 82px))', background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
>
      <div
        className="w-full max-w-sm rounded-3xl p-6 bg-white"
        style={{ boxShadow: "0 20px 60px rgba(15,23,42,0.2)" }}
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "#eff6ff" }}
        >
          <Package size={20} color="#2563eb" strokeWidth={2} />
        </div>
        <p
          className="font-black text-slate-800 mb-1"
          style={{ fontSize: "17px", letterSpacing: "-0.02em" }}
        >
          Mark as ready?
        </p>
        <p className="text-slate-500 mb-4" style={{ fontSize: "13px" }}>
          This will lock the quantities and move the order to{" "}
          <span className="font-bold text-slate-700">Ready for Delivery</span>.
        </p>
        {(skippedCount > 0 || reducedCount > 0) && (
          <div
            className="rounded-2xl p-3 mb-4 flex items-start gap-2"
            style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
          >
            <AlertCircle
              size={14}
              color="#d97706"
              strokeWidth={2}
              className="shrink-0 mt-0.5"
            />
            <p style={{ fontSize: "12px", color: "#92400e" }}>
              {[
                skippedCount > 0 &&
                  `${skippedCount} item${skippedCount > 1 ? "s" : ""} skipped`,
                reducedCount > 0 &&
                  `${reducedCount} item${reducedCount > 1 ? "s" : ""} reduced`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
        <div
          className="rounded-2xl p-3 mb-5 flex items-center justify-between"
          style={{ background: "#f8fafc" }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Final total
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 900,
              color: "#1e293b",
              letterSpacing: "-0.03em",
            }}
          >
            {formatPeso(total)}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl py-3 font-bold"
            style={{
              background: "#f1f5f9",
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-2xl py-3 font-bold active:scale-95 transition-transform"
            style={{
              background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "white",
              fontSize: "13px",
              boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
            }}
          >
            {loading ? "Saving…" : "Yes, Ready"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Preparing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: err } = await supabase
          .from("orders")
          .select(
            `
            id, status, order_total, created_at,
            customers (id, name, location, price_level),
            order_items (
              id, product_id, product_name, product_size,
              quantity_dozen, price_per_dozen,
              fulfilled, fulfilled_quantity_dozen
            )
          `,
          )
          .eq("id", id)
          .single();
        if (err) throw err;
        setOrder(data);
        setItems(
  (data.order_items ?? []).map((i) => ({
    ...i,
    fulfilled: null, // null = neutral, true = included, false = skipped
    fulfilled_quantity_dozen: i.quantity_dozen,
  })),
);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function updateItem(updated) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  const liveTotal = items.reduce(
    (s, i) =>
      s +
      (i.fulfilled ? (i.price_per_dozen ?? 0) * i.fulfilled_quantity_dozen : 0),
    0,
  );
  const skippedCount = items.filter((i) => i.fulfilled === false).length;
const includedCount = items.filter((i) => i.fulfilled === true).length;
const neutralCount = items.filter((i) => i.fulfilled === null).length;
const allActedOn = neutralCount === 0;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const results = await Promise.all(
        items.map((i) =>
          supabase
            .from("order_items")
            .update({
              fulfilled: i.fulfilled,
              fulfilled_quantity_dozen: i.fulfilled
                ? i.fulfilled_quantity_dozen
                : 0,
            })
            .eq("id", i.id),
        ),
      );
      const itemError = results.find((r) => r.error);
      if (itemError) throw itemError.error;

      const { error: orderErr } = await supabase
        .from("orders")
        .update({ status: "ready_for_delivery", order_total: liveTotal })
        .eq("id", id)
        .select();
      if (orderErr) throw orderErr;

      navigate("/preparing");
    } catch (e) {
      alert("Failed: " + e.message);
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  }

  const orderId = order ? `#${String(order.id).padStart(5, "0")}` : "";

  return (
    <div
      className="flex flex-col fixed left-0 right-0"
      style={{
        top: 60,
        bottom: 66,
        minHeight: 0,
        fontFamily: "'DM Sans', sans-serif",
        background: "#f0f4ff",
      }}
    >
      {/* Header — never scrolls */}
      <div
        style={{
          flexShrink: 0,
          padding: "16px 16px 8px",
          background: "#f0f4ff",
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center rounded-xl bg-white active:scale-95 transition-all"
            style={{
              width: 38,
              height: 38,
              boxShadow: "0 1px 4px rgba(15,23,42,0.08)",
            }}
          >
            <ArrowLeft size={16} color="#475569" strokeWidth={2.5} />
          </button>
          <div>
            <h1
              className="font-black text-slate-800"
              style={{
                fontSize: "20px",
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
              }}
            >
              Preparing
            </h1>
            {order && (
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: 1 }}>
                {order.customers?.name} · {orderId}
              </p>
            )}
          </div>
        </div>

        {error && (
          <div
            className="rounded-2xl p-4 mb-3 flex items-center gap-3"
            style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
          >
            <AlertCircle size={16} color="#ef4444" strokeWidth={2} />
            <p style={{ fontSize: "13px", color: "#dc2626" }}>{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-2.5 mb-2"
  style={{ background: "white", boxShadow: "0 1px 4px rgba(15,23,42,0.07)" }}>
  <div className="flex items-center gap-1.5">
    <div className="rounded-full" style={{ width: 8, height: 8, background: "#22c55e" }} />
    <span style={{ fontSize: "12px", fontWeight: 700, color: "#16a34a" }}>{includedCount} packed</span>
  </div>
  {skippedCount > 0 && (
    <>
      <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
      <div className="flex items-center gap-1.5">
        <div className="rounded-full" style={{ width: 8, height: 8, background: "#ef4444" }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#ef4444" }}>{skippedCount} skipped</span>
      </div>
    </>
  )}
  {neutralCount > 0 && (
    <>
      <div style={{ width: 1, height: 14, background: "#e2e8f0" }} />
      <div className="flex items-center gap-1.5">
        <div className="rounded-full" style={{ width: 8, height: 8, background: "#f59e0b" }} />
        <span style={{ fontSize: "12px", fontWeight: 700, color: "#d97706" }}>{neutralCount} remaining</span>
      </div>
    </>
  )}
</div>
        )}
      </div>

      {/* Scrollable items panel */}
      <div
        style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "0 16px" }}
      >
        {loading && (
          <div className="flex flex-col gap-3 pt-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 bg-white animate-pulse"
                style={{ height: 88 }}
              >
                <div className="h-3 bg-slate-100 rounded-full w-1/2 mb-2" />
                <div className="h-2.5 bg-slate-100 rounded-full w-1/3 mb-3" />
                <div className="flex gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-7 w-12 bg-slate-100 rounded-xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              paddingBottom: 16,
              paddingTop: 4,
            }}
          >
            {items.map((item) => (
              <ItemRow key={item.id} item={item} onChange={updateItem} />
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar — always visible */}
      {!loading && !error && (
        <div
          style={{
            flexShrink: 0,
            padding: "12px 16px 16px",
            background: "white",
            borderTop: "1px solid #e2e8f0",
            boxShadow: "0 -4px 16px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex items-center justify-between mb-2 px-1">
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Live total
            </span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: 900,
                color: "#1e293b",
                letterSpacing: "-0.03em",
              }}
            >
              {formatPeso(liveTotal)}
            </span>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            disabled={includedCount === 0 || !allActedOn}
            className="w-full rounded-2xl py-3.5 font-black flex items-center justify-center gap-2 active:scale-95 transition-transform duration-100"
            style={{
              background:
                includedCount === 0
                  ? "#e2e8f0"
                  : "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: includedCount === 0 ? "#94a3b8" : "white",
              fontSize: "14px",
              letterSpacing: "-0.01em",
              boxShadow:
                includedCount > 0 ? "0 4px 20px rgba(37,99,235,0.4)" : "none",
            }}
          >
            <ChevronRight size={16} strokeWidth={2.5} />
            Ready for Delivery
          </button>
        </div>
      )}

      {showConfirm && (
        <ConfirmReadyModal
          items={items}
          total={liveTotal}
          onConfirm={handleConfirm}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}
