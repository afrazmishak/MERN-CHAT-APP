export function createTypingStore() {
  const conversations = new Map();

  function startTyping(
    conversationId,
    userId,
    socketId
  ) {
    let users =
      conversations.get(conversationId);

    if (!users) {
      users = new Map();

      conversations.set(
        conversationId,
        users
      );
    }

    let sockets =
      users.get(userId);

    if (!sockets) {
      sockets = new Set();

      users.set(
        userId,
        sockets
      );
    }

    const wasTyping =
      sockets.size > 0;

    sockets.add(socketId);

    return {
      becameTyping: !wasTyping,
      socketCount: sockets.size,
    };
  }

  function stopTyping(
    conversationId,
    userId,
    socketId
  ) {
    const users =
      conversations.get(
        conversationId
      );

    if (!users) {
      return {
        becameStopped: false,
      };
    }

    const sockets =
      users.get(userId);

    if (!sockets) {
      return {
        becameStopped: false,
      };
    }

    sockets.delete(socketId);

    if (sockets.size > 0) {
      return {
        becameStopped: false,
      };
    }

    users.delete(userId);

    if (users.size === 0) {
      conversations.delete(
        conversationId
      );
    }

    return {
      becameStopped: true,
    };
  }

  return {
    startTyping,
    stopTyping,
  };
}