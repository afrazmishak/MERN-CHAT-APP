import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import apiClient from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import socket from "../socket/socket";

function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] =
    useState(null);

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [joinedConversationId, setJoinedConversationId] =
    useState(null);

  const [
    joinFailedConversationId,
    setJoinFailedConversationId,
  ] = useState(null);

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [error, setError] = useState("");

  const [showRoomForm, setShowRoomForm] =
    useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
  });

  const [creatingRoom, setCreatingRoom] =
    useState(false);

  const selectedConversationId =
    selectedConversation?.id ?? null;

  let roomConnectionState = "disconnected";

  if (socketConnected && selectedConversationId) {
    if (joinedConversationId === selectedConversationId) {
      roomConnectionState = "joined";
    } else if (
      joinFailedConversationId === selectedConversationId
    ) {
      roomConnectionState = "failed";
    } else {
      roomConnectionState = "joining";
    }
  }

  useEffect(() => {
    let componentActive = true;

    async function loadConversations() {
      try {
        const response =
          await apiClient.get("/conversations");

        if (!componentActive) {
          return;
        }

        const loadedConversations =
          response.data.conversations;

        setConversations(loadedConversations);

        if (loadedConversations.length > 0) {
          setSelectedConversation(
            loadedConversations[0]
          );
        }
      } catch (requestError) {
        if (componentActive) {
          setError(
            requestError.response?.data?.message ||
            "Unable to load conversations"
          );
        }
      } finally {
        if (componentActive) {
          setLoadingConversations(false);
        }
      }
    }

    loadConversations();

    return () => {
      componentActive = false;
    };
  }, []);

  useEffect(() => {
    function handleConnect() {
      setSocketConnected(true);
      setError("");
    }

    function handleDisconnect() {
      setSocketConnected(false);
      setJoinedConversationId(null);
    }

    function handleConnectionError(connectionError) {
      setSocketConnected(false);
      setJoinedConversationId(null);

      setError(
        connectionError.message ||
        "Socket connection failed"
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(
      "connect_error",
      handleConnectionError
    );

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(
        "connect_error",
        handleConnectionError
      );

      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socketConnected || !selectedConversationId) {
      return;
    }

    let effectCancelled = false;

    socket.emit(
      "conversation:join",
      {
        conversationId: selectedConversationId,
      },
      (result) => {
        if (effectCancelled) {
          return;
        }

        if (!result?.success) {
          setJoinedConversationId(null);

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

        setJoinFailedConversationId(null);
        setError("");
      }
    );

    return () => {
      effectCancelled = true;
    };
  }, [selectedConversationId, socketConnected]);

  function selectConversation(conversation) {
    if (
      conversation.id === selectedConversation?.id
    ) {
      return;
    }

    setError("");
    setJoinFailedConversationId(null);
    setSelectedConversation(conversation);
  }

  function handleNewRoomChange(event) {
    const { name, value } = event.target;

    setNewRoom((currentRoom) => ({
      ...currentRoom,
      [name]: value,
    }));
  }

  async function handleCreateRoom(event) {
    event.preventDefault();

    setCreatingRoom(true);
    setError("");

    try {
      const response = await apiClient.post(
        "/conversations/rooms",
        newRoom
      );

      const createdRoom =
        response.data.conversation;

      setConversations((currentConversations) => [
        ...currentConversations,
        createdRoom,
      ]);

      setSelectedConversation(createdRoom);

      setNewRoom({
        name: "",
        description: "",
      });

      setShowRoomForm(false);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to create room"
      );
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleLogout() {
    setError("");

    try {
      socket.disconnect();
      await logout();
      navigate("/login");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
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
            title={
              socketConnected
                ? "Connected"
                : "Disconnected"
            }
          />
        </header>

        <div className="sidebar-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowRoomForm(
                (currentValue) => !currentValue
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
            onSubmit={handleCreateRoom}
          >
            <label>
              Room name
              <input
                type="text"
                name="name"
                value={newRoom.name}
                onChange={handleNewRoomChange}
                minLength="2"
                maxLength="60"
                placeholder="Project Alpha"
                required
              />
            </label>

            <label>
              Description
              <textarea
                name="description"
                value={newRoom.description}
                onChange={handleNewRoomChange}
                maxLength="250"
                placeholder="What is this room about?"
                rows="3"
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={creatingRoom}
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

            <span>{conversations.length}</span>
          </div>

          <nav className="conversation-list">
            {loadingConversations && (
              <p className="sidebar-message">
                Loading rooms...
              </p>
            )}

            {!loadingConversations &&
              conversations.length === 0 && (
                <p className="sidebar-message">
                  No conversations available.
                </p>
              )}

            {conversations.map(
              (conversation) => (
                <button
                  type="button"
                  key={conversation.id}
                  className={
                    selectedConversation?.id ===
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
                    {conversation.type === "room"
                      ? "#"
                      : "@"}
                  </span>

                  <span className="conversation-details">
                    <strong>
                      {conversation.name}
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
              <strong>{user.name}</strong>
              <small>@{user.username}</small>
            </div>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
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
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {!selectedConversation ? (
          <div className="empty-conversation">
            <h2>Select a conversation</h2>
            <p>
              Choose a room from the sidebar.
            </p>
          </div>
        ) : (
          <>
            <header className="conversation-header">
              <div>
                <h2>
                  <span>#</span>
                  {selectedConversation.name}
                </h2>

                <p>
                  {selectedConversation.description ||
                    "No room description"}
                </p>
              </div>

              <div
                className={`room-status ${roomConnectionState}`}
              >
                {roomConnectionState === "joining" &&
                  "Joining..."}

                {roomConnectionState === "joined" &&
                  "Connected"}

                {roomConnectionState === "failed" &&
                  "Join failed"}

                {roomConnectionState === "disconnected" &&
                  "Disconnected"}
              </div>
            </header>

            <div className="message-placeholder">
              <div className="placeholder-icon">
                #
              </div>

              <h2>
                Welcome to #
                {selectedConversation.name}
              </h2>

              <p>
                You successfully joined this
                conversation through Socket.IO.
              </p>

              <p className="phase-note">
                Persistent real-time messages will
                be added in Phase 4.
              </p>
            </div>

            <footer className="disabled-composer">
              <input
                type="text"
                placeholder={`Message #${selectedConversation.name}`}
                disabled
              />

              <button type="button" disabled>
                Send
              </button>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}

export default ChatPage;