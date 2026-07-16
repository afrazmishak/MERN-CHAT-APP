import { authenticateSocket } from "../middleware/socketAuthMiddleware.js"

export function registerSocketHandlers(io) {
    io.use(authenticateSocket);

    io.on("connection", (socket) => {
        console.log(
            `Authentication socket connected: ${socket.user.username} ${socket.id}`)

        socket.emit("connection:ready", {
            socketId: socket.id,
            user: socket.user,
            message: "Authenticated socket connection established",
        });

        socket.on("disconnect", (reason) => {
            console.log(
                `Socket disconnected: ${socket.user.username}. Reason: ${reason}`
            );
        });
    });
}