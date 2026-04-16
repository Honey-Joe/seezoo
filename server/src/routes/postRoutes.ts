import { Router } from "express";
import { createPost, getMyPosts, getFeed, getUserPosts, toggleLike, addComment, deleteComment } from "../controllers/postController";
import { verifyJWT } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();
router.use(verifyJWT);

router.get("/feed",                       getFeed);
router.get("/my",                         getMyPosts);
router.get("/user/:userId",               getUserPosts);
router.post("/",                          upload.array("images", 10), createPost);
router.post("/:postId/like",              toggleLike);
router.post("/:postId/comments",          addComment);
router.delete("/:postId/comments/:commentId", deleteComment);

export default router;
