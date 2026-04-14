import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import api from "./api";
import type { AuthResponse } from "../types";

export const registerUser = (data: {
  name: string;
  username: string;
  email: string;
  password: string;
}) => api.post<{ verificationSent: boolean; email: string }>("/auth/register", data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post<AuthResponse>("/auth/login", data);

export const logoutUser = () => api.post("/auth/logout");

export const getMe = () => api.get<AuthResponse>("/auth/me");

// ─── Firebase Email / Password helpers ───────────────────────────────────────

/**
 * Creates a Firebase Auth user, sends a verification email, then signs out.
 * Call this BEFORE creating the MongoDB user.
 * Returns the uid in case you need a rollback.
 */
export const createFirebaseUserAndSendVerification = async (
  email: string,
  password: string
) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  await signOut(auth); // can't use app until verified
  return credential.user.uid;
};

/**
 * Resends the verification email.
 * Must sign in briefly, send, then sign out again.
 */
export const resendVerificationEmail = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  if (credential.user.emailVerified) {
    await signOut(auth);
    return { alreadyVerified: true };
  }
  await sendEmailVerification(credential.user);
  await signOut(auth);
  return { alreadyVerified: false };
};

/**
 * Deletes a Firebase user (rollback if MongoDB create fails).
 * Requires signing in again since we signed out.
 */
export const deleteFirebaseUser = async (email: string, password: string) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await credential.user.delete();
  } catch {
    // Best-effort cleanup — ignore failures
  }
};

// ─── Google OAuth helpers ─────────────────────────────────────────────────────

/**
 * Opens the Firebase Google popup and returns the Firebase ID token + basic profile.
 * We use result.user.getIdToken() — this is the Firebase ID token verifiable
 * by Firebase Admin SDK on the server (NOT the Google OAuth credential.idToken).
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);

  // Firebase ID token — verifiable by Firebase Admin SDK on the server
  const idToken = await result.user.getIdToken();

  const { displayName, email, photoURL } = result.user;
  return {
    idToken,
    name: displayName ?? "",
    email: email ?? "",
    picture: photoURL ?? "",
  };
};

/**
 * Sends the Google ID token to your server.
 * action="login"    → server returns user OR { needsRegistration: true }
 * action="register" → server returns user OR { pendingGoogle: true, ... }
 */
export const sendGoogleToken = (idToken: string, action: "login" | "register") =>
  api.post<
    AuthResponse & {
      needsRegistration?: boolean;
      pendingGoogle?: boolean;
      email?: string;
      name?: string;
      picture?: string;
    }
  >("/auth/google", { idToken, action });

/**
 * Called from SetupUsername — re-gets a fresh idToken from Firebase and
 * submits it with the chosen username, name, and optional password.
 */
export const completeGoogleSignup = async (
  username: string,
  name: string,
  password?: string
) => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("No active Google session. Please sign in again.");
  const idToken = await currentUser.getIdToken(true);
  return api.post<AuthResponse & { isNewUser?: boolean }>("/auth/google/complete", {
    idToken,
    username,
    name,
    ...(password ? { password } : {}),
  });
};

// ─── Password Reset helpers ───────────────────────────────────────────────────

/**
 * Sends a Firebase password reset email.
 * The reset link will redirect to /reset-password after the user sets a new password
 * (requires Firebase Console → Authentication → Templates → action URL to be set).
 */
export const sendForgotPasswordEmail = async (email: string) => {
  await sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: false,
  });
};

/**
 * Completes a Firebase password reset using the oobCode from the email link.
 * Then signs in with the new password to get a Firebase token, and syncs to MongoDB.
 */
export const confirmFirebasePasswordReset = async (
  oobCode: string,
  email: string,
  newPassword: string
) => {
  // 1. Let Firebase update its own password record
  await confirmPasswordReset(auth, oobCode, newPassword);

  // 2. Sign in with new password to get a Firebase ID token
  const credential = await signInWithEmailAndPassword(auth, email, newPassword);
  const firebaseToken = await credential.user.getIdToken();
  await signOut(auth); // we'll use our own JWT from the server

  // 3. Sync new password to MongoDB + get our JWT
  return api.post<{ message: string; user: AuthResponse }>("/auth/password-reset-sync", {
    firebaseToken,
    newPassword,
  });
};

/** Change password for a currently logged-in user (hits protected endpoint). */
export const changePasswordOnServer = (currentPassword: string | undefined, newPassword: string) =>
  api.patch<{ message: string }>("/auth/change-password", { currentPassword, newPassword });

