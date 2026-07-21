import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import { authenticateSocket } from "../middleware/socketAuthMiddleware.js";
import { canAccessConversation } from "../utils/conversationAccess.js";

function getSocketRoomName(conversationId) {
  return `conversation:${conversationId}`;
}

function sendAcknowledgement(acknowledge, data) {
  if (typeof acknowledge === "function") {
    acknowledge(data);
  }
}

export function registerSocketHandlers(io) {
  io.use(authenticateSocket);

  io.on("connection", (socket) => {
    console.log(
      `Authenticated socket connected: ${socket.user.username} (${socket.id})`
    );

    socket.join(`user:${socket.user.id}`);

    socket.emit("connection:ready", {
      socketId: socket.id,
      user: socket.user,
      message: "Authenticated socket connection established",
    });

    socket.on(
      "conversation:join",
      async (payload = {}, acknowledge) => {
        try {
          const { conversationId } = payload;

          if (
            !conversationId ||
            !mongoose.isValidObjectId(conversationId)
          ) {
            return sendAcknowledgement(acknowledge, {
              success: false,
              message: "Invalid conversation ID",
            });
          }

          const conversation = 
            await Conversation.findById(conversationId);

          if (!conversation) {
            return sendAcknowledgement(acknowledge, {
              success: false,
              message: "Conversation not found",
            });
          }

          if (
            !canAccessConversation(
              conversation,
              socket.user.id
            )
          ) {
            return sendAcknowledgement(acknowledge, {
              success: false,
              message:
                "You do not have access to this conversation",
            });
          }

          if (
            socket.activeConversationId &&
            socket.activeConversationId !== conversationId
          ) {
            socket.leave(
              getSocketRoomName(
                socket.activeConversationId
              )
            );
          }

          socket.join(
            getSocketRoomName(conversationId)
          );

          socket.activeConversationId = conversationId;

          console.log(
            `${socket.user.username} joined ${conversation.name}`
          );

          sendAcknowledgement(acknowledge, )
        }
      }
    )
    
    socket.on("disconnect", (reason) => {
      console.log(
        `Socket disconnected: ${socket.user.username}. Reason: ${reason}`
      );
    });
  });
}