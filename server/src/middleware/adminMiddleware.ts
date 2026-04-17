import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";
import type { AuthRequest } from "./authMiddleware";

interface JwtPayload { id: string; }

export const verifyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.adminToken as string | undefined;

  if (!token) {
    res.status(401).json({ message: "Admin not authenticated" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    const user    = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({ message: "Admin not found" });
      return;
    }

    if (user.role !== "admin" && user.role !== "superadmin") {
      res.status(403).json({ message: "Access denied: admin only" });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin token" });
  }
};

export const verifySuperAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await verifyAdmin(req, res, () => {
    if (req.user?.role !== "superadmin") {
      res.status(403).json({ message: "Access denied: superadmin only" });
      return;
    }
    next();
  });
};
