import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  googleAuth,
  googleComplete,
  changePassword,
  passwordResetSync,
} from "../controllers/authController";
import { verifyJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyJWT, getMe);

// Google OAuth routes
router.post("/google", googleAuth);
router.post("/google/complete", googleComplete);

// Password management
router.patch("/change-password", verifyJWT, changePassword);
router.post("/password-reset-sync", passwordResetSync); // no JWT — syncs after Firebase email reset

export default router;
