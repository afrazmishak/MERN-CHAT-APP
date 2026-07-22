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

  const [joiningConversation, setJoiningConversation]

  const [socketStatus, setSocketStatus] = useState("Connecting...");
  const [socketId, setSocketId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleConnect() {
      setSocketStatus("Connected");
      setError("");
    }

    function handleReady(data) {
      setSocketId(data.socketId);
    }

    function handleDisconnect() {
      setSocketStatus("Disconnected");
      setSocketId("");
    }

    function handleConnectionError(connectionError) {
      setSocketStatus("Connection failed");
      setError(connectionError.message);
    }

    socket.on("connect", handleConnect);
    socket.on("connection:ready", handleReady);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectionError);

    socket.connect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connection:ready", handleReady);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectionError);

      socket.disconnect();
    };
  }, []);

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
    <main className="chat-placeholder-page">
      <section className="chat-placeholder-card">
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