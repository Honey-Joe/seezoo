import "./env";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db";
import authRoutes      from "./routes/authRoutes";
import userRoutes      from "./routes/userRoutes";
import postRoutes      from "./routes/postRoutes";
import lostFoundRoutes from "./routes/lostFoundRoutes";
import adminRoutes     from "./routes/adminRoutes";

connectDB();

const app = express();

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const ADMIN_URL  = process.env.ADMIN_URL  || "http://localhost:5174";

const allowedOrigins = [CLIENT_URL, ADMIN_URL];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth",       authRoutes);
app.use("/api/user",       userRoutes);
app.use("/api/posts",      postRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/admin",      adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
