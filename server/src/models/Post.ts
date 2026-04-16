import mongoose, { Document, Schema } from "mongoose";

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  images: string[];
  caption?: string;
  location?: string;
  petTags: mongoose.Types.ObjectId[];
  commentsEnabled: boolean;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true, _id: true }
);

const postSchema = new Schema<IPost>(
  {
    user:            { type: Schema.Types.ObjectId, ref: "User", required: true },
    images:          { type: [String], required: true, validate: [(v: string[]) => v.length > 0, "At least one image required"] },
    caption:         { type: String, maxlength: 2200, trim: true },
    location:        { type: String, maxlength: 100, trim: true },
    petTags:         [{ type: Schema.Types.ObjectId }],
    commentsEnabled: { type: Boolean, default: true },
    likes:           [{ type: Schema.Types.ObjectId, ref: "User" }],
    comments:        { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IPost>("Post", postSchema);
