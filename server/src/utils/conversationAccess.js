export function canAccessConversation(conversation, userId) {
    if (
        conversation.type === "room" &&
        conversation.isPublic
    ) {
        return true;
    }

    return conversation.participants.some((participant) => {
        const participantId = participant._id || participant;

        return participantId.toString() === userId.toString();
    });
}