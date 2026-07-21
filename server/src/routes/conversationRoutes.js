import express from "express"

import {
    createRoom,
    getConversation,
    getConversations,
} from "../controllers/conversationController.js";
import { protect } from "../middleware/authMiddleware.js"

const router = express.Router();

router.use(protect);

router.get("/", getConversations);
router.post("/rooms", createRoom);
router.get("/:conversationId", getConversation);

export default router;