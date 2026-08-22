import mongoose from "mongoose";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

import AppError from "../utils/AppError.js";
import ConversationState from "../models/ConversationState.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { canAccessConversation } from "../utils/conversationAccess.js";
import { serializeMessage } from "../utils/serializeMessage.js";
import { serializeConversationState } from "../utils/serializeConversationState.js";

export const getConversationMessages =
  asyncHandler(
    async (request, response) => {
      const { conversationId } =
        request.params;

      if (
        !mongoose.isValidObjectId(
          conversationId
        )
      ) {
        throw new AppError(
          "Invalid conversation ID",
          400
        );
      }

      const conversation =
        await Conversation.findById(
          conversationId
        );

      if (!conversation) {
        throw new AppError(
          "Conversation not found",
          404
        );
      }

      if (
        !canAccessConversation(
          conversation,
          request.user._id
        )
      ) {
        throw new AppError(
          "You do not have access to this conversation",
          403
        );
      }

      const requestedLimit =
        Number.parseInt(
          request.query.limit,
          10
        );

      const limit =
        Number.isInteger(requestedLimit)
          ? Math.min(
            Math.max(
              requestedLimit,
              1
            ),
            100
          )
          : 50;

      const messages =
        await Message.find({
          conversation:
            conversationId,
        })
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(limit)
          .populate(
            "sender",
            "_id name username"
          );

      messages.reverse();

      const states =
        await ConversationState.find({
          conversation:
            conversationId,
        });

      response.status(200).json({
        success: true,

        conversationId,

        messages:
          messages.map(
            serializeMessage
          ),

        states:
          states.map(
            serializeConversationState
          ),
      });
    }
  );