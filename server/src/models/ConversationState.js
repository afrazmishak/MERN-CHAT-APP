import mongoose from "mongoose";

const conversationStateSchema =
  new mongoose.Schema(
    {
      conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true,
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      lastDeliveredMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },

      deliveredAt: {
        type: Date,
        default: null,
      },

      lastReadMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
      },

      readAt: {
        type: Date,
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

conversationStateSchema.index(
  {
    conversation: 1,
    user: 1,
  },
  {
    unique: true,
    name: "unique_user_conversation_state",
  }
);

const ConversationState =
  mongoose.model(
    "ConversationState",
    conversationStateSchema
  );

export default ConversationState;