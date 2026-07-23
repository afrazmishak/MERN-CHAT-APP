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

  const [socketConnected, setSocketConnected] = useState(false);

  const [joiningConversation, setJoiningConversation] = useState(false);

  const [loadingConversations, setLoadingConversations] = useState(true);

  const [error, setError] = useState("");

  const [showRoomForm, setShowRoomForm] = useState(false);

  const [newRoom, setNewRoom] = useState({
    name: "",
    description: ""
  });

  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    let componentActive = true;

    async function loadConversations() {
      try {
        const response = await apiClient.get("/conversations");

        if (!componentActive) {
          return;
        }

        const loadedConversations = response.data.conversations;

        setConversations(loadedConversations);

        if (loadedConversations.length > 0) {
          setSelectedConversation(
            loadConversations[0]
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
    }
  }, []);




  const [socketStatus, setSocketStatus] = useState("Connecting...");
  const [socketId, setSocketId] = useState("");

  useEffect(() => {
    function handleConnect() {
      setSocketConnected(true);
      setError("");
    }

    function handleDisconnect() {
      setSocketConnected(false);
    }

    function handleConnectionError(connectionError) {
      setSocketConnected(false);

      setError(
        connectionError.message || "Socket connection failed"
      );
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectionError);

    if (socket.connected) {
      handleConnect();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectionError);

      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    IF(
      !socketConnected ||
      !selectedConversation?.id
    ) {
      return;
    }

    setJoiningConversation(true);
    setError("")

    socket.emit(
      "conversation:join",
      {
        conversationId: selectedConversation.id,
      },
      (result) => {
        setJoiningConversation(false);

        if (!result?.success) {
          setError(
            result?.message || "Unable to join conversation"
          );
        }
      }
    );
  }, [
    selectedConversation?.id,
    socketConnected,
  ]);

  function selectConversation(conversation) {
    if (
      conversation.id === selectConversation?.id
    ) {
      return;
    }

    selectConversation(conversation);
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

      const createRoom = response.data.conversation;

      setConversations((currentConversations) => [
        ...currentConversations,
        createdRoom
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
                : "Disconnect"
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
                minLength={2}
                maxLength={60}
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
                maxLength={250}
                placeholder="What is this room about?"
                rows={3}
              />
            </label>

            <button
              type="submit"
              className="primary-button"
              disabled={creatingRoom}
            >
              {creatingRoom
                ? "Creating..."
                : "Create"
              }
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
                    selectConversation?.id ===
                      conversation.id
                      ? "conversation-item acitve"
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
            )}</nav>
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
            Logout
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
                  {selectConversation.description ||
                    "No room description"}
                </p>
              </div>

              <div
                className={
                  joiningConversation
                    ? "room-status joining"
                    : socketConnected
                      ? "room-status joined"
                      : "room-status disconnected"
                }
              >
                {joiningConversation
                  ? "Joining..."
                  : socketConnected
                    ? "Connected"
                    : "Disconnected"}
              </div>
            </header>

            <div className="message-placeholder">
              <div className="placeholder-icon">
                #
              </div>

              <h2>
                Welcome to #
                {selectConversation.name}
              </h2>

              <p className="phase-note">
                Persistent real-time messages will be added in Phase 4.
              </p>
            </div>

            <footer className="disabled-composer">
              <input
                type="text"
                placeholder={`Message #${selectConversation.name}`}
                disabled
              />

              <button type="button" disabled></button>
            </footer>
          </>
        )}
      </section>

      <section className="chat-sidebar">
        <div className="chat-placeholder-header">
          <div>
            <h1>MERN Chat</h1>
            <p>
              Signed in as <strong>@{user.username}</strong>
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="connection-details">
          <p>
            API authentication: <strong>Authenticated</strong>
          </p>

          <p>
            Socket status: <strong>{socketStatus}</strong>
          </p>

          {socketId && (
            <p>
              Socket ID: <code>{socketId}</code>
            </p>
          )}
        </div>

        <div className="next-feature">
          <h2>Authentication is working</h2>
          <p>
            The chat dashboard and conversations will be added in
            Phase 3.
          </p>
        </div>
      </section>
    </main>
  );
}

export default ChatPage;