// backend/socket/socketHandlers.ts
import { Server, Socket } from "socket.io";
import { getReceiverSocketId, userSocketMap } from "./onlineUsers";
import { io } from "../config/socket";

export const socketHandlers = (io: Server, socket: Socket) => {
  console.log("User connected:", socket.id);

  const userId = (socket.handshake.query.userId as string) || undefined;
  console.log(userId, "backend userId");

  // SAVE ONLINE USER
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} connected. Total online: ${Object.keys(userSocketMap).length}`);
  }

  // SEND ONLINE USERS to everyone
  io.emit("getOnlineUsers", Object.keys(userSocketMap));
  
  // Send current online users to the newly connected user only
  socket.emit("getOnlineUsers", Object.keys(userSocketMap));

  // PERSONAL ROOM
  if (userId) {
    socket.join(userId);
  }

  // JOIN CHAT
  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${userId} joined ${chatId}`);
  });

  // LEAVE CHAT
  socket.on("leaveChat", (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${userId} left ${chatId}`);
  });

  // TYPING
  socket.on("typing", (data) => {
    console.log('typing event received: ', data);
    socket.to(data.chatId).emit("userTyping", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // STOP TYPING
  socket.on("stopTyping", (data) => {
    socket.to(data.chatId).emit("userStopTyping", {
      userId: data.userId,
      chatId: data.chatId,
    });
  });

  // SEND MESSAGE
  socket.on("sendMessage", (messageData) => {
    io.to(messageData.chatId).emit("receiveMessage", messageData);
  });

  // SEEN MESSAGE
  socket.on("messageSeen", (data) => {
    io.to(data.chatId).emit("messagesSeen", data);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    if (userId) {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      console.log(`User ${userId} disconnected. Remaining online: ${Object.keys(userSocketMap).length}`);
    }
  });

  // Handle reconnection
  socket.on("reconnect", () => {
    console.log("User reconnected:", socket.id);
    if (userId && userId !== "undefined") {
      userSocketMap[userId] = socket.id;
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });

  // SOCKET ERROR
  socket.on("connect_error", (err) => {
    console.log(`Socket Error for user ${userId}: ${err.message}`);
  });
};
export const emitToUser = (
  receiverId: string,
  event: string,
  payload: any
) => {
  const receiverSocketId =
    getReceiverSocketId(receiverId);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit(
      event,
      payload
    );
  }
};