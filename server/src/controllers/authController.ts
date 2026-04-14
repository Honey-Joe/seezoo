import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import admin from "../config/firebaseAdmin";

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge: SEVEN_DAYS,
};

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in environment variables");

const signToken = (id: string): string =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });

const userPublicFields = (user: InstanceType<typeof User>) => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage,
  bio: user.bio,
  pets: user.pets,
  followers: user.followers,
  following: user.following,
  isPrivate: user.isPrivate,
  authProvider: user.authProvider,
  isEmailVerified: user.isEmailVerified,
});

// ─── Email / Password Auth ────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Creates the user in MongoDB with isEmailVerified: false.
 * Does NOT set a JWT cookie — client sends a Firebase verification email first
 * and the user must verify before they can log in.
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body as { name: string; password: string };
    const username = (req.body.username as string)?.toLowerCase().trim();
    const email = (req.body.email as string)?.toLowerCase().trim();

    if (!name?.trim() || !username || !email || !password) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      res.status(400).json({
        message: "Username must be 3-30 characters: letters, numbers, _ or .",
      });
      return;
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      res.status(409).json({ message: `${field} already in use` });
      return;
    }

    // Create in MongoDB — NOT verified yet, NO JWT cookie
    await User.create({
      name: name.trim(),
      username,
      email,
      password,
      authProvider: "local",
      isEmailVerified: false,
    });

    // Tell the client to show the email verification page
    res.status(201).json({ verificationSent: true, email });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoErr.code === 11000) {
      const field = mongoErr.keyPattern?.email ? "Email" : "Username";
      res.status(409).json({ message: `${field} already in use` });
      return;
    }
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/auth/login
 * Verifies password with bcrypt.
 * If not email-verified in MongoDB, checks Firebase Admin for live status — 
 * if Firebase marks verified, updates MongoDB and logs them in.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Prevent password login for Google-only accounts
    if (user.authProvider === "google" && !user.password) {
      res.status(400).json({
        message: "This account uses Google Sign-In. Please click 'Continue with Google'.",
      });
      return;
    }

    // Email verification gate
    if (!user.isEmailVerified) {
      // Check Firebase Admin for live verification status
      // (the user may have verified their email since the last login attempt)
      let firebaseVerified = false;
      try {
        const firebaseUser = await admin.auth().getUserByEmail(email);
        firebaseVerified = firebaseUser.emailVerified;
      } catch {
        // Firebase user may not exist (e.g. old account) — treat as not verified
      }

      if (firebaseVerified) {
        // Firebase says verified → unlock the account in MongoDB
        user.isEmailVerified = true;
        await user.save();
      } else {
        res.status(403).json({
          message: "Please verify your email before logging in. Check your inbox.",
          emailNotVerified: true,
          email,
        });
        return;
      }
    }

    const token = signToken(user._id.toString());
    res.cookie("token", token, cookieOptions).json(userPublicFields(user));
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res
    .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    .json({ message: "Logged out" });
};

export const getMe = (req: AuthRequest, res: Response): void => {
  res.json(req.user);
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken, action } = req.body as {
      idToken: string;
      action: "login" | "register";
    };

    if (!idToken) {
      res.status(400).json({ message: "Firebase ID token is required" });
      return;
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({ message: "Invalid or expired Google token. Please try again." });
      return;
    }

    if (!decoded.email_verified) {
      res.status(403).json({ message: "Google account email is not verified." });
      return;
    }

    const email = decoded.email?.toLowerCase().trim();
    const name = decoded.name || "User";
    const picture = decoded.picture || "";
    const googleId = decoded.uid;

    if (!email) {
      res.status(400).json({ message: "Google account has no email address." });
      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.googleId) {
        existingUser.googleId = googleId;
        existingUser.isEmailVerified = true;
        if (!existingUser.profileImage && picture) existingUser.profileImage = picture;
        await existingUser.save();
      }
      const token = signToken(existingUser._id.toString());
      res.cookie("token", token, cookieOptions).json(userPublicFields(existingUser));
      return;
    }

    if (action === "login") {
      res.status(404).json({
        needsRegistration: true,
        email,
        name,
        message: "No account found with this Google account. Please sign up first.",
      });
      return;
    }

    // New Google user — return pending state, let client pick username
    res.json({ pendingGoogle: true, email, name, picture });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * POST /api/auth/google/complete
 * Finalises account creation for new Google users.
 * Accepts: idToken, username, name (editable), optional password.
 */
export const googleComplete = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      idToken,
      username: rawUsername,
      name: customName,
      password,
    } = req.body as {
      idToken: string;
      username: string;
      name?: string;
      password?: string;
    };

    if (!idToken || !rawUsername) {
      res.status(400).json({ message: "Token and username are required" });
      return;
    }

    const username = rawUsername.toLowerCase().trim();

    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      res.status(400).json({
        message: "Username must be 3-30 characters: letters, numbers, _ or .",
      });
      return;
    }

    if (password && password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }

    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      res.status(401).json({
        message: "Session expired. Please sign in with Google again.",
      });
      return;
    }

    const email = decoded.email?.toLowerCase().trim();
    const googleName = decoded.name || "User";
    const picture = decoded.picture || "";
    const googleId = decoded.uid;

    if (!email) {
      res.status(400).json({ message: "Could not read email from Google account." });
      return;
    }

    // Race condition: already created
    const alreadyExists = await User.findOne({ email });
    if (alreadyExists) {
      const token = signToken(alreadyExists._id.toString());
      res.cookie("token", token, cookieOptions).json(userPublicFields(alreadyExists));
      return;
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      res.status(409).json({ message: "This username is already taken. Please choose another." });
      return;
    }

    const finalName = customName?.trim() || googleName;

    const user = await User.create({
      name: finalName,
      username,
      email,
      googleId,
      authProvider: "google",
      isEmailVerified: true,
      profileImage: picture || undefined,
      ...(password ? { password } : {}),
    });

    const token = signToken(user._id.toString());
    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json({ ...userPublicFields(user), isNewUser: true });
  } catch (err: unknown) {
    const mongoErr = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (mongoErr.code === 11000) {
      const field = mongoErr.keyPattern?.email ? "Email" : "Username";
      res.status(409).json({ message: `${field} already in use` });
      return;
    }
    console.error("Google complete error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
