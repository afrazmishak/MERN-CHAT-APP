import express, { request, response } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
)

app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/", (request, response) => {
    response.status(200).json({
        success: true,
        message: "MERN Chat API is running",
    })
})

app.get("/api/health", (request, response) => {
    response.status(200).json({
        success: true,
        service: "mern-chat-server",
        timestamp: new Date().toISOString(),
    })
})

app.use((request, response) => {
    response.status(404).json({
        success: false,
        message: `Route not found: ${request.method} ${request.originalUrl}`,
    })
})

export default app;