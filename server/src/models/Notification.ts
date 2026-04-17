import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  title:     string;
  message:   string;
  type:      "announcement" | "update" | "maintenance" | "promotion";
  sentBy:    mongoose.Types.ObjectId;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title:   { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    type:    { type: String, enum: ["announcement", "update", "maintenance", "promotion"], default: "announcement" },
    sentBy:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>("Notification", notificationSchema);
