import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IPet {
  name: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "fish" | "reptile" | "other";
  breed?: string;
  age?: number;
  bio?: string;
  profileImage?: string;
}

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  password?: string;
  googleId?: string;
  authProvider: "local" | "google";
  isEmailVerified: boolean;
  isBlocked: boolean;
  role: "user" | "admin" | "superadmin";
  profileImage?: string;
  bio?: string;
  pets: IPet[];
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  followRequests: mongoose.Types.ObjectId[];
  blockedUsers: mongoose.Types.ObjectId[];
  isPrivate: boolean;
  createdAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const petSchema = new Schema<IPet>(
  {
    name: { type: String, required: true, trim: true },
    species: {
      type: String,
      enum: ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"],
      required: true,
    },
    breed: { type: String, trim: true },
    age: { type: Number, min: 0 },
    bio: { type: String, maxlength: 300 },
    profileImage: { type: String },
  },
  { _id: true }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // password is optional — not set for Google users
    password: { type: String, minlength: 6 },
    googleId: { type: String, sparse: true },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    isEmailVerified: { type: Boolean, default: false },
    isBlocked:       { type: Boolean, default: false },
    role:            { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    profileImage: { type: String },
    bio: { type: String, maxlength: 300 },
    pets: { type: [petSchema], default: [] },
    followers:      [{ type: Schema.Types.ObjectId, ref: "User" }],
    following:      [{ type: Schema.Types.ObjectId, ref: "User" }],
    followRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    blockedUsers:   [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Only hash password if it was set/modified
userSchema.pre("save", async function () {
  if (!this.password || !this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
