import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  sender:    mongoose.Types.ObjectId;
  receiver:  mongoose.Types.ObjectId;
  text:      string;
  read:      boolean;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text:     { type: String, required: true, maxlength: 2000 },
    read:     { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1 });

export default mongoose.model<IMessage>("Message", messageSchema);
