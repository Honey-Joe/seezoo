import { Response } from "express";
import mongoose from "mongoose";
import { Readable } from "stream";
import User, { IPet } from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import cloudinary from "../config/cloudinary";

const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, username, bio, profileImage, isPrivate } = req.body as {
    name?: string;
    username?: string;
    bio?: string;
    profileImage?: string;
    isPrivate?: boolean;
  };

  const userId = req.user!._id;

  if (username !== undefined) {
    const normalized = username.toLowerCase().trim();
    if (!/^[a-z0-9_.]{3,30}$/.test(normalized)) {
      res.status(400).json({ message: "Username must be 3-30 characters: letters, numbers, _ or ." });
      return;
    }
    const taken = await User.findOne({ username: normalized, _id: { $ne: userId } });
    if (taken) {
      res.status(409).json({ message: "Username already in use" });
      return;
    }
  }

  const updates: Record<string, unknown> = {};
  if (name?.trim())            updates.name = name.trim();
  if (username)                updates.username = username.toLowerCase().trim();
  if (bio !== undefined)       updates.bio = bio.trim();
  if (profileImage)            updates.profileImage = profileImage;
  if (isPrivate !== undefined) updates.isPrivate = isPrivate;

  // Handle uploaded file (multipart)
  if (req.file) {
    updates.profileImage = await uploadToCloudinary(req.file.buffer, "seezoo/profiles");
  }

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
  res.json(user);
};

export const addPet = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, species, breed, age, bio, profileImage } = req.body as IPet;

  if (!name?.trim() || !species) {
    res.status(400).json({ message: "Pet name and species are required" });
    return;
  }

  let imageUrl = profileImage;
  if (req.file) {
    imageUrl = await uploadToCloudinary(req.file.buffer, "seezoo/pets");
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $push: { pets: { name: name.trim(), species, breed, age, bio, profileImage: imageUrl } } },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(201).json(user);
};

export const updatePet = async (req: AuthRequest, res: Response): Promise<void> => {
  const petId = req.params.petId as string;

  if (!mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400).json({ message: "Invalid pet ID" });
    return;
  }

  const { name, species, breed, age, bio, profileImage } = req.body as Partial<IPet>;

  const updates: Record<string, unknown> = {};
  if (name?.trim())          updates["pets.$.name"] = name.trim();
  if (species)               updates["pets.$.species"] = species;
  if (breed !== undefined)   updates["pets.$.breed"] = breed;
  if (age !== undefined)     updates["pets.$.age"] = age;
  if (bio !== undefined)     updates["pets.$.bio"] = bio;
  if (profileImage)          updates["pets.$.profileImage"] = profileImage;
  if (req.file) {
    updates["pets.$.profileImage"] = await uploadToCloudinary(req.file.buffer, "seezoo/pets");
  }

  const user = await User.findOneAndUpdate(
    { _id: req.user!._id, "pets._id": petId },
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    res.status(404).json({ message: "Pet not found" });
    return;
  }

  res.json(user);
};

export const deletePet = async (req: AuthRequest, res: Response): Promise<void> => {
  const petId = req.params.petId as string;

  if (!mongoose.Types.ObjectId.isValid(petId)) {
    res.status(400).json({ message: "Invalid pet ID" });
    return;
  }

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $pull: { pets: { _id: petId } } },
    { new: true }
  ).select("-password");

  res.json(user);
};

/* ── get followers list ── */
export const getFollowers = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  if (!mongoose.Types.ObjectId.isValid(userId)) { res.status(400).json({ message: "Invalid user ID" }); return; }
  const user = await User.findById(userId).populate("followers", "name username profileImage").lean();
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  res.json(user.followers);
};

/* ── get following list ── */
export const getFollowing = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.params.userId as string;
  if (!mongoose.Types.ObjectId.isValid(userId)) { res.status(400).json({ message: "Invalid user ID" }); return; }
  const user = await User.findById(userId).populate("following", "name username profileImage").lean();
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  res.json(user.following);
};

/* ── remove a follower (owner kicks someone out) ── */
export const removeFollower = async (req: AuthRequest, res: Response): Promise<void> => {
  const followerId = req.params.userId as string;
  const myId       = req.user!._id.toString();
  if (!mongoose.Types.ObjectId.isValid(followerId)) { res.status(400).json({ message: "Invalid user ID" }); return; }
  await Promise.all([
    User.findByIdAndUpdate(myId,       { $pull: { followers: followerId } }),
    User.findByIdAndUpdate(followerId, { $pull: { following: myId } }),
  ]);
  res.json({ message: "Follower removed" });
};

/* ── follow ── */
export const followUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const targetId = req.params.userId as string;
  const myId     = req.user!._id.toString();

  if (targetId === myId) { res.status(400).json({ message: "Cannot follow yourself" }); return; }
  if (!mongoose.Types.ObjectId.isValid(targetId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  const target = await User.findById(targetId);
  if (!target) { res.status(404).json({ message: "User not found" }); return; }

  if (target.isPrivate) {
    // Already following — nothing to do
    if (target.followers.map((id) => id.toString()).includes(myId)) {
      res.json({ message: "Already following" }); return;
    }
    await User.findByIdAndUpdate(targetId, { $addToSet: { followRequests: myId } });
    res.json({ message: "Follow request sent" });
  } else {
    await Promise.all([
      User.findByIdAndUpdate(myId,     { $addToSet: { following: targetId } }),
      User.findByIdAndUpdate(targetId, { $addToSet: { followers: myId } }),
    ]);
    res.json({ message: "Followed" });
  }
};

/* ── unfollow / cancel request ── */
export const unfollowUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const targetId = req.params.userId as string;
  const myId     = req.user!._id.toString();

  if (!mongoose.Types.ObjectId.isValid(targetId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  await Promise.all([
    User.findByIdAndUpdate(myId,      { $pull: { following: targetId } }),
    User.findByIdAndUpdate(targetId,  { $pull: { followers: myId, followRequests: myId } }),
  ]);
  res.json({ message: "Unfollowed" });
};

/* ── accept follow request ── */
export const acceptFollowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const requesterId = req.params.userId as string;
  const myId        = req.user!._id.toString();

  if (!mongoose.Types.ObjectId.isValid(requesterId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  const me = await User.findById(myId);
  if (!me) { res.status(404).json({ message: "User not found" }); return; }

  const hasPending = me.followRequests.map((id) => id.toString()).includes(requesterId);
  if (!hasPending) { res.status(400).json({ message: "No pending request from this user" }); return; }

  await Promise.all([
    User.findByIdAndUpdate(myId,        { $pull: { followRequests: requesterId }, $addToSet: { followers: requesterId } }),
    User.findByIdAndUpdate(requesterId, { $addToSet: { following: myId } }),
  ]);
  res.json({ message: "Follow request accepted" });
};

/* ── decline follow request ── */
export const declineFollowRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const requesterId = req.params.userId as string;
  const myId        = req.user!._id.toString();

  if (!mongoose.Types.ObjectId.isValid(requesterId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  await User.findByIdAndUpdate(myId, { $pull: { followRequests: requesterId } });
  res.json({ message: "Follow request declined" });
};

/* ── public profile by username ── */
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findOne({ username: req.params.username })
    .select("-password -googleId -email")
    .populate("followRequests", "name username profileImage")
    .lean();
  if (!user) { res.status(404).json({ message: "User not found" }); return; }

  const myId = req.user!._id.toString();
  const isOwner = user._id.toString() === myId;

  // Only expose followRequests to the profile owner
  const result = isOwner ? user : { ...user, followRequests: undefined };
  res.json(result);
};

/* ── search users ── */
export const searchUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = (req.query.q as string)?.trim();
  if (!q) { res.json([]); return; }

  const users = await User.find({
    $or: [
      { username: { $regex: q, $options: "i" } },
      { name:     { $regex: q, $options: "i" } },
    ],
    _id: { $ne: req.user!._id },
  })
    .select("name username profileImage bio followers")
    .limit(20)
    .lean();

  res.json(users);
};

/* ── get user by MongoDB _id (used by messages to resolve partner info) ── */
export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(userId as string)) {
    res.status(400).json({ message: "Invalid ID" }); return;
  }
  const user = await User.findById(userId)
    .select("name username profileImage")
    .lean();
  if (!user) { res.status(404).json({ message: "User not found" }); return; }
  res.json(user);
};

/* ── block a user ── */
export const blockUserByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const targetId = req.params.userId as string;
  const myId     = req.user!._id.toString();

  if (targetId === myId) { res.status(400).json({ message: "Cannot block yourself" }); return; }
  if (!mongoose.Types.ObjectId.isValid(targetId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  await Promise.all([
    User.findByIdAndUpdate(myId, { $addToSet: { blockedUsers: targetId }, $pull: { followers: targetId, following: targetId } }),
    User.findByIdAndUpdate(targetId, { $pull: { followers: myId, following: myId } }),
  ]);

  res.json({ message: "User blocked" });
};

/* ── unblock a user ── */
export const unblockUserByUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const targetId = req.params.userId as string;
  const myId     = req.user!._id.toString();

  if (!mongoose.Types.ObjectId.isValid(targetId)) { res.status(400).json({ message: "Invalid user ID" }); return; }

  await User.findByIdAndUpdate(myId, { $pull: { blockedUsers: targetId } });

  res.json({ message: "User unblocked" });
};
