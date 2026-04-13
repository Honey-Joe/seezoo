import { Router } from "express";
import { createPost, getMyPosts } from "../controllers/postController";
import { verifyJWT } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();

router.use(verifyJWT);

router.post("/", upload.array("images", 10), createPost);
router.get("/my", getMyPosts);

export default router;
