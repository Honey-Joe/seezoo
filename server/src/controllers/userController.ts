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
