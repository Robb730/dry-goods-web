import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
    } else {
      navigate("/orders");
    }
  }

  return (
    <div className="bg-slate-50 flex flex-col items-center justify-center px-6 py-8" style={{ minHeight: '100dvh', paddingTop: 'max(24px, env(safe-area-inset-top))', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

      {/* Brand — t-shirt mark */}
      <div className="mb-8 md:mb-10 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md shadow-blue-200" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path d="M32 28 L22 34 L28.5 44 L34 40 L34 74.5 Q34 77 36.5 77 L63.5 77 Q66 77 66 74.5 L66 40 L71.5 44 L78 34 L68 28 C66.5 28 64.8 26.5 63 22 L57 22 C55.5 26.5 53 29.2 50 29.2 C47 29.2 44.5 26.5 43 22 L37 22 C35.2 26.5 33.5 28 32 28 Z" fill="white"/>
            <path d="M43 22 Q50 29 57 22" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-slate-800 text-2xl md:text-3xl font-bold tracking-tight">Abella's Dry Goods</h1>
          <p className="text-slate-400 text-sm mt-0.5">Order Management</p>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@drygoods.com"
              required
              autoComplete="email"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-base placeholder-slate-300 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base rounded-xl py-3.5 mt-1 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Signing in…
              </>
            ) : "Sign In"}
          </button>

        </form>
      </div>

      <p className="mt-8 text-slate-300 text-xs">Dry Goods © {new Date().getFullYear()}</p>
    </div>
  );
}