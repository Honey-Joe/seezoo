import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import LostFound from "../models/LostFound";

/* ── helper ─────────────────────────────── */
const uploadPhoto = (buffer: Buffer, mimetype: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "seezoo/lost-found", resource_type: "image", format: mimetype.split("/")[1] },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/* ── create listing ─────────────────────── */
export const createListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ message: "At least one photo is required" });
      return;
    }

    const {
      type, petName, species, breed, age, gender, size,
      color, description, microchipId,
      lastSeenLocation, lastSeenDate,
      contactName, contactPhone, contactEmail,
      rewardOffered, rewardAmount,
    } = req.body as Record<string, string>;

    if (!type || !species || !color || !description || !lastSeenLocation || !lastSeenDate || !contactName || !contactPhone) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    const photos = await Promise.all(files.map((f) => uploadPhoto(f.buffer, f.mimetype)));

    const listing = await LostFound.create({
      user: req.user!._id,
      type,
      petName: petName?.trim() || undefined,
      species,
      breed: breed?.trim() || undefined,
      age: age ? Number(age) : undefined,
      gender: gender || "unknown",
      size: size || "medium",
      color: color.trim(),
      description: description.trim(),
      microchipId: microchipId?.trim() || undefined,
      photos,
      lastSeenLocation: lastSeenLocation.trim(),
      lastSeenDate: new Date(lastSeenDate),
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail?.trim() || undefined,
      rewardOffered: rewardOffered === "true",
      rewardAmount: rewardAmount ? Number(rewardAmount) : undefined,
    });

    res.status(201).json(listing);
  } catch (err) {
    console.error("createListing error:", err);
    res.status(500).json({ message: "Failed to create listing" });
  }
};

/* ── public feed (active listings only) ─── */
export const getListings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, species, resolved } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (type)     filter.type     = type;
    if (species)  filter.species  = species;
    filter.isResolved = resolved === "true" ? true : false;

    const listings = await LostFound.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name username profileImage")
      .lean();

    res.json(listings);
  } catch (err) {
    console.error("getListings error:", err);
    res.status(500).json({ message: "Failed to fetch listings" });
  }
};

/* ── my listings ────────────────────────── */
export const getMyListings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listings = await LostFound.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(listings);
  } catch (err) {
    console.error("getMyListings error:", err);
    res.status(500).json({ message: "Failed to fetch your listings" });
  }
};

/* ── single listing ─────────────────────── */
export const getListing = async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await LostFound.findById(req.params.id)
      .populate("user", "name username profileImage")
      .lean();
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }
    res.json(listing);
  } catch (err) {
    console.error("getListing error:", err);
    res.status(500).json({ message: "Failed to fetch listing" });
  }
};

/* ── mark resolved ──────────────────────── */
export const resolveListing = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const listing = await LostFound.findOne({ _id: req.params.id, user: req.user!._id });
    if (!listing) { res.status(404).json({ message: "Listing not found" }); return; }
    listing.isResolved = true;
    await listing.save();
    res.json({ message: "Marked as resolved 🎉", listing });
  } catch (err) {
    console.error("resolveListing error:", err);
    res.status(500).json({ message: "Failed to resolve listing" });
  }
};
