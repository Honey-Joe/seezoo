import { Router } from "express";
import {
  adminLogin, adminLogout, adminMe,
  getDashboardStats,
  getUsers, blockUser, unblockUser, deleteUser,
  getPosts, deletePost,
  getReports, createReport, resolveReport, ignoreReport,
  getCategories, createCategory, updateCategory, deleteCategory,
  sendNotification, getNotifications,
} from "../controllers/adminController";
import { verifyAdmin } from "../middleware/adminMiddleware";
import { verifyJWT }   from "../middleware/authMiddleware";

const router = Router();

/* ── Auth (no admin token needed) ── */
router.post("/login",  adminLogin);
router.post("/logout", adminLogout);
router.get("/me",      verifyAdmin, adminMe);

/* ── Dashboard ── */
router.get("/dashboard", verifyAdmin, getDashboardStats);

/* ── Users ── */
router.get("/users",                  verifyAdmin, getUsers);
router.patch("/users/:userId/block",  verifyAdmin, blockUser);
router.patch("/users/:userId/unblock",verifyAdmin, unblockUser);
router.delete("/users/:userId",       verifyAdmin, deleteUser);

/* ── Posts ── */
router.get("/posts",          verifyAdmin, getPosts);
router.delete("/posts/:postId", verifyAdmin, deletePost);

/* ── Reports ── */
router.get("/reports",                    verifyAdmin, getReports);
router.post("/reports",                   verifyJWT,   createReport);   // regular users can report
router.patch("/reports/:reportId/resolve",verifyAdmin, resolveReport);
router.patch("/reports/:reportId/ignore", verifyAdmin, ignoreReport);

/* ── Categories ── */
router.get("/categories",                  getCategories);              // public — used in client app
router.post("/categories",                 verifyAdmin, createCategory);
router.put("/categories/:categoryId",      verifyAdmin, updateCategory);
router.delete("/categories/:categoryId",   verifyAdmin, deleteCategory);

/* ── Notifications ── */
router.get("/notifications",  verifyAdmin, getNotifications);
router.post("/notifications", verifyAdmin, sendNotification);

export default router;
