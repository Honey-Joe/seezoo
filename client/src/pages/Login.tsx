import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { login, clearError, googleLogin, setUser } from "../store/authSlice";
import { signInWithGoogle, resendVerificationEmail, sendForgotPasswordEmail } from "../services/authService";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import type { IUser } from "../types";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((s) => s.auth);

  const [form, setForm] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  // Forgot password
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setEmailNotVerified(false);
    setResent(false);
    setShowForgotPass(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleForgotPassword = async (e?: React.FormEvent | React.MouseEvent | unknown) => {
    if (e && typeof (e as React.FormEvent).preventDefault === "function") {
      (e as React.FormEvent).preventDefault();
    }
    if (!forgotEmail.trim()) { setForgotError("Please enter your email address."); return; }
    setForgotError(null);
    setForgotSent(false);
    setForgotLoading(true);
    try {
      await sendForgotPasswordEmail(forgotEmail.trim());
      setForgotSent(true);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-email") {
        setForgotError("No account found with that email address.");
      } else if (e.code === "auth/too-many-requests") {
        setForgotError("Too many requests. Please wait a few minutes.");
      } else {
        setForgotError("Could not send reset email. Please try again.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);
    setEmailNotVerified(false);
    setSubmitting(true);

    try {
      // Step 1: Sign in via Firebase to check email_verified status
      const firebaseCredential = await signInWithEmailAndPassword(auth, form.email, form.password);

      if (!firebaseCredential.user.emailVerified) {
        // Not verified yet — sign out so session isn't open
        await signOut(auth);
        setEmailNotVerified(true);
        setLocalError("Please verify your email before logging in. Check your inbox.");
        setSubmitting(false);
        return;
      }

      // Email is verified in Firebase — sign out of Firebase (we use our own JWT)
      await signOut(auth);

    } catch (firebaseErr: unknown) {
      const e = firebaseErr as { code?: string };
      // Firebase login might fail if this is an old account (before Firebase was added).
      // Fall through to server-side bcrypt login in that case.
      if (
        e.code !== "auth/user-not-found" &&
        e.code !== "auth/invalid-credential" &&
        e.code !== "auth/wrong-password"
      ) {
        // Real Firebase-side error
        setLocalError("Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      // else: old account not in Firebase — continue to server login below
    }

    // Step 2: Server login (bcrypt + isEmailVerified check)
    const result = await dispatch(login(form));

    if (login.fulfilled.match(result)) {
      dispatch(setUser(result.payload as IUser));
      navigate("/profile");
    } else {
      const payload = result.payload as Record<string, unknown> | string;
      if (typeof payload === "object" && payload?.emailNotVerified) {
        setEmailNotVerified(true);
        setLocalError("Please verify your email before logging in. Check your inbox.");
      } else {
        setLocalError((payload as string) || "Invalid credentials");
      }
    }
    setSubmitting(false);
  };

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      const result = await resendVerificationEmail(form.email, form.password);
      if (result.alreadyVerified) {
        setLocalError(null);
        setEmailNotVerified(false);
        setLocalError("Your email is already verified! Try logging in now.");
      } else {
        setResent(true);
        setLocalError(null);
      }
    } catch {
      setLocalError("Could not resend verification email. Please check your password.");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setGoogleLoading(true);
    try {
      const { idToken } = await signInWithGoogle();
      const result = await dispatch(googleLogin({ idToken, action: "login" }));

      if (googleLogin.fulfilled.match(result)) {
        const data = result.payload as Record<string, unknown>;
        if (data._id) navigate("/profile");
      } else if (googleLogin.rejected.match(result)) {
        const payload = result.payload as Record<string, unknown>;
        if (payload?.needsRegistration) {
          navigate("/register", {
            state: {
              googleHint: {
                email: payload.email,
                name: payload.name,
                message: "No Seezoo account found. Please sign up first.",
              },
            },
          });
        } else {
          setLocalError((payload as string) || "Google sign-in failed.");
        }
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code !== "auth/popup-closed-by-user") {
        setLocalError("Could not open Google sign-in. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLoading = submitting || loading || googleLoading;

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
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-bold text-purple-700 mt-2">Seezoo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
            <p className="text-gray-500 text-sm mb-6">Enter your credentials to continue</p>

            {/* Resent confirmation */}
            {resent && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">
                <span>✅</span> Verification email resent! Check your inbox.
              </div>
            )}

            {/* Error / not-verified banner */}
            {localError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span>⚠️</span> {localError}
                </div>
                {emailNotVerified && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || !form.password}
                    className="text-xs font-semibold text-purple-600 hover:underline disabled:opacity-50"
                  >
                    {resending ? "Resending..." : "Resend verification email →"}
                  </button>
                )}
              </div>
            )}

            {/* Google button */}
            <button
              id="google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 shadow-sm mb-5"
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in with Google...
                </span>
              ) : (<><GoogleIcon />Continue with Google</>)}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or sign in with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                <input
                  name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required autoComplete="email"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
                <input
                  name="password" type="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange} required autoComplete="current-password"
                  className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all"
                />
                {/* Forgot password link */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPass((s) => !s); setForgotSent(false); setForgotError(null); }}
                    className="text-xs text-purple-600 hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {/* Inline forgot-password — NOT a form (can't nest forms in HTML) */}
              {showForgotPass && (
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  {forgotSent ? (
                    <div className="flex items-start gap-2 text-green-700 text-sm">
                      <span>✅</span>
                      <div>
                        <p className="font-semibold">Reset email sent!</p>
                        <p className="text-xs text-green-600 mt-0.5">Check your inbox and follow the link to reset your password.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-purple-700">Enter your email to receive a reset link:</p>
                      {forgotError && (
                        <p className="text-xs text-red-500">⚠️ {forgotError}</p>
                      )}
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => { setForgotEmail(e.target.value); setForgotError(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleForgotPassword(e as unknown as React.FormEvent); } }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full border border-purple-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
                      />
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={forgotLoading || !forgotEmail.trim()}
                        className="w-full bg-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                      >
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-200 mt-2"
              >
                {submitting ? (
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
              <Link to="/register" className="text-purple-600 font-semibold hover:underline">Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
