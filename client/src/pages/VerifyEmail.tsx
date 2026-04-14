import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { resendVerificationEmail } from "../services/authService";

interface LocationState {
  email: string;
  password: string;
}

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dots, setDots] = useState(".");

  // Animate the waiting dots
  useEffect(() => {
    const interval = setInterval(() =>
      setDots((d) => (d.length >= 3 ? "." : d + ".")), 600);
    return () => clearInterval(interval);
  }, []);

  // If navigated here without state, send back
  useEffect(() => {
    if (!state?.email) navigate("/register", { replace: true });
  }, [state, navigate]);

  const handleResend = async () => {
    if (!state?.email || !state?.password) {
      setError("Please go back to the login page and try again.");
      return;
    }
    setResending(true);
    setResent(false);
    setError(null);
    try {
      const result = await resendVerificationEmail(state.email, state.password);
      if (result.alreadyVerified) {
        navigate("/login", { replace: true });
      } else {
        setResent(true);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes before resending.");
      } else {
        setError("Could not resend email. Please try logging in to trigger a new verification.");
      }
    } finally {
      setResending(false);
    }
  };

  if (!state) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-purple-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-purple-100 overflow-hidden">

          {/* Top gradient banner */}
          <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 px-8 py-10 text-center text-white">
            <div className="text-6xl mb-4 animate-bounce">📧</div>
            <h1 className="text-2xl font-bold">Check your inbox!</h1>
            <p className="text-purple-200 text-sm mt-2">
              We sent a verification link to
            </p>
            <p className="font-semibold text-white mt-1 bg-white/10 rounded-lg px-4 py-1.5 inline-block text-sm">
              {state.email}
            </p>
          </div>

          <div className="px-8 py-8">

            {/* Waiting indicator */}
            <div className="flex items-center justify-center gap-3 mb-6 bg-purple-50 rounded-2xl py-4">
              <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse" />
              <p className="text-sm text-purple-600 font-medium">
                Waiting for verification{dots}
              </p>
            </div>

            {/* Steps */}
            <ol className="space-y-3 mb-6">
              {[
                "Open the email we just sent you",
                "Click the \"Verify email\" link",
                "Come back and sign in below",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            {/* Resent banner */}
            {resent && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
                <span>✅</span> New verification email sent!
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-purple-200 flex items-center justify-center"
              >
                I've verified — Go to Sign In
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-600 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
              >
                {resending ? "Resending..." : "Resend verification email"}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-5">
              Wrong email?{" "}
              <Link to="/register" className="text-purple-600 hover:underline font-medium">
                Go back and register again
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
