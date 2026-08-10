import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import apiClient from "../api/apiClient";
import {
  useAuth,
} from "../context/AuthContext";

import socket from "../socket/socket";

function createClientMessageId() {
  if (
    typeof crypto.randomUUID ===
    "function"
  ) {
    return crypto.randomUUID();
  }

  const randomValues =
    crypto.getRandomValues(
      new Uint32Array(4)
    );

  return `${Date.now()}-${Array.from(
    randomValues
  ).join("-")}`;
}

function mergeMessages(
  currentMessages,
  incomingMessages
) {
  const messageMap = new Map();

  for (
    const message of currentMessages
  ) {
    messageMap.set(
      message.id,
      message
    );
  }

  for (
    const message of incomingMessages
  ) {
    messageMap.set(
      message.id,
      message
    );
  }

  return Array.from(
    messageMap.values()
  ).sort(
    (firstMessage, secondMessage) =>
      new Date(
        firstMessage.createdAt
      ).getTime() -
      new Date(
        secondMessage.createdAt
      ).getTime()
  );
}

function formatMessageTime(value) {
  return new Date(
    value
  ).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function ChatPage() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const [
    conversations,
    setConversations,
  ] = useState([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState(null);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(
    socket.connected
  );

  const [
    joinedConversationId,
    setJoinedConversationId,
  ] = useState(null);

  const [
    joinFailedConversationId,
    setJoinFailedConversationId,
  ] = useState(null);

  const [
    loadingConversations,
    setLoadingConversations,
  ] = useState(true);

  const [
    messagesByConversation,
    setMessagesByConversation,
  ] = useState({});

  const [
    loadedMessageHistory,
    setLoadedMessageHistory,
  ] = useState({});

  const [
    messageDraft,
    setMessageDraft,
  ] = useState("");

  const [
    sendingMessage,
    setSendingMessage,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    showRoomForm,
    setShowRoomForm,
  ] = useState(false);

  const [
    newRoom,
    setNewRoom,
  ] = useState({
    name: "",
    description: "",
  });

  const [
    creatingRoom,
    setCreatingRoom,
  ] = useState(false);

  const selectedConversationId =
    selectedConversation?.id ??
    null;

  const messages =
    selectedConversationId
      ? messagesByConversation[
          selectedConversationId
        ] ?? []
      : [];

  const loadingMessages =
    Boolean(
      selectedConversationId &&
        !loadedMessageHistory[
          selectedConversationId
        ]
    );

  let roomConnectionState =
    "disconnected";

  if (
    socketConnected &&
    selectedConversationId
  ) {
    if (
      joinedConversationId ===
      selectedConversationId
    ) {
      roomConnectionState =
        "joined";
    } else if (
      joinFailedConversationId ===
      selectedConversationId
    ) {
      roomConnectionState =
        "failed";
    } else {
      roomConnectionState =
        "joining";
    }
  }

  /*
   * Load available conversations.
   */
  useEffect(() => {
    let componentActive = true;

    apiClient
      .get("/conversations")
      .then((response) => {
        if (!componentActive) {
          return;
        }

        const loadedConversations =
          response.data
            .conversations;

        setConversations(
          loadedConversations
        );

        if (
          loadedConversations.length >
          0
        ) {
          setSelectedConversation(
            loadedConversations[0]
          );
        }
      })
      .catch(
        (requestError) => {
          if (!componentActive) {
            return;
          }

          setError(
            requestError.response
              ?.data?.message ||
              "Unable to load conversations"
          );
        }
      )
      .finally(() => {
        if (componentActive) {
          setLoadingConversations(
            false
          );
        }
      });

    return () => {
      componentActive = false;
    };
  }, []);

  /*
   * Connect Socket.IO.
   */
  useEffect(() => {
    function handleConnect() {
      setSocketConnected(true);
      setError("");
    }

    function handleDisconnect() {
      setSocketConnected(false);

      setJoinedConversationId(
        null
      );
    }

    function handleConnectionError(
      connectionError
    ) {
      setSocketConnected(false);

      setJoinedConversationId(
        null
      );

      setError(
        connectionError.message ||
          "Socket connection failed"
      );
    }

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectionError
    );

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectionError
      );

      socket.disconnect();
    };
  }, []);

  /*
   * Listen for new real-time
   * messages.
   */
  useEffect(() => {
    function handleNewMessage(
      message
    ) {
      if (
        !message?.conversationId
      ) {
        return;
      }

      setMessagesByConversation(
        (currentMessages) => {
          const conversationMessages =
            currentMessages[
              message
                .conversationId
            ] ?? [];

          return {
            ...currentMessages,

            [message
              .conversationId]:
              mergeMessages(
                conversationMessages,
                [message]
              ),
          };
        }
      );
    }

    socket.on(
      "message:new",
      handleNewMessage
    );

    return () => {
      socket.off(
        "message:new",
        handleNewMessage
      );
    };
  }, []);

  /*
   * Join selected conversation.
   */
  useEffect(() => {
    if (
      !socketConnected ||
      !selectedConversationId
    ) {
      return;
    }

    let effectCancelled = false;

    socket.emit(
      "conversation:join",
      {
        conversationId:
          selectedConversationId,
      },
      (result) => {
        if (effectCancelled) {
          return;
        }

        if (!result?.success) {
          setJoinedConversationId(
            null
          );

          setJoinFailedConversationId(
            selectedConversationId
          );

          setError(
            result?.message ||
              "Unable to join conversation"
          );

          return;
        }

        setJoinedConversationId(
          selectedConversationId
        );

        setJoinFailedConversationId(
          null
        );

        setError("");
      }
    );

    return () => {
      effectCancelled = true;
    };
  }, [
    selectedConversationId,
    socketConnected,
  ]);

  /*
   * Load persistent history.
   */
  useEffect(() => {
    if (
      !selectedConversationId ||
      loadedMessageHistory[
        selectedConversationId
      ]
    ) {
      return;
    }

    let componentActive = true;

    apiClient
      .get(
        `/conversations/${selectedConversationId}/messages?limit=50`
      )
      .then((response) => {
        if (!componentActive) {
          return;
        }

        const loadedMessages =
          response.data.messages;

        setMessagesByConversation(
          (currentMessages) => ({
            ...currentMessages,

            [selectedConversationId]:
              mergeMessages(
                loadedMessages,
                currentMessages[
                  selectedConversationId
                ] ?? []
              ),
          })
        );
      })
      .catch(
        (requestError) => {
          if (!componentActive) {
            return;
          }

          setError(
            requestError.response
              ?.data?.message ||
              "Unable to load message history"
          );
        }
      )
      .finally(() => {
        if (!componentActive) {
          return;
        }

        setLoadedMessageHistory(
          (currentState) => ({
            ...currentState,

            [selectedConversationId]:
              true,
          })
        );
      });

    return () => {
      componentActive = false;
    };
  }, [
    selectedConversationId,
    loadedMessageHistory,
  ]);

  function selectConversation(
    conversation
  ) {
    if (
      conversation.id ===
      selectedConversationId
    ) {
      return;
    }

    setError("");

    setJoinFailedConversationId(
      null
    );

    setMessageDraft("");

    setSelectedConversation(
      conversation
    );
  }

  function handleNewRoomChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target;

    setNewRoom(
      (currentRoom) => ({
        ...currentRoom,
        [name]: value,
      })
    );
  }

  async function handleCreateRoom(
    event
  ) {
    event.preventDefault();

    setCreatingRoom(true);
    setError("");

    try {
      const response =
        await apiClient.post(
          "/conversations/rooms",
          newRoom
        );

      const createdRoom =
        response.data
          .conversation;

      setConversations(
        (
          currentConversations
        ) => [
          ...currentConversations,
          createdRoom,
        ]
      );

      setMessagesByConversation(
        (currentMessages) => ({
          ...currentMessages,
          [createdRoom.id]: [],
        })
      );

      setLoadedMessageHistory(
        (currentState) => ({
          ...currentState,
          [createdRoom.id]: true,
        })
      );

      setSelectedConversation(
        createdRoom
      );

      setNewRoom({
        name: "",
        description: "",
      });

      setShowRoomForm(false);
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.message ||
          "Unable to create room"
      );
    } finally {
      setCreatingRoom(false);
    }
  }

  function handleSendMessage(
    event
  ) {
    event.preventDefault();

    const content =
      messageDraft.trim();

    if (
      !content ||
      !selectedConversationId ||
      sendingMessage
    ) {
      return;
    }

    if (
      roomConnectionState !==
      "joined"
    ) {
      setError(
        "Wait until the conversation is connected before sending"
      );

      return;
    }

    const clientMessageId =
      createClientMessageId();

    setSendingMessage(true);
    setError("");

    socket
      .timeout(5000)
      .emit(
        "message:send",
        {
          conversationId:
            selectedConversationId,

          clientMessageId,

          content,
        },
        (
          timeoutError,
          result
        ) => {
          setSendingMessage(false);

          if (timeoutError) {
            setError(
              "The server did not confirm the message. Please try again."
            );

            return;
          }

          if (!result?.success) {
            setError(
              result?.message ||
                "Unable to send message"
            );

            return;
          }

          /*
           * Normally message:new has
           * already added this.
           *
           * This merge also makes the
           * acknowledgement safe if
           * event ordering differs.
           */
          if (result.message) {
            setMessagesByConversation(
              (
                currentMessages
              ) => ({
                ...currentMessages,

                [selectedConversationId]:
                  mergeMessages(
                    currentMessages[
                      selectedConversationId
                    ] ?? [],
                    [
                      result.message,
                    ]
                  ),
              })
            );
          }

          setMessageDraft("");
        }
      );
  }

  async function handleLogout() {
    setError("");

    try {
      socket.disconnect();

      await logout();

      navigate("/login");
    } catch (requestError) {
      setError(
        requestError.response
          ?.data?.message ||
          "Unable to log out"
      );
    }
  }

  return (
    <main className="chat-app">
      <aside className="chat-sidebar">
        <header className="sidebar-header">
          <div>
            <h1>MERN Chat</h1>
            <p>@{user.username}</p>
          </div>

          <span
            className={
              socketConnected
                ? "connection-dot online"
                : "connection-dot offline"
            }
          />
        </header>

        <div className="sidebar-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowRoomForm(
                (currentValue) =>
                  !currentValue
              )
            }
          >
            {showRoomForm
              ? "Cancel"
              : "+ Create room"}
          </button>
        </div>

        {showRoomForm && (
          <form
            className="room-form"
            onSubmit={
              handleCreateRoom
            }
          >
            <label>
              Room name

              <input
                type="text"
                name="name"
                value={newRoom.name}
                onChange={
                  handleNewRoomChange
                }
                minLength="2"
                maxLength="60"
                required
              />
            </label>

            <label>
              Description

              <textarea
                name="description"
                value={
                  newRoom.description
                }
                onChange={
                  handleNewRoomChange
                }
                maxLength="250"
                rows="3"
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={
                creatingRoom
              }
            >
              {creatingRoom
                ? "Creating..."
                : "Create"}
            </button>
          </form>
        )}

        <div className="conversation-section">
          <div className="conversation-heading">
            <h2>Rooms</h2>

            <span>
              {
                conversations.length
              }
            </span>
          </div>

          <nav className="conversation-list">
            {loadingConversations && (
              <p className="sidebar-message">
                Loading rooms...
              </p>
            )}

            {conversations.map(
              (conversation) => (
                <button
                  type="button"
                  key={
                    conversation.id
                  }
                  className={
                    selectedConversationId ===
                    conversation.id
                      ? "conversation-item active"
                      : "conversation-item"
                  }
                  onClick={() =>
                    selectConversation(
                      conversation
                    )
                  }
                >
                  <span className="conversation-icon">
                    {conversation.type ===
                    "room"
                      ? "#"
                      : "@"}
                  </span>

                  <span className="conversation-details">
                    <strong>
                      {
                        conversation.name
                      }
                    </strong>

                    <small>
                      {conversation.description ||
                        "No description"}
                    </small>
                  </span>
                </button>
              )
            )}
          </nav>
        </div>

        <footer className="sidebar-footer">
          <div className="current-user">
            <div className="user-avatar">
              {user.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user.name}
              </strong>

              <small>
                @{user.username}
              </small>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Log out
          </button>
        </footer>
      </aside>

      <section className="conversation-panel">
        {error && (
          <div className="dashboard-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {!selectedConversation ? (
          <div className="empty-conversation">
            <h2>
              Select a conversation
            </h2>

            <p>
              Choose a room from the
              sidebar.
            </p>
          </div>
        ) : (
          <>
            <header className="conversation-header">
              <div>
                <h2>
                  <span>#</span>
                  {
                    selectedConversation.name
                  }
                </h2>

                <p>
                  {selectedConversation.description ||
                    "No room description"}
                </p>
              </div>

              <div
                className={`room-status ${roomConnectionState}`}
              >
                {roomConnectionState ===
                  "joining" &&
                  "Joining..."}

                {roomConnectionState ===
                  "joined" &&
                  "Connected"}

                {roomConnectionState ===
                  "failed" &&
                  "Join failed"}

                {roomConnectionState ===
                  "disconnected" &&
                  "Disconnected"}
              </div>
            </header>

            <div className="message-list">
              {loadingMessages ? (
                <div className="messages-state">
                  Loading messages...
                </div>
              ) : messages.length ===
                0 ? (
                <div className="messages-state">
                  <div className="placeholder-icon">
                    #
                  </div>

                  <h2>
                    Welcome to #
                    {
                      selectedConversation.name
                    }
                  </h2>

                  <p>
                    There are no
                    messages yet.
                  </p>

                  <p>
                    Start the
                    conversation.
                  </p>
                </div>
              ) : (
                messages.map(
                  (message) => {
                    const ownMessage =
                      message.sender
                        .id ===
                      user.id;

                    return (
                      <article
                        key={
                          message.id
                        }
                        className={
                          ownMessage
                            ? "message-row own-message"
                            : "message-row"
                        }
                      >
                        <div className="message-avatar">
                          {message.sender.name
                            .charAt(
                              0
                            )
                            .toUpperCase()}
                        </div>

                        <div className="message-body">
                          <div className="message-meta">
                            <strong>
                              {
                                message
                                  .sender
                                  .name
                              }
                            </strong>

                            <span>
                              @
                              {
                                message
                                  .sender
                                  .username
                              }
                            </span>

                            <time>
                              {formatMessageTime(
                                message.createdAt
                              )}
                            </time>
                          </div>

                          <p>
                            {
                              message.content
                            }
                          </p>
                        </div>
                      </article>
                    );
                  }
                )
              )}
            </div>

            <form
              className="message-composer"
              onSubmit={
                handleSendMessage
              }
            >
              <textarea
                value={
                  messageDraft
                }
                onChange={(event) =>
                  setMessageDraft(
                    event.target.value
                  )
                }
                placeholder={`Message #${selectedConversation.name}`}
                maxLength="4000"
                rows="1"
                disabled={
                  roomConnectionState !==
                    "joined" ||
                  sendingMessage
                }
              />

              <button
                type="submit"
                disabled={
                  roomConnectionState !==
                    "joined" ||
                  sendingMessage ||
                  !messageDraft.trim()
                }
              >
                {sendingMessage
                  ? "Sending..."
                  : "Send"}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default ChatPage;