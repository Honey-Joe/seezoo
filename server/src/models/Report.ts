import mongoose, { Document, Schema } from "mongoose";

export type ReportStatus = "pending" | "resolved" | "ignored";

export interface IReport extends Document {
  post:       mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  reason:     string;
  status:     ReportStatus;
  createdAt:  Date;
}

const reportSchema = new Schema<IReport>(
  {
    post:       { type: Schema.Types.ObjectId, ref: "Post",  required: true },
    reportedBy: { type: Schema.Types.ObjectId, ref: "User",  required: true },
    reason:     { type: String, required: true, trim: true, maxlength: 500 },
    status:     { type: String, enum: ["pending", "resolved", "ignored"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>("Report", reportSchema);
