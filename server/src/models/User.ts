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
  password: string;
  profileImage?: string;
  bio?: string;
  pets: IPet[];
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
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
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    profileImage: { type: String },
    bio: { type: String, maxlength: 300 },
    pets: { type: [petSchema], default: [] },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isPrivate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model<IUser>("User", userSchema);
