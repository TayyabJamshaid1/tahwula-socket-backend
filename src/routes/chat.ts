import { Router } from "express";
import {
  emitToUser,
  joinUserToRoom,
  removeUserFromRoom,
} from "../socket/socketHandlers";
import { io } from "../config/socket";
import {
  getReceiverSocketId,
  isUserActiveInChat,
} from "../socket/onlineUsers";

const router = Router();

console.log("chat router loaded");

const isAuthorized = (req: any) => {
  return (
    req.headers["x-internal-secret"] ===
    process.env.INTERNAL_SOCKET_SECRET
  );
};

// =========================
// EMIT TO SINGLE USER
// =========================

router.post("/emit", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { receiverId, event, payload } = req.body;

    if (!receiverId || !event) {
      return res.status(400).json({
        success: false,
        message: "receiverId and event are required",
      });
    }

    emitToUser(receiverId.toString(), event, payload);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =========================
// EMIT TO CHAT ROOM
// for newMessage, groupUpdated,
// groupDeleted, messagesSeen, etc.
// =========================

router.post("/emit-room", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { roomId, event, payload } = req.body;

    if (!roomId || !event) {
      return res.status(400).json({
        success: false,
        message: "roomId and event are required",
      });
    }

    io.to(roomId.toString()).emit(event, payload);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =========================
// JOIN USER TO ROOM
// used when user is added to group
// =========================

router.post("/join-room", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { userId, roomId } = req.body;

    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "userId and roomId are required",
      });
    }

    joinUserToRoom(userId.toString(), roomId.toString());

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =========================
// REMOVE USER FROM ROOM
// used when member removed / leaves group
// =========================

router.post("/leave-room", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { userId, roomId } = req.body;

    if (!userId || !roomId) {
      return res.status(400).json({
        success: false,
        message: "userId and roomId are required",
      });
    }

    removeUserFromRoom(userId.toString(), roomId.toString());

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =========================
// CHECK ACTIVE CHAT
// used for seenBy logic
// =========================

router.post("/check-room", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { receiverId, chatId } = req.body;

    if (!receiverId || !chatId) {
      return res.status(400).json({
        success: false,
        message: "receiverId and chatId are required",
      });
    }

    const isInRoom = isUserActiveInChat(
      receiverId.toString(),
      chatId.toString(),
    );

    return res.json({
      success: true,
      isInRoom,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// =========================
// LEGACY: EMIT MESSAGE
// keep only if your old one-to-one chat still uses it
// =========================

router.post("/emit-message", (req, res) => {
  try {
    if (!isAuthorized(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      chatId,
      senderId,
      receiverId,
      message,
      seenByUsers,
    } = req.body;

    if (!chatId || !senderId || !message) {
      return res.status(400).json({
        success: false,
        message: "chatId, senderId and message are required",
      });
    }

    io.to(chatId.toString()).emit("newMessage", message);

    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(
        receiverId.toString(),
      );

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", message);
      }
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());

    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", message);
    }

    if (
      Array.isArray(seenByUsers) &&
      seenByUsers.length > 0 &&
      senderSocketId
    ) {
      io.to(senderSocketId).emit("messagesSeen", {
        chatId,
        messageIds: [message._id],
        seenByUsers,
      });
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

export default router;