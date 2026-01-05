import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { initSocket } from "./socket.js";

import "./config/cloudinary.js";

import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import userRoutes from "./routes/users.js";
import settingsRoutes from "./routes/settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);

// ✅ Init Socket.io
initSocket(httpServer);

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost:5173"
].filter(Boolean); // removes undefined

console.log("📡 Allowed CORS origins:", allowedOrigins);

// ✅ Express CORS
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);

            if (allowedOrigins.some(o => origin.startsWith(o))) {
                return callback(null, true);
            }

            console.warn("❌ Blocked by CORS:", origin);
            callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);

// ✅ Health check (important for Render)
app.get("/health", (req, res) => {
    res.status(200).json({ status: "Backend running 🚀" });
});

// ✅ Catch-all for API 404s
app.use("/api/*", (req, res) => {
    res.status(404).json({ message: "API route not found" });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Server startup error:", error);
        process.exit(1);
    }
};

startServer();
