export function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`)

        socket.emit("connection:ready", {
            socketId: socket.id,
            message: "Connected to the Mern chat server",
        })

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id}. Reason: ${reason}`)
        })
    })
}