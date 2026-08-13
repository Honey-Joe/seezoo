import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

const SEVEN_DAYS  = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure:   isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  maxAge:   SEVEN_DAYS,
};

const JWT_SECRET = process.env.JWT_SECRET!;

const signToken = (id: string) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });

const userPublicFields = (user: InstanceType<typeof User>) => ({
  _id:             user._id,
  name:            user.name,
  username:        user.username,
  email:           user.email,
  profileImage:    user.profileImage,
  bio:             user.bio,
  pets:            user.pets,
  followers:       user.followers,
  following:       user.following,
  isPrivate:       user.isPrivate,
  authProvider:    user.authProvider,
  isEmailVerified: user.isEmailVerified,
  blockedUsers:    user.blockedUsers,
});

/* ── register ── */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password } = req.body as { name: string; password: string };
    const username = (req.body.username as string)?.toLowerCase().trim();
    const email    = (req.body.email    as string)?.toLowerCase().trim();

    if (!name?.trim() || !username || !email || !password) {
      res.status(400).json({ message: "All fields are required" }); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ message: "Invalid email format" }); return;
    }
    if (password.length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" }); return;
    }
    if (!/^[a-z0-9_.]{3,30}$/.test(username)) {
      res.status(400).json({ message: "Username must be 3-30 characters: letters, numbers, _ or ." }); return;
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      res.status(409).json({ message: `${field} already in use` }); return;
    }

    const user = await User.create({
      name: name.trim(), username, email, password,
      authProvider: "local", isEmailVerified: true,
    });

    const token = signToken(user._id.toString());
    res.status(201).cookie("token", token, cookieOptions).json(userPublicFields(user));
  } catch (err: unknown) {
    const e = err as { code?: number; keyPattern?: Record<string, unknown> };
    if (e.code === 11000) {
      res.status(409).json({ message: e.keyPattern?.email ? "Email already in use" : "Username already in use" });
      return;
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── login ── */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    if (!email || !password) { res.status(400).json({ message: "Email and password are required" }); return; }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: "Invalid credentials" }); return;
    }
    if (user.isBlocked) {
      res.status(403).json({ message: "Your account has been suspended." }); return;
    }

    const token = signToken(user._id.toString());
    res.cookie("token", token, cookieOptions).json(userPublicFields(user));
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── logout ── */
export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token", { ...cookieOptions, maxAge: 0 }).json({ message: "Logged out" });
};

/* ── me ── */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!._id)
    .select("-password")
    .populate("followRequests", "name username profileImage")
    .lean();
  res.json(user);
};

/* ── change password ── */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword: string };
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ message: "New password must be at least 6 characters" }); return;
    }
    const user = await User.findById(req.user?._id);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }

    if (user.password) {
      if (!currentPassword) { res.status(400).json({ message: "Current password is required" }); return; }
      if (!(await user.comparePassword(currentPassword))) {
        res.status(401).json({ message: "Current password is incorrect" }); return;
      }
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── forgot password — sends reset token via email (simple implementation) ── */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  // In production wire up nodemailer/sendgrid here.
  // For now just confirm the email exists so the client can show a success message.
  const { email } = req.body as { email: string };
  const user = await User.findOne({ email: email?.toLowerCase().trim() });
  // Always return 200 to avoid email enumeration
  res.json({ message: "If an account with that email exists, a reset link has been sent." });
  if (!user) return;
  // TODO: generate a signed reset token, store it, send email
};

/* ── reset password with token ── */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ message: "Token and new password (min 6 chars) are required" }); return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; purpose: string };
    if (decoded.purpose !== "password-reset") { res.status(400).json({ message: "Invalid token" }); return; }
    const user = await User.findById(decoded.id);
    if (!user) { res.status(404).json({ message: "User not found" }); return; }
    user.password = newPassword;
    await user.save();
    const authToken = signToken(user._id.toString());
    res.cookie("token", authToken, cookieOptions).json({ message: "Password reset successful" });
  } catch {
    res.status(400).json({ message: "Invalid or expired reset token" });
  }
};
