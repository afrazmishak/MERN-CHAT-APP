import "dotenv/config"
import http from "node:http"
import { Server } from "socket.io"

import app from "./app.js"
import { connectDatabase } from "./config/database.js"
import { registerSocketHandlers } from "./sockets/socketHandler.js"
import { error } from "node:console"

const PORT = process.env.PORT || 5000;

async function startServer() {
    await connectDatabase()

    const httpServer = http.createServer(app);

    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CLIENT_URL,
            credentials: true,
        }
    })

    registerSocketHandlers(io);

    httpServer.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    })
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
})