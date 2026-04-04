import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { login, clearError } from "../store/authSlice";

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) navigate("/profile");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-purple-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-bold text-purple-700 mt-2">Seezoo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <input
                  name="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange} required
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{" "}
              <Link to="/register" className="text-purple-600 font-semibold hover:underline">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
