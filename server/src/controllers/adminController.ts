import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User";
import Post from "../models/Post";
import Report from "../models/Report";
import Category from "../models/Category";
import Notification from "../models/Notification";
import type { AuthRequest } from "../middleware/authMiddleware";

const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge:   8 * 60 * 60 * 1000, // 8 hours
};

const PAGE_LIMIT = 10;

/* ─────────────────────────────────────────────
   AUTH
───────────────────────────────────────────── */

export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    res.status(401).json({ message: "Invalid credentials or insufficient permissions" });
    return;
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, { expiresIn: "8h" });

  res.cookie("adminToken", token, ADMIN_COOKIE_OPTIONS).json({
    _id:         user._id,
    name:        user.name,
    email:       user.email,
    role:        user.role,
    permissions: [],
  });
};

export const adminLogout = (_req: Request, res: Response): void => {
  res.clearCookie("adminToken", { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 }).json({ message: "Logged out" });
};

export const adminMe = (req: AuthRequest, res: Response): void => {
  const u = req.user!;
  res.json({ _id: u._id, name: u.name, email: u.email, role: u.role, permissions: [] });
};

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Count non-admin users — includes docs where role is "user" OR role field doesn't exist yet
  const userFilter = { role: { $nin: ["admin", "superadmin"] } };

  const [totalUsers, totalPosts, totalReports, newUsersThisWeek, newPostsThisWeek, usersWithPets] =
    await Promise.all([
      User.countDocuments(userFilter),
      Post.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ ...userFilter, createdAt: { $gte: oneWeekAgo } }),
      Post.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.aggregate([{ $project: { petCount: { $size: "$pets" } } }, { $group: { _id: null, total: { $sum: "$petCount" } } }]),
    ]);

  const totalPets = usersWithPets[0]?.total ?? 0;

  res.json({ totalUsers, totalPets, totalPosts, totalReports, newUsersThisWeek, newPostsThisWeek });
};

/* ─────────────────────────────────────────────
   USERS
───────────────────────────────────────────── */

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const page   = Math.max(1, parseInt(req.query.page   as string) || 1);
  const search = (req.query.search as string)?.trim();
  const status = req.query.status as string;

  const filter: Record<string, unknown> = { role: { $nin: ["admin", "superadmin"] } };

  if (search) {
    filter.$or = [
      { name:     { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
      { username: { $regex: search, $options: "i" } },
    ];
  }

  if (status === "blocked") filter.isBlocked = true;
  if (status === "active")  filter.isBlocked = false;

  const [data, total] = await Promise.all([
    User.find(filter)
      .select("-password -googleId")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({ data, total, page, totalPages: Math.ceil(total / PAGE_LIMIT) });
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await User.findByIdAndUpdate(userId, { isBlocked: true });
  res.json({ message: "User blocked" });
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await User.findByIdAndUpdate(userId, { isBlocked: false });
  res.json({ message: "User unblocked" });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await Promise.all([
    User.findByIdAndDelete(userId),
    Post.deleteMany({ user: userId }),
    Report.deleteMany({ reportedBy: userId }),
  ]);
  res.json({ message: "User deleted" });
};

/* ─────────────────────────────────────────────
   POSTS
───────────────────────────────────────────── */

export const getPosts = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const date = req.query.date as string;

  const filter: Record<string, unknown> = {};
  if (date) {
    const start = new Date(date);
    const end   = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }

  const [data, total] = await Promise.all([
    Post.find(filter)
      .populate("user", "name username profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean(),
    Post.countDocuments(filter),
  ]);

  res.json({ data, total, page, totalPages: Math.ceil(total / PAGE_LIMIT) });
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(postId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await Promise.all([
    Post.findByIdAndDelete(postId),
    Report.updateMany({ post: postId }, { status: "resolved" }),
  ]);
  res.json({ message: "Post deleted" });
};

/* ─────────────────────────────────────────────
   REPORTS
───────────────────────────────────────────── */

export const getReports = async (req: Request, res: Response): Promise<void> => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const status = req.query.status as string;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  const [data, total] = await Promise.all([
    Report.find(filter)
      .populate("post",       "images caption user")
      .populate({ path: "post", populate: { path: "user", select: "name username" } })
      .populate("reportedBy", "name username profileImage")
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_LIMIT)
      .limit(PAGE_LIMIT)
      .lean(),
    Report.countDocuments(filter),
  ]);

  res.json({ data, total, page, totalPages: Math.ceil(total / PAGE_LIMIT) });
};

export const createReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { postId, reason } = req.body as { postId: string; reason: string };
  if (!postId || !reason?.trim()) { res.status(400).json({ message: "postId and reason are required" }); return; }
  const report = await Report.create({ post: postId, reportedBy: req.user!._id, reason: reason.trim() });
  res.status(201).json(report);
};

export const resolveReport = async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(reportId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await Report.findByIdAndUpdate(reportId, { status: "resolved" });
  res.json({ message: "Report resolved" });
};

export const ignoreReport = async (req: Request, res: Response): Promise<void> => {
  const { reportId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(reportId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await Report.findByIdAndUpdate(reportId, { status: "ignored" });
  res.json({ message: "Report ignored" });
};

/* ─────────────────────────────────────────────
   CATEGORIES
───────────────────────────────────────────── */

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await Category.find().sort({ createdAt: -1 }).lean();
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description, icon } = req.body as { name: string; description?: string; icon?: string };
  if (!name?.trim()) { res.status(400).json({ message: "Name is required" }); return; }
  const existing = await Category.findOne({ name: name.trim() });
  if (existing) { res.status(409).json({ message: "Category already exists" }); return; }
  const category = await Category.create({ name: name.trim(), description, icon });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(categoryId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  const { name, description, icon } = req.body as { name: string; description?: string; icon?: string };
  const category = await Category.findByIdAndUpdate(categoryId, { name, description, icon }, { new: true, runValidators: true });
  if (!category) { res.status(404).json({ message: "Category not found" }); return; }
  res.json(category);
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { categoryId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(categoryId as string)) { res.status(400).json({ message: "Invalid ID" }); return; }
  await Category.findByIdAndDelete(categoryId);
  res.json({ message: "Category deleted" });
};

/* ─────────────────────────────────────────────
   NOTIFICATIONS
───────────────────────────────────────────── */

export const sendNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, message, type } = req.body as { title: string; message: string; type: string };
  if (!title?.trim() || !message?.trim()) {
    res.status(400).json({ message: "Title and message are required" });
    return;
  }
  const notification = await Notification.create({
    title:   title.trim(),
    message: message.trim(),
    type:    type || "announcement",
    sentBy:  req.user!._id,
  });
  res.status(201).json(notification);
};

export const getNotifications = async (_req: Request, res: Response): Promise<void> => {
  const notifications = await Notification.find()
    .populate("sentBy", "name email")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json(notifications);
};
