import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../services/authService";

const ResetPassword = () => {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const token      = params.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirm,     setConfirm]     = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [done,        setDone]        = useState(false);

  if (!token) return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <p className="text-4xl mb-4">⚠️</p>
        <p className="text-gray-700 font-semibold mb-4">Invalid or missing reset link.</p>
        <Link to="/login" className="text-purple-600 hover:underline text-sm">Back to Sign In</Link>
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Reset failed. The link may have expired.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-purple-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 px-8 py-8 text-center text-white">
          <div className="text-5xl mb-3">{done ? "🎉" : "🔐"}</div>
          <h1 className="text-xl font-bold">{done ? "Password reset!" : "Set a new password"}</h1>
        </div>

        <div className="px-8 py-8">
          {done ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                ✅ Password reset successfully! Redirecting to login...
              </p>
              <Link to="/login" className="text-purple-600 text-sm hover:underline">Click here if not redirected</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  ⚠️ {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="Min. 6 characters" required autoComplete="new-password"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confirm Password</label>
                <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  placeholder="Re-enter new password" required autoComplete="new-password"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all" />
                {confirm.length > 0 && confirm !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirm}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-all shadow-md shadow-purple-200">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
              <p className="text-center text-xs text-gray-400">
                <Link to="/login" className="text-purple-600 hover:underline">Back to Sign In</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
