import { Server, Socket } from "socket.io";
import {
  activeChatMap,
  getReceiverSocketId,
  userSocketMap,
} from "./onlineUsers";
import { io } from "../config/socket";

export const socketHandlers = async (
  io: Server,
  socket: Socket,
) => {
  console.log("User connected:", socket.id);

  const userId =
    (socket.handshake.query.userId as string) || undefined;

  console.log(userId, "backend userId");

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;

    console.log(
      `User ${userId} connected. Total online: ${
        Object.keys(userSocketMap).length
      }`,
    );
  }

  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  socket.emit("getOnlineUsers", Object.keys(userSocketMap));

  if (userId) {
    socket.join(userId);
    console.log(`User ${userId} joined personal room`);
  }

  socket.on("joinChat", (chatId: string) => {
    if (!userId) return;

    activeChatMap[userId] = chatId.toString();
    socket.join(chatId);

    console.log(`User ${userId} opened chat ${chatId}`);
  });

  socket.on("leaveChat", (chatId: string) => {
    if (!userId) return;

    if (activeChatMap[userId] === chatId.toString()) {
      delete activeChatMap[userId];
    }

    console.log(`User ${userId} closed chat ${chatId}`);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("userTyping", {
      userId: data.userId,
      userName: data.userName,
      chatId: data.chatId,
    });
  });

  socket.on("stopTyping", (data) => {
    socket.to(data.chatId).emit("userStopTyping", {
      userId: data.userId,
      userName: data.userName,
      chatId: data.chatId,
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      delete activeChatMap[userId];

      io.emit("getOnlineUsers", Object.keys(userSocketMap));

      console.log(
        `User ${userId} disconnected. Remaining online: ${
          Object.keys(userSocketMap).length
        }`,
      );
    }
  });

  socket.on("connect_error", (err) => {
    console.log(
      `Socket Error for user ${userId}: ${err.message}`,
    );
  });
};

export const emitToUser = (
  receiverId: string,
  event: string,
  payload: any,
) => {
  const receiverSocketId = getReceiverSocketId(receiverId);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit(event, payload);
  }
};

export const joinUserToRoom = (
  userId: string,
  roomId: string,
) => {
  const socketId = getReceiverSocketId(userId);

  if (!socketId) return;

  const userSocket = io.sockets.sockets.get(socketId);

  if (!userSocket) return;

  userSocket.join(roomId);

  console.log(`User ${userId} joined room ${roomId}`);
};

export const removeUserFromRoom = (
  userId: string,
  roomId: string,
) => {
  const socketId = getReceiverSocketId(userId);

  if (!socketId) return;

  const userSocket = io.sockets.sockets.get(socketId);

  if (!userSocket) return;

  userSocket.leave(roomId);

  if (activeChatMap[userId] === roomId.toString()) {
    delete activeChatMap[userId];
  }

  console.log(`User ${userId} left room ${roomId}`);
};