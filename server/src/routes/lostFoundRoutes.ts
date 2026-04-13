import { Router } from "express";
import {
  createListing,
  getListings,
  getMyListings,
  getListing,
  resolveListing,
} from "../controllers/lostFoundController";
import { verifyJWT } from "../middleware/authMiddleware";
import upload from "../middleware/upload";

const router = Router();

/* public */
router.get("/",        getListings);
router.get("/:id",     getListing);

/* protected */
router.post(   "/",          verifyJWT, upload.array("photos", 6), createListing);
router.get(    "/my/list",   verifyJWT, getMyListings);
router.patch(  "/:id/resolve", verifyJWT, resolveListing);

export default router;
