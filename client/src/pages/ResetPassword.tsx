import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch } from "../store";
import { setUser } from "../store/authSlice";
import { confirmFirebasePasswordReset } from "../services/authService";
import { getAuth, verifyPasswordResetCode } from "firebase/auth";
import type { IUser } from "../types";

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const oobCode = params.get("oobCode") ?? "";
  const mode = params.get("mode");

  const [email, setEmail] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Verify the oobCode and extract the email it belongs to
  useEffect(() => {
    if (!oobCode || mode !== "resetPassword") {
      setCodeError("Invalid or missing reset link. Please request a new one.");
      setVerifying(false);
      return;
    }
    const auth = getAuth();
    verifyPasswordResetCode(auth, oobCode)
      .then((e) => { setEmail(e); setVerifying(false); })
      .catch(() => {
        setCodeError("This reset link has expired or already been used. Please request a new one.");
        setVerifying(false);
      });
  }, [oobCode, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    if (!email) { setError("Could not determine account email."); return; }

    setLoading(true);
    try {
      const res = await confirmFirebasePasswordReset(oobCode, email, newPassword);
      dispatch(setUser(res.data.user as IUser));
      setDone(true);
      setTimeout(() => navigate("/profile", { replace: true }), 2500);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; code?: string };
      if (e.code === "auth/expired-action-code" || e.code === "auth/invalid-action-code") {
        setError("This reset link has expired. Please request a new one from the login page.");
      } else {
        setError(e.response?.data?.message || "Password reset failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-purple-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 px-8 py-8 text-center text-white">
            <div className="text-5xl mb-3">{done ? "🎉" : "🔐"}</div>
            <h1 className="text-xl font-bold">
              {done ? "Password reset!" : "Set a new password"}
            </h1>
            {email && !done && (
              <p className="text-purple-200 text-sm mt-1">for {email}</p>
            )}
          </div>

          <div className="px-8 py-8">
            {/* Loading state */}
            {verifying && (
              <div className="flex items-center justify-center gap-3 py-8">
                <svg className="animate-spin h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                <p className="text-gray-500 text-sm">Verifying reset link...</p>
              </div>
            )}

            {/* Invalid code */}
            {!verifying && codeError && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  <span>⚠️</span> {codeError}
                </div>
                <Link
                  to="/login"
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center"
                >
                  Back to Sign In
                </Link>
              </div>
            )}

            {/* Success */}
            {done && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
                  ✅ Your password has been reset! Redirecting you to your profile...
                </div>
                <Link to="/profile" className="text-purple-600 text-sm hover:underline">
                  Click here if you're not redirected
                </Link>
              </div>
            )}

            {/* Password form */}
            {!verifying && !codeError && !done && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                    <span>⚠️</span> {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(null); }}
                      placeholder="Min. 6 characters"
                      required
                      autoComplete="new-password"
                      className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 pr-16 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPass((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {newPassword.length > 0 && newPassword.length < 6 && (
                    <p className="text-xs text-amber-500 mt-1">Minimum 6 characters</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                    placeholder="Re-enter new password"
                    required
                    autoComplete="new-password"
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                  />
                  {confirm.length > 0 && confirm !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || newPassword.length < 6 || newPassword !== confirm}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Resetting password...
                    </>
                  ) : "Reset Password"}
                </button>

                <p className="text-center text-xs text-gray-400">
                  <Link to="/login" className="text-purple-600 hover:underline">Back to Sign In</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
