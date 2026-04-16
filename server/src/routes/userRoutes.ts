import { Router } from "express";
import {
  updateProfile, addPet, updatePet, deletePet,
  followUser, unfollowUser, getUserProfile, searchUsers,
  acceptFollowRequest, declineFollowRequest,
  getFollowers, getFollowing, removeFollower,
} from "../controllers/userController";
import { verifyJWT } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();
router.use(verifyJWT);

router.put("/profile",                          upload.single("profileImage"), updateProfile);
router.post("/pets",                            upload.single("petImage"), addPet);
router.put("/pets/:petId",                      upload.single("petImage"), updatePet);
router.delete("/pets/:petId",                   deletePet);
router.get("/search",                           searchUsers);
router.get("/:username",                        getUserProfile);
router.get("/:userId/followers",                getFollowers);
router.get("/:userId/following",                getFollowing);
router.post("/:userId/follow",                  followUser);
router.post("/:userId/unfollow",                unfollowUser);
router.post("/:userId/remove-follower",         removeFollower);
router.post("/:userId/follow-requests/accept",  acceptFollowRequest);
router.post("/:userId/follow-requests/decline", declineFollowRequest);

export default router;
