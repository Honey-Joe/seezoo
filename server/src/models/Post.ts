import mongoose, { Document, Schema } from "mongoose";

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  images: string[];           // Cloudinary URLs
  caption?: string;
  location?: string;
  petTags: mongoose.Types.ObjectId[];
  commentsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    images: { type: [String], required: true, validate: [(v: string[]) => v.length > 0, "At least one image required"] },
    caption: { type: String, maxlength: 2200, trim: true },
    location: { type: String, maxlength: 100, trim: true },
    petTags: [{ type: Schema.Types.ObjectId }],
    commentsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);
