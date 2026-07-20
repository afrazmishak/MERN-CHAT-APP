import Conversation from "../models/Conversation.js"

const defaultRooms = [
    {
        name: "General",
        slug: "general",
        description: "General conversations for everyone.",
    },
    {
        name: "Developers",
        slug: "developers",
        description: "Discuss programming, projects and technology.",
    },
    {
        name: "Random",
        slug: "random",
        description: "Casual conversations and everything else.",
    },
];

export async function seedDefaultRooms() {
    const operations = defaultRooms.map((room) => ({
        updateOne: {
            filter: {
                slug: room.slug,
            },

            update: {
                $setOnInsert: {
                    type: "room",
                    name: room.name,
                    slug: room.slug,
                    description: room.description,
                    isPublic: true,
                    participants: [],
                },
            },

            upsert: true,
        },
    }));

    await Conversation.bulkWrite(operations);

    console.log("Default chat rooms verified");
}