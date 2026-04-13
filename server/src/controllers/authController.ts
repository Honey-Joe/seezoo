import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";

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
});

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
      res.status(400).json({ message: "Username must be 3-30 characters: letters, numbers, _ or ." });
      return;
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? "Email" : "Username";
      res.status(409).json({ message: `${field} already in use` });
      return;
    }

    const user = await User.create({ name: name.trim(), username, email, password });
    const token = signToken(user._id.toString());

    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json(userPublicFields(user));
  } catch (err: unknown) {
    // Handle MongoDB duplicate key race condition
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

    const token = signToken(user._id.toString());

    res
      .cookie("token", token, cookieOptions)
      .json(userPublicFields(user));
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
