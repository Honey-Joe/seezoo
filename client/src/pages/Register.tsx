import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store";
import { register, clearError, googleLogin } from "../store/authSlice";
import {
  signInWithGoogle,
  createFirebaseUserAndSendVerification,
  deleteFirebaseUser,
} from "../services/authService";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

interface LocationState {
  googleHint?: { email: string; name: string; message: string };
}

const fields = [
  { name: "name",     label: "Full Name",  type: "text",     placeholder: "Buddy's Human" },
  { name: "username", label: "Username",   type: "text",     placeholder: "buddyslover" },
  { name: "email",    label: "Email",      type: "email",    placeholder: "you@example.com" },
  { name: "password", label: "Password",   type: "password", placeholder: "Min. 6 characters" },
] as const;

const Register = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAppSelector((s) => s.auth);

  const googleHint = (location.state as LocationState)?.googleHint;

  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setLocalError(null);
    setSubmitting(true);

    try {
      // Step 1 — Create Firebase user & send verification email
      await createFirebaseUserAndSendVerification(form.email, form.password);

      // Step 2 — Create user in MongoDB (returns verificationSent: true, no JWT)
      const result = await dispatch(register(form));

      if (register.fulfilled.match(result)) {
        // Navigate to "check your inbox" page
        navigate("/verify-email", { state: { email: form.email, password: form.password } });
      } else {
        // MongoDB failed — clean up Firebase user (best-effort)
        await deleteFirebaseUser(form.email, form.password);
        setLocalError((result.payload as string) || "Registration failed. Please try again.");
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/email-already-in-use") {
        setLocalError("An account with this email already exists. Please sign in.");
      } else if (e.code === "auth/weak-password") {
        setLocalError("Password must be at least 6 characters.");
      } else if (e.code === "auth/invalid-email") {
        setLocalError("Please enter a valid email address.");
      } else {
        setLocalError(e.message || "Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setLocalError(null);
    setGoogleLoading(true);
    try {
      const { idToken, name, email, picture } = await signInWithGoogle();
      const result = await dispatch(googleLogin({ idToken, action: "register" }));

      if (googleLogin.fulfilled.match(result)) {
        const data = result.payload as Record<string, unknown>;
        if (data._id) {
          navigate("/profile");
        } else if (data.pendingGoogle) {
          navigate("/setup-username", { state: { name, email, picture } });
        }
      } else if (googleLogin.rejected.match(result)) {
        setLocalError((result.payload as string) || "Google sign-in failed. Please try again.");
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
      {/* Left form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-purple-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <span className="text-5xl">🐾</span>
            <h1 className="text-2xl font-bold text-purple-700 mt-2">Seezoo</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
            <p className="text-gray-500 text-sm mb-6">Join thousands of pet lovers today 🐾</p>

            {googleHint && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3 mb-5">
                <span className="mt-0.5">ℹ️</span>
                <span>{googleHint.message}</span>
              </div>
            )}

            {localError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
                <span>⚠️</span> {localError}
              </div>
            )}

            {/* Google register button */}
            <button
              id="google-register-btn"
              type="button"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mb-5"
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-gray-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing up with Google...
                </span>
              ) : (<><GoogleIcon />Sign up with Google</>)}
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">or create with email</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {label}
                  </label>
                  <input
                    name={name} type={type} placeholder={placeholder}
                    value={form[name]} onChange={handleChange}
                    required autoComplete={name === "password" ? "new-password" : name === "email" ? "email" : "off"}
                    className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent focus:bg-white transition-all"
                  />
                </div>
              ))}

              <p className="text-xs text-gray-400 pt-1">
                Username: 3–30 chars · letters, numbers, <code className="bg-gray-100 px-1 rounded">_</code> or <code className="bg-gray-100 px-1 rounded">.</code>
              </p>

              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
                <span>📧</span>
                <span>A verification email will be sent to confirm your address before you can log in.</span>
              </div>

              <button
                type="submit" disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-purple-200"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending verification...
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
