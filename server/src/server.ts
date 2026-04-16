import "./env";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import connectDB from "./config/db";
import authRoutes      from "./routes/authRoutes";
import userRoutes      from "./routes/userRoutes";
import postRoutes      from "./routes/postRoutes";
import lostFoundRoutes from "./routes/lostFoundRoutes";
import messageRoutes   from "./routes/messageRoutes";
import Message         from "./models/Message";
import User            from "./models/User";

connectDB();

const app    = express();
const server = http.createServer();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",       authRoutes);
app.use("/api/user",       userRoutes);
app.use("/api/posts",      postRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/messages",   messageRoutes);

/* ── Socket.IO ── */
const io = new SocketServer(server, {
  cors: { origin: CLIENT_URL, credentials: true },
  transports: ["websocket", "polling"],
});

// Forward HTTP requests to Express
server.on("request", app);

// Map userId → socketId for online presence
const onlineUsers = new Map<string, string>();

io.use(async (socket, next) => {
  try {
    const raw = socket.handshake.headers.cookie ?? "";
    const cookies = cookie.parse(raw);
    const token = cookies.token;
    if (!token) return next(new Error("Not authenticated"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select("_id name username profileImage followers following").lean();
    if (!user) return next(new Error("User not found"));

    (socket as unknown as { user: typeof user }).user = user;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const user = (socket as unknown as { user: { _id: { toString(): string }; followers: { toString(): string }[] } }).user;
  const userId = user._id.toString();

  onlineUsers.set(userId, socket.id);

  // Notify followers that this user is online
  user.followers.forEach((fId) => {
    const fSocketId = onlineUsers.get(fId.toString());
    if (fSocketId) io.to(fSocketId).emit("user:online", userId);
  });

  socket.emit("online:list", Array.from(onlineUsers.keys()));

  /* ── send message ── */
  socket.on("message:send", async (data: { receiverId: string; text: string }) => {
    const { receiverId, text } = data;
    if (!text?.trim() || !receiverId) return;

    const msg = await Message.create({
      sender:   userId,
      receiver: receiverId,
      text:     text.trim(),
    });

    const payload = {
      _id:       msg._id.toString(),
      sender:    userId,
      receiver:  receiverId,
      text:      msg.text,
      read:      false,
      createdAt: msg.createdAt.toISOString(),
    };

    // Send to receiver if online
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("message:receive", payload);
    }

    // Echo back to sender
    socket.emit("message:sent", payload);
  });

  /* ── typing indicators ── */
  socket.on("typing:start", (receiverId: string) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("typing:start", userId);
  });

  socket.on("typing:stop", (receiverId: string) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) io.to(receiverSocketId).emit("typing:stop", userId);
  });

  socket.on("disconnect", () => {
    onlineUsers.delete(userId);
    user.followers.forEach((fId) => {
      const fSocketId = onlineUsers.get(fId.toString());
      if (fSocketId) io.to(fSocketId).emit("user:offline", userId);
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
