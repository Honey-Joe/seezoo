import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/authController";
import { verifyJWT } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyJWT, getMe);

export default router;
