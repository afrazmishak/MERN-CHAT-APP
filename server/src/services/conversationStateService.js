import ConversationState
  from "../models/ConversationState.js";

export async function markMessageDelivered({
  conversationId,
  userId,
  messageId,
}) {
  return ConversationState.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
    },
    {
      $max: {
        lastDeliveredMessage:
          messageId,
      },

      $set: {
        deliveredAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}

export async function markMessageRead({
  conversationId,
  userId,
  messageId,
}) {
  return ConversationState.findOneAndUpdate(
    {
      conversation: conversationId,
      user: userId,
    },
    {
      $max: {
        lastDeliveredMessage:
          messageId,

        lastReadMessage:
          messageId,
      },

      $set: {
        deliveredAt: new Date(),
        readAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
}