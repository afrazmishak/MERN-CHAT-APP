import mongoose from "mongoose";

import Conversation from "../models/Conversation.js"
import AppError from "../utils/AppError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { canAccessConversation } from "../utils/conversationAccess.js"

function createSlug(value) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60);
}

function serializeParticipant(participant) {
    return {
        id: participant._id.toString(),
        name: participant.name,
        username: participant.username,
    };
}

function serializeConversation(conversation) {
    return {
        id: conversation._id.toString(),
        type: conversation.type,
        name: conversation.name,
        slug: conversation.slug,
        description: conversation.description,
        isPublic: conversation.isPublic,
        participants: conversation.participants.map(
            serializeParticipant
        ),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
    };
}

export const getConversations = asyncHandler(
    async (request, response) => {
        const conversations = await Conversation.find({
            $or: [
                {
                    type: "room",
                    isPublic: true,
                },
                {
                    participants: request.user._id,
                },
            ],
        })
            .populate("participants", "_id name username")
            .sort({
                type: -1,
                name: 1,
                updatedAt: 1,
            });

        response.status(200).json({
            success: true,
            conversation: conversation.map(
                serializeConversation
            ),
        });
    }
);

export const getConversation = asyncHandler(
    async (request, response) => {
        const { conversationId } = request.params;

        if (!mongoose.isValidObjectId(conversationId)) {
            throw new AppError("Invalid conversation ID", 400);
        }

        const conversation = 
            await Conversation.findById(conversationId);

        if (!conversation) {
            throw new AppError("Conversaion not found", 404);
        }

        if (
            !canAccessConversation(
                conversation,
                request.user._id
            )
        ) {
            throw new AppError(
                "You do not have access to this conversation", 
                403
            );
        }

        await conversation.populate(
            "participants",
            "_id name username"
        );

        response.status(200).json({
            success: true,
            conversation: serializeConversation(conversation),
        });
    }
)

export const createRoom = asyncHandler(
    async (request, response) => {
        const { name, description = "" } = request.body;

        if (!name || !name.trim()) {
            throw new AppError("Room name is required", 400);
        }

        const normalizedName = name.trim();

        if (
            normalizedName.length < 2 ||
            normalizedName.length > 60
        ) {
            throw new AppError(
                "Room name must contain between 2 and 60 characters",
                400
            );
        }

        const slug = createSlug(normalizedName);

        if (!slug) {
            throw new AppError(
                "Room name must contain letters or numbers",
                400
            );
        }

        const existingRoom = await Conversation.findOne({
            slug,
        });

        if (existingRoom) {
            throw new AppError(
                "A room with this name already exists",
                409
            );
        }

        const room = await Conversation.create({
            type: "room",
            name: normalizedName,
            slug,
            description: description.trim(),
            isPublic: true,
            participants: [],
            createdBy: request.user._id,
        });

        response.status(201).json({
            success: true,
            message: "Room created successfully",
            conversation: serializeConversation(room),
        });
    }
);