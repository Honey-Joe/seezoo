import { Router } from "express";
import { updateProfile, addPet, updatePet, deletePet } from "../controllers/userController";
import { verifyJWT } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();

router.use(verifyJWT);

router.put("/profile", upload.single("profileImage"), updateProfile);
router.post("/pets", upload.single("petImage"), addPet);
router.put("/pets/:petId", upload.single("petImage"), updatePet);
router.delete("/pets/:petId", deletePet);

export default router;
