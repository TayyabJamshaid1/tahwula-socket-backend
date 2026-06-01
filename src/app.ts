// backend/app.ts
import express from "express";
import cors from "cors";
import ChatRouter from "./routes/chat";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// Health check - BEFORE middleware
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server healthy",
    timestamp: new Date().toISOString()
  });
});

// CORS with proper config
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://tahwula.netlify.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

console.log("✅ app.ts loaded");
console.log("📡 FRONTEND_URL:", process.env.FRONTEND_URL);

// Routes
app.use("/chatRoutes", ChatRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;