import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";
import Post from "../models/Post";
import User from "../models/User";
import mongoose from "mongoose";

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

const populatePost = (query: ReturnType<typeof Post.findOne>) =>
  query
    .populate("user", "name username profileImage pets")
    .populate("comments.user", "name username profileImage");

/* ── create ── */
export const createPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) { res.status(400).json({ message: "At least one image is required" }); return; }

    const { caption, location, petTags, commentsEnabled } = req.body as {
      caption?: string; location?: string; petTags?: string; commentsEnabled?: string;
    };

    const imageUrls = await Promise.all(files.map((f) => uploadToCloudinary(f.buffer, f.mimetype)));

    let parsedPetTags: mongoose.Types.ObjectId[] = [];
    if (petTags) {
      try { parsedPetTags = (JSON.parse(petTags) as string[]).map((id) => new mongoose.Types.ObjectId(id)); } catch { /* ignore */ }
    }

    const post = await Post.create({
      user: req.user!._id, images: imageUrls,
      caption: caption?.trim() || undefined,
      location: location?.trim() || undefined,
      petTags: parsedPetTags,
      commentsEnabled: commentsEnabled !== "false",
    });

    res.status(201).json(post);
  } catch (err) { console.error("createPost error:", err); res.status(500).json({ message: "Failed to create post" }); }
};

/* ── my posts ── */
export const getMyPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const posts = await Post.find({ user: req.user!._id })
      .sort({ createdAt: -1 })
      .populate("user", "name username profileImage pets")
      .populate("comments.user", "name username profileImage")
      .lean();
    res.json(posts);
  } catch (err) { res.status(500).json({ message: "Failed to fetch posts" }); }
};

/* ── user posts (by userId param) ── */
export const getUserPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId as string)) { res.status(400).json({ message: "Invalid user ID" }); return; }

    const myId = req.user!._id.toString();
    const isOwner = userId === myId;

    if (!isOwner) {
      const target = await User.findById(userId).select("isPrivate followers").lean();
      if (!target) { res.status(404).json({ message: "User not found" }); return; }

      if (target.isPrivate) {
        const isFollower = target.followers.map((id) => id.toString()).includes(myId);
        if (!isFollower) { res.status(403).json({ message: "This account is private" }); return; }
      }
    }

    const posts = await Post.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("user", "name username profileImage pets")
      .lean();
    res.json(posts);
  } catch (err) { res.status(500).json({ message: "Failed to fetch posts" }); }
};

/* ── feed ── */
export const getFeed = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  as string) || 1);
    const limit = Math.min(20, parseInt(req.query.limit as string) || 10);
    const skip  = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate("user", "name username profileImage pets")
        .populate("comments.user", "name username profileImage")
        .lean(),
      Post.countDocuments(),
    ]);

    res.json({ posts, page, totalPages: Math.ceil(total / limit), hasMore: page * limit < total });
  } catch (err) { res.status(500).json({ message: "Failed to fetch feed" }); }
};

/* ── like toggle ── */
export const toggleLike = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) { res.status(404).json({ message: "Post not found" }); return; }

    const uid = req.user!._id as mongoose.Types.ObjectId;
    const liked = post.likes.some((id) => id.equals(uid));

    await Post.findByIdAndUpdate(post._id, liked ? { $pull: { likes: uid } } : { $addToSet: { likes: uid } });

    res.json({ liked: !liked, likeCount: post.likes.length + (liked ? -1 : 1) });
  } catch (err) { res.status(500).json({ message: "Failed to toggle like" }); }
};

/* ── add comment ── */
export const addComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body as { text: string };
    if (!text?.trim()) { res.status(400).json({ message: "Comment text is required" }); return; }

    const post = await Post.findById(req.params.postId);
    if (!post) { res.status(404).json({ message: "Post not found" }); return; }
    if (!post.commentsEnabled) { res.status(403).json({ message: "Comments are disabled" }); return; }

    post.comments.push({ user: req.user!._id as mongoose.Types.ObjectId, text: text.trim(), createdAt: new Date(), _id: new mongoose.Types.ObjectId() });
    await post.save();

    const updated = await populatePost(Post.findById(post._id));
    res.status(201).json(updated);
  } catch (err) { res.status(500).json({ message: "Failed to add comment" }); }
};

/* ── delete comment ── */
export const deleteComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { postId, commentId } = req.params;
    const post = await Post.findById(postId);
    if (!post) { res.status(404).json({ message: "Post not found" }); return; }

    const comment = post.comments.find((c) => c._id.toString() === commentId);
    if (!comment) { res.status(404).json({ message: "Comment not found" }); return; }

    const uid = req.user!._id.toString();
    if (comment.user.toString() !== uid && post.user.toString() !== uid) {
      res.status(403).json({ message: "Not authorized" }); return;
    }

    await Post.findByIdAndUpdate(postId, { $pull: { comments: { _id: commentId } } });
    res.json({ message: "Comment deleted" });
  } catch (err) { res.status(500).json({ message: "Failed to delete comment" }); }
};
