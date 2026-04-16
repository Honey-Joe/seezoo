import { Router } from "express";
import { getConversations, getHistory } from "../controllers/messageController";
import { verifyJWT } from "../middleware/authMiddleware";

const router = Router();
router.use(verifyJWT);

router.get("/",            getConversations);
router.get("/:userId",     getHistory);

export default router;
