import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/authMiddleware";
import Message from "../models/Message";
import User from "../models/User";

/* ── conversation list: one entry per unique partner ── */
export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  const myId = new mongoose.Types.ObjectId(req.user!._id.toString());

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: myId }, { receiver: myId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ["$sender", myId] }, "$receiver", "$sender"] },
        lastMessage: { $first: "$$ROOT" },
        unread: {
          $sum: {
            $cond: [{ $and: [{ $eq: ["$receiver", myId] }, { $eq: ["$read", false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { "lastMessage.createdAt": -1 } },
  ]);

  const partnerIds = conversations.map((c) => c._id);
  const partners = await User.find({ _id: { $in: partnerIds } })
    .select("name username profileImage")
    .lean();

  const partnerMap = Object.fromEntries(partners.map((p) => [p._id.toString(), p]));

  res.json(conversations.map((c) => ({
    partner: partnerMap[c._id.toString()],
    lastMessage: c.lastMessage,
    unread: c.unread,
  })));
};

/* ── message history between two users ── */
export const getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  const myId      = new mongoose.Types.ObjectId(req.user!._id.toString());
  const partnerId = req.params.userId as string;

  if (!mongoose.Types.ObjectId.isValid(partnerId)) {
    res.status(400).json({ message: "Invalid user ID" }); return;
  }

  const partnerObjId = new mongoose.Types.ObjectId(partnerId);

  const messages = await Message.find({
    $or: [
      { sender: myId,       receiver: partnerObjId },
      { sender: partnerObjId, receiver: myId },
    ],
  })
    .sort({ createdAt: 1 })
    .lean();

  await Message.updateMany(
    { sender: partnerObjId, receiver: myId, read: false },
    { $set: { read: true } }
  );

  res.json(messages);
};
