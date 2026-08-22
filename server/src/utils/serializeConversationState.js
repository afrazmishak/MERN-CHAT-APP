export function serializeConversationState(
  state
) {
  return {
    conversationId:
      state.conversation.toString(),

    userId:
      state.user.toString(),

    lastDeliveredMessageId:
      state.lastDeliveredMessage
        ?.toString() ?? null,

    deliveredAt:
      state.deliveredAt ?? null,

    lastReadMessageId:
      state.lastReadMessage
        ?.toString() ?? null,

    readAt:
      state.readAt ?? null,
  };
}