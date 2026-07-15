import { useEffect, useState } from "react"
import { io } from "socket.io-client"
import "./App.css"

const socket = io("http://localhost:5000", {
  withCredentials: true,
  autoConnect: false,
})

function App() {
  const [socketStatus, setSocketStatus] = useState("Connecting...");
  const [socketId, setSocketId] = useState("");

  useEffect(() => {
    socket.connect();

    function handleConnect() {
      setSocketStatus("Connected");
    }

    function handleConnectionReady() {
      setSocketId(DataTransfer.socketId);
    }

    function handleDisconnect() {
      setSocketStatus("Disconnected");
      setSocketId("");
    }

    function handleConnectionError(error) {
      console.error("Socket connection failed:", error.message);
      setSocketStatus("Connection failed");
    }

    socket.on("connect", handleConnect);
    socket.on("connection:ready", handleConnectionReady);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectionError);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connection:ready", handleConnectionReady);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectionError);
      socket.disconnect();
    }

  }, []);

  return (
    <>
      <main className="app">
        <section className="status-card">
          <h1>MERN Chat Application</h1>

          <p>
            Server status: <strong>{socketStatus}</strong>
          </p>

          {socketId && (
            <p>
              Socket ID: <code>{socketId}</code>
            </p>
          )}
        </section>
      </main>
    </>
  )
}

export default App;
