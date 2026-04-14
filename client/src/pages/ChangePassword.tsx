import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store";
import { changePasswordOnServer } from "../services/authService";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const hasPassword = !!user;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isGoogleOnly = user?.authProvider === "google" && !user?.email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await changePasswordOnServer(
        currentPassword || undefined,
        newPassword
      );
      setSuccess(true);
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
      setTimeout(() => navigate("/profile", { replace: true }), 2000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-purple-50 to-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link to="/profile"
          className="inline-flex items-center gap-2 text-sm text-purple-600 hover:underline mb-6 font-medium"
        >
          ← Back to Profile
        </Link>

        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 px-8 py-8 text-center text-white">
            <div className="text-5xl mb-3">🔐</div>
            <h1 className="text-xl font-bold">
              {hasPassword ? "Change Password" : "Set a Password"}
            </h1>
            <p className="text-purple-200 text-sm mt-1">
              {isGoogleOnly
                ? "Add a backup password for email/password login"
                : "Update your Seezoo password"}
            </p>
          </div>

          <div className="px-8 py-8">

            {/* Google-only info badge */}
            {isGoogleOnly && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm rounded-xl px-4 py-3 mb-5">
                <span>ℹ️</span>
                <span>You currently sign in with Google. Setting a password lets you also log in with email + password.</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                <span>✅</span> Password updated successfully! Redirecting...
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <span>⚠️</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Current password — only if not Google-only */}
              {!isGoogleOnly && (
                <div>
                  <label className={labelCls}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => { setCurrentPassword(e.target.value); setError(null); }}
                      placeholder="Your current password"
                      autoComplete="current-password"
                      className={`${inputCls} pr-16`}
                    />
                    <button type="button" onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>New Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                  placeholder="Min. 6 characters"
                  required
                  autoComplete="new-password"
                  className={inputCls}
                />
                {newPassword.length > 0 && newPassword.length < 6 && (
                  <p className="text-xs text-amber-500 mt-1">Minimum 6 characters</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Confirm New Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                  placeholder="Re-enter new password"
                  required
                  autoComplete="new-password"
                  className={inputCls}
                />
                {confirm.length > 0 && confirm !== newPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || newPassword.length < 6 || newPassword !== confirm || success}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Updating...
                  </>
                ) : isGoogleOnly ? "Set Password" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
