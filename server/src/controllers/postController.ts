import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import Post from "../models/Post";
import mongoose from "mongoose";

/* ─── helpers ─────────────────────────────────── */

const uploadToCloudinary = (buffer: Buffer, mimetype: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "seezoo/posts", resource_type: "image", format: mimetype.split("/")[1] },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

/* ─── create post ──────────────────────────────── */

export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ message: "At least one image is required" });
      return;
    }

    const { caption, location, petTags, commentsEnabled } = req.body as {
      caption?: string;
      location?: string;
      petTags?: string;        // JSON stringified array of pet _id strings
      commentsEnabled?: string;
    };

    // Upload all images in parallel
    const imageUrls = await Promise.all(
      files.map((f) => uploadToCloudinary(f.buffer, f.mimetype))
    );

    // Parse pet tags safely
    let parsedPetTags: mongoose.Types.ObjectId[] = [];
    if (petTags) {
      try {
        const ids: string[] = JSON.parse(petTags);
        parsedPetTags = ids.map((id) => new mongoose.Types.ObjectId(id));
      } catch {
        // ignore malformed input
      }
    }

    const post = await Post.create({
      user: req.user!._id,
      images: imageUrls,
      caption: caption?.trim() || undefined,
      location: location?.trim() || undefined,
      petTags: parsedPetTags,
      commentsEnabled: commentsEnabled !== "false",
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

/* ─── get own posts ─────────────────────────────── */

export const getMyPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await Post.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error("getMyPosts error:", err);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};
