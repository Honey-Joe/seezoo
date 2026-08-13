import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { login, clearError } from "../store/authSlice";
import { forgotPassword } from "../services/authService";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((s) => s.auth);

  const [form,          setForm]          = useState({ email: "", password: "" });
  const [error,         setError]         = useState("");
  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotError,   setForgotError]   = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      navigate("/feed");
    } else {
      setError((result.payload as string) || "Invalid credentials");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError("Please enter your email."); return; }
    setForgotLoading(true); setForgotError("");
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch {
      setForgotError("Could not send reset email. Please try again.");
    } finally { setForgotLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="text-8xl mb-6">🐾</div>
        <h2 className="text-4xl font-bold mb-4 text-center">Welcome back!</h2>
        <p className="text-purple-200 text-center text-lg max-w-sm">
          Your pets missed you. Log in to see what's happening in the Seezoo community.
        </p>
        <div className="mt-10 flex gap-4 text-4xl">
          <span>🐶</span><span>🐱</span><span>🐰</span><span>🐦</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-purple-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-bold text-purple-700 mt-2">Seezoo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required autoComplete="email"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <input name="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange} required autoComplete="current-password"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all" />
                <div className="flex justify-end mt-1.5">
                  <button type="button" onClick={() => { setShowForgot((v) => !v); setForgotSent(false); setForgotError(""); }}
                    className="text-xs text-purple-600 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
              </div>

              {showForgot && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  {forgotSent ? (
                    <p className="text-sm text-green-700">✅ Reset link sent! Check your inbox.</p>
                  ) : (
                    <form onSubmit={handleForgot} className="space-y-3">
                      <p className="text-xs font-semibold text-purple-700">Enter your email to receive a reset link:</p>
                      {forgotError && <p className="text-xs text-red-500">⚠️ {forgotError}</p>}
                      <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com" autoComplete="email"
                        className="w-full border border-purple-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all" />
                      <button type="submit" disabled={forgotLoading || !forgotEmail.trim()}
                        className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </form>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-200 mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-600 font-semibold hover:underline">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
