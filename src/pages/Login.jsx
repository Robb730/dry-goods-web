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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">

      {/* Brand */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        </div>
        <div className="text-center">
          <h1 className="text-slate-800 text-2xl font-bold tracking-tight">Dry Goods</h1>
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