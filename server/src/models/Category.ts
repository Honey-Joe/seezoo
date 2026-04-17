import mongoose, { Document, Schema } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  createdAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name:        { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 300 },
    icon:        { type: String, trim: true, maxlength: 10 },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>("Category", categorySchema);
