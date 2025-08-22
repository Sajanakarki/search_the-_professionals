import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// allow big-ish payloads for profile forms
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// optional debug: confirm Cloudinary envs are loaded
app.get("/api/_cloudinary-check", (_req, res) => {
  res.json({
    CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
  });
});

app.get("/", (_req, res) => res.send("This is the Homepage."));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Not Found" }));

// error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

export default app;
