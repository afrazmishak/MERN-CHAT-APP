import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      minlength: [
        1,
        "Message cannot be empty",
      ],
      maxlength: [
        4000,
        "Message cannot exceed 4000 characters",
      ],
    },

    clientMessageId: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

messageSchema.index(
  {
    sender: 1,
    clientMessageId: 1,
  },
  {
    unique: true,
    name: "unique_sender_client_message",
  }
);

messageSchema.index(
  {
    conversation: 1,
    createdAt: -1,
  },
  {
    name: "conversation_message_history",
  }
);

const Message = mongoose.model(
  "Message",
  messageSchema
);

export default Message;