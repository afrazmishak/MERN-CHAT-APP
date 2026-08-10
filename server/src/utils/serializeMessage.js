export function serializeMessage(message) {
  return {
    id: message._id.toString(),

    conversationId:
      message.conversation._id?.toString() ||
      message.conversation.toString(),

    clientMessageId:
      message.clientMessageId,

    content: message.content,

    sender: {
      id: message.sender._id.toString(),
      name: message.sender.name,
      username: message.sender.username,
    },

    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}