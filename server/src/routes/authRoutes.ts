import { Router } from "express";
import { register, login, logout, getMe, changePassword, forgotPassword, resetPassword } from "../controllers/authController";
import { verifyJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/register",         register);
router.post("/login",            login);
router.post("/logout",           logout);
router.get("/me",                verifyJWT, getMe);
router.patch("/change-password", verifyJWT, changePassword);
router.post("/forgot-password",  forgotPassword);
router.post("/reset-password",   resetPassword);

export default router;
