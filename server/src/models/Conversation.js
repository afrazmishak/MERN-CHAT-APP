import mongoose from "mongoose"

const conversationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["room", "direct"],
            required: true,
        },

        name: {
            type: String,
            trim: true,
            minlength:[2, "Conversation name must contain at least 2 characters"],
            maxlength: [60, "Conversation name connot exceed 60 characters"],
            required: function requireNameForRoom() {
                return this.type == "room";
            },
        },

        slug: {
            type: String,
            trim: true,
            lowercase: true,
        },
        
        description: {
            type: String,
            trim: true,
            maxlength: [250, "Description cannot exceed 250 characters"],
            default: "",
        },

        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        isPublic: 
    }
)