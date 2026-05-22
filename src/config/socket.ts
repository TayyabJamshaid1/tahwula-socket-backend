import http from "http";
import { Server } from "socket.io";
import app from "../app";
import { socketHandlers } from "../socket/socketHandlers";
import dotenv from "dotenv";
dotenv.config();
const server =
  http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socketHandlers(io, socket);
});

export { io, server };