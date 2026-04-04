import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { register, clearError } from "../store/authSlice";

const fields = [
  { name: "name",     label: "Full Name",  type: "text",     placeholder: "Buddy's Human" },
  { name: "username", label: "Username",   type: "text",     placeholder: "buddyslover" },
  { name: "email",    label: "Email",      type: "email",    placeholder: "you@example.com" },
  { name: "password", label: "Password",   type: "password", placeholder: "••••••••" },
] as const;

const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) navigate("/profile");
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-purple-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-bold text-purple-700 mt-2">Seezoo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-500 text-sm mb-6">Join thousands of pet lovers today 🐾</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    name={name} type={type} placeholder={placeholder}
                    value={form[name]} onChange={handleChange} required
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              ))}

              <p className="text-xs text-gray-400 pt-1">
                Username: 3–30 chars, letters, numbers, <code className="bg-gray-100 px-1 rounded">_</code> or <code className="bg-gray-100 px-1 rounded">.</code>
              </p>

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-200"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-purple-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 flex-col items-center justify-center p-12 text-white">
        <div className="grid grid-cols-3 gap-4 text-5xl mb-8">
          <span>🐶</span><span>🐱</span><span>🐰</span>
          <span>🐦</span><span>🐠</span><span>🦎</span>
          <span>🐹</span><span>🐾</span><span>🦜</span>
        </div>
        <h2 className="text-4xl font-bold mb-4 text-center">Your pets deserve the spotlight</h2>
        <p className="text-purple-200 text-center text-lg max-w-sm">
          Share their moments, connect with other pet lovers, and build your pet's social profile.
        </p>
      </div>
    </div>
  );
};

export default Register;
