import { Router } from "express";
import { emitToUser } from "../socket/socketHandlers";
import { io } from "../config/socket";
import { getReceiverSocketId } from "../socket/onlineUsers";

const router = Router();
console.log("chat router loaded");
router.post("/emit", (req, res) => {
  try {
    // SECURITY CHECK
    const internalSecret =
      req.headers["x-internal-secret"];

    if (
      internalSecret !==
      process.env.INTERNAL_SOCKET_SECRET
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      receiverId,
      event,
      payload,
    } = req.body;
console.log(  receiverId,
      event,
      payload,);

    emitToUser(
      receiverId,
      event,
      payload,
    );

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
router.post("/emit-message", (req, res) => {
  try {
    const internalSecret =
      req.headers["x-internal-secret"];

    if (
      internalSecret !==
      process.env.INTERNAL_SOCKET_SECRET
    ) {
      return res.status(401).json({
        success: false,
      });
    }

    const {
      chatId,
      senderId,
      receiverId,
      message,
      isReceieverInChatRoom,
    } = req.body;

    // =====================================
    // ROOM EMIT
    // =====================================

    io.to(chatId).emit(
      "newMessage",
      message,
    );

    // =====================================
    // RECEIVER DIRECT EMIT
    // =====================================

    const receiverSocketId =
      getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        message,
      );
    }

    // =====================================
    // SENDER DIRECT EMIT
    // =====================================

    const senderSocketId =
      getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "newMessage",
        message,
      );
    }

    // =====================================
    // MESSAGE SEEN
    // =====================================

    if (
      isReceieverInChatRoom &&
      senderSocketId
    ) {
      io.to(senderSocketId).emit(
        "messageSeen",
        {
          chatId,
          messageIds: [message._id],
          seenBy: receiverId,
        },
      );
    }

    return res.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
});

router.post("/check-room", (req, res) => {
  try {
    
    const internalSecret =
      req.headers["x-internal-secret"];

    if (
      internalSecret !==
      process.env.INTERNAL_SOCKET_SECRET
    ) {
      return res.status(401).json({
        success: false,
      });
    }

    const { receiverId, chatId } =
      req.body;

    const receiverSocketId =
      getReceiverSocketId(receiverId);

    let isInRoom = false;
console.log(receiverSocketId,"receiverSocketId");

    if (receiverSocketId) {
      const receiverSocket =
        io.sockets.sockets.get(
          receiverSocketId,
        );

      if (
        receiverSocket &&
        receiverSocket.rooms.has(chatId)
      ) {
        isInRoom = true;
      }
    }

    return res.json({
      success: true,
      isInRoom,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,
    });
  }
});
export default router;