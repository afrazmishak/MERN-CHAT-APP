export function createPresenceStore() {
  const userSockets = new Map();

  function addConnection(
    userId,
    socketId
  ) {
    const sockets =
      userSockets.get(userId) ??
      new Set();

    const wasOffline =
      sockets.size === 0;

    sockets.add(socketId);

    userSockets.set(
      userId,
      sockets
    );

    return {
      becameOnline:
        wasOffline,
      connectionCount:
        sockets.size,
    };
  }

  function removeConnection(
    userId,
    socketId
  ) {
    const sockets =
      userSockets.get(userId);

    if (!sockets) {
      return {
        becameOffline: false,
        connectionCount: 0,
      };
    }

    sockets.delete(socketId);

    if (sockets.size === 0) {
      userSockets.delete(userId);

      return {
        becameOffline: true,
        connectionCount: 0,
      };
    }

    return {
      becameOffline: false,
      connectionCount:
        sockets.size,
    };
  }

  function getOnlineUserIds() {
    return Array.from(
      userSockets.keys()
    );
  }

  function isOnline(userId) {
    return userSockets.has(userId);
  }

  return {
    addConnection,
    removeConnection,
    getOnlineUserIds,
    isOnline,
  };
}