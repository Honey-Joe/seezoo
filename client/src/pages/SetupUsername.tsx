import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch } from "../store";
import { setUser } from "../store/authSlice";
import { completeGoogleSignup } from "../services/authService";
import { auth } from "../lib/firebase";
import type { IUser } from "../types";

interface LocationState {
  name: string;
  email: string;
  picture: string;
}

const SetupUsername = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");           // user types their own name
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guard: need Firebase session + state
  useEffect(() => {
    if (!state?.email || !auth.currentUser) {
      navigate("/register", { replace: true });
    }
  }, [navigate, state]);

  const isValidUsername = /^[a-z0-9_.]{3,30}$/.test(username.toLowerCase());

  const handleUsernameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUsername) {
      setError("Username must be 3-30 chars: letters, numbers, _ or .");
      return;
    }
    if (!name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters (or leave it blank).");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await completeGoogleSignup(username, name.trim(), password || undefined);
      dispatch(setUser(res.data as IUser));
      navigate("/profile", { replace: true });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      if (e.message?.includes("No active Google session")) {
        navigate("/register", { replace: true });
        return;
      }
      setError(e.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-purple-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">

          {/* Top banner */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 px-8 pt-8 pb-10 text-center text-white">
            {/* Generic avatar — user sets their photo in settings later */}
            <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 mx-auto mb-4 flex items-center justify-center text-4xl">
              🐾
            </div>
            <h1 className="text-xl font-bold">Almost there! 🐾</h1>
            <p className="text-purple-200 text-sm mt-1">{state.email}</p>
          </div>

          <div className="px-8 py-8 -mt-2">
            <div className="flex justify-center mb-5">
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-4 py-1.5 rounded-full">
                Complete your Seezoo profile
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="Your full name"
                  required
                  autoComplete="name"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-semibold select-none">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameInput}
                    placeholder="yourpawsome_name"
                    maxLength={30}
                    autoFocus
                    autoComplete="username"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl pl-9 pr-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">3–30 chars · letters, numbers, _ or .</p>
                {username.length > 0 && (
                  <p className={`text-xs mt-1 font-medium ${isValidUsername ? "text-green-600" : "text-amber-500"}`}>
                    {isValidUsername ? "✓ Looks good!" : "Needs 3+ valid characters"}
                  </p>
                )}
              </div>

              {/* Optional password */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Password <span className="text-gray-400 font-normal normal-case">(optional — for backup login)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Leave blank to use Google only"
                    autoComplete="new-password"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 pr-12 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-amber-500 mt-1">Minimum 6 characters</p>
                )}
              </div>

              <button
                id="setup-username-submit"
                type="submit"
                disabled={loading || !isValidUsername || !name.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating your profile...
                  </>
                ) : "Join Seezoo 🐾"}
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-4">
              Your Google email is already verified — no extra confirmation needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupUsername;
