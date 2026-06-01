// backend/config/socket.ts
import http from "http";
import { Server } from "socket.io";
import app from "../app";
import { socketHandlers } from "../socket/socketHandlers";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "https://tahwula.netlify.app",
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  // transports goes here - at root level, NOT inside cors
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // Add connection state recovery for better reliability
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  }
});

io.on("connection", (socket) => {
  socketHandlers(io, socket);
});

export { io, server };